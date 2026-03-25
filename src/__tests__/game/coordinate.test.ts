/**
 * 坐标转换单元测试
 * Week 2 - TC-026 至 TC-029
 */

import { describe, it, expect } from 'vitest';
import { screenToGrid, gridToScreen } from '../../utils/coordinate';

describe('Coordinate - TC-026: 屏幕坐标转网格坐标测试', () => {
  const canvasSize = 600;
  const padding = 30;

  it('应该正确转换中心点', () => {
    const result = screenToGrid(300, 300, canvasSize, padding);
    expect(result).toEqual({ x: 7, y: 7 });
  });

  it('应该正确转换左上角', () => {
    const result = screenToGrid(30, 30, canvasSize, padding);
    expect(result).toEqual({ x: 0, y: 0 });
  });

  it('应该正确转换右下角', () => {
    const result = screenToGrid(570, 570, canvasSize, padding);
    expect(result).toEqual({ x: 14, y: 14 });
  });

  it('边界外点击应该返回null', () => {
    // 左边距外 - 需要足够远才会四舍五入到负数
    expect(screenToGrid(10, 300, canvasSize, padding)).toBeNull();
    expect(screenToGrid(300, 10, canvasSize, padding)).toBeNull();
    // 右边距外
    expect(screenToGrid(590, 300, canvasSize, padding)).toBeNull();
    expect(screenToGrid(300, 590, canvasSize, padding)).toBeNull();
  });
});

describe('Coordinate - TC-027: 网格坐标转屏幕坐标测试', () => {
  const canvasSize = 600;
  const padding = 30;

  it('应该正确转换中心点', () => {
    const result = gridToScreen(7, 7, canvasSize, padding);
    expect(result).toEqual({ x: 300, y: 300 });
  });

  it('应该正确转换左上角', () => {
    const result = gridToScreen(0, 0, canvasSize, padding);
    expect(result).toEqual({ x: padding, y: padding });
  });

  it('应该正确转换右下角', () => {
    const result = gridToScreen(14, 14, canvasSize, padding);
    expect(result).toEqual({ x: 570, y: 570 });
  });
});

describe('Coordinate - TC-028: 坐标转换往返精度测试', () => {
  const canvasSize = 600;
  const padding = 30;

  const testPositions = [
    { x: 0, y: 0 },
    { x: 7, y: 7 },
    { x: 14, y: 14 },
    { x: 3, y: 5 },
    { x: 10, y: 12 },
  ];

  it('往返转换应该保持精度', () => {
    for (const pos of testPositions) {
      const screen = gridToScreen(pos.x, pos.y, canvasSize, padding);
      const grid = screenToGrid(screen.x, screen.y, canvasSize, padding);
      expect(grid).toEqual(pos);
    }
  });
});

describe('Coordinate - TC-029: 坐标转换边界值测试', () => {
  const canvasSize = 600;
  const padding = 30;

  it('应该正确处理四个角点', () => {
    expect(screenToGrid(30, 30, canvasSize, padding)).toEqual({ x: 0, y: 0 });
    expect(screenToGrid(570, 30, canvasSize, padding)).toEqual({ x: 14, y: 0 });
    expect(screenToGrid(30, 570, canvasSize, padding)).toEqual({ x: 0, y: 14 });
    expect(screenToGrid(570, 570, canvasSize, padding)).toEqual({ x: 14, y: 14 });
  });

  it('应该正确处理四边中点', () => {
    expect(screenToGrid(300, 30, canvasSize, padding)).toEqual({ x: 7, y: 0 });
    expect(screenToGrid(300, 570, canvasSize, padding)).toEqual({ x: 7, y: 14 });
    expect(screenToGrid(30, 300, canvasSize, padding)).toEqual({ x: 0, y: 7 });
    expect(screenToGrid(570, 300, canvasSize, padding)).toEqual({ x: 14, y: 7 });
  });

  it('边界外应该返回null', () => {
    // 左边距外
    expect(screenToGrid(10, 300, canvasSize, padding)).toBeNull();
    // 右边距外
    expect(screenToGrid(590, 300, canvasSize, padding)).toBeNull();
    // 上边距外
    expect(screenToGrid(300, 10, canvasSize, padding)).toBeNull();
    // 下边距外
    expect(screenToGrid(300, 590, canvasSize, padding)).toBeNull();
  });
});
