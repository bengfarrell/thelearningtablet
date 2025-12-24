import { test, expect } from '@playwright/test';
test.describe('Device Connection', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });
    test('should show tablet status component', async ({ page }) => {
        const statusComponent = page.locator('tablet-status');
        await expect(statusComponent).toBeVisible();
    });
    test('should show drawing canvas component', async ({ page }) => {
        const canvasComponent = page.locator('drawing-canvas');
        await expect(canvasComponent).toBeVisible();
    });
    test('components should be rendered in the correct sections', async ({ page }) => {
        // Check that the page structure is correct
        const sections = page.locator('.section');
        await expect(sections).toHaveCount(2);
    });
});
//# sourceMappingURL=connection.spec.js.map