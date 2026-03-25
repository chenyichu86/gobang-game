/**
 * SimpleAI类 - 简单AI（80%随机+20%基础防守）
 * Week 3 - WO 2.1
 */

import { Board } from '../core/board';
import type { Position, Player } from '../core/rules';

export class SimpleAI {
  private seed: number;

  constructor(seed: number = Math.random()) {
    this.seed = seed;
  }

  /**
   * 计算AI下一步的落子位置
   * 策略：80%随机落子 + 20%基础防守（堵截对方活三）
   */
  calculateMove(board: Board, player: Player, customSeed?: number): Position {
    const emptyPositions = this.getEmptyPositions(board);

    if (emptyPositions.length === 0) {
      throw new Error('No empty positions available');
    }

    // 1. 如果棋盘为空，占据天元
    if (emptyPositions.length === 225) {
      return { x: 7, y: 7 };
    }

    // 2. 20%概率检测对方威胁
    const seed = customSeed ?? this.seed;
    const defenseChance = this.seededRandom(seed);

    if (defenseChance < 0.2) {
      const defensiveMove = this.findDefensiveMove(board, player);
      if (defensiveMove) {
        return defensiveMove;
      }
    }

    // 3. 80%概率随机落子（优先选择有邻居的位置）
    return this.getRandomMove(board);
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
   * 随机选择一个空位
   * 优先选择已有棋子周围2格范围内的位置
   */
  private getRandomMove(board: Board): Position {
    const emptyPositions = this.getEmptyPositions(board);
    const occupiedPositions = board.getOccupiedPositions();

    // 如果没有已占领的位置，返回随机空位
    if (occupiedPositions.length === 0) {
      const randomValue = this.seededRandom(Date.now());
      return emptyPositions[Math.floor(randomValue * emptyPositions.length)];
    }

    // 找出有邻居的空位（周围2格内有棋子）
    const candidates = emptyPositions.filter((pos) =>
      this.hasNeighbor(board, pos, 2, occupiedPositions)
    );

    // 如果没有候选位置，返回所有空位中的随机位置
    const pool = candidates.length > 0 ? candidates : emptyPositions;
    const randomValue = this.seededRandom(Date.now() + this.seed);
    return pool[Math.floor(randomValue * pool.length)];
  }

  /**
   * 检查位置是否有邻居
   */
  private hasNeighbor(
    board: Board,
    position: Position,
    distance: number,
    occupiedPositions: Position[]
  ): boolean {
    return occupiedPositions.some((occupied) => {
      const dx = Math.abs(position.x - occupied.x);
      const dy = Math.abs(position.y - occupied.y);
      return dx <= distance && dy <= distance;
    });
  }

  /**
   * 基础防守：检测对方是否有活三，如果有则堵截
   * 返回防守位置，如果没有威胁则返回null
   */
  private findDefensiveMove(board: Board, aiPlayer: Player): Position | null {
    const opponent: Player = aiPlayer === 'black' ? 'white' : 'black';
    const directions = [
      { dx: 1, dy: 0 }, // 横向
      { dx: 0, dy: 1 }, // 纵向
      { dx: 1, dy: 1 }, // 主对角线
      { dx: 1, dy: -1 }, // 副对角线
    ];

    // 遍历所有对方棋子，检测是否形成活三
    const occupiedPositions = board.getOccupiedPositions();
    const opponentPositions = occupiedPositions.filter(
      (pos) => board.getCell(pos.x, pos.y) === opponent
    );

    for (const pos of opponentPositions) {
      for (const { dx, dy } of directions) {
        const blockPositions = this.checkLiveThree(board, pos, dx, dy, opponent);
        if (blockPositions.length > 0) {
          // 随机选择一个堵截位置
          return blockPositions[Math.floor(this.seededRandom(this.seed + 2) * blockPositions.length)];
        }
      }
    }

    return null;
  }

  /**
   * 检查从指定位置开始是否形成活三
   * 返回需要堵截的位置
   */
  private checkLiveThree(
    board: Board,
    startPos: Position,
    dx: number,
    dy: number,
    player: Player
  ): Position[] {
    const positions: Position[] = [startPos];

    // 正向查找
    for (let i = 1; i < 5; i++) {
      const nextPos = { x: startPos.x + dx * i, y: startPos.y + dy * i };
      if (!board.isValid(nextPos.x, nextPos.y)) break;
      if (board.getCell(nextPos.x, nextPos.y) !== player) break;
      positions.push(nextPos);
    }

    // 反向查找
    for (let i = 1; i < 5; i++) {
      const prevPos = { x: startPos.x - dx * i, y: startPos.y - dy * i };
      if (!board.isValid(prevPos.x, prevPos.y)) break;
      if (board.getCell(prevPos.x, prevPos.y) !== player) break;
      positions.unshift(prevPos);
    }

    // 检查是否是活三（3个连续棋子，两端为空）
    if (positions.length === 3) {
      const leftPos = { x: positions[0].x - dx, y: positions[0].y - dy };
      const rightPos = { x: positions[2].x + dx, y: positions[2].y + dy };

      const leftEmpty = board.isValid(leftPos.x, leftPos.y) && board.isEmpty(leftPos.x, leftPos.y);
      const rightEmpty = board.isValid(rightPos.x, rightPos.y) && board.isEmpty(rightPos.x, rightPos.y);

      if (leftEmpty && rightEmpty) {
        return [leftPos, rightPos];
      }
    }

    return [];
  }

  /**
   * 生成伪随机数（使用种子）
   */
  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
}
