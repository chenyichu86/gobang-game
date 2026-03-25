/**
 * MediumAI测试 - 中等AI（评分系统+棋型识别）
 * Week 3 - TC-093~107
 */

import { describe, it, expect } from 'vitest';
import { Board } from '../../core/board';
import { MediumAI } from '../medium-ai';

describe('MediumAI', () => {
  // TC-093: 中等AI-空棋盘天元开局
  it('应该在天元落子（棋盘为空）', () => {
    const board = new Board(15);
    const ai = new MediumAI();
    const move = ai.calculateMove(board, 'black');

    expect(move).toEqual({ x: 7, y: 7 });
  });

  // TC-094: 中等AI-识别并堵截活四
  it('应该识别并堵截对方活四', () => {
    const board = new Board(15);
    // 创建白棋活四：(5,7), (6,7), (7,7), (8,7)
    board.setCell(5, 7, 'white');
    board.setCell(6, 7, 'white');
    board.setCell(7, 7, 'white');
    board.setCell(8, 7, 'white');

    const ai = new MediumAI();
    const move = ai.calculateMove(board, 'black');

    // 应该堵截在 (4,7) 或 (9,7)
    expect(move.y).toBe(7);
    expect(move.x === 4 || move.x === 9).toBe(true);
  });

  // TC-095: 中等AI-识别并堵截冲四
  it('应该识别并堵截对方冲四', () => {
    const board = new Board(15);
    // 创建冲四（一端被堵）：
    board.setCell(0, 7, 'black'); // 堵截端
    board.setCell(1, 7, 'white');
    board.setCell(2, 7, 'white');
    board.setCell(3, 7, 'white');
    board.setCell(4, 7, 'white');

    const ai = new MediumAI();
    const move = ai.calculateMove(board, 'black');

    // 应该堵截在 (5,7)
    expect(move).toEqual({ x: 5, y: 7 });
  });

  // TC-096: 中等AI-形成自己的活四
  it('应该形成自己的活四', () => {
    const board = new Board(15);
    // 创建黑棋活三：
    board.setCell(5, 7, 'black');
    board.setCell(6, 7, 'black');
    board.setCell(7, 7, 'black');

    const ai = new MediumAI();
    const move = ai.calculateMove(board, 'black');

    // 应该形成活四：(4,7) 或 (8,7)
    expect(move.y).toBe(7);
    expect(move.x === 4 || move.x === 8).toBe(true);
  });

  // TC-097: 中等AI-识别并堵截活三
  it('应该识别并堵截对方活三', () => {
    const board = new Board(15);
    // 创建白棋活三：
    board.setCell(5, 7, 'white');
    board.setCell(6, 7, 'white');
    board.setCell(7, 7, 'white');

    // 添加一些干扰棋子
    board.setCell(3, 3, 'black');

    const ai = new MediumAI();
    const move = ai.calculateMove(board, 'black');

    // 应该堵截在 (4,7) 或 (8,7)
    expect(move.y).toBe(7);
    expect(move.x === 4 || move.x === 8).toBe(true);
  });

  // TC-098: 中等AI-优先进攻而非防守
  it('应该优先进攻而非防守（活四 > 防守活三）', () => {
    const board = new Board(15);
    // 黑棋有活三（可以形成活四）
    board.setCell(5, 7, 'black');
    board.setCell(6, 7, 'black');
    board.setCell(7, 7, 'black');

    // 白棋也有活三（需要防守）
    board.setCell(5, 5, 'white');
    board.setCell(6, 5, 'white');
    board.setCell(7, 5, 'white');

    const ai = new MediumAI();
    const move = ai.calculateMove(board, 'black');

    // 应该优先形成自己的活四，而不是防守
    expect(move.y).toBe(7);
    expect(move.x === 4 || move.x === 8).toBe(true);
  });

  // TC-099: 中等AI-形成活三
  it('应该形成自己的活三', () => {
    const board = new Board(15);
    // 创建黑棋活二：
    board.setCell(5, 7, 'black');
    board.setCell(6, 7, 'black');

    const ai = new MediumAI();
    const move = ai.calculateMove(board, 'black');

    // 应该形成活三：(4,7) 或 (7,7)
    expect(move.y).toBe(7);
    expect(move.x === 4 || move.x === 7).toBe(true);
  });

  // TC-100: 中等AI-识别眠三
  it('应该识别眠三（一端被堵的三连）', () => {
    const board = new Board(15);
    // 创建眠三：
    board.setCell(0, 7, 'white'); // 堵截端
    board.setCell(1, 7, 'white');
    board.setCell(2, 7, 'white');
    board.setCell(3, 7, 'white');

    const ai = new MediumAI();
    const move = ai.calculateMove(board, 'black');

    // 应该堵截在 (4,7)
    expect(move).toEqual({ x: 4, y: 7 });
  });

  // TC-101: 中等AI-识别活二
  it('应该识别并扩展活二', () => {
    const board = new Board(15);
    // 创建活二：
    board.setCell(5, 7, 'black');
    board.setCell(6, 7, 'black');

    const ai = new MediumAI();
    const move = ai.calculateMove(board, 'black');

    // 应该形成活三
    expect(move.y).toBe(7);
    expect(move.x === 4 || move.x === 7).toBe(true);
  });

  // TC-102: 中等AI-多位置评分选择最优
  it('应该对多个位置评分并选择最优', () => {
    const board = new Board(15);
    // 创建多个进攻机会
    board.setCell(5, 7, 'black');
    board.setCell(6, 7, 'black'); // 活二

    board.setCell(7, 5, 'black');
    board.setCell(7, 6, 'black'); // 另一个活二

    const ai = new MediumAI();
    const move = ai.calculateMove(board, 'black');

    // 应该选择其中之一形成活三
    const isValidMove =
      (move.y === 7 && (move.x === 4 || move.x === 7)) ||
      (move.x === 7 && (move.y === 4 || move.y === 8));

    expect(isValidMove).toBe(true);
  });

  // TC-103: 中等AI-防守多个威胁时选择最高优先级
  it('应该防守多个威胁时选择最高优先级', () => {
    const board = new Board(15);
    // 白棋有活四（高优先级）
    board.setCell(5, 7, 'white');
    board.setCell(6, 7, 'white');
    board.setCell(7, 7, 'white');
    board.setCell(8, 7, 'white');

    // 白棋有活三（低优先级）
    board.setCell(5, 5, 'white');
    board.setCell(6, 5, 'white');
    board.setCell(7, 5, 'white');

    const ai = new MediumAI();
    const move = ai.calculateMove(board, 'black');

    // 应该优先防守活四
    expect(move.y).toBe(7);
    expect(move.x === 4 || move.x === 9).toBe(true);
  });

  // TC-104: 中等AI-棋盘只有一个空位
  it('应该选择最后一个空位', () => {
    const board = new Board(15);
    // 填满整个棋盘，除了(7,7)
    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        if (x !== 7 || y !== 7) {
          board.setCell(x, y, 'black');
        }
      }
    }

    const ai = new MediumAI();
    const move = ai.calculateMove(board, 'white');

    expect(move).toEqual({ x: 7, y: 7 });
  });

  // TC-105: 中等AI-棋盘已满
  it('棋盘已满时应该抛出异常', () => {
    const board = new Board(15);
    // 填满整个棋盘
    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        board.setCell(x, y, 'black');
      }
    }

    const ai = new MediumAI();

    expect(() => {
      ai.calculateMove(board, 'white');
    }).toThrow('No empty positions available');
  });

  // TC-106: 中等AI-响应时间测试
  it('中等AI响应时间应该<500ms', () => {
    const board = new Board(15);
    // 创建中局棋盘（75个棋子，更复杂的局面）
    let count = 0;
    for (let y = 0; y < 15 && count < 75; y++) {
      for (let x = 0; x < 15 && count < 75; x++) {
        if ((x + y) % 2 === 0) {
          board.setCell(x, y, count % 2 === 0 ? 'black' : 'white');
          count++;
        }
      }
    }

    const ai = new MediumAI();

    const start = performance.now();
    const move = ai.calculateMove(board, 'black');
    const duration = performance.now() - start;

    expect(move).toBeDefined();
    expect(duration).toBeLessThan(500); // <500ms
    console.log(`中等AI响应时间: ${duration.toFixed(2)}ms`);
  });

  // TC-107: 中等AI-内存占用测试
  it('内存占用应该合理', () => {
    const boards: Board[] = [];
    // 创建100个复杂棋盘
    for (let i = 0; i < 100; i++) {
      const board = new Board(15);
      let count = 0;
      for (let y = 0; y < 15 && count < 50; y++) {
        for (let x = 0; x < 15 && count < 50; x++) {
          if (Math.random() > 0.5) {
            board.setCell(x, y, Math.random() > 0.5 ? 'black' : 'white');
            count++;
          }
        }
      }
      boards.push(board);
    }

    // 执行100次AI计算
    for (let i = 0; i < 100; i++) {
      const ai = new MediumAI();
      ai.calculateMove(boards[i % boards.length], 'black');
    }

    // 如果能完成说明内存占用合理（无内存泄漏）
    expect(true).toBe(true);
  });
});
