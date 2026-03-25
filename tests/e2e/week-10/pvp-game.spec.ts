/**
 * Week 10 - PvP对局E2E测试
 *
 * 测试PvP完整流程、胜负判定、金币奖励等
 *
 * 测试数量: 2个
 * 预期状态: 🔴 RED（功能未完全实现）
 */

import { test, expect } from '@playwright/test';

test.describe('Week 10 - PvP对局E2E测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('TC-E2E-01: PvP对局完整流程', async ({ page }) => {
    // 选择PvP模式
    await page.click('[data-testid="pvp-mode-button"]');

    // 开始游戏
    await page.click('[data-testid="start-game-button"]');

    // 验证游戏状态
    await expect(page.locator('[data-testid="status"]')).toContainText('黑棋回合');

    // 黑棋落子
    await page.locator('.konvajs-content').click({ position: { x: 300, y: 300 } });
    await expect(page.locator('[data-testid="status"]')).toContainText('白棋回合');

    // 白棋落子
    await page.locator('.konvajs-content').click({ position: { x: 320, y: 300 } });
    await expect(page.locator('[data-testid="status"]')).toContainText('黑棋回合');

    // 验证悔棋功能
    await page.click('[data-testid="undo-button"]');
    await expect(page.locator('[data-testid="status"]')).toContainText('白棋回合');

    // 验证重新开始
    await page.click('[data-testid="restart-button"]');
    await expect(page.locator('[data-testid="status"]')).toContainText('黑棋回合');

    // 验证返回主菜单
    await page.click('[data-testid="return-home-button"]');
    await expect(page.locator('[data-testid="home-menu"]')).toBeVisible();
  });

  test('TC-E2E-02: PvP胜负判定和金币奖励', async ({ page }) => {
    await page.click('[data-testid="pvp-mode-button"]');
    await page.click('[data-testid="start-game-button"]');

    // 模拟五连
    const moves = [
      { x: 300, y: 300 }, { x: 320, y: 300 },
      { x: 280, y: 300 }, { x: 340, y: 300 },
      { x: 260, y: 300 }, { x: 360, y: 300 },
      { x: 240, y: 300 },
    ];

    for (const move of moves) {
      await page.locator('.konvajs-content').click({ position: move });
    }

    // 验证胜负判定
    await expect(page.locator('[data-testid="winner-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="winner-text"]')).toContainText('黑棋获胜');

    // 验证金币奖励
    await expect(page.locator('[data-testid="coin-reward"]')).toContainText('+10');
  });
});
