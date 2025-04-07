import * as github from '@actions/github';
import { defineCommand, runMain } from 'citty';
import { stripIndents } from 'common-tags';
import debug from 'debug';
import _ from 'lodash';
import { inject } from 'regexparam';

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
    competitionEndAt: {
      required: false,
      type: 'string',
      valueHint: '2025-03-23T18:30:00.000+09:00',
    },
    competitionStartAt: {
      required: false,
      type: 'string',
      valueHint: '2025-03-22T10:30:00.000+09:00',
    },
    dashboardServerToken: {
      required: false,
      type: 'string',
    },
    dashboardServerUrl: {
      required: false,
      type: 'string',
      valueHint: 'https://scoring-board.example/',
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
  async run({
    args: {
      applicationUrl,
      competitionEndAt = null,
      competitionStartAt = null,
      dashboardServerToken = null,
      dashboardServerUrl = null,
      participationGitHubId = null,
      participationKind = null,
    },
  }) {
    async function sendScoreToDashboard(score: number): Promise<{ rank: number | null }> {
      if (dashboardServerUrl == null || dashboardServerToken == null || participationGitHubId == null) {
        return { rank: null };
      }

      const requestUrl = new URL(
        inject('/api/scores/:userId', {
          userId: participationGitHubId,
        }),
        dashboardServerUrl,
      );
      const res = await fetch(requestUrl, {
        body: JSON.stringify({
          kind: participationKind === '学生' ? 'STUDENT' : 'GENERAL',
          previewUrl: applicationUrl,
          score,
        }),
        headers: {
          'Content-Type': 'application/json',
          Token: dashboardServerToken,
        },
        method: 'POST',
      });

      if (res.status !== 200) {
        return { rank: null };
      }
      return res.json() as Promise<{ rank: number }>;
    }

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

    const requestedDate =
      process.env['GITHUB_ACTIONS'] != null
        ? new Date(
            (github.context.eventName === 'issues'
              ? github.context.payload.issue!['created_at']
              : github.context.payload.comment!['created_at']) as number,
          )
        : new Date();

    if (competitionStartAt != null && new Date(competitionStartAt) <= requestedDate) {
      await reporter.appendArea('fatalError', '❌ 競技開始前です');
      return;
    }
    if (competitionEndAt != null && requestedDate < new Date(competitionEndAt)) {
      await reporter.appendArea('fatalError', '❌ 競技は終了しました');
      return;
    }

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
          '|テスト項目|スコア|',
          '|:---|---:|',
          ...results.map(({ error, scoreX100, target }) => {
            const scoreText =
              error != null ? '計測できません' : `${(scoreX100 / 100).toFixed(2)} / ${target.maxScore.toFixed(2)}`;
            return `| ${target.name} | ${scoreText} |`;
          }),
        ].join('\n');

        await reporter.setArea('scoreTable', scoreTable);
      }

      {
        const totalScore = _.round(_.sum(_.map(results, ({ scoreX100 }) => scoreX100)) / 100, 2);
        const totalMaxScore = _.sum(_.map(results, ({ target }) => target.maxScore));

        const { rank } = await sendScoreToDashboard(totalScore);

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
