/**
 * 坐标转换工具单元测试
 * 测试用例: TC-026 至 TC-029
 */

import { describe, it, expect } from 'vitest';
import { screenToGrid, gridToScreen } from '../coordinate';

describe('坐标转换工具测试', () => {
  const canvasSize = 600;
  const padding = 30;

  /**
   * TC-026: 屏幕坐标转网格坐标测试
   */
  describe('TC-026: 屏幕坐标转网格坐标测试', () => {
    it('应该正确转换屏幕坐标为网格坐标', () => {
      // 中心点
      expect(screenToGrid(300, 300, canvasSize, padding)).toEqual({ x: 7, y: 7 });

      // 左上角
      expect(screenToGrid(30, 30, canvasSize, padding)).toEqual({ x: 0, y: 0 });

      // 右下角
      expect(screenToGrid(570, 570, canvasSize, padding)).toEqual({ x: 14, y: 14 });

      // 边界外 (真正的边界外坐标,四舍五入后仍越界)
      expect(screenToGrid(10, 300, canvasSize, padding)).toBeNull();
      expect(screenToGrid(300, 10, canvasSize, padding)).toBeNull();
    });
  });

  /**
   * TC-027: 网格坐标转屏幕坐标测试
   */
  describe('TC-027: 网格坐标转屏幕坐标测试', () => {
    it('应该正确转换网格坐标为屏幕坐标', () => {
      // 中心点
      expect(gridToScreen(7, 7, canvasSize, padding)).toEqual({ x: 300, y: 300 });

      // 左上角
      expect(gridToScreen(0, 0, canvasSize, padding)).toEqual({ x: padding, y: padding });

      // 右下角
      expect(gridToScreen(14, 14, canvasSize, padding)).toEqual({ x: 570, y: 570 });
    });
  });

  /**
   * TC-028: 坐标转换往返精度测试
   */
  describe('TC-028: 坐标转换往返精度测试', () => {
    it('应该保证往返转换后结果一致', () => {
      const testPositions = [
        { x: 0, y: 0 },
        { x: 7, y: 7 },
        { x: 14, y: 14 },
        { x: 3, y: 5 },
        { x: 10, y: 12 },
      ];

      for (const pos of testPositions) {
        const screen = gridToScreen(pos.x, pos.y, canvasSize, padding);
        const grid = screenToGrid(screen.x, screen.y, canvasSize, padding);
        expect(grid).toEqual(pos);
      }
    });
  });

  /**
   * TC-029: 坐标转换边界值测试
   */
  describe('TC-029: 坐标转换边界值测试', () => {
    it('应该正确处理边界值', () => {
      // 四个角
      expect(screenToGrid(30, 30, canvasSize, padding)).toEqual({ x: 0, y: 0 });
      expect(screenToGrid(570, 30, canvasSize, padding)).toEqual({ x: 14, y: 0 });
      expect(screenToGrid(30, 570, canvasSize, padding)).toEqual({ x: 0, y: 14 });
      expect(screenToGrid(570, 570, canvasSize, padding)).toEqual({ x: 14, y: 14 });

      // 四边中点
      expect(screenToGrid(300, 30, canvasSize, padding)).toEqual({ x: 7, y: 0 });
      expect(screenToGrid(300, 570, canvasSize, padding)).toEqual({ x: 7, y: 14 });
      expect(screenToGrid(30, 300, canvasSize, padding)).toEqual({ x: 0, y: 7 });
      expect(screenToGrid(570, 300, canvasSize, padding)).toEqual({ x: 14, y: 7 });

      // 边界外多个像素
      expect(screenToGrid(10, 300, canvasSize, padding)).toBeNull();
      expect(screenToGrid(590, 300, canvasSize, padding)).toBeNull();
    });
  });
});
