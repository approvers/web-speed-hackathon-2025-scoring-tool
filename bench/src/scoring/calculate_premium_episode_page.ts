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

export async function calculatePremiumEpisodePage({ baseUrl, playwrightPage, puppeteerPage }: Params) {
  const flow = await startFlow(puppeteerPage);

  consola.debug('PremiumEpisode - navigate');
  await flow.startNavigation();
  try {
    await goTo({
      playwrightPage,
      puppeteerPage,
      timeout: 120 * 1000,
      url: new URL('/episodes/a2cda25c-37f0-44e3-8b89-0f4546c6bf50', baseUrl).href,
    });
  } catch (err) {
    throw new Error('ページの読み込みに失敗したか、タイムアウトしました', { cause: err });
  }
  await flow.endNavigation();

  consola.debug('PremiumEpisode - navigate end');
  const {
    steps: [result],
  } = await flow.createFlowResult();

  return {
    audits: result!.lhr.audits,
    scoreX100: calculateHackathonScore(result!.lhr.audits, { isUserflow: false }),
  };
}
