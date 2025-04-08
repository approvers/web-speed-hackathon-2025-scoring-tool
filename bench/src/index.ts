import * as github from '@actions/github';
import { createClient } from '@supabase/supabase-js';
import { defineCommand, runMain } from 'citty';
import { stripIndents } from 'common-tags';
import debug from 'debug';
import _ from 'lodash';

import { calculate } from './calculate';
import { consola } from './consola';
import { Reporter } from './reporting/reporter';
import type { Result } from './result';
import { CLIWriter } from './writer/cli_writer';
import { EmptyWriter } from './writer/empty_writer';
import { GitHubWriter } from './writer/github_writer';

const command = defineCommand({
  args: {
    applicationUrl: {
      required: true,
      type: 'string',
    },
    participationGitHubId: {
      required: false,
      type: 'string',
    },
    participationKind: {
      required: false,
      type: 'string',
      valueHint: '学生 | 一般',
    },
  },
  meta: {
    description: 'Scoring tool for Web Speed Hackathon 2025',
    name: '@wsh-2025/scoring-tool',
  },
  async run({ args: { applicationUrl, participationGitHubId = null, participationKind = null } }) {
    const supabase = (() => {
      const [url, key] = [process.env['SUPABASE_URL'], process.env['SUPABASE_SERVICE_KEY']];
      if (url == null || key == null) {
        throw new Error('missing SUPABASE_URL or SUPABASE_ANNO_KEY');
      }
      return createClient(url, key);
    })();

    const sendScoreToDashboard = async (score: number, results: Result[]): Promise<{ rank: number | null }> => {
      if (participationGitHubId == null) {
        console.warn('githubid == null');
        return { rank: null };
      }

      const record: Record<string, unknown> = {};
      for (const r of results) {
        const d: Record<string, unknown> = { ...r };
        delete d['dbRecordKey'];
        record[r.dbRecordKey] = d;
      }
      const res = await supabase
        .from('scores')
        .insert({
          username: participationGitHubId,
          is_student: participationKind === '学生',
          score_total: score,
          ...record,
        })
        .select();
      if (res.error) {
        throw new Error(`failed to report score`, { cause: res.error });
      }

      const d = await supabase.from('ranked_scores').select().eq('username', participationGitHubId).single();
      return { rank: d.data['rank'] as number };
    };

    const writer = (() => {
      if (debug.enabled('wsh:log')) {
        return new EmptyWriter();
      }
      if (process.env['GITHUB_ACTIONS'] != null) {
        return new GitHubWriter({
          github,
          octokit: github.getOctokit(process.env['GITHUB_TOKEN']!),
        });
      }
      return new CLIWriter();
    })();

    const reporter = new Reporter({ writer });
    await reporter.initialize();

    try {
      new URL('/api/initialize', applicationUrl);
    } catch {
      await reporter.appendArea('fatalError', `❌ 与えられた URL \`${applicationUrl}\` が正しくありません`);
      return;
    }

    try {
      const res = await fetch(new URL('/api/initialize', applicationUrl), { method: 'POST' });
      if (res.status !== 200 && res.status !== 204) {
        throw new Error(`Initialize error: ${res.status}`);
      }
    } catch (err) {
      consola.error(err);
      await reporter.appendArea('fatalError', '❌ 初期化 API `/api/initialize` にアクセスできません');
      return;
    }

    try {
      const results: Result[] = [];

      for await (const result of calculate({ baseUrl: applicationUrl })) {
        results.push(result);

        if (result.error != null) {
          await reporter.appendArea(
            'errorList',
            `- **${result.target.name}** | ${result.error.message.replaceAll('\n', '').slice(0, 100)}`,
          );
        }

        const scoreTable = [
          '|テスト項目|スコア|FCP|LCP|SI|TTI|TBT|CLS|',
          '|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|',
          ...results.map(({ error, scoreX100, target, audits }) => {
            const scoreText =
              error != null ? '計測できません' : `${(scoreX100 / 100).toFixed(2)} / ${target.maxScore.toFixed(2)}`;
            const metrics = [
              audits['first-contentful-paint'],
              audits['largest-contentful-paint'],
              audits['speed-index'],
              audits['total-blocking-time'],
              audits['total-blocking-time'],
              audits['cumulative-layout-shift'],
            ].map((n) => (n?.score == null ? '-' : `${Math.round(n.score * 100)}`));
            let res = `| ${target.name} | ${scoreText} |`;
            for (const m of metrics) {
              res += `${m}|`;
            }
            return res;
          }),
        ].join('\n');

        await reporter.setArea('scoreTable', scoreTable);
      }

      {
        const totalScore = _.round(_.sum(_.map(results, ({ scoreX100 }) => scoreX100)) / 100, 2);
        const totalMaxScore = _.sum(_.map(results, ({ target }) => target.maxScore));

        const { rank } = await sendScoreToDashboard(totalScore, results);

        const shareUrl = new URL('https://x.com/intent/tweet');
        shareUrl.searchParams.set(
          'text',
          stripIndents`
            "Web Speed Hackathon 2025" に挑戦中です！
            スコア: ${totalScore.toFixed(2)} / ${totalMaxScore.toFixed(2)}
            ${rank != null ? `現在 ${rank} 位です` : ''}
          `,
        );
        shareUrl.searchParams.set('url', 'https://github.com/CyberAgentHack/web-speed-hackathon-2025');
        shareUrl.searchParams.set('hashtags', 'WebSpeedHackathon');

        await reporter.setArea(
          'result',
          stripIndents`
            **合計 ${totalScore.toFixed(2)} / ${totalMaxScore.toFixed(2)}**
            ${rank != null ? `**（暫定 ${rank} 位）**` : ''}

            - [**Xで結果を投稿しよう！**](${shareUrl.href})
          `,
        );
      }
    } catch (err) {
      await reporter.appendArea('fatalError', '❌ 計測に失敗しました、運営にご連絡ください');
      throw err;
    }
  },
});

runMain(command)
  .then(() => {
    process.exit(0);
  })
  .catch((err: unknown) => {
    consola.error(err);
    process.exit(1);
  });
