import { setTimeout } from 'node:timers/promises';

import _ from 'lodash';
import mergeErrorCause from 'merge-error-cause';
import type * as playwright from 'playwright';
import type * as puppeteer from 'puppeteer';

import { consola } from './consola';
import type { Result } from './result';
import { calculateArchivedProgramPage } from './scoring/calculate_archived_program_page';
import { calculateBroadcastingProgramPage } from './scoring/calculate_broadcasting_program_page';
import { calculateEpisodePlayStartedPage } from './scoring/calculate_episode_play_started_page';
import { calculateFreeEpisodePage } from './scoring/calculate_free_episode_page';
import { calculateHomePage } from './scoring/calculate_home_page';
import { calculateHomeSeriesEpisodeFlowAction } from './scoring/calculate_home_series_episode_flow_action';
import { calculateNotFoundPage } from './scoring/calculate_not_found_page';
import { calculatePremiumEpisodePage } from './scoring/calculate_premium_episode_page';
import { calculateProgramPlayStartedPage } from './scoring/calculate_program_play_started_page';
import { calculateSeriesPage } from './scoring/calculate_series_page';
import { calculateTimetableGutterFlowAction } from './scoring/calculate_timetable_gutter_control_flow_action';
import { calculateTimetablePage } from './scoring/calculate_timetable_page';
import { calculateTimetableProgramEpisodeFlowAction } from './scoring/calculate_timetable_program_episode_flow_action';
import { calculateUpcomingPromgramPage } from './scoring/calculate_upcoming_program_page';
import { calculateUserAuthFlowAction } from './scoring/calculate_user_auth_flow_action';
import { createPage } from './utils/create_page';

type Target = {
  device: Partial<(typeof playwright.devices)[string]>;
  func: (params: {
    baseUrl: string;
    playwrightPage: playwright.Page;
    puppeteerPage: puppeteer.Page;
  }) => Promise<{ audits: Record<string, { score: number | null }>; scoreX100: number }>;
  maxScore: number;
  name: string;
  recordKey: string;
};

const DEVICE = {
  deviceScaleFactor: 1,
  hasTouch: false,
  isMobile: false,
  viewport: {
    height: 1080,
    width: 1920,
  },
};

const LANDING_TARGET_LIST: Target[] = [
  {
    device: DEVICE,
    func: calculateHomePage,
    maxScore: 100,
    name: 'ホームを開く',
    recordKey: 'score_home',
  },
  {
    device: DEVICE,
    func: calculateFreeEpisodePage,
    maxScore: 100,
    name: 'エピソード視聴（無料作品）を開く',
    recordKey: 'score_free_episode',
  },
  // {
  //   device: DEVICE,
  //   func: calculatePremiumEpisodePage,
  //   maxScore: 100,
  //   name: 'エピソード視聴（プレミアム作品）を開く',
  //   recordKey: 'score_premium_episode',
  // },
  // {
  //   device: DEVICE,
  //   func: calculateTimetablePage,
  //   maxScore: 100,
  //   name: '番組表を開く',
  //   recordKey: 'score_timetable',
  // },
  // {
  //   device: DEVICE,
  //   func: calculateUpcomingPromgramPage,
  //   maxScore: 100,
  //   name: '番組視聴（放送前）を開く',
  //   recordKey: 'score_upcoming_program',
  // },
  // {
  //   device: DEVICE,
  //   func: calculateBroadcastingProgramPage,
  //   maxScore: 100,
  //   name: '番組視聴（放送中）を開く',
  //   recordKey: 'score_broadcasting_program',
  // },
  // {
  //   device: DEVICE,
  //   func: calculateArchivedProgramPage,
  //   maxScore: 100,
  //   name: '番組視聴（放送後）を開く',
  //   recordKey: 'score_archived_program',
  // },
  // {
  //   device: DEVICE,
  //   func: calculateSeriesPage,
  //   maxScore: 100,
  //   name: 'シリーズを開く',
  //   recordKey: 'score_series',
  // },
  // {
  //   device: DEVICE,
  //   func: calculateNotFoundPage,
  //   maxScore: 100,
  //   name: '404 ページを開く',
  //   recordKey: 'score_not_found',
  // },
];

const USER_FLOW_TARGET_LIST: Target[] = [
  {
    device: DEVICE,
    func: calculateUserAuthFlowAction,
    maxScore: 50,
    name: 'ユーザーフロー: 新規作成 → ログアウト → ログイン',
    recordKey: 'flow_score_user_auth',
  },
  // {
  //   device: DEVICE,
  //   func: calculateTimetableGutterFlowAction,
  //   maxScore: 50,
  //   name: 'ユーザーフロー: 番組表のカラムの拡大縮小',
  //   recordKey: 'flow_score_timetable_gutter',
  // },
  // {
  //   device: DEVICE,
  //   func: calculateHomeSeriesEpisodeFlowAction,
  //   maxScore: 50,
  //   name: 'ユーザーフロー: ホーム → シリーズ → エピソード',
  //   recordKey: 'flow_score_home_series',
  // },
  // {
  //   device: DEVICE,
  //   func: calculateTimetableProgramEpisodeFlowAction,
  //   maxScore: 50,
  //   name: 'ユーザーフロー: 番組表 → モーダル → 番組 → 関連エピソード',
  //   recordKey: 'flow_score_timetable',
  // },
  // {
  //   device: DEVICE,
  //   func: calculateEpisodePlayStartedPage,
  //   maxScore: 50,
  //   name: '再生開始までの時間: エピソード',
  //   recordKey: 'flow_score_episode_play',
  // },
  // {
  //   device: DEVICE,
  //   func: calculateProgramPlayStartedPage,
  //   maxScore: 50,
  //   name: '再生開始までの時間: 番組',
  //   recordKey: 'flow_score_program_play',
  // },
];

type Params = {
  baseUrl: string;
};

async function* _calculate({
  baseUrl,
  targets,
}: {
  baseUrl: string;
  targets: Target[];
}): AsyncGenerator<Result, void, void> {
  for (const target of targets) {
    await using context = await createPage({
      device: target.device,
    });

    try {
      const { playwrightPage, puppeteerPage } = context;
      const { audits, scoreX100 } = await target.func({ baseUrl, playwrightPage, puppeteerPage });
      yield { scoreX100, target, audits, dbRecordKey: target.recordKey };
    } catch (err) {
      consola.error(mergeErrorCause(err));
      yield { error: err as Error, scoreX100: 0, target, audits: {}, dbRecordKey: target.recordKey };
    }

    // サーバー負荷が落ち着くまで、10秒待つ
    await setTimeout(10 * 1000);
  }
}

export async function* calculate({ baseUrl }: Params): AsyncGenerator<Result, void, void> {
  const landingResults = [];

  for await (const result of _calculate({ baseUrl, targets: LANDING_TARGET_LIST })) {
    landingResults.push(result);
    yield result;
  }

  const landingTotalScore = _.round(_.sum(_.map(landingResults, ({ scoreX100 }) => scoreX100)) / 100, 2);

  if (landingTotalScore < 200) {
    for (const target of USER_FLOW_TARGET_LIST) {
      yield {
        error: new Error('アプリが重いため、計測をスキップしました'),
        scoreX100: 0,
        target,
        audits: {},
        dbRecordKey: target.recordKey,
      };
    }
    return;
  }

  for await (const result of _calculate({ baseUrl, targets: USER_FLOW_TARGET_LIST })) {
    yield result;
  }
}
