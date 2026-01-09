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
  // timeout: 120000,
  reporter: [
    ['list'],
        // HTML report per environment
    ['html', {
      outputFolder: `playwright-report/${env}`,
      open: 'always',
    }],
    ['allure-playwright'],

    // JSON report per environment
    ['json', {
      outputFile: `playwright-report/${env}/results.json`,
    }],
  ],
  
  use: {
    baseURL: process.env[`${prefix}_BASE_URL`],
    headless: false,
    storageState,
    screenshot: 'on',
    trace: 'on',
    video: 'retain-on-failure',
    launchOptions: {
      slowMo: 5000, // 5 seconds slow motion
      args: ['--start-maximized'],
    },
  },
  testDir: './tests',
};

export default config;
