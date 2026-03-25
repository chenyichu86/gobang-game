/**
 * GameEngine类 - 五子棋游戏引擎
 * Week 2 - WO 2.5
 */

import { Board } from './board';
import { GameRules, type Position, type Player } from './rules';

export interface MoveResult {
  success: boolean;
  error?: string;
  position?: Position;
  player?: Player;
  gameStatus?: 'idle' | 'playing' | 'won' | 'draw';
  winLine?: Position[] | null;
}

export class GameEngine {
  private board: Board;
  private currentPlayer: Player;
  private moveHistory: Position[];
  private gameStatus: 'idle' | 'playing' | 'won' | 'draw';

  constructor() {
    this.board = new Board();
    this.currentPlayer = 'black';
    this.moveHistory = [];
    this.gameStatus = 'idle';
  }

  /**
   * 开始游戏
   */
  startGame(): void {
    this.board.clear();
    this.currentPlayer = 'black';
    this.moveHistory = [];
    this.gameStatus = 'playing';
  }

  /**
   * 尝试落子
   * @param position 落子位置
   * @returns 落子结果
   */
  makeMove(position: Position): MoveResult {
    // 1. 检查游戏状态
    if (this.gameStatus !== 'playing') {
      return {
        success: false,
        error: 'Game is not in playing state',
      };
    }

    // 2. 检查位置是否为空
    if (!GameRules.isValidMove(this.board, position)) {
      return {
        success: false,
        error: 'Position is already occupied or invalid',
      };
    }

    // 3. 执行落子
    this.board.setCell(position.x, position.y, this.currentPlayer);
    this.moveHistory.push(position);

    // 4. 检查胜负
    const winLine = GameRules.checkWin(this.board, position);
    if (winLine) {
      this.gameStatus = 'won';
      return {
        success: true,
        position,
        player: this.currentPlayer,
        winLine,
        gameStatus: 'won',
      };
    }

    // 5. 检查和棋
    if (this.isDraw()) {
      this.gameStatus = 'draw';
      return {
        success: true,
        position,
        player: this.currentPlayer,
        gameStatus: 'draw',
      };
    }

    // 6. 切换玩家
    // const previousPlayer = this.currentPlayer;
    this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';

    return {
      success: true,
      position,
      player: this.currentPlayer,
      gameStatus: 'playing',
    };
  }

  /**
   * 获取当前玩家
   */
  getCurrentPlayer(): Player {
    return this.currentPlayer;
  }

  /**
   * 获取游戏状态
   */
  getGameStatus(): 'idle' | 'playing' | 'won' | 'draw' {
    return this.gameStatus;
  }

  /**
   * 获取棋盘
   */
  getBoard(): Board {
    return this.board;
  }

  /**
   * 获取历史记录
   */
  getMoveHistory(): Position[] {
    return [...this.moveHistory];
  }

  /**
   * 悔棋
   */
  undo(): void {
    if (this.moveHistory.length === 0) {
      return;
    }

    const lastMove = this.moveHistory.pop();
    if (lastMove) {
      // 清除最后一步棋
      this.board.setCell(lastMove.x, lastMove.y, null);
      // 切换回上一个玩家
      this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
      // 恢复游戏状态
      this.gameStatus = 'playing';
    }
  }

  /**
   * 重置游戏
   */
  resetGame(): void {
    this.board.clear();
    this.currentPlayer = 'black';
    this.moveHistory = [];
    this.gameStatus = 'idle';
  }

  /**
   * 检查是否和棋
   */
  private isDraw(): boolean {
    return this.moveHistory.length >= this.board.getSize() * this.board.getSize();
  }
}
