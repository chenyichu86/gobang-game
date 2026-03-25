/**
 * Week 9: TaskList 组件测试
 * TDD Phase: RED - 测试代码编写完成，等待实现
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskList } from '../../components/Tasks/TaskList';
import { useUserStore } from '../../store/user-store';

// Mock useUserStore
vi.mock('../../store/user-store');

const mockUseUserStore = vi.mocked(useUserStore);

describe('TaskList - 任务列表组件', () => {
  const mockClaimTaskReward = vi.fn();

  beforeEach(() => {
    mockUseUserStore.mockImplementation((selector) => {
      const state = {
        tasks: [
          {
            id: 'daily_games_3',
            type: 'daily',
            name: '游戏达人',
            description: '完成3局游戏',
            target: 3,
            progress: 2,
            reward: { coins: 30 },
            completed: false,
            claimed: false,
          },
          {
            id: 'daily_win_1',
            type: 'daily',
            name: '胜利者',
            description: '获得1局胜利',
            target: 1,
            progress: 1,
            reward: { coins: 50 },
            completed: true,
            claimed: false,
          },
        ],
        claimTaskReward: mockClaimTaskReward,
      };
      return selector ? selector(state) : state;
    });
  });

  /**
   * 测试用例 1: 渲染任务列表
   */
  it('应该正确渲染任务列表', () => {
    render(<TaskList />);

    expect(screen.getByText('游戏达人')).toBeInTheDocument();
    expect(screen.getByText('胜利者')).toBeInTheDocument();
  });

  /**
   * 测试用例 2: 显示任务进度
   */
  it('应该正确显示任务进度（2/3）', () => {
    render(<TaskList />);

    expect(screen.getByText('2/3')).toBeInTheDocument();
  });

  /**
   * 测试用例 3: 领取奖励按钮
   */
  it('应该显示"领取"按钮当任务完成且未领取', () => {
    render(<TaskList />);

    const claimButton = screen.getAllByText('领取').find((btn) =>
      btn.textContent === '领取'
    );

    expect(claimButton).toBeDefined();
  });

  /**
   * 测试用例 4: 点击领取奖励
   */
  it('应该调用 claimTaskReward 当点击领取按钮', () => {
    mockUseUserStore.mockImplementation((selector) => {
      const state = {
        tasks: [
          {
            id: 'daily_win_1',
            type: 'daily',
            name: '胜利者',
            description: '获得1局胜利',
            target: 1,
            progress: 1,
            reward: { coins: 50 },
            completed: true,
            claimed: false,
          },
        ],
        claimTaskReward: mockClaimTaskReward,
      };
      return selector ? selector(state) : state;
    });

    render(<TaskList />);

    const claimButton = screen.getByText('领取');
    fireEvent.click(claimButton);

    expect(mockClaimTaskReward).toHaveBeenCalledWith('daily_win_1');
  });

  /**
   * 测试用例 5: 已领取状态
   */
  it('应该显示"已领取"当任务已领取', () => {
    mockUseUserStore.mockImplementation((selector) => {
      const state = {
        tasks: [
          {
            id: 'daily_win_1',
            type: 'daily',
            name: '胜利者',
            description: '获得1局胜利',
            target: 1,
            progress: 1,
            reward: { coins: 50 },
            completed: true,
            claimed: true,
          },
        ],
        claimTaskReward: mockClaimTaskReward,
      };
      return selector ? selector(state) : state;
    });

    render(<TaskList />);

    expect(screen.getByText('已领取')).toBeInTheDocument();
  });

  /**
   * 测试用例 6: 显示任务奖励
   */
  it('应该显示任务奖励金币数', () => {
    render(<TaskList />);

    // 使用更灵活的匹配器，因为金币图标和数字可能在不同的元素中
    const allText = screen.getAllByText(/🪙/);
    expect(allText.length).toBeGreaterThan(0);

    // 或者查找包含 30 和 50 的元素
    expect(screen.getByText((content) => content.includes('30'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('50'))).toBeInTheDocument();
  });
});
