/**
 * SimpleAI类 - 简单AI（评分系统，适合初学者）
 * Week 11优化 - 100%逻辑，0%随机
 *
 * 策略：
 * - 使用简化的评分系统（参考MediumAI）
 * - 1层搜索（只评估当前局面）
 * - 进攻+防守综合考虑
 * - 响应时间<20ms
 */

import { Board } from '../core/board';
import type { Position, Player } from '../core/rules';
import { OpeningStrategy } from './opening-strategy';

// 简化的棋型评分权重
const SCORE = {
  FIVE: 100000,      // 连五（必胜）
  LIVE_FOUR: 10000,  // 活四（两端都空，必胜）
  RUSH_FOUR: 5000,   // 冲四（一端被堵）
  LIVE_THREE: 1000,  // 活三（两端都空）
  SLEEP_THREE: 100,  // 眠三（一端被堵）
  LIVE_TWO: 100,     // 活二（两端都空）
  ONE: 10,           // 单子
};

export class SimpleAI {
  /**
   * 计算AI下一步的落子位置
   * 策略：评分系统 + 开局策略
   */
  calculateMove(board: Board, player: Player): Position {
    const emptyPositions = this.getEmptyPositions(board);

    if (emptyPositions.length === 0) {
      throw new Error('No empty positions available');
    }

    // 1. 如果棋盘为空，使用开局策略
    if (emptyPositions.length === 225) {
      return OpeningStrategy.selectOpening();
    }

    // 2. 使用评分系统选择最佳位置
    return this.findBestMove(board, player, emptyPositions);
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
   * 找出最佳落子位置（使用评分系统）
   */
  private findBestMove(board: Board, player: Player, emptyPositions: Position[]): Position {
    const opponent: Player = player === 'black' ? 'white' : 'black';
    let bestPosition = emptyPositions[0];
    let maxScore = -Infinity;

    for (const pos of emptyPositions) {
      // 进攻分数（在该位置落子后，对自己有多大好处）
      const attackScore = this.evaluatePosition(board, pos, player);

      // 防守分数（如果不在该位置落子，对方在该位置落子后有多大威胁）
      const defenseScore = this.evaluatePosition(board, pos, opponent);

      // 总分 = 进攻分数 + 防守分数（防守权重稍高，优先生存）
      const totalScore = attackScore + defenseScore * 1.2;

      if (totalScore > maxScore) {
        maxScore = totalScore;
        bestPosition = pos;
      }
    }

    return bestPosition;
  }

  /**
   * 评估某个位置的分数
   * 使用简化的棋型识别
   */
  private evaluatePosition(board: Board, position: Position, player: Player): number {
    let totalScore = 0;
    const directions = [
      { dx: 1, dy: 0 },  // 横向
      { dx: 0, dy: 1 },  // 纵向
      { dx: 1, dy: 1 },  // 主对角线
      { dx: 1, dy: -1 }, // 副对角线
    ];

    for (const { dx, dy } of directions) {
      const pattern = this.analyzePattern(board, position, dx, dy, player);
      totalScore += this.scorePattern(pattern);
    }

    return totalScore;
  }

  /**
   * 分析某个方向上的棋型
   */
  private analyzePattern(
    board: Board,
    position: Position,
    dx: number,
    dy: number,
    player: Player
  ): {
    count: number;      // 连续棋子数
    openEnds: number;   // 两端空位数
  } {
    let count = 1;      // 包含当前位置
    let openEnds = 0;

    // 正向查找
    let blockedForward = false;
    for (let i = 1; i <= 4; i++) {
      const nextPos = { x: position.x + dx * i, y: position.y + dy * i };
      if (!board.isValid(nextPos.x, nextPos.y)) {
        blockedForward = true;
        break;
      }
      const cell = board.getCell(nextPos.x, nextPos.y);
      if (cell === player) {
        count++;
      } else if (cell === null) {
        openEnds++;
        break;
      } else {
        blockedForward = true;
        break;
      }
    }

    // 反向查找
    let blockedBackward = false;
    for (let i = 1; i <= 4; i++) {
      const prevPos = { x: position.x - dx * i, y: position.y - dy * i };
      if (!board.isValid(prevPos.x, prevPos.y)) {
        blockedBackward = true;
        break;
      }
      const cell = board.getCell(prevPos.x, prevPos.y);
      if (cell === player) {
        count++;
      } else if (cell === null) {
        openEnds++;
        break;
      } else {
        blockedBackward = true;
        break;
      }
    }

    return { count, openEnds };
  }

  /**
   * 根据棋型计算分数
   */
  private scorePattern(pattern: { count: number; openEnds: number }): number {
    const { count, openEnds } = pattern;

    // 连五（必胜）
    if (count >= 5) {
      return SCORE.FIVE;
    }

    // 活四（两端都空，4个连续棋子）
    if (count === 4 && openEnds === 2) {
      return SCORE.LIVE_FOUR;
    }

    // 冲四（一端被堵，4个连续棋子）
    if (count === 4 && openEnds === 1) {
      return SCORE.RUSH_FOUR;
    }

    // 活三（两端都空，3个连续棋子）
    if (count === 3 && openEnds === 2) {
      return SCORE.LIVE_THREE;
    }

    // 眠三（一端被堵，3个连续棋子）
    if (count === 3 && openEnds === 1) {
      return SCORE.SLEEP_THREE;
    }

    // 活二（两端都空，2个连续棋子）
    if (count === 2 && openEnds === 2) {
      return SCORE.LIVE_TWO;
    }

    // 单子
    if (count === 1) {
      return SCORE.ONE;
    }

    return 0;
  }
}
