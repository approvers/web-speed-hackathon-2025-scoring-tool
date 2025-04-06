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
export async function calculateEpisodePlayControlFlowAction({ baseUrl, playwrightPage, puppeteerPage }: Params) {
  consola.debug('EpisodeSeekFlowAction - navigate');
  try {
    await goTo({
      playwrightPage,
      puppeteerPage,
      timeout: 120 * 1000,
      url: new URL('/episodes/c6a775c8-bfc6-43db-996a-4d8dce78f4fa', baseUrl).href,
    });
  } catch (err) {
    throw new Error('ページの読み込みに失敗したか、タイムアウトしました', { cause: err });
  }
  consola.debug('EpisodeSeekFlowAction - navigate end');

  const flow = await startFlow(puppeteerPage);

  consola.debug('EpisodeSeekFlowAction - timespan');
  await flow.startTimespan();
  {
    // 一時停止処理
    try {
      await playwrightPage.getByRole('button', { name: '一時停止する' }).waitFor({ timeout: 10 * 1000 });
    } catch (err) {
      throw new Error('一時停止ボタンが見つかりません', { cause: err });
    }
    try {
      const button = playwrightPage.getByRole('button', { name: '一時停止する' });
      await button.click();
      await playwrightPage.getByRole('button', { name: '再生する' }).waitFor({ timeout: 10 * 1000 });
    } catch (err) {
      throw new Error('一時停止に失敗しました', { cause: err });
    }

    // シーク処理
    try {
      await playwrightPage.getByRole('slider').waitFor({ timeout: 10 * 1000 });
    } catch (err) {
      throw new Error('シークバー（role="slider"）が見つかりません', { cause: err });
    }
    try {
      const input = playwrightPage.getByRole('slider');
      const inputSize = (await (await input.elementHandle())!.boundingBox())!;
      await input.hover({ force: true, position: { x: inputSize.width / 2, y: inputSize.height / 2 } });
      await playwrightPage.mouse.down();
      await playwrightPage.mouse.move(inputSize.x + inputSize.width / 2 + 300, inputSize.y + inputSize.height / 2, {
        steps: 100,
      });
      await playwrightPage.mouse.up();
      await setTimeout(5 * 1000);
    } catch (err) {
      throw new Error('シークバーの操作に失敗しました', { cause: err });
    }

    // 再生再開処理
    try {
      await playwrightPage.getByRole('button', { name: '再生する' }).waitFor({ timeout: 10 * 1000 });
    } catch (err) {
      throw new Error('再生ボタンが見つかりません', { cause: err });
    }
    try {
      const button = playwrightPage.getByRole('button', { name: '再生する' });
      await button.click();
      await playwrightPage.getByRole('button', { name: '一時停止する' }).waitFor({ timeout: 10 * 1000 });
    } catch (err) {
      throw new Error('再生再開に失敗しました', { cause: err });
    }

    // ミュート処理
    try {
      await playwrightPage.getByRole('button', { name: 'ミュート解除する' }).waitFor({ timeout: 10 * 1000 });
    } catch (err) {
      throw new Error('ミュート解除ボタンが見つかりません', { cause: err });
    }
    try {
      const button = playwrightPage.getByRole('button', { name: 'ミュート解除する' });
      await button.click();
      await playwrightPage.getByRole('button', { name: 'ミュートする' }).waitFor({ timeout: 10 * 1000 });
    } catch (err) {
      throw new Error('ミュート解除に失敗しました', { cause: err });
    }
  }
  await flow.endTimespan();
  consola.debug('EpisodeSeekFlowAction - timespan end');

  const {
    steps: [result],
  } = await flow.createFlowResult();

  return {
    audits: result!.lhr.audits,
    scoreX100: calculateHackathonScore(result!.lhr.audits, { isUserflow: true }),
  };
}
