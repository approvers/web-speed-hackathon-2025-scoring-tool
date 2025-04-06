import { set } from 'date-fns';
import type * as playwright from 'playwright';
import type * as puppeteer from 'puppeteer';

import { consola } from '../consola';
import { defineMockDate } from '../utils/define_mock_date';
import { goTo } from '../utils/go_to';
import { measureJoinTime } from '../utils/measure_join_time';

type Params = {
  baseUrl: string;
  playwrightPage: playwright.Page;
  puppeteerPage: puppeteer.Page;
};

export async function calculateProgramPlayStartedPage({ baseUrl, playwrightPage, puppeteerPage }: Params) {
  await using measure = await measureJoinTime({
    puppeteerPage,
  });
  await using _ = await defineMockDate({
    // eslint-disable-next-line sort/object-properties
    date: set(new Date(), { hours: 13, minutes: 0, seconds: 0, milliseconds: 0 }),
    puppeteerPage,
  });

  consola.debug('ProgramPlayStartedPage - navigate');

  try {
    await goTo({
      playwrightPage,
      puppeteerPage,
      timeout: 120 * 1000,
      url: new URL('/programs/8840e380-d456-456b-84ff-3a2c7326907c', baseUrl).href,
    });
  } catch (err) {
    throw new Error('ページの読み込みに失敗したか、タイムアウトしました', { cause: err });
  }

  consola.debug('ProgramPlayStartedPage - navigate end');

  const joinTime = await measure.getJoinTime({ timeout: 20 * 1000 });
  const modified = joinTime - 800;
  return {
    audits: {},
    scoreX100: 50 * 100 * (1 - modified / (modified + 3000)),
  };
}
