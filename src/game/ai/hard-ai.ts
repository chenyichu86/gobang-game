/**
 * HardAI - 困难AI（Minimax + Alpha-Beta剪枝）
 * Week 5 - 困难AI核心实现
 *
 * 功能：
 * - 使用Minimax算法进行4层深度搜索
 * - Alpha-Beta剪枝优化性能
 * - 超时保护（3秒超时）
 */

import { Board } from '../core/board';
import { GameRules } from '../core/rules';
import type { Position, Player } from '../core/rules';
import { BoardEvaluator } from './board-evaluator';
import { MoveGenerator } from './move-generator';

/**
 * HardAI配置
 */
export interface HardAIConfig {
  searchDepth: number; // 搜索深度（默认4）
  timeLimit: number; // 时间限制（毫秒，默认3000）
  enableAlphaBeta: boolean; // 启用Alpha-Beta剪枝（默认true）
}

/**
 * AI统计信息
 */
export interface AIStats {
  nodesSearched: number; // 搜索节点数
  searchTime: number; // 搜索时间（毫秒）
  pruningEfficiency: number; // 剪枝效率（0-1）
}

export class HardAI {
  private config: HardAIConfig;
  private evaluator: BoardEvaluator;
  private moveGenerator: MoveGenerator;
  private nodesSearched: number;
  private startTime: number;
  private prunedNodes: number;

  constructor(config?: Partial<HardAIConfig>) {
    this.config = {
      searchDepth: 4,
      timeLimit: 3000,
      enableAlphaBeta: true,
      ...config,
    };
    this.evaluator = new BoardEvaluator();
    this.moveGenerator = new MoveGenerator();
    this.nodesSearched = 0;
    this.startTime = 0;
    this.prunedNodes = 0;
  }

  /**
   * 计算AI下一步的落子位置
   * 策略：Minimax + Alpha-Beta剪枝
   */
  async calculateMove(board: Board, aiPlayer: Player): Promise<Position> {
    // 重置统计
    this.nodesSearched = 0;
    this.prunedNodes = 0;
    this.startTime = Date.now();

    // 生成候选着法
    const candidates = this.moveGenerator.generateCandidates(board);

    // 如果棋盘为空，占据中心位置
    if (candidates.length === 1 && candidates[0].position.x === 7 && candidates[0].position.y === 7) {
      return candidates[0].position;
    }

    // 如果只有一个候选着法
    if (candidates.length === 1) {
      return candidates[0].position;
    }

    let bestPosition = candidates[0].position;
    let bestScore = -Infinity;
    const alpha = -Infinity;
    const beta = Infinity;

    // 遍历所有候选着法
    for (const { position } of candidates) {
      // 检查超时
      if (Date.now() - this.startTime > this.config.timeLimit) {
        console.warn('HardAI timeout, returning current best move');
        return bestPosition;
      }

      // 模拟落子
      board.setCell(position.x, position.y, aiPlayer);

      // 递归搜索
      const score = this.minimax(
        board,
        this.config.searchDepth - 1,
        alpha,
        beta,
        false,
        aiPlayer,
      );

      // 撤销落子
      board.setCell(position.x, position.y, null);

      // 更新最佳着法
      if (score > bestScore) {
        bestScore = score;
        bestPosition = position;
      }
    }

    return bestPosition;
  }

  /**
   * Minimax算法主入口
   * 返回最优位置及其得分
   */
  private minimax(
    board: Board,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    aiPlayer: Player,
  ): number {
    this.nodesSearched++;

    // 检查游戏结束或达到深度限制
    if (depth === 0 || this.isGameOver(board)) {
      return this.evaluator.evaluate(board, aiPlayer);
    }

    // 生成候选着法
    const candidates = this.moveGenerator.generateCandidates(board);

    if (candidates.length === 0) {
      return this.evaluator.evaluate(board, aiPlayer);
    }

    if (isMaximizing) {
      // AI的回合（最大化）
      let maxEval = -Infinity;

      for (const { position } of candidates) {
        // 检查超时
        if (Date.now() - this.startTime > this.config.timeLimit) {
          break;
        }

        // 模拟落子
        board.setCell(position.x, position.y, aiPlayer);

        // 递归搜索
        const evalScore = this.minimax(
          board,
          depth - 1,
          alpha,
          beta,
          false,
          aiPlayer,
        );

        // 撤销落子
        board.setCell(position.x, position.y, null);

        // 更新最大值
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);

        // Alpha-Beta剪枝
        if (this.config.enableAlphaBeta && beta <= alpha) {
          this.prunedNodes++;
          break;
        }
      }

      return maxEval;
    } else {
      // 对手的回合（最小化）
      const opponent: Player = aiPlayer === 'black' ? 'white' : 'black';
      let minEval = Infinity;

      for (const { position } of candidates) {
        // 检查超时
        if (Date.now() - this.startTime > this.config.timeLimit) {
          break;
        }

        // 模拟落子
        board.setCell(position.x, position.y, opponent);

        // 递归搜索
        const evalScore = this.minimax(
          board,
          depth - 1,
          alpha,
          beta,
          true,
          aiPlayer,
        );

        // 撤销落子
        board.setCell(position.x, position.y, null);

        // 更新最小值
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);

        // Alpha-Beta剪枝
        if (this.config.enableAlphaBeta && beta <= alpha) {
          this.prunedNodes++;
          break;
        }
      }

      return minEval;
    }
  }

  /**
   * 检查游戏是否结束
   */
  private isGameOver(board: Board): boolean {
    // 检查是否有玩家获胜
    const size = board.getSize();
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cell = board.getCell(x, y);
        if (cell !== null) {
          const winLine = GameRules.checkWin(board, { x, y });
          if (winLine !== null) {
            return true;
          }
        }
      }
    }

    // 检查是否平局（棋盘满）
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (board.isEmpty(x, y)) {
          return false;
        }
      }
    }

    return true; // 平局
  }

  /**
   * 获取搜索统计信息
   */
  getStats(): AIStats {
    const searchTime = Date.now() - this.startTime;
    const pruningEfficiency =
      this.nodesSearched > 0 ? this.prunedNodes / this.nodesSearched : 0;

    return {
      nodesSearched: this.nodesSearched,
      searchTime,
      pruningEfficiency,
    };
  }
}
