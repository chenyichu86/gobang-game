/**
 * Week 10 - 商城功能E2E测试
 *
 * 测试商城购买流程、金币扣除、持久化等
 *
 * 测试数量: 2个
 * 预期状态: 🔴 RED（功能未完全实现）
 */

import { test, expect } from '@playwright/test';

test.describe('Week 10 - 商城功能E2E测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/shop');
  });

  test('TC-E2E-05: 商城购买流程', async ({ page }) => {
    // 获取初始金币余额
    const initialCoins = await page.locator('[data-testid="coin-balance"]').textContent();
    const initialCoinsNum = parseInt(initialCoins!.replace(/,/g, ''));

    // 选择一款皮肤
    await page.click('[data-testid="skin-classic-board"]');

    // 购买皮肤
    await page.click('[data-testid="purchase-button"]');

    // 验证购买成功提示
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('购买成功');

    // 验证金币扣除
    const finalCoins = await page.locator('[data-testid="coin-balance"]').textContent();
    const finalCoinsNum = parseInt(finalCoins!.replace(/,/g, ''));
    expect(finalCoinsNum).toBeLessThan(initialCoinsNum);

    // 验证拥有状态
    await expect(page.locator('[data-testid="owned-badge"]')).toBeVisible();

    // 刷新页面验证持久化
    await page.reload();
    await expect(page.locator('[data-testid="owned-badge"]')).toBeVisible();
  });

  test('TC-E2E-06: 金币不足提示', async ({ page }) => {
    // 修改金币为0
    await page.evaluate(() => {
      localStorage.setItem('gobang_user_data_v2', JSON.stringify({
        coins: 0,
        unlockedSkins: [],
      }));
    });

    // 刷新页面
    await page.reload();

    // 尝试购买昂贵皮肤
    await page.click('[data-testid="skin-premium-board"]');
    await page.click('[data-testid="purchase-button"]');

    // 验证金币不足提示
    await expect(page.locator('[data-testid="error-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-toast"]')).toContainText('金币不足');
  });
});
