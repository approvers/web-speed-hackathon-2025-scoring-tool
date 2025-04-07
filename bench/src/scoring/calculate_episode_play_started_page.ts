import type * as playwright from 'playwright';
import type * as puppeteer from 'puppeteer';

import { consola } from '../consola';
import { goTo } from '../utils/go_to';
import { measureJoinTime } from '../utils/measure_join_time';

type Params = {
  baseUrl: string;
  playwrightPage: playwright.Page;
  puppeteerPage: puppeteer.Page;
};

export async function calculateEpisodePlayStartedPage({ baseUrl, playwrightPage, puppeteerPage }: Params) {
  await using measure = await measureJoinTime({
    puppeteerPage,
  });

  consola.debug('EpisodePlayStartedPage - navigate');

  try {
    await goTo({
      playwrightPage,
      puppeteerPage,
      timeout: 120 * 1000,
      url: new URL('/episodes/15792f69-bfa6-4c69-bb65-a674167e6d02', baseUrl).href,
    });
  } catch (err) {
    throw new Error('ページの読み込みに失敗したか、タイムアウトしました', { cause: err });
  }

  consola.debug('EpisodePlayStartedPage - navigate end');

  const joinTime = await measure.getJoinTime({ timeout: 20 * 1000 });
  const modified = joinTime - 800;
  return {
    audits: {},
    scoreX100: 50 * 100 * (1 - modified / (modified + 3000)),
  };
}
