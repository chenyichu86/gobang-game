/**
 * BoardEvaluator测试
 * Week 5 - 局面评估函数测试
 */

import { describe, it, expect } from 'vitest';
import { Board } from '../../core/board';
import { BoardEvaluator, PATTERN_SCORES } from '../board-evaluator';

describe('BoardEvaluator', () => {
  let evaluator: BoardEvaluator;

  beforeEach(() => {
    evaluator = new BoardEvaluator();
  });

  describe('基础评估测试', () => {
    it('TC-193: 空棋盘评估为0', () => {
      const board = new Board(15);
      const score = evaluator.evaluate(board, 'black');
      expect(score).toBe(0);
    });

    it('TC-194: 识别连五（FIVE）', () => {
      const board = new Board(15);
      // 创建横向连五
      board.setCell(5, 7, 'black');
      board.setCell(6, 7, 'black');
      board.setCell(7, 7, 'black');
      board.setCell(8, 7, 'black');
      board.setCell(9, 7, 'black');

      const score = evaluator.evaluatePlayer(board, 'black');
      expect(score).toBeGreaterThanOrEqual(PATTERN_SCORES.FIVE);
    });

    it('TC-195: 识别活四（LIVE_FOUR）', () => {
      const board = new Board(15);
      // 创建活四：_XXXX_
      board.setCell(5, 7, 'black');
      board.setCell(6, 7, 'black');
      board.setCell(7, 7, 'black');
      board.setCell(8, 7, 'black');
      // 位置4和9为空

      const score = evaluator.evaluatePlayer(board, 'black');
      expect(score).toBeGreaterThanOrEqual(PATTERN_SCORES.LIVE_FOUR);
    });

    it('TC-196: 识别冲四（DEAD_FOUR）', () => {
      const board = new Board(15);
      // 创建冲四：OXXXX_
      board.setCell(0, 7, 'white'); // 一端被堵
      board.setCell(1, 7, 'black');
      board.setCell(2, 7, 'black');
      board.setCell(3, 7, 'black');
      board.setCell(4, 7, 'black');

      const score = evaluator.evaluatePlayer(board, 'black');
      expect(score).toBeGreaterThanOrEqual(PATTERN_SCORES.DEAD_FOUR);
    });

    it('TC-197: 识别活三（LIVE_THREE）', () => {
      const board = new Board(15);
      // 创建活三：_XXX_
      board.setCell(5, 7, 'black');
      board.setCell(6, 7, 'black');
      board.setCell(7, 7, 'black');

      const score = evaluator.evaluatePlayer(board, 'black');
      expect(score).toBeGreaterThanOrEqual(PATTERN_SCORES.LIVE_THREE);
    });

    it('TC-198: 识别眠三（SLEEP_THREE）', () => {
      const board = new Board(15);
      // 创建眠三：OXXX_
      board.setCell(0, 7, 'white');
      board.setCell(1, 7, 'black');
      board.setCell(2, 7, 'black');
      board.setCell(3, 7, 'black');

      const score = evaluator.evaluatePlayer(board, 'black');
      expect(score).toBeGreaterThanOrEqual(PATTERN_SCORES.SLEEP_THREE);
    });

    it('TC-199: 识别活二（LIVE_TWO）', () => {
      const board = new Board(15);
      // 创建活二：_XX_
      board.setCell(5, 7, 'black');
      board.setCell(6, 7, 'black');

      const score = evaluator.evaluatePlayer(board, 'black');
      expect(score).toBeGreaterThanOrEqual(PATTERN_SCORES.LIVE_TWO);
    });
  });

  describe('多方向测试', () => {
    it('TC-200: 多方向棋型累加', () => {
      const board = new Board(15);
      // 创建十字交叉棋型
      board.setCell(6, 7, 'black');
      board.setCell(7, 7, 'black');
      board.setCell(8, 7, 'black');
      board.setCell(7, 6, 'black');
      board.setCell(7, 8, 'black');

      const score = evaluator.evaluatePlayer(board, 'black');
      // 应该累加纵向（活三）和横向（活二）的得分
      expect(score).toBeGreaterThan(PATTERN_SCORES.LIVE_THREE);
    });

    it('TC-201: 进攻与防守权重', () => {
      const board = new Board(15);
      // AI活三
      board.setCell(5, 7, 'black');
      board.setCell(6, 7, 'black');
      board.setCell(7, 7, 'black');
      // 玩家活三
      board.setCell(5, 5, 'white');
      board.setCell(6, 5, 'white');
      board.setCell(7, 5, 'white');

      const score = evaluator.evaluate(board, 'black');
      // 验证防守权重
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('四方向检测', () => {
    it('TC-202: 纵向连五检测', () => {
      const board = new Board(15);
      board.setCell(7, 5, 'black');
      board.setCell(7, 6, 'black');
      board.setCell(7, 7, 'black');
      board.setCell(7, 8, 'black');
      board.setCell(7, 9, 'black');

      const score = evaluator.evaluatePlayer(board, 'black');
      expect(score).toBeGreaterThanOrEqual(PATTERN_SCORES.FIVE);
    });

    it('TC-203: 主对角线连五检测', () => {
      const board = new Board(15);
      board.setCell(5, 5, 'black');
      board.setCell(6, 6, 'black');
      board.setCell(7, 7, 'black');
      board.setCell(8, 8, 'black');
      board.setCell(9, 9, 'black');

      const score = evaluator.evaluatePlayer(board, 'black');
      expect(score).toBeGreaterThanOrEqual(PATTERN_SCORES.FIVE);
    });

    it('TC-204: 副对角线连五检测', () => {
      const board = new Board(15);
      board.setCell(5, 9, 'black');
      board.setCell(6, 8, 'black');
      board.setCell(7, 7, 'black');
      board.setCell(8, 6, 'black');
      board.setCell(9, 5, 'black');

      const score = evaluator.evaluatePlayer(board, 'black');
      expect(score).toBeGreaterThanOrEqual(PATTERN_SCORES.FIVE);
    });

    it('TC-205: 边界棋型检测', () => {
      const board = new Board(15);
      // 边界棋型（虽然不是活三，但应该有评分）
      board.setCell(0, 7, 'black');
      board.setCell(1, 7, 'black');
      board.setCell(2, 7, 'black');

      const score = evaluator.evaluatePlayer(board, 'black');
      // 边界棋型虽然不是活三，但应该有评分（眠三或活二）
      expect(score).toBeGreaterThan(0);
      // 验证不会抛出越界错误
    });
  });

  describe('位置评估测试', () => {
    it('TC-206: 双方棋子评分', () => {
      const board = new Board(15);
      // 黑棋活四
      board.setCell(5, 7, 'black');
      board.setCell(6, 7, 'black');
      board.setCell(7, 7, 'black');
      board.setCell(8, 7, 'black');
      // 白棋活三
      board.setCell(5, 5, 'white');
      board.setCell(6, 5, 'white');
      board.setCell(7, 5, 'white');

      const blackScore = evaluator.evaluate(board, 'black');
      const whiteScore = evaluator.evaluate(board, 'white');

      // 黑棋优势应该更大
      expect(blackScore).toBeGreaterThan(0);
      expect(whiteScore).toBeLessThan(0);
    });

    it('应该正确评估空位', () => {
      const board = new Board(15);
      board.setCell(7, 7, 'black');

      const score = evaluator.evaluatePosition(board, { x: 7, y: 8 }, 'black');
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('快速评估测试', () => {
    it('应该只考虑高威胁棋型', () => {
      const board = new Board(15);
      // 创建活三
      board.setCell(5, 7, 'black');
      board.setCell(6, 7, 'black');
      board.setCell(7, 7, 'black');

      const score = evaluator.quickEvaluate(board, { x: 8, y: 7 }, 'black');
      // 应该识别为可以形成活四
      expect(score).toBeGreaterThan(0);
    });

    it('应该忽略低威胁棋型', () => {
      const board = new Board(15);
      // 单子
      board.setCell(7, 7, 'black');

      const score = evaluator.quickEvaluate(board, { x: 7, y: 8 }, 'black');
      // 单子不应被快速评估考虑
      expect(score).toBe(0);
    });
  });
});
