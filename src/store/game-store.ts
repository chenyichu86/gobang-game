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
import { persistenceService } from '../services/persistence-service';
import { STORAGE_KEYS } from '../types/storage';
import { GameRecorder } from '../game/recorder';

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

  // 悔棋功能状态
  currentUndoCount: number; // 当前玩家已使用悔棋次数 (deprecated, kept for compatibility)
  maxUndoCount: number; // 每个玩家最大悔棋次数
  player1UndoCount: number; // 玩家1（黑棋）已使用悔棋次数
  player2UndoCount: number; // 玩家2（白棋）已使用悔棋次数

  // 游戏记录
  recorder: GameRecorder | null;

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
  reset: () => void; // Week 9.1: 测试用重置方法
  setGameMode: (mode: GameMode) => void;
  setAIDifficulty: (difficulty: AIType) => void;
  setPlayerFirst: (first: boolean) => void;
  getHint: () => Promise<Position | null>;
  clearHint: () => void;

  // Week 9.1: 游戏流程集成
  endGameWithRewards: (result: GameResult) => GameResult;
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

      // 保存游戏记录
      if (state.recorder) {
        const savedRecord = state.recorder.saveGame(winner, totalMoves);
        console.log(`📜 游戏记录已保存: ${savedRecord.id}`);
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
            const stateBeforeAIMove = get();

            // 记录AI的移动
            if (stateBeforeAIMove.recorder) {
              stateBeforeAIMove.recorder.addMove(response.position, stateBeforeAIMove.currentPlayer);
            }

            set({
              gameStatus: newStatus,
              currentPlayer: engine.getCurrentPlayer(),
              winner,
              winLine: result.winLine || null,
              moveHistory,
              board: (engine.getBoard() as any).cells,
            });

            // AI移动时不调用handleGameEnd，避免重复处理
            // 游戏结束会在makeMove中统一处理
          }
        }
      }
    } catch (error) {
      console.error('AI move failed:', error);
    } finally {
      set({ isAIThinking: false }); // 统一在这里重置AI思考状态
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
    currentUndoCount: 0,
    maxUndoCount: 3, // PvP每方3次，PvE不限
    player1UndoCount: 0, // 玩家1（黑棋）悔棋次数
    player2UndoCount: 0, // 玩家2（白棋）悔棋次数
    recorder: null,

    // Actions
    startGame: () => {
      const engine = new GameEngine();
      engine.startGame();

      const state = get();
      const currentPlayer = state.playerFirst ? 'black' : 'white';

      // 创建游戏记录器
      const recorder = new GameRecorder();
      recorder.initGame(
        state.gameMode,
        state.gameMode === 'pve' ? state.aiDifficulty : undefined,
        state.playerFirst
      );

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
        currentUndoCount: 0, // 重置悔棋次数
        player1UndoCount: 0, // 重置玩家1悔棋次数
        player2UndoCount: 0, // 重置玩家2悔棋次数
        recorder,
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
        const stateBeforeMove = get();

        // 记录落子（使用移动前的currentPlayer）
        if (stateBeforeMove.recorder) {
          stateBeforeMove.recorder.addMove(position, stateBeforeMove.currentPlayer);
        }

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
        const playerColor = state.playerFirst ? 'black' : 'white'; // 玩家执什么颜色
        const currentPlayer = get().currentPlayer; // 当前轮到谁

        // 如果当前玩家不是玩家，说明轮到AI了
        if (
          state.gameMode === 'pve' &&
          state.gameStatus === 'playing' &&
          !state.isAIThinking &&
          currentPlayer !== playerColor // 关键判断：当前不是玩家的回合
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

      // 检查PvP悔棋次数限制（玩家独立计数）
      if (state.gameMode === 'pvp') {
        // 如果当前是黑棋回合，说明白棋刚下完，白棋要悔棋
        // 如果当前是白棋回合，说明黑棋刚下完，黑棋要悔棋
        const currentPlayer = state.currentPlayer;
        if (currentPlayer === 'black') {
          // 白棋悔棋
          if (state.player2UndoCount >= state.maxUndoCount) {
            console.warn('白棋已达到最大悔棋次数');
            return;
          }
        } else {
          // 黑棋悔棋
          if (state.player1UndoCount >= state.maxUndoCount) {
            console.warn('黑棋已达到最大悔棋次数');
            return;
          }
        }
      }

      for (let i = 0; i < movesToUndo; i++) {
        engine.undo();
      }

      // 更新玩家悔棋计数
      let newPlayer1UndoCount = state.player1UndoCount;
      let newPlayer2UndoCount = state.player2UndoCount;
      if (state.gameMode === 'pvp') {
        const currentPlayerBeforeUndo = state.currentPlayer;
        if (currentPlayerBeforeUndo === 'black') {
          // 白棋悔棋
          newPlayer2UndoCount++;
        } else {
          // 黑棋悔棋
          newPlayer1UndoCount++;
        }
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
        currentUndoCount: state.gameMode === 'pvp' ? state.currentUndoCount + 1 : state.currentUndoCount,
        player1UndoCount: newPlayer1UndoCount,
        player2UndoCount: newPlayer2UndoCount,
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
        currentUndoCount: 0, // 重置悔棋次数
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
        // 提示功能使用中等AI（快速响应）
        // 对于困难/大师难度，提示也使用中等AI以避免等待太久
        const hintDifficulty = state.aiDifficulty === 'hard' || state.aiDifficulty === 'master'
          ? 'medium'
          : state.aiDifficulty;

        const aiClient = await createAIClient(hintDifficulty);
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

    // Week 9.1: 重置方法（用于测试）
    reset: () => {
      set({
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
      });
    },

    // Week 9.1: 游戏流程集成 - 带奖励的游戏结束
    endGameWithRewards: (result: GameResult) => {
      const state = get();
      const userStore = useUserStore.getState();

      // 1. 计算金币奖励
      const coinGainMap: Record<GameResult, number> = {
        win: 10,
        lose: 2,
        draw: 5,
      };
      const coinGain = coinGainMap[result];
      userStore.addCoins(coinGain);

      // 2. 更新任务进度
      userStore.checkTaskProgress(result);
      userStore.checkTaskProgress('game_end');

      // 3. 计算经验值
      const currentStreak = userStore.stats.currentStreak;
      const levelUpResult = userStore.addExp(result, currentStreak);

      // 4. 更新统计数据
      userStore.updateStats(result, state.moveHistory.length, 0);

      // 5. 构建游戏上下文用于成就检测
      const context = {
        result,
        totalMoves: state.moveHistory.length,
        opponentPieces: 0,
        currentStreak: result === 'win' ? currentStreak + 1 : 0,
        userStats: userStore.stats,
      };

      // 6. 检查游戏结束成就
      userStore.checkAchievements(context);

      // 7. 检查里程碑成就
      userStore.checkMilestoneAchievements(context);

      // 8. 设置游戏状态
      if (result === 'draw') {
        set({
          gameStatus: 'draw',
          winner: null,
        });
      } else if (result === 'win') {
        set({
          gameStatus: 'won',
          winner: state.currentPlayer,
        });
      } else {
        set({
          gameStatus: 'won',
          winner: state.currentPlayer === 'black' ? 'white' : 'black',
        });
      }

      // 9. 自动保存数据（重新获取最新状态）
      const updatedUserStore = useUserStore.getState();
      const userData = {
        version: 2,
        exp: updatedUserStore.exp,
        level: updatedUserStore.level,
        achievements: updatedUserStore.achievements,
        stats: updatedUserStore.stats,
        dailyLogin: updatedUserStore.dailyLogin,
        settings: updatedUserStore.settings,
        coins: updatedUserStore.coins,
        totalEarned: updatedUserStore.totalEarned,
        totalSpent: updatedUserStore.totalSpent,
        tasks: updatedUserStore.tasks,
        checkInData: updatedUserStore.checkInData,
        unlockedSkins: updatedUserStore.unlockedSkins,
        currentBoardSkin: updatedUserStore.currentBoardSkin,
        currentPieceSkin: updatedUserStore.currentPieceSkin,
        lastSaveTime: Date.now(),
      };
      persistenceService.save(STORAGE_KEYS.USER_DATA, userData);

      return result;
    },
  };
});
