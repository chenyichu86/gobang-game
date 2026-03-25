import { describe, it, expect } from 'vitest';
import { render, screen, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { StatusIndicator } from '../StatusIndicator';

// 临时内联utils函数
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
 * Week 4 - StatusIndicator组件测试
 * 测试用例: TC-130 ~ TC-134 (5个测试)
 */

describe('StatusIndicator组件', () => {
  /**
   * TC-130: StatusIndicator显示当前玩家
   */
  it('TC-130: 显示当前玩家(黑棋)', () => {
    renderWithProviders(
      <StatusIndicator gameStatus="playing" currentPlayer="black" />
    );
    expect(screen.getByText('轮到黑棋落子')).toBeInTheDocument();
  });

  it('TC-130: 显示当前玩家(白棋)', () => {
    renderWithProviders(
      <StatusIndicator gameStatus="playing" currentPlayer="white" />
    );
    expect(screen.getByText('轮到白棋落子')).toBeInTheDocument();
  });

  /**
   * TC-131: StatusIndicator显示游戏状态
   */
  it('TC-131: 显示游戏状态', () => {
    const { rerender } = renderWithProviders(
      <StatusIndicator gameStatus="playing" currentPlayer="black" />
    );
    expect(screen.getByText(/轮到.*落子/)).toBeInTheDocument();

    rerender(<StatusIndicator gameStatus="paused" currentPlayer="black" />);
    expect(screen.getByText('游戏已暂停')).toBeInTheDocument();

    rerender(
      <StatusIndicator gameStatus="won" currentPlayer="black" winner="black" />
    );
    expect(screen.getByText('黑棋获胜')).toBeInTheDocument();

    rerender(<StatusIndicator gameStatus="draw" currentPlayer="black" />);
    expect(screen.getByText('平局')).toBeInTheDocument();
  });

  /**
   * TC-132: StatusIndicator显示获胜方
   */
  it('TC-132: 显示获胜方', () => {
    const { rerender } = renderWithProviders(
      <StatusIndicator gameStatus="won" currentPlayer="black" winner="black" />
    );
    expect(screen.getByText('黑棋获胜')).toBeInTheDocument();

    rerender(
      <StatusIndicator gameStatus="won" currentPlayer="white" winner="white" />
    );
    expect(screen.getByText('白棋获胜')).toBeInTheDocument();
  });
});
