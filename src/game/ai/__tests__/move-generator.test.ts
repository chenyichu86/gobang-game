/**
 * MoveGenerator测试
 * Week 5 - 候选着法生成器测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Board } from '../../core/board';
import { MoveGenerator } from '../move-generator';

describe('MoveGenerator', () => {
  let generator: MoveGenerator;

  beforeEach(() => {
    generator = new MoveGenerator();
  });

  describe('候选着法生成测试', () => {
    it('空棋盘应该返回中心位置', () => {
      const board = new Board(15);
      const candidates = generator.generateCandidates(board);

      expect(candidates.length).toBe(1);
      expect(candidates[0].position.x).toBe(7);
      expect(candidates[0].position.y).toBe(7);
    });

    it('应该只返回有邻居的位置', () => {
      const board = new Board(15);
      // 放置一个棋子在中心
      board.setCell(7, 7, 'black');

      const candidates = generator.generateCandidates(board);

      // 所有候选位置都应该在(7,7)周围2格内
      candidates.forEach(({ position }) => {
        const distance = Math.max(
          Math.abs(position.x - 7),
          Math.abs(position.y - 7),
        );
        expect(distance).toBeLessThanOrEqual(2);
      });
    });

    it('候选着法数量应该<=50个', () => {
      const board = new Board(15);
      // 模拟30步后的棋盘
      for (let i = 0; i < 30; i++) {
        const x = Math.floor(Math.random() * 15);
        const y = Math.floor(Math.random() * 15);
        if (board.isEmpty(x, y)) {
          board.setCell(x, y, i % 2 === 0 ? 'black' : 'white');
        }
      }

      const candidates = generator.generateCandidates(board);
      expect(candidates.length).toBeLessThanOrEqual(50);
    });

    it('应该按分数排序候选着法', () => {
      const board = new Board(15);
      // 创建一些棋子
      board.setCell(7, 7, 'black');
      board.setCell(7, 8, 'white');

      const candidates = generator.generateCandidates(board);

      // 验证是降序排列
      for (let i = 1; i < Math.min(candidates.length, 10); i++) {
        expect(candidates[i - 1].score).toBeGreaterThanOrEqual(candidates[i].score);
      }
    });
  });

  describe('邻居位置检测', () => {
    it('应该正确检测邻居位置', () => {
      const board = new Board(15);
      board.setCell(7, 7, 'black');

      const candidates = generator.generateCandidates(board);

      // 应该包含周围2格内的所有空位
      const hasNeighbor = candidates.some(({ position }) =>
        position.x === 7 && position.y === 8
      );
      expect(hasNeighbor).toBe(true);
    });

    it('应该排除距离太远的位置', () => {
      const board = new Board(15);
      board.setCell(7, 7, 'black');

      const candidates = generator.generateCandidates(board);

      // 不应该包含距离超过2格的位置
      const hasFarPosition = candidates.some(({ position }) =>
        Math.abs(position.x - 7) > 2 || Math.abs(position.y - 7) > 2
      );
      expect(hasFarPosition).toBe(false);
    });
  });

  describe('边界情况测试', () => {
    it('棋盘边界应该正确处理', () => {
      const board = new Board(15);
      board.setCell(0, 0, 'black');

      const candidates = generator.generateCandidates(board);

      // 应该包含边界周围的空位
      expect(candidates.length).toBeGreaterThan(0);
      // 所有位置都应该在棋盘内
      candidates.forEach(({ position }) => {
        expect(position.x).toBeGreaterThanOrEqual(0);
        expect(position.x).toBeLessThan(15);
        expect(position.y).toBeGreaterThanOrEqual(0);
        expect(position.y).toBeLessThan(15);
      });
    });

    it('多个棋子时应该去重', () => {
      const board = new Board(15);
      board.setCell(7, 7, 'black');
      board.setCell(7, 8, 'white');

      const candidates = generator.generateCandidates(board);

      // 验证没有重复位置
      const positions = candidates.map(({ position }) =>
        `${position.x},${position.y}`
      );
      const uniquePositions = new Set(positions);
      expect(uniquePositions.size).toBe(positions.length);
    });
  });

  describe('性能测试', () => {
    it('生成时间应该<10ms', () => {
      const board = new Board(15);
      // 模拟中局
      for (let i = 0; i < 50; i++) {
        const x = Math.floor(Math.random() * 15);
        const y = Math.floor(Math.random() * 15);
        if (board.isEmpty(x, y)) {
          board.setCell(x, y, i % 2 === 0 ? 'black' : 'white');
        }
      }

      const startTime = performance.now();
      generator.generateCandidates(board);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(10);
    });
  });
});
