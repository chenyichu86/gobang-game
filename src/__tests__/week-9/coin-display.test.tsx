/**
 * Week 9: CoinDisplay 组件测试
 * TDD Phase: RED - 测试代码编写完成，等待实现
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CoinDisplay } from '../../components/CoinDisplay/CoinDisplay';
import { useUserStore } from '../../store/user-store';

// Mock useUserStore
vi.mock('../../store/user-store');

const mockUseUserStore = vi.mocked(useUserStore);

describe('CoinDisplay - 金币显示组件', () => {
  beforeEach(() => {
    mockUseUserStore.mockImplementation((selector) => {
      const state = { coins: 1250 };
      return selector ? selector(state) : state;
    });
  });

  /**
   * 测试用例 1: 渲染金币数量
   */
  it('应该正确显示金币数量', () => {
    render(<CoinDisplay />);

    expect(screen.getByText('1,250')).toBeInTheDocument();
  });

  /**
   * 测试用例 2: 显示金币标签
   */
  it('应该显示"金币"标签当 showLabel=true', () => {
    render(<CoinDisplay showLabel={true} />);

    expect(screen.getByText('金币')).toBeInTheDocument();
  });

  /**
   * 测试用例 3: 不显示金币标签
   */
  it('不应该显示"金币"标签当 showLabel=false', () => {
    render(<CoinDisplay showLabel={false} />);

    expect(screen.queryByText('金币')).not.toBeInTheDocument();
  });

  /**
   * 测试用例 4: 可点击状态
   */
  it('应该触发 onClick 回调当点击时', () => {
    const handleClick = vi.fn();

    const { container } = render(<CoinDisplay onClick={handleClick} />);

    const coinElement = container.querySelector('.cursor-pointer');
    if (coinElement) {
      coinElement.click();
    }

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  /**
   * 测试用例 5: 不可点击状态
   */
  it('不应该触发 onClick 当 clickable=false', () => {
    const handleClick = vi.fn();

    const { container } = render(
      <CoinDisplay clickable={false} onClick={handleClick} />
    );

    const coinElement = container.querySelector('.cursor-pointer');
    expect(coinElement).not.toBeInTheDocument();
  });

  /**
   * 测试用例 6: 大数字格式化
   */
  it('应该正确格式化大数字（10000 → 10,000）', () => {
    mockUseUserStore.mockImplementation((selector) => {
      const state = { coins: 10000 };
      return selector ? selector(state) : state;
    });

    render(<CoinDisplay />);

    expect(screen.getByText('10,000')).toBeInTheDocument();
  });

  /**
   * 测试用例 7: 自定义样式类名
   */
  it('应该应用自定义 className', () => {
    const { container } = render(<CoinDisplay className="custom-class" />);

    const element = container.querySelector('.custom-class');
    expect(element).toBeInTheDocument();
  });
});
