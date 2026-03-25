/**
 * 游戏状态管理Store - 扩展版本
 * 支持完整的游戏状态管理和棋盘数据
 * Week 7: 集成用户成长系统
 */

import { create } from 'zustand';
import type { GameStatus, Player, GameMode, Position } from '../types/game';
import { GameEngine } from '../game/core/game-engine';
import type { BoardCell } from '../game/types';
import { createAIClient, type AIType } from '../game/ai/ai-client';
import { useUserStore } from './user-store';
import type { GameResult } from '../types/user';

interface GameState {
  // 游戏状态
  gameStatus: GameStatus;
  currentPlayer: Player;
  gameMode: GameMode;
  winner: Player | null;
  winLine: Position[] | null;
  moveHistory: Position[];
  board: BoardCell[][] | null;

  // PVE模式特有状态
  aiDifficulty: AIType;
  playerFirst: boolean;
  isAIThinking: boolean;

  // 提示功能状态
  hintPosition: Position | null;
  isShowingHint: boolean;
  remainingHints: number;

  // 引擎实例
  engine: GameEngine | null;

  // Actions
  startGame: () => void;
  makeMove: (position: Position) => Promise<{
    success: boolean;
    position?: Position;
    player?: Player;
    gameStatus?: GameStatus;
    winLine?: Position[] | null;
    error?: string;
  }>;
  undo: () => void;
  resetGame: () => void;
  setGameMode: (mode: GameMode) => void;
  setAIDifficulty: (difficulty: AIType) => void;
  setPlayerFirst: (first: boolean) => void;
  getHint: () => Promise<Position | null>;
  clearHint: () => void;
}

export const useGameStore = create<GameState>((set, get) => {
  /**
   * Week 7: 处理游戏结束时的用户成长系统
   */
  function handleGameEnd(previousStatus: GameStatus, newStatus: GameStatus, winner: Player | null, totalMoves: number) {
    // 只在从playing变为won/draw时触发一次
    if (previousStatus === 'playing' && (newStatus === 'won' || newStatus === 'draw')) {
      const userStore = useUserStore.getState();
      const state = get();

      // 确定游戏结果
      let result: GameResult = 'draw';
      if (newStatus === 'won') {
        // PvE模式：玩家是黑棋且先手，或玩家是白棋且后手
        // PvP模式：根据winner判断
        if (state.gameMode === 'pve') {
          // 玩家始终是黑棋（如果playerFirst）或白棋（如果!playerFirst）
          const playerColor = state.playerFirst ? 'black' : 'white';
          result = winner === playerColor ? 'win' : 'lose';
        } else {
          // PvP模式，当前玩家就是赢家（因为刚落子）
          result = 'win'; // 当前玩家获胜
        }
      }

      // 计算对手棋子数（用于完美防守成就）
      const opponentPieces = countOpponentPieces(state.board!, winner || 'black');

      // 更新统计数据
      userStore.updateStats(result, totalMoves, opponentPieces);

      // 获取当前连胜
      const currentStreak = userStore.stats.currentStreak;

      // 添加经验值
      const levelUpResult = userStore.addExp(result, currentStreak);

      // 构建游戏上下文用于成就检测
      const context = {
        result,
        totalMoves,
        opponentPieces,
        currentStreak: result === 'win' ? currentStreak : 0,
        userStats: userStore.stats,
      };

      // 检查游戏结束成就
      const gameEndAchievements = userStore.checkAchievements(context);

      // 检查里程碑成就
      const milestoneAchievements = userStore.checkMilestoneAchievements(context);

      // 如果升级，可以在UI显示升级提示
      if (levelUpResult?.leveledUp) {
        console.log(`🎉 ${levelUpResult.reward.message}`);
      }

      // 如果解锁成就，可以在UI显示成就提示
      const allAchievements = [...gameEndAchievements, ...milestoneAchievements];
      if (allAchievements.length > 0) {
        console.log(`🏆 解锁了 ${allAchievements.length} 个成就!`);
        allAchievements.forEach(a => console.log(`  - ${a.icon} ${a.name}`));
      }
    }
  }

  /**
   * Week 7: 计算对手棋子数量
   */
  function countOpponentPieces(board: BoardCell[][], winner: Player): number {
    const opponent = winner === 'black' ? 'white' : 'black';
    let count = 0;
    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        if (board[y][x] === opponent) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * 触发AI落子
   */
  async function triggerAIMove() {
    const state = get();
    if (
      state.gameMode !== 'pve' ||
      state.gameStatus !== 'playing' ||
      state.isAIThinking ||
      !state.engine
    ) {
      return;
    }

    const previousStatus = state.gameStatus;
    set({ isAIThinking: true });

    try {
      const aiClient = await createAIClient(state.aiDifficulty);
      const response = await aiClient.calculateMove({
        boardData: state.board!,
        player: state.currentPlayer,
      });

      if (response.success && response.position) {
        const engine = get().engine;
        if (engine) {
          const result = engine.makeMove(response.position);

          if (result.success) {
            const newStatus = result.gameStatus || 'playing';
            const winner = result.gameStatus === 'won' ? result.player : null;
            const moveHistory = engine.getMoveHistory();

            set({
              gameStatus: newStatus,
              currentPlayer: engine.getCurrentPlayer(),
              winner,
              winLine: result.winLine || null,
              moveHistory,
              board: (engine.getBoard() as any).cells,
            });

            // Week 7: 处理游戏结束时的用户成长系统
            handleGameEnd(previousStatus, newStatus, winner, moveHistory.length);
          }
        }
      }
    } catch (error) {
      console.error('AI move failed:', error);
    } finally {
      set({ isAIThinking: false });
    }
  }

  return {
    // Initial state
    gameStatus: 'idle',
    currentPlayer: 'black',
    gameMode: 'pvp',
    winner: null,
    winLine: null,
    moveHistory: [],
    board: null,
    engine: null,
    aiDifficulty: 'simple',
    playerFirst: true,
    isAIThinking: false,
    hintPosition: null,
    isShowingHint: false,
    remainingHints: 3,

    // Actions
    startGame: () => {
      const engine = new GameEngine();
      engine.startGame();

      const state = get();
      const currentPlayer = state.playerFirst ? 'black' : 'white';

      set({
        engine,
        gameStatus: 'playing',
        currentPlayer,
        winner: null,
        winLine: null,
        moveHistory: [],
        board: (engine.getBoard() as any).cells,
        isAIThinking: !state.playerFirst, // 如果AI先手，标记为思考中
        hintPosition: null,
        isShowingHint: false,
        remainingHints: 3,
      });

      // 如果AI先手，立即触发AI落子
      if (state.gameMode === 'pve' && !state.playerFirst) {
        setTimeout(() => triggerAIMove(), 100);
      }
    },

    makeMove: async (position) => {
      const engine = get().engine;
      if (!engine) {
        return { success: false, error: 'Game not initialized' };
      }

      const previousStatus = get().gameStatus;
      const result = engine.makeMove(position);

      if (result.success) {
        const newStatus = result.gameStatus || 'playing';
        const winner = result.gameStatus === 'won' ? result.player : null;
        const moveHistory = engine.getMoveHistory();

        set({
          gameStatus: newStatus,
          currentPlayer: engine.getCurrentPlayer(),
          winner,
          winLine: result.winLine || null,
          moveHistory,
          board: (engine.getBoard() as any).cells,
          hintPosition: null, // 落子后清除提示
          isShowingHint: false,
        });

        // Week 7: 处理游戏结束时的用户成长系统
        handleGameEnd(previousStatus, newStatus, winner, moveHistory.length);

        // PVE模式：如果游戏未结束且轮到AI，触发AI落子
        const state = get();
        if (
          state.gameMode === 'pve' &&
          state.gameStatus === 'playing' &&
          !state.isAIThinking
        ) {
          setTimeout(() => triggerAIMove(), 100);
        }
      }

      return result;
    },

    undo: () => {
      const engine = get().engine;
      if (!engine) return;

      const state = get();
      const movesToUndo = state.gameMode === 'pve' ? 2 : 1; // PVE模式撤销两步

      for (let i = 0; i < movesToUndo; i++) {
        engine.undo();
      }

      set({
        gameStatus: 'playing',
        currentPlayer: engine.getCurrentPlayer(),
        winner: null,
        winLine: null,
        moveHistory: engine.getMoveHistory(),
        board: (engine.getBoard() as any).cells,
        isAIThinking: false,
        hintPosition: null, // 悔棋后清除提示
        isShowingHint: false,
      });
    },

    resetGame: () => {
      set({
        gameStatus: 'idle',
        currentPlayer: 'black',
        winner: null,
        winLine: null,
        moveHistory: [],
        board: null,
        engine: null,
        isAIThinking: false,
        hintPosition: null,
        isShowingHint: false,
        remainingHints: 3,
      });
    },

    setGameMode: (mode) => {
      set({ gameMode: mode });
    },

    setAIDifficulty: (difficulty) => {
      set({ aiDifficulty: difficulty });
    },

    setPlayerFirst: (first) => {
      set({ playerFirst: first });
    },

    getHint: async () => {
      const state = get();

      // 检查游戏状态
      if (state.gameStatus !== 'playing' || !state.engine) {
        return null;
      }

      // 检查剩余提示次数
      if (state.remainingHints <= 0) {
        return null;
      }

      try {
        // 使用AI计算推荐位置
        const aiClient = await createAIClient(state.aiDifficulty);
        const response = await aiClient.calculateMove({
          boardData: state.board!,
          player: state.currentPlayer,
        });

        if (response.success && response.position) {
          set({
            hintPosition: response.position,
            isShowingHint: true,
            remainingHints: state.remainingHints - 1,
          });

          // Week 7: 记录提示使用次数
          const userStore = useUserStore.getState();
          userStore.incrementHintUsage();

          return response.position;
        }

        return null;
      } catch (error) {
        console.error('Hint calculation failed:', error);
        return null;
      }
    },

    clearHint: () => {
      set({
        hintPosition: null,
        isShowingHint: false,
      });
    },
  };
});
