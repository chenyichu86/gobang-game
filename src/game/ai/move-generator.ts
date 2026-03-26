/**
 * MoveGenerator - 候选着法生成器
 * Week 5 - 困难AI核心组件
 *
 * 功能：
 * - 生成值得考虑的候选着法（优化搜索空间）
 * - 只考虑已有棋子周围的位置
 * - 对候选着法进行排序
 */

import { Board } from '../core/board';
import type { Position } from '../core/rules';
import { BoardEvaluator } from './board-evaluator';
import { OpeningStrategy } from './opening-strategy';

/**
 * 带分数的着法
 */
export interface MoveWithScore {
  position: Position;
  score: number;
}

export class MoveGenerator {
  private evaluator: BoardEvaluator;
  private readonly SEARCH_RADIUS = 2; // 搜索半径（格）

  constructor() {
    this.evaluator = new BoardEvaluator();
  }

  /**
   * 生成候选着法
   * 优化：只考虑已有棋子周围的位置
   */
  generateCandidates(board: Board): MoveWithScore[] {
    const emptyPositions = this.getEmptyPositions(board);

    // 如果棋盘为空，使用开局策略
    if (emptyPositions.length === 0 || this.isBoardEmpty(board)) {
      const opening = OpeningStrategy.selectOpening();
      return [{ position: opening, score: 0 }];
    }

    // 获取邻居位置
    const neighborPositions = this.getNeighborPositions(board, emptyPositions);

    // 对候选着法排序
    const sortedMoves = this.sortMoves(neighborPositions, board);

    // 限制候选着法数量
    return this.limitCandidates(sortedMoves);
  }

  /**
   * 获取所有空位
   */
  private getEmptyPositions(board: Board): Position[] {
    const positions: Position[] = [];
    const size = board.getSize();

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (board.isEmpty(x, y)) {
          positions.push({ x, y });
        }
      }
    }

    return positions;
  }

  /**
   * 检查棋盘是否为空
   */
  private isBoardEmpty(board: Board): boolean {
    const size = board.getSize();
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (!board.isEmpty(x, y)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * 获取所有已有棋子的邻居位置
   * 返回：去重后的空位列表
   */
  private getNeighborPositions(board: Board, emptyPositions: Position[]): Position[] {
    const neighbors: Position[] = [];
    const size = board.getSize();
    const visited = new Set<string>();

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // 跳过空位
        if (board.isEmpty(x, y)) continue;

        // 检查周围2格内的所有位置
        for (let dy = -this.SEARCH_RADIUS; dy <= this.SEARCH_RADIUS; dy++) {
          for (let dx = -this.SEARCH_RADIUS; dx <= this.SEARCH_RADIUS; dx++) {
            if (dx === 0 && dy === 0) continue;

            const nx = x + dx;
            const ny = y + dy;

            // 检查边界
            if (!board.isValid(nx, ny)) continue;

            // 检查是否为空位
            if (!board.isEmpty(nx, ny)) continue;

            // 去重
            const key = `${nx},${ny}`;
            if (visited.has(key)) continue;

            visited.add(key);
            neighbors.push({ x: nx, y: ny });
          }
        }
      }
    }

    return neighbors;
  }

  /**
   * 对候选着法排序
   * 优化：先搜索高分着法，提高剪枝效率
   */
  private sortMoves(positions: Position[], board: Board): MoveWithScore[] {
    const movesWithScore = positions.map((position) => {
      // 使用快速评估对每个位置评分
      const score =
        this.evaluator.evaluatePosition(board, position, 'black') +
        this.evaluator.evaluatePosition(board, position, 'white');

      return { position, score };
    });

    // 按分数降序排序
    movesWithScore.sort((a, b) => b.score - a.score);

    return movesWithScore;
  }

  /**
   * 限制候选着法数量
   */
  private limitCandidates(moves: MoveWithScore[], maxCount: number = 50): MoveWithScore[] {
    if (moves.length <= maxCount) {
      return moves;
    }

    // 保留分数最高的前N个
    return moves.slice(0, maxCount);
  }

  /**
   * 检查位置是否在已有棋子周围
   */
  private isNearExistingPiece(board: Board, position: Position): boolean {
    const size = board.getSize();

    for (let dy = -this.SEARCH_RADIUS; dy <= this.SEARCH_RADIUS; dy++) {
      for (let dx = -this.SEARCH_RADIUS; dx <= this.SEARCH_RADIUS; dx++) {
        if (dx === 0 && dy === 0) continue;

        const nx = position.x + dx;
        const ny = position.y + dy;

        if (!board.isValid(nx, ny)) continue;

        if (!board.isEmpty(nx, ny)) {
          return true;
        }
      }
    }

    return false;
  }
}
