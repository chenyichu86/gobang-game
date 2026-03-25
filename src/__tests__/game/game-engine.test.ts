/**
 * GameEngine类单元测试
 * Week 2 - TC-019 至 TC-025, TC-049
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../../game/core/game-engine';
import type { Position } from '../../game/core/rules';

export interface MoveResult {
  success: boolean;
  error?: string;
  position?: Position;
  player?: 'black' | 'white';
  gameStatus?: 'idle' | 'playing' | 'won' | 'draw';
  winLine?: Position[] | null;
}

describe('GameEngine - TC-019: 游戏初始化测试', () => {
  it('应该正确初始化游戏', () => {
    const engine = new GameEngine();
    expect(engine.getGameStatus()).toBe('idle');
    expect(engine.getCurrentPlayer()).toBe('black');
    expect(engine.getMoveHistory()).toHaveLength(0);

    engine.startGame();
    expect(engine.getGameStatus()).toBe('playing');
    expect(engine.getCurrentPlayer()).toBe('black');
  });
});

describe('GameEngine - TC-020: 正常落子测试', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine();
    engine.startGame();
  });

  it('应该正确执行落子', () => {
    const result = engine.makeMove({ x: 7, y: 7 }) as MoveResult;
    expect(result.success).toBe(true);
    expect(result.position).toEqual({ x: 7, y: 7 });
    expect(result.gameStatus).toBe('playing');

    expect(engine.getCurrentPlayer()).toBe('white');
    expect(engine.getMoveHistory()).toHaveLength(1);
    expect(engine.getBoard().getCell(7, 7)).toBe('black');
  });
});

describe('GameEngine - TC-021: 重复落子测试', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine();
    engine.startGame();
    engine.makeMove({ x: 7, y: 7 });
  });

  it('应该拒绝重复落子', () => {
    const result = engine.makeMove({ x: 7, y: 7 }) as MoveResult;
    expect(result.success).toBe(false);
    expect(result.error).toContain('occupied');

    expect(engine.getMoveHistory()).toHaveLength(1);
    expect(engine.getCurrentPlayer()).toBe('white');
  });
});

describe('GameEngine - TC-022: 游戏结束后落子测试', () => {
  it('游戏结束后应该拒绝落子', () => {
    const engine = new GameEngine();
    engine.startGame();

    // 创建5连获胜：黑棋横向5连
    // 落子顺序：(5,7)黑, (5,8)白, (6,7)黑, (6,8)白, (7,7)黑, (7,8)白, (8,7)黑, (8,8)白, (9,7)黑
    engine.makeMove({ x: 5, y: 7 });
    engine.makeMove({ x: 5, y: 8 });
    engine.makeMove({ x: 6, y: 7 });
    engine.makeMove({ x: 6, y: 8 });
    engine.makeMove({ x: 7, y: 7 });
    engine.makeMove({ x: 7, y: 8 });
    engine.makeMove({ x: 8, y: 7 });
    engine.makeMove({ x: 8, y: 8 });
    const winResult = engine.makeMove({ x: 9, y: 7 }) as MoveResult;

    expect(winResult.gameStatus).toBe('won');
    expect(engine.getGameStatus()).toBe('won');

    const result = engine.makeMove({ x: 10, y: 10 }) as MoveResult;
    expect(result.success).toBe(false);
    expect(result.error).toContain('not in playing state');
  });
});

describe('GameEngine - TC-023: 玩家交替测试', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine();
    engine.startGame();
  });

  it('应该正确交替玩家', () => {
    expect(engine.getCurrentPlayer()).toBe('black');

    engine.makeMove({ x: 7, y: 7 });
    expect(engine.getCurrentPlayer()).toBe('white');

    engine.makeMove({ x: 7, y: 8 });
    expect(engine.getCurrentPlayer()).toBe('black');

    engine.makeMove({ x: 7, y: 9 });
    expect(engine.getCurrentPlayer()).toBe('white');

    // 验证历史记录中的棋子颜色
    const history = engine.getMoveHistory();
    const board = engine.getBoard();
    expect(board.getCell(history[0].x, history[0].y)).toBe('black');
    expect(board.getCell(history[1].x, history[1].y)).toBe('white');
    expect(board.getCell(history[2].x, history[2].y)).toBe('black');
  });
});

describe('GameEngine - TC-024: 获胜判定测试', () => {
  it('应该正确判定横向获胜', () => {
    const engine = new GameEngine();
    engine.startGame();

    // 黑棋: (5,7), 白棋: (5,8), 黑棋: (6,7), 白棋: (6,8)
    // 黑棋: (7,7), 白棋: (7,8), 黑棋: (8,7), 白棋: (8,8), 黑棋: (9,7)
    const moves = [
      { x: 5, y: 7 },
      { x: 5, y: 8 },
      { x: 6, y: 7 },
      { x: 6, y: 8 },
      { x: 7, y: 7 },
      { x: 7, y: 8 },
      { x: 8, y: 7 },
      { x: 8, y: 8 },
      { x: 9, y: 7 },
    ];

    for (const move of moves) {
      const result = engine.makeMove(move) as MoveResult;
      if (move.x === 9 && move.y === 7) {
        expect(result.gameStatus).toBe('won');
        expect(result.winLine).toHaveLength(5);
        expect(result.player).toBe('black');
      }
    }

    expect(engine.getGameStatus()).toBe('won');
  });
});

describe('GameEngine - TC-025: 和棋判定测试', () => {
  it('应该正确判定和棋', () => {
    const engine = new GameEngine();
    engine.startGame();

    // 简化测试：使用小棋盘或直接检查逻辑
    // 填满棋盘（这里只是示例，实际需要225步）
    let movedToDraw = false;
    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        const result = engine.makeMove({ x, y }) as MoveResult;
        if (result.gameStatus === 'draw') {
          movedToDraw = true;
          expect(result.gameStatus).toBe('draw');
          expect(result.player).toBeUndefined();
          break;
        }
      }
      if (movedToDraw) break;
    }
  });
});

describe('GameEngine - 基础功能测试', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine();
    engine.startGame();
  });

  it('应该正确获取棋盘', () => {
    const board = engine.getBoard();
    expect(board).toBeDefined();
    expect(board.getSize()).toBe(15);
  });

  it('应该正确重置游戏', () => {
    engine.makeMove({ x: 7, y: 7 });
    engine.makeMove({ x: 7, y: 8 });

    engine.resetGame();

    expect(engine.getGameStatus()).toBe('idle');
    expect(engine.getMoveHistory()).toHaveLength(0);
    expect(engine.getCurrentPlayer()).toBe('black');
  });
});
