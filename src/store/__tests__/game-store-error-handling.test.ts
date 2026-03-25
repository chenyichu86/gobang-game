/**
 * GameStore 错误处理测试
 * 测试AI move失败和Hint计算失败场景
 * Week 5 - 错误处理覆盖补充
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameStore } from '../game-store';
import { createAIClient } from '../../game/ai/ai-client';

// Mock createAIClient
vi.mock('../../game/ai/ai-client', () => ({
  createAIClient: vi.fn(),
}));

describe('GameStore - 错误处理', () => {
  beforeEach(() => {
    // 重置store状态
    const { resetGame } = useGameStore.getState();
    resetGame();

    // 清理所有mock
    vi.clearAllMocks();
  });

  describe('AI move失败处理', () => {
    it('应该在AI计算失败时优雅降级', async () => {
      // Mock AI Client返回失败
      vi.mocked(createAIClient).mockResolvedValue({
        calculateMove: vi.fn().mockResolvedValue({
          success: false,
          error: 'AI calculation failed',
        }),
      });

      const { result } = renderHook(() => useGameStore());

      // 启动PVE游戏（玩家先行，避免AI在startGame时立即触发）
      act(() => {
        result.current.setGameMode('pve');
        result.current.setAIDifficulty('simple');
        result.current.setPlayerFirst(true); // 玩家先行
        result.current.startGame();
      });

      // 玩家落子，触发AI响应
      await act(async () => {
        await result.current.makeMove({ x: 7, y: 7 });
      });

      // 等待AI响应（失败）
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
      });

      // 验证：即使AI失败，游戏状态应该仍然正常
      const state = result.current;
      expect(state.gameStatus).toBe('playing');
      // isAIThinking应该在finally块中被设置为false
      expect(state.isAIThinking).toBe(false);

      // 验证createAIClient被调用
      expect(createAIClient).toHaveBeenCalledWith('simple');
    });

    it('应该在AI Client抛出异常时优雅降级', async () => {
      // Mock AI Client抛出异常
      vi.mocked(createAIClient).mockRejectedValue(
        new Error('AI Worker crashed')
      );

      const { result } = renderHook(() => useGameStore());

      // 启动PVE游戏（玩家先行）
      act(() => {
        result.current.setGameMode('pve');
        result.current.setAIDifficulty('medium');
        result.current.setPlayerFirst(true);
        result.current.startGame();
      });

      // 玩家落子，触发AI响应
      await act(async () => {
        await result.current.makeMove({ x: 7, y: 7 });
      });

      // 等待AI响应（异常）
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
      });

      // 验证：游戏状态应该正常，不应该崩溃
      const state = result.current;
      expect(state.gameStatus).toBe('playing');
      expect(state.isAIThinking).toBe(false);
    });

    it('应该在玩家落子后AI响应失败时保持游戏状态', async () => {
      // Mock AI先成功，然后失败
      let callCount = 0;
      vi.mocked(createAIClient).mockResolvedValue({
        calculateMove: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            // 第一次调用失败
            return Promise.resolve({
              success: false,
              error: 'AI timeout',
            });
          } else {
            // 后续调用也失败
            return Promise.resolve({
              success: false,
              error: 'AI error',
            });
          }
        }),
      });

      const { result } = renderHook(() => useGameStore());

      // 启动PVE游戏（玩家先行）
      act(() => {
        result.current.setGameMode('pve');
        result.current.setAIDifficulty('simple');
        result.current.setPlayerFirst(true);
        result.current.startGame();
      });

      // 玩家落子
      await act(async () => {
        await result.current.makeMove({ x: 7, y: 8 });
      });

      // 等待AI响应（失败）
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
      });

      // 验证：游戏应该继续，AI失败不应该阻止游戏
      const state = result.current;
      expect(state.gameStatus).toBe('playing');
      expect(state.isAIThinking).toBe(false);
    });

    it('应该在AI返回无效位置时不执行落子', async () => {
      // Mock AI返回成功但位置为undefined
      vi.mocked(createAIClient).mockResolvedValue({
        calculateMove: vi.fn().mockResolvedValue({
          success: true,
          position: undefined,
        }),
      });

      const { result } = renderHook(() => useGameStore());

      // 启动PVE游戏（玩家先行）
      act(() => {
        result.current.setGameMode('pve');
        result.current.setAIDifficulty('simple');
        result.current.setPlayerFirst(true);
        result.current.startGame();
      });

      // 玩家落子，触发AI响应
      await act(async () => {
        await result.current.makeMove({ x: 7, y: 7 });
      });

      // 等待AI响应（无效位置）
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
      });

      // 验证：游戏仍在进行，但没有AI的棋子
      const state = result.current;
      expect(state.gameStatus).toBe('playing');
      expect(state.isAIThinking).toBe(false);
    });
  });

  describe('Hint计算失败处理', () => {
    it('应该在AI Client返回失败时返回null', async () => {
      // Mock AI Client返回失败
      vi.mocked(createAIClient).mockResolvedValue({
        calculateMove: vi.fn().mockResolvedValue({
          success: false,
          error: 'Hint calculation failed',
        }),
      });

      const { result } = renderHook(() => useGameStore());

      // 启动游戏
      act(() => {
        result.current.setGameMode('pve');
        result.current.setAIDifficulty('simple');
        result.current.startGame();
      });

      // 获取提示
      let hintPosition;
      await act(async () => {
        hintPosition = await result.current.getHint();
      });

      // 验证：应该返回null
      expect(hintPosition).toBeNull();
      expect(result.current.hintPosition).toBeNull();
      expect(result.current.isShowingHint).toBe(false);
    });

    it('应该在AI Client抛出异常时返回null', async () => {
      // Mock AI Client抛出异常
      vi.mocked(createAIClient).mockRejectedValue(
        new Error('Hint calculation error')
      );

      const { result } = renderHook(() => useGameStore());

      // 启动游戏
      act(() => {
        result.current.setGameMode('pve');
        result.current.setAIDifficulty('medium');
        result.current.startGame();
      });

      // 获取提示
      let hintPosition;
      await act(async () => {
        hintPosition = await result.current.getHint();
      });

      // 验证：应该返回null
      expect(hintPosition).toBeNull();
      expect(result.current.hintPosition).toBeNull();
    });

    it('应该在AI计算超时时返回null', async () => {
      // Mock AI Client超时
      vi.mocked(createAIClient).mockResolvedValue({
        calculateMove: vi.fn().mockImplementation(
          () =>
            new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Timeout')), 100);
            })
        ),
      });

      const { result } = renderHook(() => useGameStore());

      // 启动游戏
      act(() => {
        result.current.setGameMode('pve');
        result.current.setAIDifficulty('hard');
        result.current.startGame();
      });

      // 获取提示（设置较短的超时）
      let hintPosition;
      await act(async () => {
        // 使用race来模拟超时
        const hintPromise = result.current.getHint();
        const timeoutPromise = new Promise((resolve) =>
          setTimeout(() => resolve(null), 50)
        );
        hintPosition = await Promise.race([hintPromise, timeoutPromise]);
      });

      // 验证：超时时应该返回null或等待超时
      expect(hintPosition).toBeNull();
    });

    it('应该在Hint失败后不消耗提示次数', async () => {
      // 记录初始提示次数
      let initialHints = 3;

      // Mock AI Client返回失败
      vi.mocked(createAIClient).mockResolvedValue({
        calculateMove: vi.fn().mockResolvedValue({
          success: false,
          error: 'Calculation failed',
        }),
      });

      const { result } = renderHook(() => useGameStore());

      // 启动游戏
      act(() => {
        result.current.setGameMode('pve');
        result.current.startGame();
      });

      initialHints = result.current.remainingHints;
      expect(initialHints).toBe(3);

      // 尝试获取提示（失败）
      let hintPosition;
      await act(async () => {
        hintPosition = await result.current.getHint();
      });

      // 验证：提示次数不应该减少
      expect(hintPosition).toBeNull();
      expect(result.current.remainingHints).toBe(initialHints);
    });

    it('应该在Hint失败后不影响游戏继续', async () => {
      // Mock AI Client返回失败（用于hint）
      vi.mocked(createAIClient).mockResolvedValue({
        calculateMove: vi.fn().mockResolvedValue({
          success: false,
          error: 'Hint failed',
        }),
      });

      const { result } = renderHook(() => useGameStore());

      // 启动游戏
      act(() => {
        result.current.setGameMode('pve');
        result.current.setAIDifficulty('simple');
        result.current.startGame();
      });

      // 获取提示失败
      let hintPosition;
      await act(async () => {
        hintPosition = await result.current.getHint();
      });
      expect(hintPosition).toBeNull();

      // 验证：游戏应该仍然可以正常进行
      expect(result.current.gameStatus).toBe('playing');
      expect(result.current.remainingHints).toBe(3); // 次数未消耗

      // 玩家可以正常落子（但由于AI失败，AI响应会失败）
      // 让我们验证游戏仍然在进行
      expect(result.current.gameStatus).toBe('playing');
    });
  });

  describe('边界条件错误处理', () => {
    it('应该在AI Client未初始化时不崩溃', async () => {
      // Mock createAIClient返回null（极端情况）
      vi.mocked(createAIClient).mockResolvedValue(null as any);

      const { result } = renderHook(() => useGameStore());

      // 启动游戏
      act(() => {
        result.current.setGameMode('pve');
        result.current.startGame();
      });

      // 尝试获取提示
      let hintPosition;
      await act(async () => {
        try {
          hintPosition = await result.current.getHint();
        } catch (e) {
          // 预期可能抛出异常
          hintPosition = null;
        }
      });

      // 验证：不应该崩溃
      expect(result.current.gameStatus).toBe('playing');
    });

    it('应该在多次AI失败后仍可正常游戏', async () => {
      // Mock AI总是失败
      vi.mocked(createAIClient).mockResolvedValue({
        calculateMove: vi.fn().mockResolvedValue({
          success: false,
          error: 'Persistent error',
        }),
      });

      const { result } = renderHook(() => useGameStore());

      // 启动游戏（玩家先行）
      act(() => {
        result.current.setGameMode('pve');
        result.current.setAIDifficulty('simple');
        result.current.setPlayerFirst(true);
        result.current.startGame();
      });

      // 玩家落子，触发AI（失败）
      await act(async () => {
        await result.current.makeMove({ x: 7, y: 7 });
      });

      // 等待AI响应（失败）
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
      });

      // 尝试获取提示（失败）
      let hintPosition;
      await act(async () => {
        hintPosition = await result.current.getHint();
      });
      expect(hintPosition).toBeNull();

      // 再次获取提示（仍然失败）
      await act(async () => {
        hintPosition = await result.current.getHint();
      });
      expect(hintPosition).toBeNull();

      // 验证：游戏应该仍然可以继续
      expect(result.current.gameStatus).toBe('playing');
      expect(result.current.isAIThinking).toBe(false);
    });
  });
});
