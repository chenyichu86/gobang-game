/**
 * Week 9: CheckInCalendar 组件测试
 * TDD Phase: RED - 测试代码编写完成，等待实现
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CheckInCalendar } from '../../components/CheckIn/CheckInCalendar';
import { useUserStore } from '../../store/user-store';

// Mock useUserStore
vi.mock('../../store/user-store');

const mockUseUserStore = vi.mocked(useUserStore);

describe('CheckInCalendar - 签到日历组件', () => {
  const mockCheckIn = vi.fn();

  beforeEach(() => {
    mockUseUserStore.mockImplementation((selector) => {
      const state = {
        checkInData: {
          lastCheckInDate: '2026-03-24',
          consecutiveDays: 5,
          totalCheckInDays: 20,
        },
        checkIn: mockCheckIn,
      };
      return selector ? selector(state) : state;
    });
  });

  /**
   * 测试用例 1: 渲染签到日历
   */
  it('应该正确渲染签到日历', () => {
    render(<CheckInCalendar />);

    expect(screen.getByText('📅 每日签到')).toBeInTheDocument();
  });

  /**
   * 测试用例 2: 显示连续签到天数
   */
  it('应该显示连续签到天数', () => {
    render(<CheckInCalendar />);

    expect(screen.getByText('5天')).toBeInTheDocument();
  });

  /**
   * 测试用例 3: 显示今日奖励
   */
  it('应该显示今日奖励（50金币）', () => {
    render(<CheckInCalendar />);

    expect(screen.getByText('50金币')).toBeInTheDocument();
  });

  /**
   * 测试用例 4: 签到按钮
   */
  it('应该显示"立即签到"按钮当今日未签到', () => {
    mockCheckIn.mockReturnValue({ success: true, reward: 50 });

    render(<CheckInCalendar />);

    // 按钮文本是"立即签到 (领取50金币)"
    expect(screen.getByText((content) => content.includes('立即签到'))).toBeInTheDocument();
  });

  /**
   * 测试用例 5: 已签到状态
   */
  it('应该显示"今日已签到"当今日已签到', () => {
    const today = new Date().toDateString();

    mockUseUserStore.mockImplementation((selector) => {
      const state = {
        checkInData: {
          lastCheckInDate: today, // 今天
          consecutiveDays: 6,
          totalCheckInDays: 21,
        },
        checkIn: mockCheckIn,
      };
      return selector ? selector(state) : state;
    });

    render(<CheckInCalendar />);

    expect(screen.getByText('今日已签到')).toBeInTheDocument();
  });
});
