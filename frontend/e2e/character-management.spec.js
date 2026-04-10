import { test, expect } from '@playwright/test';

test.describe('Character Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to novel detail
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("登录")');
    await page.waitForURL(/\/novels/);
    await page.click('.novel-card:first-child');
  });

  test('should display character list', async ({ page }) => {
    await page.click('text=角色管理');
    await expect(page.locator('.character-list')).toBeVisible();
  });

  test('should add new character', async ({ page }) => {
    await page.click('text=角色管理');
    await page.click('button:has-text("添加角色")');

    // Fill character form
    await page.fill('input[placeholder*="姓名"]', 'Hero Character');
    await page.fill('textarea[placeholder*="描述"]', 'A brave hero');
    await page.fill('input[placeholder*="年龄"]', '25');

    await page.click('button:has-text("保存")');

    // Should see new character
    await expect(page.locator('text=Hero Character')).toBeVisible();
  });

  test('should edit character', async ({ page }) => {
    await page.click('text=角色管理');
    await page.click('.character-item:first-child .edit-button');

    // Update character
    await page.fill('input[placeholder*="姓名"]', 'Updated Character Name');
    await page.click('button:has-text("保存")');

    await expect(page.locator('text=Updated Character Name')).toBeVisible();
  });

  test('should delete character', async ({ page }) => {
    await page.click('text=角色管理');
    
    const characterCount = await page.locator('.character-item').count();

    await page.click('.character-item:first-child .delete-button');
    await page.click('button:has-text("确认")');

    await expect(page.locator('.character-item')).toHaveCount(characterCount - 1);
  });

  test('should view character relationships', async ({ page }) => {
    await page.click('text=角色关系');
    await expect(page.locator('.relationship-visualization')).toBeVisible();
  });

  test('should view character growth chart', async ({ page }) => {
    await page.click('text=角色成长');
    await expect(page.locator('.character-growth-chart')).toBeVisible();
  });
});

