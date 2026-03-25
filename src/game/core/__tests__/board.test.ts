/**
 * Board类单元测试
 * 测试用例: TC-001 至 TC-009
 */

import { describe, it, expect } from 'vitest';
import { Board } from '../board';

describe('Board类测试', () => {
  /**
   * TC-001: Board类初始化测试
   */
  describe('TC-001: Board类初始化测试', () => {
    it('应该创建15x15的空棋盘', () => {
      const board = new Board();
      expect(board.getSize()).toBe(15);
      expect(board.isEmpty(7, 7)).toBe(true);
      expect(board.isEmpty(0, 0)).toBe(true);
      expect(board.isEmpty(14, 14)).toBe(true);
      expect(board.getOccupiedPositions()).toHaveLength(0);
    });
  });

  /**
   * TC-002: Board类自定义大小初始化测试
   */
  describe('TC-002: Board类自定义大小初始化测试', () => {
    it('应该创建指定大小的棋盘', () => {
      const board = new Board(10);
      expect(board.getSize()).toBe(10);
      expect(board.isValid(0, 0)).toBe(true);
      expect(board.isValid(9, 9)).toBe(true);
      expect(board.isValid(10, 10)).toBe(false);
    });
  });

  /**
   * TC-003: 落子功能测试
   */
  describe('TC-003: 落子功能测试', () => {
    it('应该正确设置和获取棋子', () => {
      const board = new Board();
      board.setCell(7, 7, 'black');
      expect(board.getCell(7, 7)).toBe('black');
      expect(board.isEmpty(7, 7)).toBe(false);

      board.setCell(7, 8, 'white');
      expect(board.getCell(7, 8)).toBe('white');
      expect(board.getCell(7, 7)).toBe('black'); // 原有棋子不变
    });
  });

  /**
   * TC-004: 覆盖落子测试
   */
  describe('TC-004: 覆盖落子测试', () => {
    it('应该允许覆盖已有棋子', () => {
      const board = new Board();
      board.setCell(7, 7, 'black');
      board.setCell(7, 7, 'white');
      expect(board.getCell(7, 7)).toBe('white');
      expect(board.getOccupiedPositions()).toHaveLength(1);
    });
  });

  /**
   * TC-005: 位置验证测试
   */
  describe('TC-005: 位置验证测试', () => {
    it('应该正确验证位置有效性', () => {
      const board = new Board();

      // 有效位置
      expect(board.isValid(0, 0)).toBe(true);
      expect(board.isValid(14, 14)).toBe(true);
      expect(board.isValid(7, 7)).toBe(true);

      // 无效位置
      expect(board.isValid(-1, 0)).toBe(false);
      expect(board.isValid(15, 0)).toBe(false);
      expect(board.isValid(0, -1)).toBe(false);
      expect(board.isValid(0, 15)).toBe(false);
    });
  });

  /**
   * TC-006: 获取已占位置测试
   */
  describe('TC-006: 获取已占位置测试', () => {
    it('应该返回所有已落子位置', () => {
      const board = new Board();
      board.setCell(7, 7, 'black');
      board.setCell(7, 8, 'white');
      board.setCell(8, 7, 'black');

      const positions = board.getOccupiedPositions();
      expect(positions).toHaveLength(3);
      expect(positions).toContainEqual({ x: 7, y: 7 });
      expect(positions).toContainEqual({ x: 7, y: 8 });
      expect(positions).toContainEqual({ x: 8, y: 7 });
    });
  });

  /**
   * TC-007: 清空棋盘测试
   */
  describe('TC-007: 清空棋盘测试', () => {
    it('应该正确清空棋盘', () => {
      const board = new Board();
      board.setCell(7, 7, 'black');
      board.setCell(7, 8, 'white');

      board.clear();

      expect(board.isEmpty(7, 7)).toBe(true);
      expect(board.isEmpty(7, 8)).toBe(true);
      expect(board.getOccupiedPositions()).toHaveLength(0);
      expect(board.getSize()).toBe(15);
    });
  });

  /**
   * TC-008: 棋盘克隆测试
   */
  describe('TC-008: 棋盘克隆测试', () => {
    it('应该创建独立的棋盘副本', () => {
      const board = new Board();
      board.setCell(7, 7, 'black');
      board.setCell(7, 8, 'white');

      const cloned = board.clone();

      // 验证初始状态一致
      expect(cloned.getCell(7, 7)).toBe('black');
      expect(cloned.getCell(7, 8)).toBe('white');

      // 修改原棋盘
      board.setCell(7, 7, 'white');

      // 验证副本未受影响
      expect(cloned.getCell(7, 7)).toBe('black');
      expect(board.getCell(7, 7)).toBe('white');
    });
  });

  /**
   * TC-009: 越界访问抛出异常测试
   */
  describe('TC-009: 越界访问抛出异常测试', () => {
    it('应该在越界访问时抛出异常', () => {
      const board = new Board();

      // getCell越界
      expect(() => board.getCell(-1, 0)).toThrow('Invalid position');
      expect(() => board.getCell(15, 0)).toThrow('Invalid position');

      // setCell越界
      expect(() => board.setCell(-1, 0, 'black')).toThrow('Invalid position');
      expect(() => board.setCell(0, 15, 'white')).toThrow('Invalid position');
    });
  });
});
