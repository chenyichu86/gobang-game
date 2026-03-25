/**
 * Week 10 - 任务系统E2E测试
 *
 * 测试任务完成、进度更新、每日刷新等
 *
 * 测试数量: 2个
 * 预期状态: 🔴 RED（功能未完全实现）
 */

import { test, expect } from '@playwright/test';

test.describe('Week 10 - 任务系统E2E测试', () => {
  test('TC-E2E-07: 完成任务并领取奖励', async ({ page }) => {
    await page.goto('http://localhost:5173/tasks');

    // 检查初始进度
    await expect(page.locator('[data-testid="task-progress-1"]')).toHaveText('0/3');

    // 完成3局游戏
    for (let i = 0; i < 3; i++) {
      await page.goto('http://localhost:5173');
      await page.click('[data-testid="pve-mode-button"]');
      await page.selectOption('[data-testid="difficulty-select"]', 'simple');
      await page.click('[data-testid="start-game-button"]');

      // 玩家落子
      await page.locator('.konvajs-content').click({ position: { x: 300, y: 300 } });

      // 等待AI落子
      await page.waitForTimeout(500);

      // 认输结束游戏
      await page.click('[data-testid="resign-button"]');
      await page.click('[data-testid="return-home-button"]');
    }

    // 返回任务页面
    await page.goto('http://localhost:5173/tasks');

    // 验证任务完成
    await expect(page.locator('[data-testid="task-progress-1"]')).toHaveText('3/3');
    await expect(page.locator('[data-testid="task-status-1"]')).toContainText('已完成');

    // 领取奖励
    await page.click('[data-testid="claim-reward-button-1"]');

    // 验证奖励领取成功
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="claim-reward-button-1"]')).toBeDisabled();
  });

  test('TC-E2E-08: 任务每日刷新', async ({ page }) => {
    await page.goto('http://localhost:5173/tasks');

    // 修改任务日期为昨天
    await page.evaluate(() => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      localStorage.setItem('gobang_tasks_v2', JSON.stringify({
        dailyTasks: {
          date: yesterday.toISOString().split('T')[0],
          tasks: [
            { id: '1', progress: 3, target: 3, completed: true, claimed: true },
          ],
        },
      }));
    });

    // 刷新页面
    await page.reload();

    // 验证任务已刷新
    await expect(page.locator('[data-testid="task-progress-1"]')).toHaveText('0/3');
  });
});
