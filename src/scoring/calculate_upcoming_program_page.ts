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

export async function calculateUpcomingPromgramPage({ baseUrl, playwrightPage, puppeteerPage }: Params) {
  await using _ = await defineMockDate({
    // eslint-disable-next-line sort/object-properties
    date: set(new Date(), { hours: 13, minutes: 0, seconds: 0, milliseconds: 0 }),
    puppeteerPage,
  });

  const flow = await startFlow(puppeteerPage);

  consola.debug('UpcomingPromgram - navigate');
  await flow.startNavigation();
  try {
    await goTo({
      playwrightPage,
      puppeteerPage,
      timeout: 120 * 1000,
      url: new URL('/programs/3c1b6bea-47dd-46e9-bfa4-fa1b1552dc1d', baseUrl).href,
    });
  } catch (err) {
    throw new Error('ページの読み込みに失敗したか、タイムアウトしました', { cause: err });
  }
  await flow.endNavigation();

  consola.debug('UpcomingPromgram - navigate end');
  const {
    steps: [result],
  } = await flow.createFlowResult();

  return {
    audits: result!.lhr.audits,
    scoreX100: calculateHackathonScore(result!.lhr.audits, { isUserflow: false }),
  };
}
