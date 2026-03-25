/**
 * 游戏记录器 - 记录和回放棋局
 */

import type { Position, GameMode, GameStatus, Player } from '../types/game';

export interface GameRecord {
  id: string;
  mode: GameMode;
  moves: Position[];
  winner: Player | null;
  gameStatus: GameStatus;
  metadata: {
    startTime: string;
    endTime: string;
    duration: number; // 毫秒
    moveCount: number;
  };
}

export interface ReplaySession {
  moves: Position[];
  currentMoveIndex: number;
  isPlaying: boolean;
  speed: number;
  next: () => Position | null;
  prev: () => Position | null;
  play: () => void;
  pause: () => void;
  seek: (index: number) => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
}

export class GameRecorder {
  private readonly STORAGE_PREFIX = 'gobang_game_';
  private readonly MAX_RECORDS = 50;

  /**
   * 创建游戏记录
   */
  createRecord(params: {
    mode: GameMode;
    moves: Position[];
    winner: Player | null;
    gameStatus: GameStatus;
    startTime: string;
    endTime: string;
  }): GameRecord {
    const startTime = new Date(params.startTime).getTime();
    const endTime = new Date(params.endTime).getTime();

    return {
      id: this.generateId(),
      mode: params.mode,
      moves: params.moves,
      winner: params.winner,
      gameStatus: params.gameStatus,
      metadata: {
        startTime: params.startTime,
        endTime: params.endTime,
        duration: endTime - startTime,
        moveCount: params.moves.length,
      },
    };
  }

  /**
   * 保存游戏记录到LocalStorage
   */
  saveRecord(record: GameRecord): void {
    const key = `${this.STORAGE_PREFIX}${record.id}`;
    localStorage.setItem(key, JSON.stringify(record));

    // 清理旧记录，保持最多50个
    this.cleanupOldRecords();
  }

  /**
   * 从LocalStorage加载游戏记录
   */
  loadRecord(id: string): GameRecord | null {
    const key = `${this.STORAGE_PREFIX}${id}`;
    const data = localStorage.getItem(key);

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data) as GameRecord;
    } catch {
      return null;
    }
  }

  /**
   * 删除游戏记录
   */
  deleteRecord(id: string): void {
    const key = `${this.STORAGE_PREFIX}${id}`;
    localStorage.removeItem(key);
  }

  /**
   * 获取所有保存的游戏记录
   */
  getAllRecords(): GameRecord[] {
    const records: GameRecord[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.STORAGE_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const record = JSON.parse(data) as GameRecord;
            records.push(record);
          } catch {
            // 忽略解析错误
          }
        }
      }
    }

    // 按时间倒序排列（最新的在前）
    records.sort(
      (a, b) =>
        new Date(b.metadata.startTime).getTime() -
        new Date(a.metadata.startTime).getTime()
    );

    // 限制最多返回50个
    return records.slice(0, this.MAX_RECORDS);
  }

  /**
   * 创建回放会话
   */
  createReplaySession(moves: Position[]): ReplaySession {
    let currentMoveIndex = 0;
    let isPlaying = false;
    let speed = 1;

    return {
      moves,
      get currentMoveIndex() {
        return currentMoveIndex;
      },
      get isPlaying() {
        return isPlaying;
      },
      get speed() {
        return speed;
      },

      next: () => {
        if (currentMoveIndex >= moves.length) {
          return null;
        }
        const move = moves[currentMoveIndex];
        currentMoveIndex++;
        return move;
      },

      prev: () => {
        if (currentMoveIndex <= 0) {
          return null;
        }
        currentMoveIndex--;
        return moves[currentMoveIndex];
      },

      play: () => {
        isPlaying = true;
      },

      pause: () => {
        isPlaying = false;
      },

      seek: (index: number) => {
        if (index >= 0 && index <= moves.length) {
          currentMoveIndex = index;
        }
      },

      reset: () => {
        currentMoveIndex = 0;
        isPlaying = false;
      },

      setSpeed: (newSpeed: number) => {
        // 限制速度在0.25x到5x之间
        speed = Math.max(0.25, Math.min(5, newSpeed));
      },
    };
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 清理旧记录，保持最多50个
   */
  private cleanupOldRecords(): void {
    const records = this.getAllRecords();

    if (records.length > this.MAX_RECORDS) {
      // 删除最旧的记录
      const toDelete = records.slice(this.MAX_RECORDS);
      toDelete.forEach((record) => {
        this.deleteRecord(record.id);
      });
    }
  }
}
