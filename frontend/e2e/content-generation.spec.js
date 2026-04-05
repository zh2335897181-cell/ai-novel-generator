import { test, expect } from '@playwright/test';

test.describe('Content Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to novel detail
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("登录")');
    await page.waitForURL(/\/novels/);
    await page.click('.novel-card:first-child');
  });

  test('should open AI config dialog', async ({ page }) => {
    await page.click('button:has-text("AI配置")');
    await expect(page.locator('.ai-config-dialog')).toBeVisible();
  });

  test('should configure AI settings', async ({ page }) => {
    await page.click('button:has-text("AI配置")');
    
    // Select provider
    await page.selectOption('select[name="provider"]', 'openai');
    
    // Enter API key
    await page.fill('input[placeholder*="API Key"]', 'test-api-key');
    
    // Save configuration
    await page.click('button:has-text("保存")');
    
    await expect(page.locator('.el-message--success')).toBeVisible();
  });

  test('should generate content', async ({ page }) => {
    // Click generate button
    await page.click('button:has-text("生成内容")');

    // Enter prompt
    await page.fill('textarea[placeholder*="提示"]', 'Write the next chapter');
    
    // Start generation
    await page.click('button:has-text("开始生成")');

    // Should show loading state
    await expect(page.locator('.generating-indicator')).toBeVisible();

    // Wait for generation to complete (with timeout)
    await expect(page.locator('.generated-content')).toBeVisible({ timeout: 30000 });
  });

  test('should display generated content', async ({ page }) => {
    // Assuming content already generated
    await expect(page.locator('.content-editor')).toBeVisible();
    
    const content = await page.locator('.content-editor').textContent();
    expect(content.length).toBeGreaterThan(0);
  });

  test('should edit generated content', async ({ page }) => {
    await page.click('.content-editor');
    await page.keyboard.type(' Additional text');

    // Save changes
    await page.click('button:has-text("保存")');
    
    await expect(page.locator('.el-message--success')).toBeVisible();
  });

  test('should regenerate content', async ({ page }) => {
    const originalContent = await page.locator('.content-editor').textContent();

    await page.click('button:has-text("重新生成")');
    await page.click('button:has-text("确认")');

    // Wait for new content
    await page.waitForTimeout(2000);
    
    const newContent = await page.locator('.content-editor').textContent();
    expect(newContent).not.toBe(originalContent);
  });

  test('should export novel', async ({ page }) => {
    // Setup download listener
    const downloadPromise = page.waitForEvent('download');

    await page.click('button:has-text("导出")');
    await page.click('button:has-text("导出为PDF")');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
  });
});
