import { test, expect } from '@playwright/test';

test.describe('Novel Creation and Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("登录")');
    await page.waitForURL(/\/novels/);
  });

  test('should display novel list page', async ({ page }) => {
    await expect(page.locator('h1:has-text("我的小说")')).toBeVisible();
  });

  test('should create new novel', async ({ page }) => {
    await page.click('button:has-text("创建新小说")');

    // Fill novel form
    await page.fill('input[placeholder*="标题"]', 'Test Novel');
    await page.selectOption('select[name="genre"]', 'Fantasy');
    await page.fill('textarea[placeholder*="大纲"]', 'This is a test novel outline');

    await page.click('button:has-text("创建")');

    // Should show success message
    await expect(page.locator('.el-message--success')).toBeVisible();
    
    // Should see new novel in list
    await expect(page.locator('text=Test Novel')).toBeVisible();
  });

  test('should view novel details', async ({ page }) => {
    // Click on first novel
    await page.click('.novel-card:first-child');

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/novels\/\d+/);
    await expect(page.locator('.novel-detail')).toBeVisible();
  });

  test('should edit novel', async ({ page }) => {
    await page.click('.novel-card:first-child');
    await page.click('button:has-text("编辑")');

    // Update title
    await page.fill('input[placeholder*="标题"]', 'Updated Novel Title');
    await page.click('button:has-text("保存")');

    // Should show success message
    await expect(page.locator('.el-message--success')).toBeVisible();
  });

  test('should delete novel', async ({ page }) => {
    const novelCount = await page.locator('.novel-card').count();

    // Delete first novel
    await page.click('.novel-card:first-child .delete-button');
    
    // Confirm deletion
    await page.click('button:has-text("确认")');

    // Should show success message
    await expect(page.locator('.el-message--success')).toBeVisible();

    // Novel count should decrease
    await expect(page.locator('.novel-card')).toHaveCount(novelCount - 1);
  });

  test('should search novels', async ({ page }) => {
    await page.fill('input[placeholder*="搜索"]', 'Fantasy');

    // Should filter results
    const novels = page.locator('.novel-card');
    await expect(novels.first()).toContainText('Fantasy');
  });
});
