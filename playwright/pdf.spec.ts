import { test } from '@playwright/test';
const baseURL = process.env.BASE_URL;

if (!baseURL) throw new Error('BASE_URL environment variable is not set');


test('get started link', async ({ page }) => {
  await page.goto(`${baseURL}/cv`);
  await page.pdf({
    path: './playwright/hans-askov-cv.pdf',
    printBackground: true,
    tagged: true,
    height: 2048,
    width: 1240,
  });
});