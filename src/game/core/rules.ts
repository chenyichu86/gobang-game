/**
 * GameRules类 - 五子棋游戏规则引擎
 * Week 2 - WO 2.6
 */

import { Board } from './board';

export interface Position {
  x: number;
  y: number;
}

export type Player = 'black' | 'white';

export class GameRules {
  /**
   * 检查是否获胜
   * @param board 棋盘
   * @param lastMove 最后落子位置
   * @returns 获胜连线数组，未获胜返回null
   */
  static checkWin(board: Board, lastMove: Position): Position[] | null {
    const player = board.getCell(lastMove.x, lastMove.y);
    if (!player) return null;

    const directions = [
      { dx: 1, dy: 0 }, // 横向
      { dx: 0, dy: 1 }, // 纵向
      { dx: 1, dy: 1 }, // 主对角线
      { dx: 1, dy: -1 }, // 副对角线
    ];

    for (const { dx, dy } of directions) {
      const line = this.getLineInDirection(board, lastMove, dx, dy, player);
      if (line.length >= 5) {
        return line;
      }
    }

    return null;
  }

  /**
   * 获取某个方向的连线
   * @param board 棋盘
   * @param startPos 起始位置
   * @param dx X方向增量
   * @param dy Y方向增量
   * @param player 玩家
   * @returns 连线位置数组
   */
  private static getLineInDirection(
    board: Board,
    startPos: Position,
    dx: number,
    dy: number,
    player: Player
  ): Position[] {
    const line: Position[] = [startPos];

    // 正向查找
    for (let i = 1; i < 5; i++) {
      const nextPos = {
        x: startPos.x + dx * i,
        y: startPos.y + dy * i,
      } as Position;

      if (!board.isValid(nextPos.x, nextPos.y)) break;
      if (board.getCell(nextPos.x, nextPos.y) !== player) break;

      line.push(nextPos);
    }

    // 反向查找
    for (let i = 1; i < 5; i++) {
      const prevPos = {
        x: startPos.x - dx * i,
        y: startPos.y - dy * i,
      } as Position;

      if (!board.isValid(prevPos.x, prevPos.y)) break;
      if (board.getCell(prevPos.x, prevPos.y) !== player) break;

      line.unshift(prevPos);
    }

    return line;
  }

  /**
   * 检查是否为有效落子
   * @param board 棋盘
   * @param position 位置
   * @returns 是否有效
   */
  static isValidMove(board: Board, position: Position): boolean {
    return (
      board.isValid(position.x, position.y) &&
      board.isEmpty(position.x, position.y)
    );
  }
}
