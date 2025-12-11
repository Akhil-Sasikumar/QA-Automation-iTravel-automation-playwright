import fs from 'fs';
import { LoginPageStaging2 } from '../pages/LoginPage.staging2.js';

export async function ensureAuth(page, env) {
  if (!env) throw new Error('ensureAuth: "env" argument is required (e.g. "sit1", "sit2", "staging2").');

  const environment = String(env).toLowerCase();

  // SIT1 & SIT2: require pre-saved session file (no automated login)
  if (environment === 'sit1' || environment === 'sit2') {
    const expected = `auth-${environment}.json`;
    if (!fs.existsSync(expected)) {
      throw new Error(
        `ensureAuth: expected stored session file "${expected}" not found. Run the recorder to create it (e.g. npm run login:${environment}).`
      );
    }
    console.log(`ensureAuth: ${environment.toUpperCase()} uses stored auth — skipping automated login.`);
    return;
  }

  // Only staging2 supports automated login in this project
  if (environment !== 'staging2') {
    throw new Error(`ensureAuth: unsupported env "${env}". Supported values: sit1, sit2, staging2.`);
  }

  // STAGING2 automated login
  const prefix = environment.toUpperCase();
  const loginPath = process.env[`${prefix}_LOGIN_URL`];
  const user = process.env[`${prefix}_USERNAME`];
  const pass = process.env[`${prefix}_PASSWORD`];

  if (!loginPath) throw new Error(`ensureAuth: ${prefix}_LOGIN_URL is required in environment variables.`);
  if (!user || !pass) throw new Error(`ensureAuth: ${prefix}_USERNAME and ${prefix}_PASSWORD must be set for automated staging2 login.`);

  const lp = new LoginPageStaging2(page);

  // Navigate and perform login. Let errors bubble up (no try/catch).
  await lp.gotoLogin(loginPath);
  await lp.login(user, pass);

  // Save storage state for subsequent runs
  const storagePath = `auth-staging2.json`;
  await page.context().storageState({ path: storagePath });
  console.log(`ensureAuth: automated staging2 login complete — storageState saved to ${storagePath}`);
}
