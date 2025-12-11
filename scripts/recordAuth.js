import { chromium } from 'playwright';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_GLOBAL_TIMEOUT = 60_000; // ms for short waits
const DEFAULT_MFA_TIMEOUT = 10 * 60_000; // 10 minutes for MFA + redirects

function getEnvName() {
  const envArg = process.env.TEST_ENV || process.argv[2] || 'sit1';
  const env = String(envArg).toLowerCase();
  if (!['sit1', 'sit2', 'staging2'].includes(env)) {
    throw new Error(`Unsupported environment "${env}". Supported: sit1, sit2, staging2`);
  }
  return env;
}

function getConfigForEnv(env) {
  const upper = env.toUpperCase();

  // Required
  const base = process.env[`${upper}_BASE_URL`] || process.env.BASE_URL;
  const loginPath = process.env[`${upper}_LOGIN_URL`] || process.env.LOGIN_URL || '/';

  // Optional overrides for selectors (useful if sit1 and sit2 have different DOM)
  const usernameSelector = process.env[`${upper}_USERNAME_SELECTOR`] || process.env.USERNAME_SELECTOR || '#username1';
  const nextButtonSelector = process.env[`${upper}_NEXT_SELECTOR`] || process.env.NEXT_SELECTOR || 'button[ng-click="goNext(loginUserForm)"]';

  // Username value to autofill (required if you want autofill)
  const usernameValue = process.env[`${upper}_USERNAME`] || process.env.USERNAME || '';

  // Output file (canonical)
  const outFile = `auth-${env}.json`;

  return {
    base,
    loginPath,
    usernameSelector,
    nextButtonSelector,
    usernameValue,
    outFile
  };
}

async function run() {
  const env = getEnvName();
  const cfg = getConfigForEnv(env);

  if (!cfg.base) {
    console.error(`Missing base URL for ${env.toUpperCase()}. Set ${env.toUpperCase()}_BASE_URL or BASE_URL in .env`);
    process.exit(1);
  }

  const startUrl = (() => {
    try {
      return new URL(cfg.loginPath, cfg.base).toString();
    } catch (e) {
      console.error('Failed to build login URL:', e.message || e);
      process.exit(1);
    }
  })();

  console.log(`\nRecording auth for environment: ${env.toUpperCase()}`);
  console.log(`Opening login page: ${startUrl}`);
  console.log(`Will auto-fill username using selector: ${cfg.usernameSelector}`);
  console.log(`Will click next using selector: ${cfg.nextButtonSelector}`);
  console.log(`Saved session will be written to: ${cfg.outFile}\n`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to login page
  try {
    await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: DEFAULT_GLOBAL_TIMEOUT });
  } catch (e) {
    console.warn('Initial navigation timed out or failed (continuing):', e.message || e);
  }

  // If username is provided, try to auto-fill and click next
  if (cfg.usernameValue) {
    try {
      // Wait briefly for username input to appear
      await page.waitForSelector(cfg.usernameSelector, { timeout: DEFAULT_GLOBAL_TIMEOUT });
      await page.fill(cfg.usernameSelector, cfg.usernameValue);
      console.log(`✓ Auto-filled username into ${cfg.usernameSelector}`);

      // If next button exists, click it
      const nextExists = await page.locator(cfg.nextButtonSelector).count();
      if (nextExists > 0) {
        await page.click(cfg.nextButtonSelector);
        console.log(`✓ Clicked next button (${cfg.nextButtonSelector}). Please complete password & MFA manually.`);
      } else {
        console.log(`→ Next button (${cfg.nextButtonSelector}) not found; please continue manually.`);
      }
    } catch (e) {
      console.warn('Auto-fill username step failed (proceed manually):', e.message || e);
    }
  } else {
    console.log('No username provided in env; please enter username manually in the opened browser.');
  }

  console.log('\n🔐 Please complete password and MFA in the opened browser window.');
  console.log(`The script will wait up to ${Math.round(DEFAULT_MFA_TIMEOUT/60000)} minutes for the dashboard to appear, then save the session.\n`);

  // Wait for dashboard indicator (Selling App tile). This is broad and adjustable.
  try {
    await page.waitForSelector(
      'div.widget-item_name:has-text("Selling App"), #dashboard-root, .dashboard-main, .widget-container',
      { timeout: DEFAULT_MFA_TIMEOUT }
    );
    console.log('🏠 Dashboard detected (Selling App or dashboard container).');
  } catch (e) {
    console.warn(`Timeout while waiting for dashboard (${DEFAULT_MFA_TIMEOUT}ms).`);
    // still continue to save if user wants; check current url and cookies for diagnostics
  }

  // Diagnostic info before saving
  try {
    console.log('Current page URL before saving:', page.url());
    const cookies = await context.cookies();
    const cookieDomains = Array.from(new Set(cookies.map(c => c.domain))).slice(0, 10);
    console.log('Context cookie domains (sample):', cookieDomains);
  } catch (e) {
    console.warn('Failed to read diagnostic cookies:', e.message || e);
  }

  // Save storage state
  try {
    await context.storageState({ path: cfg.outFile });
    console.log(`\n✅ Saved storage state to ${cfg.outFile}`);
  } catch (e) {
    console.error('Failed to save storage state:', e.message || e);
    await browser.close();
    process.exit(1);
  }

  await browser.close();
  console.log('Browser closed — recording complete.\n');
}

run().catch(err => {
  console.error('recordAuth encountered an error:', err);
  process.exit(1);
});
