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
export async function calculateUserAuthFlowAction({ baseUrl, playwrightPage, puppeteerPage }: Params) {
  consola.debug('UserAuthFlowAction - navigate');
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
  consola.debug('UserAuthFlowAction - navigate end');

  const flow = await startFlow(puppeteerPage);

  consola.debug('UserAuthFlowAction - timespan');
  await flow.startTimespan();
  {
    // 新規登録
    try {
      const button = playwrightPage.getByRole('button', { name: 'ログイン' });
      await button.click();
      await playwrightPage
        .getByRole('dialog')
        .getByRole('heading', { name: 'ログイン' })
        .waitFor({ timeout: 10 * 1000 });
    } catch (err) {
      throw new Error('ログインモーダルの表示に失敗しました', { cause: err });
    }
    try {
      const button = playwrightPage.getByRole('dialog').getByRole('button', { name: 'アカウントを新規登録する' });
      await button.click();
      await playwrightPage
        .getByRole('dialog')
        .getByRole('heading', { name: '会員登録' })
        .waitFor({ timeout: 10 * 1000 });
    } catch (err) {
      throw new Error('新規登録モーダルへの遷移に失敗しました', { cause: err });
    }
    try {
      const input = playwrightPage.getByRole('dialog').getByRole('textbox', { name: 'メールアドレス' });
      await input.pressSequentially('superultrahypermiracleromantic@example.test');
    } catch (err) {
      throw new Error('メールアドレスの入力に失敗しました', { cause: err });
    }
    try {
      const input = playwrightPage.getByRole('dialog').getByRole('textbox', { name: 'パスワード' });
      await input.pressSequentially('superultrahypermiracleromantic');
    } catch (err) {
      throw new Error('パスワードの入力に失敗しました', { cause: err });
    }
    try {
      const button = playwrightPage.getByRole('dialog').getByRole('button', { name: 'アカウント作成' });
      await button.click();
      await playwrightPage.getByRole('button', { name: 'ログアウト' }).waitFor({ timeout: 10 * 1000 });
    } catch (err) {
      throw new Error('新規登録に失敗しました', { cause: err });
    }

    // ログアウト
    try {
      const button = playwrightPage.getByRole('button', { name: 'ログアウト' });
      await button.click();
      await playwrightPage
        .getByRole('dialog')
        .getByRole('button', { name: 'ログアウト' })
        .waitFor({ timeout: 10 * 1000 });
    } catch (err) {
      throw new Error('ログアウトモーダルの表示に失敗しました', { cause: err });
    }
    try {
      const button = playwrightPage.getByRole('dialog').getByRole('button', { name: 'ログアウト' });
      await button.click();
      await playwrightPage.getByRole('button', { name: 'ログイン' }).waitFor({ timeout: 10 * 1000 });
    } catch (err) {
      throw new Error('ログアウトに失敗しました', { cause: err });
    }

    // ログイン
    try {
      const button = playwrightPage.getByRole('button', { name: 'ログイン' });
      await button.click();
      await playwrightPage
        .getByRole('dialog')
        .getByRole('heading', { name: 'ログイン' })
        .waitFor({ timeout: 10 * 1000 });
    } catch (err) {
      throw new Error('ログインモーダルの表示に失敗しました', { cause: err });
    }
    try {
      const input = playwrightPage.getByRole('dialog').getByRole('textbox', { name: 'メールアドレス' });
      await input.pressSequentially('superultrahypermiracleromantic@example.test');
    } catch (err) {
      throw new Error('メールアドレスの入力に失敗しました', { cause: err });
    }
    try {
      const input = playwrightPage.getByRole('dialog').getByRole('textbox', { name: 'パスワード' });
      await input.pressSequentially('superultrahypermiracleromantic');
    } catch (err) {
      throw new Error('パスワードの入力に失敗しました', { cause: err });
    }
    try {
      const button = playwrightPage.getByRole('dialog').getByRole('button', { name: 'ログイン' });
      await button.click();
      await playwrightPage.getByRole('button', { name: 'ログアウト' }).waitFor({ timeout: 10 * 1000 });
    } catch (err) {
      throw new Error('ログインに失敗しました', { cause: err });
    }
  }
  await flow.endTimespan();
  consola.debug('UserAuthFlowAction - timespan end');

  const {
    steps: [result],
  } = await flow.createFlowResult();

  return {
    audits: result!.lhr.audits,
    scoreX100: calculateHackathonScore(result!.lhr.audits, { isUserflow: true }),
  };
}
