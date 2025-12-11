// playwright.config.js
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const env = process.env.TEST_ENV || 'sit2';
const prefix = env.toUpperCase();

let storageState = undefined;
if (env === 'sit1' && fs.existsSync('auth-sit1.json')) {
  storageState = 'auth-sit1.json';
}
else if (env === 'sit2' && fs.existsSync('auth-sit2.json')) {
  storageState = 'auth-sit2.json';
}

const config = {
  testDir: './tests',
  timeout: 120000,
  reporter: [
    ['list'],
    ['html', {
      outputFolder: 'playwright-report',
      open: 'always'
    }]
  ],
  use: {
    baseURL: process.env[`${prefix}_BASE_URL`],
    headless: false,
    storageState,
    screenshot: 'on',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    launchOptions: {
      slowMo: 3000, // 3 seconds slow motion
    },
  },
  testDir: './tests',
};

export default config;
