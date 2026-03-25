import { test as base, Page } from '@playwright/test';

/**
 * Playwright测试基类
 * 用于Week 4的E2E测试
 */
export const test = base.extend<{
  gamePage: Page;
}>({
  gamePage: async ({ page }, use) => {
    await page.goto('/');
    await use(page);
  },
});

export { expect } from '@playwright/test';
