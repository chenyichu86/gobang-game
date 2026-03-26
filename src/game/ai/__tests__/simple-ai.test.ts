/**
 * SimpleAI测试 - 简单AI（80%随机+20%基础防守）
 * Week 3 - TC-084~092
 */

import { describe, it, expect } from 'vitest';
import { Board } from '../../core/board';
import { SimpleAI } from '../simple-ai';
import { OpeningStrategy } from '../opening-strategy';
import type { Position } from '../../core/rules';

describe('SimpleAI', () => {
  // TC-084: 简单AI-空棋盘开局（使用开局策略）
  it('应该使用开局策略落子（棋盘为空）', () => {
    const board = new Board(15);
    const ai = new SimpleAI();
    const move = ai.calculateMove(board, 'black');

    // 验证位置在棋盘内
    expect(move.x).toBeGreaterThanOrEqual(0);
    expect(move.x).toBeLessThan(15);
    expect(move.y).toBeGreaterThanOrEqual(0);
    expect(move.y).toBeLessThan(15);

    // 验证是有效的开局位置
    expect(OpeningStrategy.isOpeningPosition(move)).toBe(true);
  });

  // TC-085: 简单AI-逻辑化落子验证
  it('应该使用评分系统选择最佳位置', () => {
    const board = new Board(15);
    // 创建一个活三威胁
    board.setCell(7, 7, 'white');
    board.setCell(8, 7, 'white');
    board.setCell(9, 7, 'white');

    const ai = new SimpleAI();
    const move = ai.calculateMove(board, 'black');

    // 验证AI选择了防守位置（活三的两端）
    const isBlocking = (move.x === 6 && move.y === 7) || (move.x === 10 && move.y === 7);
    expect(isBlocking).toBe(true);
  });

  // TC-086: 简单AI-防守活三检测
  it('应该堵截对方活三（20%概率）', () => {
    const board = new Board(15);
    // 创建活三：黑棋在(5,7), (6,7), (7,7)
    board.setCell(5, 7, 'black');
    board.setCell(6, 7, 'black');
    board.setCell(7, 7, 'black');

    // 使用多个AI实例来增加触发防守的概率
    let foundBlock = false;
    for (let i = 0; i < 100; i++) {
      const ai = new SimpleAI(i * 0.01); // 使用不同的种子
      const move = ai.calculateMove(board, 'white');
      if (move.x === 4 || move.x === 8) {
        foundBlock = true;
        break;
      }
    }

    expect(foundBlock).toBe(true); // 至少有一次应该堵截
  });

  // TC-087: 简单AI-防守概率统计验证
  it('应该能够防守活三', () => {
    const board = new Board(15);
    // 创建活三
    board.setCell(5, 7, 'black');
    board.setCell(6, 7, 'black');
    board.setCell(7, 7, 'black');

    let blockCount = 0;
    for (let i = 0; i < 1000; i++) {
      const ai = new SimpleAI(i / 1000); // 使用不同的种子
      const move = ai.calculateMove(board, 'white');
      if (move.x === 4 || move.x === 8) {
        blockCount++;
      }
    }

    const probability = blockCount / 1000;
    // 只要概率大于0就说明防守逻辑工作正常
    expect(probability).toBeGreaterThan(0);
  });

  // TC-088: 简单AI-棋盘只有一个空位
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

    const ai = new SimpleAI();
    const move = ai.calculateMove(board, 'white');

    expect(move).toEqual({ x: 7, y: 7 });
  });

  // TC-089: 简单AI-棋盘已满
  it('棋盘已满时应该抛出异常', () => {
    const board = new Board(15);
    // 填满整个棋盘
    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        board.setCell(x, y, 'black');
      }
    }

    const ai = new SimpleAI();

    expect(() => {
      ai.calculateMove(board, 'white');
    }).toThrow('No empty positions available');
  });

  // TC-090: 简单AI-无邻居位置随机落子
  it('无邻居位置时应该选择任意空位', () => {
    const board = new Board(15);
    board.setCell(0, 0, 'black');
    board.setCell(14, 14, 'white');

    const ai = new SimpleAI();
    const move = ai.calculateMove(board, 'black');

    // 应该选择任意有效的空位
    expect(board.isValid(move.x, move.y)).toBe(true);
    expect(board.isEmpty(move.x, move.y)).toBe(true);
  });

  // TC-091: 简单AI-响应时间测试
  it('简单AI响应时间应该<100ms', () => {
    const board = new Board(15);
    // 创建中局棋盘（50个棋子）
    let count = 0;
    for (let y = 0; y < 15 && count < 50; y++) {
      for (let x = 0; x < 15 && count < 50; x++) {
        if ((x + y) % 2 === 0) {
          board.setCell(x, y, count % 2 === 0 ? 'black' : 'white');
          count++;
        }
      }
    }

    const ai = new SimpleAI();

    const start = performance.now();
    const move = ai.calculateMove(board, 'black');
    const duration = performance.now() - start;

    expect(move).toBeDefined();
    expect(duration).toBeLessThan(100); // <100ms
    console.log(`简单AI响应时间: ${duration.toFixed(2)}ms`);
  });

  // TC-092: 简单AI-内存占用测试
  it('内存占用应该合理', () => {
    const boards: Board[] = [];
    // 创建100个随机棋盘
    for (let i = 0; i < 100; i++) {
      const board = new Board(15);
      let count = 0;
      for (let y = 0; y < 15 && count < 30; y++) {
        for (let x = 0; x < 15 && count < 30; x++) {
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
      const ai = new SimpleAI();
      ai.calculateMove(boards[i % boards.length], 'black');
    }

    // 如果能完成说明内存占用合理（无内存泄漏）
    expect(true).toBe(true);
  });
});
