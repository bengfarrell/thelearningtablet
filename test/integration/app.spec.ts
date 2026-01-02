import { test, expect } from '@playwright/test';

test.describe('HID Data Reader App', () => {
  test('should render the hid-data-reader component', async ({ page }) => {
    await page.goto('/');
    const app = page.locator('hid-data-reader');
    await expect(app).toBeVisible();
  });

  test('page should have correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/The Learning Tablet/);
  });

  test('should display connect button when not connected', async ({ page }) => {
    await page.goto('/');
    const connectButton = page.getByRole('button', { name: /Connect Real Tablet/i });
    await expect(connectButton).toBeVisible();
  });

  test('should display walkthrough step 1 on load', async ({ page }) => {
    await page.goto('/');
    const stepHeading = page.getByText('Step 1: Horizontal Movement');
    await expect(stepHeading).toBeVisible();
  });

  test('should have simulate button for walkthrough', async ({ page }) => {
    await page.goto('/');
    const simulateButton = page.getByRole('button', { name: /Simulate this data/i });
    await expect(simulateButton).toBeVisible();
  });
});
