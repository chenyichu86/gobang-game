import { describe, it, expect, vi } from 'vitest';
import { render, screen, RenderOptions, act } from '@testing-library/react';
import { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Timer } from '../Timer';

// 临时内联utils函数,避免导入问题
function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  function AllTheProviders({ children }: { children: React.ReactNode }) {
    return <BrowserRouter>{children}</BrowserRouter>;
  }

  return render(ui, { wrapper: AllTheProviders, ...options });
}

/**
 * Week 4 - Timer组件测试
 * 测试用例: TC-125 ~ TC-129 (5个测试)
 */

describe('Timer组件', () => {
  /**
   * TC-125: Timer组件初始化显示00:00
   */
  it('TC-125: 初始化显示00:00', () => {
    renderWithProviders(<Timer isRunning={false} />);
    expect(screen.getByText('00:00')).toBeInTheDocument();
  });

  /**
   * TC-126: Timer秒数累加
   */
  it('TC-126: 秒数累加正确', () => {
    vi.useFakeTimers();
    const onTimeUpdate = vi.fn();
    renderWithProviders(<Timer isRunning={true} onTimeUpdate={onTimeUpdate} />);

    // 快进3秒
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // 验证显示00:03
    expect(screen.getByText('00:03')).toBeInTheDocument();
    expect(onTimeUpdate).toHaveBeenCalledWith(3);
    vi.useRealTimers();
  });

  /**
   * TC-127: Timer分钟进位
   */
  it('TC-127: 分钟进位正确', () => {
    vi.useFakeTimers();
    renderWithProviders(<Timer isRunning={true} />);

    // 快进65秒 (1分5秒)
    act(() => {
      vi.advanceTimersByTime(65000);
    });

    // 验证显示01:05
    expect(screen.getByText('01:05')).toBeInTheDocument();
    vi.useRealTimers();
  });

  /**
   * TC-128: Timer暂停和恢复
   */
  it('TC-128: 暂停和恢复功能正常', () => {
    vi.useFakeTimers();
    const { rerender } = renderWithProviders(<Timer isRunning={true} />);

    // 运行5秒
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('00:05')).toBeInTheDocument();

    // 暂停
    rerender(<Timer isRunning={false} />);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    // 应该仍然显示00:05
    expect(screen.getByText('00:05')).toBeInTheDocument();

    // 恢复
    rerender(<Timer isRunning={true} />);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    // 应该显示00:08
    expect(screen.getByText('00:08')).toBeInTheDocument();
    vi.useRealTimers();
  });

  /**
   * TC-129: Timer回合切换重置
   */
  it('TC-129: 重新开始时重置为00:00', () => {
    vi.useFakeTimers();
    const { rerender } = renderWithProviders(<Timer isRunning={true} key="1" />);

    // 运行30秒
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(screen.getByText('00:30')).toBeInTheDocument();

    // 重新开始(通过key变化强制重新挂载)
    rerender(<Timer isRunning={true} key="2" />);
    expect(screen.getByText('00:00')).toBeInTheDocument();
    vi.useRealTimers();
  });
});
