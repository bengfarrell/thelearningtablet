import { test, expect } from '@playwright/test';
test.describe('Tablet App', () => {
    test('should display the main heading', async ({ page }) => {
        await page.goto('/');
        const heading = page.locator('h1');
        await expect(heading).toContainText('The Learning Tablet');
    });
    test('should render the application', async ({ page }) => {
        await page.goto('/');
        const app = page.locator('tablet-app');
        await expect(app).toBeVisible();
    });
    test('page should have correct title', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/The Learning Tablet/);
    });
    test('should display device status heading', async ({ page }) => {
        await page.goto('/');
        const heading = page.getByText('Device Status');
        await expect(heading).toBeVisible();
    });
    test('should display drawing canvas heading', async ({ page }) => {
        await page.goto('/');
        const heading = page.getByText('Drawing Canvas');
        await expect(heading).toBeVisible();
    });
});
//# sourceMappingURL=app.spec.js.map