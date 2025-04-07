import { setTimeout } from 'node:timers/promises';

import type * as playwright from 'playwright';
import type * as puppeteer from 'puppeteer';

import { consola } from '../consola';
import { goTo } from '../utils/go_to';
import { startFlow } from '../utils/start_flow';

import { calculateHackathonScore } from './utils/calculate_hackathon_score';

type Params = {
  baseUrl: string;
  playwrightPage: playwright.Page;
  puppeteerPage: puppeteer.Page;
};
export async function calculateHomeSeriesEpisodeFlowAction({ baseUrl, playwrightPage, puppeteerPage }: Params) {
  consola.debug('HomeSeriesEpisodeFlowAction - navigate');
  try {
    await goTo({
      playwrightPage,
      puppeteerPage,
      timeout: 120 * 1000,
      url: new URL('/', baseUrl).href,
    });
  } catch (err) {
    throw new Error('ページの読み込みに失敗したか、タイムアウトしました', { cause: err });
  }
  consola.debug('HomeSeriesEpisodeFlowAction - navigate end');

  const flow = await startFlow(puppeteerPage);

  consola.debug('HomeSeriesEpisodeFlowAction - timespan');
  await flow.startTimespan();
  {
    // ホーム → シリーズ
    try {
      const series = playwrightPage
        .getByRole('link', { name: /ゼロの使い魔F/ })
        .and(playwrightPage.locator('[href*="/series"]'));
      await series.click();
      await playwrightPage.getByRole('heading', { level: 1, name: /ゼロの使い魔F/ }).waitFor({
        timeout: 120 * 1000,
      });
    } catch (err) {
      throw new Error('ホームから指定されたシリーズへの遷移に失敗しました', { cause: err });
    }

    // シリーズ → エピソード
    try {
      const episode = playwrightPage
        .getByRole('link', { name: /第3話 蝶兵衛、ついに食べた!/ })
        .and(playwrightPage.locator('[href*="/episodes"]'));
      await episode.click();
      await playwrightPage.getByRole('heading', { level: 1, name: /第3話 蝶兵衛、ついに食べた!/ }).waitFor({
        timeout: 120 * 1000,
      });
    } catch (err) {
      throw new Error('シリーズから指定されたエピソードへの遷移に失敗しました', { cause: err });
    }

    await setTimeout(10 * 1000);
  }
  await flow.endTimespan();
  consola.debug('HomeSeriesEpisodeFlowAction - timespan end');

  const {
    steps: [result],
  } = await flow.createFlowResult();

  return {
    audits: result!.lhr.audits,
    scoreX100: calculateHackathonScore(result!.lhr.audits, { isUserflow: true }),
  };
}
