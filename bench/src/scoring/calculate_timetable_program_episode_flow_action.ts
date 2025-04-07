import { setTimeout } from 'node:timers/promises';

import { set } from 'date-fns';
import type * as playwright from 'playwright';
import type * as puppeteer from 'puppeteer';

import { consola } from '../consola';
import { defineMockDate } from '../utils/define_mock_date';
import { goTo } from '../utils/go_to';
import { startFlow } from '../utils/start_flow';

import { calculateHackathonScore } from './utils/calculate_hackathon_score';

type Params = {
  baseUrl: string;
  playwrightPage: playwright.Page;
  puppeteerPage: puppeteer.Page;
};
export async function calculateTimetableProgramEpisodeFlowAction({ baseUrl, playwrightPage, puppeteerPage }: Params) {
  await using _ = await defineMockDate({
    // eslint-disable-next-line sort/object-properties
    date: set(new Date(), { hours: 22, minutes: 30, seconds: 0, milliseconds: 0 }),
    puppeteerPage,
  });

  consola.debug('TimetableProgramEpisodeFlowAction - navigate');
  try {
    await goTo({
      playwrightPage,
      puppeteerPage,
      timeout: 120 * 1000,
      url: new URL('/timetable', baseUrl).href,
    });
  } catch (err) {
    throw new Error('ページの読み込みに失敗したか、タイムアウトしました', { cause: err });
  }
  consola.debug('TimetableProgramEpisodeFlowAction - navigate end');

  const flow = await startFlow(puppeteerPage);

  // 初回モーダルを閉じる
  try {
    const button = playwrightPage.getByRole('dialog').getByRole('button', { name: '試してみる' });
    await button.waitFor({ timeout: 10 * 1000 });
    await button.click();
  } catch (err) {
    throw new Error('番組表の操作訴求モーダルを閉じられません', { cause: err });
  }

  consola.debug('TimetableProgramEpisodeFlowAction - timespan');
  await flow.startTimespan();
  {
    // 番組表 → 番組
    try {
      const program = playwrightPage.getByRole('button', { name: /働きマン 第6話/ });
      await program.waitFor({ timeout: 10 * 1000 });
      await program.click();

      const button = playwrightPage.getByRole('dialog').getByRole('link', { name: '番組をみる' });
      await button.waitFor({ timeout: 10 * 1000 });
      await button.click();

      await playwrightPage.getByRole('heading', { level: 1, name: /働きマン 第6話/ }).waitFor({
        timeout: 120 * 1000,
      });
    } catch (err) {
      throw new Error('番組表から指定された番組への遷移に失敗しました', { cause: err });
    }

    // シリーズ → エピソード
    try {
      const episode = playwrightPage
        .getByRole('link', { name: /第4話 トロフィー泥棒/ })
        .and(playwrightPage.locator('[href*="/episodes"]'));
      await episode.click();
      await playwrightPage.getByRole('heading', { level: 1, name: /第4話 トロフィー泥棒/ }).waitFor({
        timeout: 120 * 1000,
      });
    } catch (err) {
      throw new Error('番組から指定されたエピソードへの遷移に失敗しました', { cause: err });
    }

    await setTimeout(10 * 1000);
  }
  await flow.endTimespan();
  consola.debug('TimetableProgramEpisodeFlowAction - timespan end');

  const {
    steps: [result],
  } = await flow.createFlowResult();

  return {
    audits: result!.lhr.audits,
    scoreX100: calculateHackathonScore(result!.lhr.audits, { isUserflow: true }),
  };
}
