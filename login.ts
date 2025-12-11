// login.ts (simple)
import { chromium } from 'playwright';
import { loginMap, LoginEnvKey } from './login.config';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  try {
    const raw = (process.argv[2] ?? '').toString().toLowerCase();
    if (!raw || !(raw in loginMap)) {
      console.error('Usage: npx ts-node ./login.ts <sit1|sit2|staging2>');
      process.exit(1);
    }

    const env = raw as LoginEnvKey;
    const LOGIN_URL = loginMap[env];
    if (!LOGIN_URL) {
      console.error(`Login URL not configured for "${env}"`);
      process.exit(1);
    }

    const AUTH_FILE = path.join(process.cwd(), `auth-${env}.json`);
    console.log(`Opening ${env} login: ${LOGIN_URL}`);
    console.log(`Will save session to: ${AUTH_FILE}`);

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(LOGIN_URL);

    // Wait for manual login + MFA (default 2 minutes)
    const WAIT_MS = Number(process.env.LOGIN_TIMEOUT_MS ?? 120000);
    console.log(`Please complete manual login (including MFA). Waiting ${WAIT_MS/1000}s...`);
    await page.waitForTimeout(WAIT_MS);

    await context.storageState({ path: AUTH_FILE });
    console.log(`Saved session: ${AUTH_FILE}`);

    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
})();
