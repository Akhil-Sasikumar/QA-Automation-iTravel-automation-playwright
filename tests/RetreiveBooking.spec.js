import { test, expect } from '@playwright/test';
import { ensureAuth } from '../helpers/auth.js';
import { ENV_DATA } from '../config/env.data.js';
import dotenv from 'dotenv';
dotenv.config();
const env = (process.env.TEST_ENV || 'sit2').toLowerCase();
const globaltimeout = Number(process.env.GLOBAL_TIMEOUT || 3000);

test('RETREIVE BOOKING', async ({ page }, testInfo) => {
  

    // Step 1: Ensure login
    await test.step(`Ensure user is authenticated for ${env}`, async () => {
        await ensureAuth(page, env);
    });

    // Step 2: Navigate to dashboard
    if (env === 'sit1' || env === 'sit2') {
        const dashboard =
            (env === 'sit1' && process.env.SIT1_DASHBOARD_URL) ||
            (env === 'sit2' && process.env.SIT2_DASHBOARD_URL);

        await test.step(`Navigate to ${env.toUpperCase()} dashboard`, async () => {
            await page.goto(dashboard);
        });
    }

    // Step 3: Open Selling App
    let sellingPage;
    const sellingAppTile = page.locator('div.widget-item_name:has-text("Selling App")');

    await test.step('Open Selling App from dashboard', async () => {
        await expect(sellingAppTile).toBeVisible({ timeout: 10000 });

        const [newPage] = await Promise.all([
            page.context().waitForEvent('page'),
            sellingAppTile.click(),
        ]);

        sellingPage = newPage;
    });

    // Step 4: Open Retrieve tab
    await test.step('Open Retrieve Booking tab', async () => {
        const retrieveTab = sellingPage.locator(
            "//li[@role='tab']//a[@href='#Retrievebooking']"
        );
        await retrieveTab.first().waitFor({ state: 'visible' });
        await retrieveTab.first().click();
    });

    // Step 5: Read booking ID from ENV_DATA
    const envBookings = ENV_DATA[env]?.booking?.ids || [];
    if (envBookings.length === 0) {
        throw new Error(`No booking IDs configured for env: ${env}`);
    }

    const bookingId = envBookings[0];

    await test.step(`Enter booking ID: ${bookingId}`, async () => {
        const bookingIdInput = sellingPage.locator(
            'input[placeholder="Booking Ref No/CartID"]'
        );
        await expect(bookingIdInput).toBeVisible({ timeout: 10000 });
        await bookingIdInput.fill(bookingId);
    });

    // Step 6: Search booking
    await test.step('Search booking', async () => {
        const searchButton = sellingPage.getByRole('button', { name: 'Search' });

        await Promise.all([
            sellingPage.waitForResponse(
                r => r.url().includes('bookingConfirmationPageV1.html') && r.ok()
            ),
            searchButton.click(),
        ]);
    });

    // Step 7: Verify booking loaded
    await test.step('Verify booking confirmation page', async () => {
        const cancelButton = sellingPage.locator('button.ga-nbcbcp__cancelbooking-btn');
        await expect(cancelButton).toBeVisible({ timeout: 60000 });
    });
});