/**
 * GameRules类单元测试
 * Week 2 - TC-010 至 TC-018, TC-045至TC-048
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Board } from '../../game/core/board';
import { GameRules } from '../../game/core/rules';

describe('GameRules - TC-010: 横向5连判断测试', () => {
  let board: Board;

  beforeEach(() => {
    board = new Board();
  });

  it('应该正确识别横向5连', () => {
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

describe('GameRules - TC-011: 纵向5连判断测试', () => {
  let board: Board;

  beforeEach(() => {
    board = new Board();
  });

  it('应该正确识别纵向5连', () => {
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

describe('GameRules - TC-012: 主对角线5连判断测试', () => {
  let board: Board;

  beforeEach(() => {
    board = new Board();
  });

  it('应该正确识别主对角线5连', () => {
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

describe('GameRules - TC-013: 副对角线5连判断测试', () => {
  let board: Board;

  beforeEach(() => {
    board = new Board();
  });

  it('应该正确识别副对角线5连', () => {
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

describe('GameRules - TC-014: 未达到5子判断测试', () => {
  let board: Board;

  beforeEach(() => {
    board = new Board();
  });

  it('4子连续不应该判胜', () => {
    for (let i = 5; i < 9; i++) {
      board.setCell(i, 7, 'black');
    }

    const winLine = GameRules.checkWin(board, { x: 7, y: 7 });
    expect(winLine).toBeNull();
  });
});

describe('GameRules - TC-015: 超过5子判断测试', () => {
  let board: Board;

  beforeEach(() => {
    board = new Board();
  });

  it('6子连续应该判胜', () => {
    for (let i = 5; i < 11; i++) {
      board.setCell(i, 7, 'black');
    }

    const winLine = GameRules.checkWin(board, { x: 7, y: 7 });
    expect(winLine).not.toBeNull();
    expect(winLine).toHaveLength(6);
  });
});

describe('GameRules - TC-016: 边界5连判断测试', () => {
  it('应该正确识别左上角边界5连', () => {
    const board = new Board();
    for (let i = 0; i < 5; i++) {
      board.setCell(i, 0, 'black');
    }

    const winLine = GameRules.checkWin(board, { x: 2, y: 0 });
    expect(winLine).not.toBeNull();
    expect(winLine).toHaveLength(5);
  });
});

describe('GameRules - TC-017: 被阻挡的连线判断测试', () => {
  let board: Board;

  beforeEach(() => {
    board = new Board();
  });

  it('被阻挡的连线不应该判胜', () => {
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

describe('GameRules - TC-018: 有效落子验证测试', () => {
  let board: Board;

  beforeEach(() => {
    board = new Board();
    board.setCell(7, 7, 'black');
  });

  it('应该正确验证有效落子', () => {
    expect(GameRules.isValidMove(board, { x: 7, y: 8 })).toBe(true);
  });

  it('应该拒绝已占位置', () => {
    expect(GameRules.isValidMove(board, { x: 7, y: 7 })).toBe(false);
  });

  it('应该拒绝越界位置', () => {
    expect(GameRules.isValidMove(board, { x: -1, y: 0 })).toBe(false);
    expect(GameRules.isValidMove(board, { x: 15, y: 0 })).toBe(false);
  });
});

describe('GameRules - TC-048: 空棋盘测试', () => {
  it('空位置检查胜负应该返回null', () => {
    const board = new Board();
    const winLine = GameRules.checkWin(board, { x: 7, y: 7 });
    expect(winLine).toBeNull();
  });
});
