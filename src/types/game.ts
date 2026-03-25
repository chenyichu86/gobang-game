// 游戏类型定义
export type Player = 'black' | 'white';
export type GameStatus = 'idle' | 'playing' | 'won' | 'draw';
export type GameMode = 'pve' | 'pvp';

export interface Position {
  x: number;
  y: number;
}

export interface Move {
  position: Position;
  player: Player;
  timestamp: number;
}

export interface GameState {
  gameStatus: GameStatus;
  currentPlayer: Player;
  gameMode: GameMode;
}
