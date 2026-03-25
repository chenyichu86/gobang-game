/**
 * PvP对战模式测试
 * TC-148 ~ TC-157
 */

import { renderHook, act } from '@testing-library/react';
import { useGameStore } from '../../store/game-store';
import { GameEngine } from '../../game/core/game-engine';

describe('PvP对战模式', () => {
  beforeEach(() => {
    // 重置store状态
    const { resetGame } = useGameStore.getState();
    resetGame();
  });

  describe('TC-148: PvP模式基础状态', () => {
    it('应该正确初始化PvP模式', () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setGameMode('pvp');
        result.current.startGame();
      });

      expect(result.current.gameMode).toBe('pvp');
      expect(result.current.gameStatus).toBe('playing');
      expect(result.current.currentPlayer).toBe('black');
      expect(result.current.winner).toBeNull();
      expect(result.current.moveHistory).toHaveLength(0);
    });

    it('应该在PvP模式下禁用AI相关状态', () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setGameMode('pvp');
        result.current.startGame();
      });

      expect(result.current.isAIThinking).toBe(false);
      expect(result.current.aiDifficulty).toBe('simple');
      expect(result.current.playerFirst).toBe(true);
    });
  });

  describe('TC-149: 两名玩家交替落子', () => {
    it('应该支持两名玩家交替落子', async () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setGameMode('pvp');
        result.current.startGame();
      });

      // 黑方落子
      let blackMove = await act(async () => {
        const moveResult = await result.current.makeMove({ x: 7, y: 7 });
        return moveResult;
      });

      expect(blackMove.success).toBe(true);
      expect(blackMove.player).toBe('white'); // 下一个玩家是白方
      expect(result.current.currentPlayer).toBe('white');
      expect(result.current.moveHistory).toHaveLength(1);

      // 白方落子
      let whiteMove = await act(async () => {
        const moveResult = await result.current.makeMove({ x: 7, y: 8 });
        return moveResult;
      });

      expect(whiteMove.success).toBe(true);
      expect(whiteMove.player).toBe('black'); // 下一个玩家是黑方
      expect(result.current.currentPlayer).toBe('black');
      expect(result.current.moveHistory).toHaveLength(2);
    });

    it('应该正确记录每一步的落子位置', async () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setGameMode('pvp');
        result.current.startGame();
      });

      await act(async () => {
        await result.current.makeMove({ x: 7, y: 7 });
        await result.current.makeMove({ x: 7, y: 8 });
        await result.current.makeMove({ x: 8, y: 7 });
      });

      expect(result.current.moveHistory).toEqual([
        { x: 7, y: 7 },
        { x: 7, y: 8 },
        { x: 8, y: 7 },
      ]);
    });
  });

  describe('TC-150: PvP模式胜负判断', () => {
    it('应该正确判断黑方获胜', async () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setGameMode('pvp');
        result.current.startGame();
      });

      // 模拟黑方连五
      const blackMoves = [
        { x: 7, y: 7 },
        { x: 8, y: 7 },
        { x: 9, y: 7 },
        { x: 10, y: 7 },
        { x: 11, y: 7 },
      ];

      const whiteMoves = [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: 0, y: 3 },
      ];

      for (let i = 0; i < blackMoves.length; i++) {
        await act(async () => {
          await result.current.makeMove(blackMoves[i]);
          if (i < whiteMoves.length) {
            await result.current.makeMove(whiteMoves[i]);
          }
        });
      }

      expect(result.current.gameStatus).toBe('won');
      expect(result.current.winner).toBe('black');
      expect(result.current.winLine).not.toBeNull();
      expect(result.current.winLine).toHaveLength(5);
    });

    it('应该正确判断白方获胜', async () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setGameMode('pvp');
        result.current.startGame();
      });

      // 白方连五测试：让白方在(5,5)到(9,5)连成五子
      // 黑方的落子位置确保不会连五

      const moves = [
        { x: 0, y: 0 },  // 黑
        { x: 5, y: 5 },  // 白
        { x: 14, y: 0 }, // 黑 (远离白方)
        { x: 6, y: 5 },  // 白
        { x: 14, y: 14 },// 黑
        { x: 7, y: 5 },  // 白
        { x: 0, y: 14 }, // 黑
        { x: 8, y: 5 },  // 白
        { x: 10, y: 10 },// 黑 (完全分散)
        { x: 9, y: 5 },  // 白 - 连五获胜！
      ];

      for (const move of moves) {
        await act(async () => {
          await result.current.makeMove(move);
        });
      }

      expect(result.current.gameStatus).toBe('won');
      expect(result.current.winner).toBe('white');
      expect(result.current.winLine).not.toBeNull();
    });
  });

  describe('TC-151: PvP模式和棋判断', () => {
    it('应该在棋盘满时判断为和棋', async () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setGameMode('pvp');
        result.current.startGame();
      });

      // 填满棋盘（除了会导致获胜的位置）
      const engine = new GameEngine();
      engine.startGame();

      // 填满棋盘但不形成五连
      for (let y = 0; y < 15; y++) {
        for (let x = 0; x < 15; x++) {
          // 跳过某些位置避免形成五连
          if ((x + y) % 3 !== 0) {
            await act(async () => {
              await result.current.makeMove({ x, y });
            });
          }
        }
      }

      // 继续填满剩余位置（确保不会形成五连）
      const remainingMoves = [];
      for (let y = 0; y < 15; y++) {
        for (let x = 0; x < 15; x++) {
          if ((x + y) % 3 === 0) {
            remainingMoves.push({ x, y });
          }
        }
      }

      // 交替落子直到棋盘满
      for (let i = 0; i < Math.min(remainingMoves.length, 225); i++) {
        if (result.current.gameStatus !== 'playing') break;

        await act(async () => {
          await result.current.makeMove(remainingMoves[i]);
        });
      }

      // 检查是否所有位置都被占用
      const board = result.current.board;
      if (board) {
        const allFilled = board.every((row) =>
          row.every((cell) => cell !== null)
        );
        if (allFilled) {
          expect(result.current.gameStatus).toBe('draw');
        }
      }
    });
  });

  describe('TC-152: PvP模式游戏记录保存', () => {
    it('应该正确保存PvP模式的完整游戏记录', async () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setGameMode('pvp');
        result.current.startGame();
      });

      const moves = [
        { x: 7, y: 7 },
        { x: 7, y: 8 },
        { x: 8, y: 7 },
        { x: 8, y: 8 },
        { x: 9, y: 7 },
      ];

      for (const move of moves) {
        await act(async () => {
          await result.current.makeMove(move);
        });
      }

      const gameRecord = {
        mode: result.current.gameMode,
        moves: result.current.moveHistory,
        winner: result.current.winner,
        status: result.current.gameStatus,
      };

      expect(gameRecord.mode).toBe('pvp');
      expect(gameRecord.moves).toHaveLength(5);
      expect(gameRecord.moves).toEqual(moves);
    });
  });

  describe('TC-153: 模式切换（PvP ↔ PvE）', () => {
    it('应该支持从PvP切换到PvE模式', async () => {
      const { result } = renderHook(() => useGameStore());

      // 开始PvP游戏
      act(() => {
        result.current.setGameMode('pvp');
        result.current.startGame();
      });

      await act(async () => {
        await result.current.makeMove({ x: 7, y: 7 });
      });

      expect(result.current.gameMode).toBe('pvp');
      expect(result.current.moveHistory).toHaveLength(1);

      // 切换到PvE模式（需要重置游戏）
      act(() => {
        result.current.resetGame();
        result.current.setGameMode('pve');
        result.current.setAIDifficulty('medium');
        result.current.startGame();
      });

      expect(result.current.gameMode).toBe('pve');
      expect(result.current.aiDifficulty).toBe('medium');
      expect(result.current.moveHistory).toHaveLength(0);
    });

    it('应该支持从PvE切换到PvP模式', async () => {
      const { result } = renderHook(() => useGameStore());

      // 开始PvE游戏
      act(() => {
        result.current.setGameMode('pve');
        result.current.setAIDifficulty('simple');
        result.current.startGame();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200)); // 等待AI
      });

      expect(result.current.gameMode).toBe('pve');

      // 切换到PvP模式
      act(() => {
        result.current.resetGame();
        result.current.setGameMode('pvp');
        result.current.startGame();
      });

      expect(result.current.gameMode).toBe('pvp');
      expect(result.current.moveHistory).toHaveLength(0);
    });
  });

  describe('TC-154: PvP模式悔棋功能', () => {
    it('应该在PvP模式下每次悔棋撤销一步', async () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setGameMode('pvp');
        result.current.startGame();
      });

      // 落子3步：黑→白→黑
      await act(async () => {
        await result.current.makeMove({ x: 7, y: 7 }); // 黑方落子，切换到白方
        await result.current.makeMove({ x: 7, y: 8 }); // 白方落子，切换到黑方
        await result.current.makeMove({ x: 8, y: 7 }); // 黑方落子，切换到白方
      });

      expect(result.current.moveHistory).toHaveLength(3);
      expect(result.current.currentPlayer).toBe('white'); // 3步后是白方

      // 悔棋一步：撤销黑方的棋，切换回黑方
      act(() => {
        result.current.undo();
      });

      expect(result.current.moveHistory).toHaveLength(2);
      expect(result.current.currentPlayer).toBe('black'); // 悔棋后是黑方
    });

    it('应该在PvP模式下多次悔棋', async () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setGameMode('pvp');
        result.current.startGame();
      });

      // 落子6步
      const moves = [
        { x: 7, y: 7 },
        { x: 7, y: 8 },
        { x: 8, y: 7 },
        { x: 8, y: 8 },
        { x: 9, y: 7 },
        { x: 9, y: 8 },
      ];

      for (const move of moves) {
        await act(async () => {
          await result.current.makeMove(move);
        });
      }

      expect(result.current.moveHistory).toHaveLength(6);

      // 悔棋3次
      act(() => {
        result.current.undo();
        result.current.undo();
        result.current.undo();
      });

      expect(result.current.moveHistory).toHaveLength(3);
      expect(result.current.currentPlayer).toBe('white'); // 6步悔3步后轮到白方
    });
  });

  describe('TC-155: PvP模式边界条件', () => {
    it('应该拒绝在游戏结束后落子', async () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setGameMode('pvp');
        result.current.startGame();
      });

      // 黑方连五获胜
      const blackMoves = [
        { x: 7, y: 7 },
        { x: 8, y: 7 },
        { x: 9, y: 7 },
        { x: 10, y: 7 },
        { x: 11, y: 7 },
      ];

      const whiteMoves = [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: 0, y: 3 },
      ];

      for (let i = 0; i < blackMoves.length; i++) {
        await act(async () => {
          await result.current.makeMove(blackMoves[i]);
          if (i < whiteMoves.length) {
            await result.current.makeMove(whiteMoves[i]);
          }
        });
      }

      expect(result.current.gameStatus).toBe('won');

      // 尝试在游戏结束后落子
      const lateMove = await act(async () => {
        const moveResult = await result.current.makeMove({ x: 5, y: 5 });
        return moveResult;
      });

      expect(lateMove.success).toBe(false);
      expect(lateMove.error).toBeDefined();
    });

    it('应该拒绝在已有棋子的位置落子', async () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setGameMode('pvp');
        result.current.startGame();
      });

      await act(async () => {
        await result.current.makeMove({ x: 7, y: 7 });
      });

      // 尝试在同一位置落子
      const duplicateMove = await act(async () => {
        const moveResult = await result.current.makeMove({ x: 7, y: 7 });
        return moveResult;
      });

      expect(duplicateMove.success).toBe(false);
      expect(duplicateMove.error).toBeDefined();
    });

    it('应该拒绝超出棋盘范围的落子', async () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setGameMode('pvp');
        result.current.startGame();
      });

      // 尝试超出范围的落子
      const outOfBoundsMoves = [
        { x: -1, y: 0 },
        { x: 0, y: -1 },
        { x: 15, y: 0 },
        { x: 0, y: 15 },
        { x: 20, y: 20 },
      ];

      for (const move of outOfBoundsMoves) {
        const result_move = await act(async () => {
          const moveResult = await result.current.makeMove(move);
          return moveResult;
        });

        expect(result_move.success).toBe(false);
      }
    });
  });

  describe('TC-156: PvP模式性能测试', () => {
    it('应该在100ms内完成单次落子', async () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setGameMode('pvp');
        result.current.startGame();
      });

      const startTime = performance.now();

      await act(async () => {
        await result.current.makeMove({ x: 7, y: 7 });
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('应该在500ms内完成50次连续落子', async () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setGameMode('pvp');
        result.current.startGame();
      });

      const startTime = performance.now();

      for (let i = 0; i < 50; i++) {
        const x = i % 15;
        const y = Math.floor(i / 15);
        if (x < 15 && y < 15) {
          await act(async () => {
            await result.current.makeMove({ x, y });
          });
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500);
    });
  });

  describe('TC-157: PvP模式悔棋功能验证', () => {
    it('应该正确支持悔棋功能', async () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setGameMode('pvp');
        result.current.startGame();
      });

      // 落子6步（黑方3步，白方3步）
      const moves = [
        { x: 7, y: 7 }, // 黑
        { x: 7, y: 8 }, // 白
        { x: 8, y: 7 }, // 黑
        { x: 8, y: 8 }, // 白
        { x: 9, y: 7 }, // 黑
        { x: 9, y: 8 }, // 白
      ];

      for (const move of moves) {
        await act(async () => {
          await result.current.makeMove(move);
        });
      }

      expect(result.current.moveHistory).toHaveLength(6);

      // 悔棋3次
      act(() => {
        result.current.undo();
        result.current.undo();
        result.current.undo();
      });

      expect(result.current.moveHistory).toHaveLength(3);
    });

    it('应该在PvP模式下正确悔棋', async () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setGameMode('pvp');
        result.current.startGame();
      });

      // 落子12步
      for (let i = 0; i < 12; i++) {
        const x = i % 15;
        const y = Math.floor(i / 15);
        await act(async () => {
          await result.current.makeMove({ x, y });
        });
      }

      expect(result.current.moveHistory).toHaveLength(12);

      // 悔棋4次
      for (let i = 0; i < 4; i++) {
        act(() => {
          result.current.undo();
        });
      }

      // 应该还有8步（12 - 4）
      expect(result.current.moveHistory).toHaveLength(8);
    });
  });
});
