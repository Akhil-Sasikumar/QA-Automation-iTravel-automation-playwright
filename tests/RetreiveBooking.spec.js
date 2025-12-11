import { test, expect } from '@playwright/test';
import { ensureAuth } from '../helpers/auth.js';
import dotenv from 'dotenv';

dotenv.config();

const env = (process.env.TEST_ENV || 'sit2').toLowerCase();
const globaltimeout = Number(process.env.GLOBAL_TIMEOUT || 3000);

// Booking IDs per environment
const bookingIdsByEnv = {
  sit1: ['L6222A'],
  sit2: ['10029536'],
  staging2: ['10007962'],
};

test('RETRIEVE BOOKING', async ({ page }) => {
  // 1) Ensure you are logged in
  await ensureAuth(page, env);

  if (env === 'sit1' || env === 'sit2') {
    const dashboard =
      (env === 'sit1' && process.env.SIT1_DASHBOARD_URL) ||
      (env === 'sit2' && process.env.SIT2_DASHBOARD_URL);

    await page.goto(dashboard);

  }
  await page.waitForTimeout(globaltimeout);
  // 3) Open Selling App (new tab)
  const sellingAppTile = page.locator('div.widget-item_name:has-text("Selling App")');
  await expect(sellingAppTile).toBeVisible();

  const [sellingAppPage] = await Promise.all([
    page.context().waitForEvent('page'),
    sellingAppTile.click(),
  ]);

  console.log('Selling App URL:', sellingAppPage.url());

  // 4) Click "Retrieve Bookings" tab if present
  const retrieveTab = sellingAppPage.locator("//li[@role='tab']//a[@href='#Retrievebooking']");
  await retrieveTab.first().waitFor({ state: 'visible' });
  await retrieveTab.first().click();

  // 5) Pick booking ID for this environment
  const envBookings = bookingIdsByEnv[env] || [];
  if (envBookings.length === 0) {
    throw new Error(`No booking IDs configured for env: ${env}`);
  }
  const bookingId = envBookings[0];
  console.log(`Using booking ID: ${bookingId} for env: ${env}`);

  // 6) Fill booking reference
  const bookingIdInput = sellingAppPage.locator(
    'input[placeholder="Booking Ref No/CartID"]'
  );
  await expect(bookingIdInput).toBeVisible({ timeout: 10000 });
  await bookingIdInput.fill(bookingId);
  await page.waitForTimeout(globaltimeout);
  console.log('✓ Booking ID entered');

  // 7) Click Search + wait for bookingConfirmationPageV1.html in Network (SPA)
  const searchButton = sellingAppPage.getByRole('button', { name: 'Search' });

  await Promise.all([
    sellingAppPage.waitForResponse((response) =>
      response.url().includes('bookingConfirmationPageV1.html') &&
      response.ok()
    ),
    searchButton.click(),
  ]);

  // 8) Wait for Cancel Booking button to be visible on the confirmation page
  const cancelButton = sellingAppPage.locator('button.ga-nbcbcp__cancelbooking-btn');
  await expect(cancelButton).toBeVisible({ timeout: 60000 });
  console.log('✓ Cancel Booking button is visible');
  await page.waitForTimeout(globaltimeout);

});

