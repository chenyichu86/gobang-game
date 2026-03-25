/**
 * Week 10 - PvE对局E2E测试
 *
 * 测试PvE完整流程、AI响应时间、性能等
 *
 * 测试数量: 2个
 * 预期状态: 🔴 RED（功能未完全实现）
 */

import { test, expect } from '@playwright/test';

test.describe('Week 10 - PvE对局E2E测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('TC-E2E-03: PvE对局完整流程', async ({ page }) => {
    // 选择PvE模式
    await page.click('[data-testid="pve-mode-button"]');

    // 选择难度
    await page.selectOption('[data-testid="difficulty-select"]', 'medium');

    // 开始游戏
    await page.click('[data-testid="start-game-button"]');

    // 验证游戏状态
    await expect(page.locator('[data-testid="status"]')).toContainText('黑棋回合');

    // 玩家落子
    await page.locator('.konvajs-content').click({ position: { x: 300, y: 300 } });

    // 等待AI落子（最多5秒）
    await expect(page.locator('[data-testid="status"]')).toContainText('黑棋回合', { timeout: 5000 });

    // 验证悔棋功能（撤销2步）
    const undoCountBefore = await page.locator('[data-testid="undo-count"]').textContent();
    await page.click('[data-testid="undo-button"]');
    const undoCountAfter = await page.locator('[data-testid="undo-count"]').textContent();
    expect(parseInt(undoCountAfter!)).toBe(parseInt(undoCountBefore!) - 1);

    // 验证提示功能
    await page.click('[data-testid="hint-button"]');
    await expect(page.locator('[data-testid="hint-marker"]')).toBeVisible();
  });

  test('TC-E2E-04: PvE AI响应时间', async ({ page }) => {
    await page.click('[data-testid="pve-mode-button"]');
    await page.selectOption('[data-testid="difficulty-select"]', 'medium');
    await page.click('[data-testid="start-game-button"]');

    // 测试AI响应时间
    const startTime = Date.now();
    await page.locator('.konvajs-content').click({ position: { x: 300, y: 300 } });
    await page.waitForSelector('[data-testid="status"]:has-text("黑棋回合")', { timeout: 5000 });
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(5000); // MediumAI应<5秒
  });
});
