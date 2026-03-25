/**
 * 五子棋游戏类型定义
 */

// 棋盘单元格类型
export type BoardCell = 'black' | 'white' | null;

// 棋盘数据类型 (15x15二维数组)
export type Board = BoardCell[][];

// 玩家类型
export type Player = 'black' | 'white';

// 坐标位置
export interface Position {
  x: number; // 0-14, 从左到右
  y: number; // 0-14, 从上到下
}

// 棋子对象
export interface Piece {
  x: number;
  y: number;
  player: Player;
  timestamp?: number;
}

// 游戏状态枚举
export type GameStatus = 'idle' | 'playing' | 'won' | 'draw';

// 游戏结果
export interface MoveResult {
  success: boolean;
  position?: Position;
  player?: Player;
  gameStatus?: GameStatus;
  winLine?: Position[] | null;
  error?: string;
}

// 游戏配置常量
export const GAME_CONFIG = {
  BOARD_SIZE: 15,
  WIN_CONDITION: 5,
  CANVAS_SIZE: 600,
  PADDING: 30,
  CELL_SIZE: 40,
} as const;

// 棋盘渲染配置
export interface BoardRenderConfig {
  canvasSize: number;
  padding: number;
  lineCount: number;
  cellSize: number;
  backgroundColor: string;
  lineColor: string;
  lineWidth: number;
}

// 棋子渲染配置
export interface PieceRenderConfig {
  radius: number;
  blackColor: string;
  whiteColor: string;
  shadowColor: string;
  shadowBlur: number;
  shadowOffset: { x: number; y: number };
}
