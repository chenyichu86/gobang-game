/**
 * Week 10 - 签到功能E2E测试
 *
 * 测试每日签到、连续签到、奖励等
 *
 * 测试数量: 2个
 * 预期状态: 🔴 RED（功能未完全实现）
 */

import { test, expect } from '@playwright/test';

test.describe('Week 10 - 签到功能E2E测试', () => {
  test('TC-E2E-09: 每日签到流程', async ({ page }) => {
    await page.goto('http://localhost:5173/checkin');

    // 清除签到数据
    await page.evaluate(() => {
      localStorage.removeItem('gobang_check_in_v2');
    });
    await page.reload();

    // 验证初始状态
    await expect(page.locator('[data-testid="check-in-button"]')).toBeEnabled();
    await expect(page.locator('[data-testid="consecutive-days"]')).toHaveText('0天');

    // 执行签到
    await page.click('[data-testid="check-in-button"]');

    // 验证签到成功
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('签到成功');
    await expect(page.locator('[data-testid="check-in-button"]')).toBeDisabled();

    // 验证连续签到天数
    await expect(page.locator('[data-testid="consecutive-days"]')).toHaveText('1天');

    // 验证今日已签到标记
    await expect(page.locator('[data-testid="today-checked"]')).toBeVisible();

    // 刷新页面验证持久化
    await page.reload();
    await expect(page.locator('[data-testid="check-in-button"]')).toBeDisabled();
  });

  test('TC-E2E-10: 连续签到奖励', async ({ page }) => {
    await page.goto('http://localhost:5173/checkin');

    // 模拟连续签到6天
    await page.evaluate(() => {
      const history = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        history.push(date.toDateString());
      }
      localStorage.setItem('gobang_check_in_v2', JSON.stringify({
        lastCheckInDate: history[history.length - 2],
        consecutiveDays: 6,
        totalCheckInDays: 6,
        checkInHistory: history.slice(0, -1),
      }));
    });

    // 刷新页面
    await page.reload();

    // 验证第7天额外奖励提示
    await expect(page.locator('[data-testid="bonus-reward"]')).toContainText('额外+100金币');

    // 执行签到
    await page.click('[data-testid="check-in-button"]');

    // 验证额外奖励（50 + 100 = 150）
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('150金币');
  });
});
