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
export async function calculateTimetableGutterFlowAction({ baseUrl, playwrightPage, puppeteerPage }: Params) {
  consola.debug('TimetableGutterFlowAction - navigate');
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
  consola.debug('TimetableGutterFlowAction - navigate end');

  const flow = await startFlow(puppeteerPage);

  // 初回モーダルを閉じる
  try {
    const button = playwrightPage.getByRole('dialog').getByRole('button', { name: '試してみる' });
    await button.waitFor({ timeout: 10 * 1000 });
    await button.click();
  } catch (err) {
    throw new Error('番組表の操作訴求モーダルを閉じられません', { cause: err });
  }

  consola.debug('TimetableGutterFlowAction - timespan');
  await flow.startTimespan();
  {
    try {
      await playwrightPage
        .getByRole('slider')
        .first()
        .waitFor({ timeout: 120 * 1000 });
    } catch (err) {
      throw new Error('カラムの拡縮ポジション（role="slider"）が見つかりません', { cause: err });
    }

    // カラム拡大
    try {
      const input = playwrightPage.getByRole('slider').first();
      const inputSize = (await (await input.elementHandle())!.boundingBox())!;
      await input.hover({ force: true, position: { x: inputSize.width / 2, y: inputSize.height / 2 } });
      await playwrightPage.mouse.down();
      await playwrightPage.mouse.move(inputSize.x + inputSize.width / 2 + 300, inputSize.y + inputSize.height / 2, {
        steps: 10,
      });
      await playwrightPage.mouse.up();
      await setTimeout(5 * 1000);
    } catch (err) {
      throw new Error('カラムの拡大に失敗しました', { cause: err });
    }

    // カラム縮小
    try {
      const input = playwrightPage.getByRole('slider').first();
      const inputSize = (await (await input.elementHandle())!.boundingBox())!;
      await input.hover({ force: true, position: { x: inputSize.width / 2, y: inputSize.height / 2 } });
      await playwrightPage.mouse.down();
      await playwrightPage.mouse.move(inputSize.x + inputSize.width / 2 - 400, inputSize.y + inputSize.height / 2, {
        steps: 20,
      });
      await playwrightPage.mouse.up();
      await setTimeout(5 * 1000);
    } catch (err) {
      throw new Error('カラムの縮小に失敗しました', { cause: err });
    }
  }
  await flow.endTimespan();
  consola.debug('TimetableGutterFlowAction - timespan end');

  const {
    steps: [result],
  } = await flow.createFlowResult();

  return {
    audits: result!.lhr.audits,
    scoreX100: calculateHackathonScore(result!.lhr.audits, { isUserflow: true }),
  };
}
