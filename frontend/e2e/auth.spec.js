import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/AI Novel/);
    await expect(page.locator('text=登录')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("登录")');

    // Should redirect to novel list
    await expect(page).toHaveURL(/\/novels/);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button:has-text("登录")');

    // Should show error message
    await expect(page.locator('.el-message--error')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.click('text=注册账号');
    await expect(page).toHaveURL(/\/register/);
  });

  test('should register new user', async ({ page }) => {
    await page.click('text=注册账号');
    
    await page.fill('input[placeholder*="用户名"]', 'newuser');
    await page.fill('input[type="email"]', 'newuser@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("注册")');

    // Should redirect to login or novels page
    await page.waitForURL(/\/(login|novels)/);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("登录")');

    // Logout
    await page.click('button:has-text("退出")');
    await expect(page).toHaveURL(/\/login/);
  });
});
