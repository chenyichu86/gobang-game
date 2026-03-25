/**
 * GameRules类单元测试
 * 测试用例: TC-010 至 TC-018
 */

import { describe, it, expect } from 'vitest';
import { Board } from '../board';
import { GameRules } from '../rules';

describe('GameRules类测试', () => {
  /**
   * TC-010: 横向5连判断测试
   */
  describe('TC-010: 横向5连判断测试', () => {
    it('应该正确识别横向5连', () => {
      const board = new Board();
      for (let i = 5; i < 10; i++) {
        board.setCell(i, 7, 'black');
      }

      const winLine = GameRules.checkWin(board, { x: 7, y: 7 });
      expect(winLine).not.toBeNull();
      expect(winLine).toHaveLength(5);
      expect(winLine).toContainEqual({ x: 5, y: 7 });
      expect(winLine).toContainEqual({ x: 6, y: 7 });
      expect(winLine).toContainEqual({ x: 7, y: 7 });
      expect(winLine).toContainEqual({ x: 8, y: 7 });
      expect(winLine).toContainEqual({ x: 9, y: 7 });
    });
  });

  /**
   * TC-011: 纵向5连判断测试
   */
  describe('TC-011: 纵向5连判断测试', () => {
    it('应该正确识别纵向5连', () => {
      const board = new Board();
      for (let i = 5; i < 10; i++) {
        board.setCell(7, i, 'black');
      }

      const winLine = GameRules.checkWin(board, { x: 7, y: 7 });
      expect(winLine).not.toBeNull();
      expect(winLine).toHaveLength(5);
      expect(winLine).toContainEqual({ x: 7, y: 5 });
      expect(winLine).toContainEqual({ x: 7, y: 6 });
      expect(winLine).toContainEqual({ x: 7, y: 7 });
      expect(winLine).toContainEqual({ x: 7, y: 8 });
      expect(winLine).toContainEqual({ x: 7, y: 9 });
    });
  });

  /**
   * TC-012: 主对角线5连判断测试
   */
  describe('TC-012: 主对角线5连判断测试', () => {
    it('应该正确识别主对角线5连', () => {
      const board = new Board();
      for (let i = 5; i < 10; i++) {
        board.setCell(i, i, 'black');
      }

      const winLine = GameRules.checkWin(board, { x: 7, y: 7 });
      expect(winLine).not.toBeNull();
      expect(winLine).toHaveLength(5);
      expect(winLine).toContainEqual({ x: 5, y: 5 });
      expect(winLine).toContainEqual({ x: 6, y: 6 });
      expect(winLine).toContainEqual({ x: 7, y: 7 });
      expect(winLine).toContainEqual({ x: 8, y: 8 });
      expect(winLine).toContainEqual({ x: 9, y: 9 });
    });
  });

  /**
   * TC-013: 副对角线5连判断测试
   */
  describe('TC-013: 副对角线5连判断测试', () => {
    it('应该正确识别副对角线5连', () => {
      const board = new Board();
      for (let i = 0; i < 5; i++) {
        board.setCell(5 + i, 9 - i, 'black');
      }

      const winLine = GameRules.checkWin(board, { x: 7, y: 7 });
      expect(winLine).not.toBeNull();
      expect(winLine).toHaveLength(5);
      expect(winLine).toContainEqual({ x: 5, y: 9 });
      expect(winLine).toContainEqual({ x: 6, y: 8 });
      expect(winLine).toContainEqual({ x: 7, y: 7 });
      expect(winLine).toContainEqual({ x: 8, y: 6 });
      expect(winLine).toContainEqual({ x: 9, y: 5 });
    });
  });

  /**
   * TC-014: 未达到5子判断测试
   */
  describe('TC-014: 未达到5子判断测试', () => {
    it('应该返回null当未达到5连', () => {
      const board = new Board();
      for (let i = 5; i < 9; i++) {
        board.setCell(i, 7, 'black');
      }

      const winLine = GameRules.checkWin(board, { x: 7, y: 7 });
      expect(winLine).toBeNull();
    });
  });

  /**
   * TC-015: 超过5子判断测试
   */
  describe('TC-015: 超过5子判断测试', () => {
    it('应该正确识别超过5子的情况', () => {
      const board = new Board();
      for (let i = 5; i < 11; i++) {
        board.setCell(i, 7, 'black');
      }

      const winLine = GameRules.checkWin(board, { x: 7, y: 7 });
      expect(winLine).not.toBeNull();
      expect(winLine).toHaveLength(6);
    });
  });

  /**
   * TC-016: 边界5连判断测试
   */
  describe('TC-016: 边界5连判断测试', () => {
    it('应该正确识别边界的5连', () => {
      const board = new Board();
      for (let i = 0; i < 5; i++) {
        board.setCell(i, 0, 'black');
      }

      const winLine = GameRules.checkWin(board, { x: 2, y: 0 });
      expect(winLine).not.toBeNull();
      expect(winLine).toHaveLength(5);
    });
  });

  /**
   * TC-017: 被阻挡的连线判断测试
   */
  describe('TC-017: 被阻挡的连线判断测试', () => {
    it('应该返回null当连线被阻挡', () => {
      const board = new Board();
      // 黑 白 黑 黑 黑
      board.setCell(5, 7, 'black');
      board.setCell(6, 7, 'white');
      board.setCell(7, 7, 'black');
      board.setCell(8, 7, 'black');
      board.setCell(9, 7, 'black');

      const winLine = GameRules.checkWin(board, { x: 7, y: 7 });
      expect(winLine).toBeNull();
    });
  });

  /**
   * TC-018: 有效落子验证测试
   */
  describe('TC-018: 有效落子验证测试', () => {
    it('应该正确验证落子位置的有效性', () => {
      const board = new Board();
      board.setCell(7, 7, 'black');

      // 空位置 - 有效
      expect(GameRules.isValidMove(board, { x: 7, y: 8 })).toBe(true);

      // 已占位置 - 无效
      expect(GameRules.isValidMove(board, { x: 7, y: 7 })).toBe(false);

      // 越界位置 - 无效
      expect(GameRules.isValidMove(board, { x: -1, y: 0 })).toBe(false);
      expect(GameRules.isValidMove(board, { x: 15, y: 0 })).toBe(false);
    });
  });
});
