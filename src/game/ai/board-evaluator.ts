/**
 * BoardEvaluator - 局面评估函数
 * Week 5 - 困难AI核心组件
 *
 * 功能：
 * - 评估棋盘当前状态的价值
 * - 支持多方向棋型评分
 * - 计算攻防权重
 */

import { Board } from '../core/board';
import type { Position, Player } from '../core/rules';

/**
 * 棋型评分表
 */
export const PATTERN_SCORES = {
  FIVE: 100000, // 连五（获胜）
  LIVE_FOUR: 10000, // 活四（两端都空，必胜）
  DEAD_FOUR: 5000, // 冲四（一端被堵）
  LIVE_THREE: 1000, // 活三（两端都空）
  SLEEP_THREE: 100, // 眠三（一端被堵）
  LIVE_TWO: 10, // 活二
  SLEEP_TWO: 1, // 眠二
  ONE: 0, // 单子
};

/**
 * 方向向量
 */
const DIRECTIONS = [
  { dx: 1, dy: 0 }, // 横向
  { dx: 0, dy: 1 }, // 纵向
  { dx: 1, dy: 1 }, // 主对角线
  { dx: 1, dy: -1 }, // 副对角线
];

export class BoardEvaluator {
  /**
   * 评估棋盘状态
   * 返回：AI的得分 - 玩家的得分（差值）
   * 正数：AI优势
   * 负数：玩家优势
   */
  evaluate(board: Board, aiPlayer: Player): number {
    const opponent: Player = aiPlayer === 'black' ? 'white' : 'black';

    // 评估AI的进攻分数
    const attackScore = this.evaluatePlayer(board, aiPlayer);

    // 评估对手的进攻分数（即AI的防守分数）
    const defenseScore = this.evaluatePlayer(board, opponent);

    // 综合评分（进攻为主，防守为辅）
    return attackScore - defenseScore * 0.9;
  }

  /**
   * 评估某个玩家的局势
   * 统计所有棋型，计算总分
   */
  evaluatePlayer(board: Board, player: Player): number {
    let totalScore = 0;
    const size = board.getSize();

    // 遍历所有位置
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (board.getCell(x, y) !== player) continue;

        // 检查4个方向的棋型
        for (const { dx, dy } of DIRECTIONS) {
          const pattern = this.analyzePattern(board, { x, y }, dx, dy, player);
          totalScore += this.scorePattern(pattern);
        }
      }
    }

    return totalScore;
  }

  /**
   * 评估某个位置的价值
   * 考虑进攻和防守两个方面
   */
  evaluatePosition(board: Board, position: Position, player: Player): number {
    const opponent: Player = player === 'black' ? 'white' : 'black';

    // 进攻分数（在该位置落子后，对自己有多大好处）
    const attackScore = this.quickEvaluate(board, position, player);

    // 防守分数（如果不在该位置落子，对方在该位置落子后有多大威胁）
    const defenseScore = this.quickEvaluate(board, position, opponent);

    // 总分 = 进攻分数 + 防守分数（优先进攻）
    return attackScore + defenseScore * 0.8;
  }

  /**
   * 快速评估（用于排序）
   * 只考虑直接威胁（活三、冲四、活四）
   */
  quickEvaluate(board: Board, position: Position, player: Player): number {
    let score = 0;

    for (const { dx, dy } of DIRECTIONS) {
      const pattern = this.analyzePattern(board, position, dx, dy, player);
      const patternScore = this.scorePattern(pattern);

      // 只考虑高威胁棋型
      if (patternScore >= PATTERN_SCORES.LIVE_THREE) {
        score += patternScore;
      }
    }

    return score;
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
    count: number; // 连续棋子数
    openEnds: number; // 两端空位数
  } {
    let count = 1; // 包含当前位置
    let openEnds = 0;

    // 正向查找
    for (let i = 1; i <= 4; i++) {
      const nextPos = { x: position.x + dx * i, y: position.y + dy * i };
      if (!board.isValid(nextPos.x, nextPos.y)) {
        break;
      }
      const cell = board.getCell(nextPos.x, nextPos.y);
      if (cell === player) {
        count++;
      } else if (cell === null) {
        openEnds++;
        break;
      } else {
        break;
      }
    }

    // 反向查找
    for (let i = 1; i <= 4; i++) {
      const prevPos = { x: position.x - dx * i, y: position.y - dy * i };
      if (!board.isValid(prevPos.x, prevPos.y)) {
        break;
      }
      const cell = board.getCell(prevPos.x, prevPos.y);
      if (cell === player) {
        count++;
      } else if (cell === null) {
        openEnds++;
        break;
      } else {
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
      return PATTERN_SCORES.FIVE;
    }

    // 活四（两端都空，4个连续棋子）
    if (count === 4 && openEnds === 2) {
      return PATTERN_SCORES.LIVE_FOUR;
    }

    // 冲四（一端被堵，4个连续棋子）
    if (count === 4 && openEnds === 1) {
      return PATTERN_SCORES.DEAD_FOUR;
    }

    // 活三（两端都空，3个连续棋子）
    if (count === 3 && openEnds === 2) {
      return PATTERN_SCORES.LIVE_THREE;
    }

    // 眠三（一端被堵，3个连续棋子）
    if (count === 3 && openEnds === 1) {
      return PATTERN_SCORES.SLEEP_THREE;
    }

    // 活二（两端都空，2个连续棋子）
    if (count === 2 && openEnds === 2) {
      return PATTERN_SCORES.LIVE_TWO;
    }

    // 眠二（一端被堵，2个连续棋子）
    if (count === 2 && openEnds === 1) {
      return PATTERN_SCORES.SLEEP_TWO;
    }

    // 单子
    return PATTERN_SCORES.ONE;
  }
}
