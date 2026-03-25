import { describe, it, expect, vi } from 'vitest';
import { render, screen, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { GameControls } from '../GameControls';

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
 * Week 4 - GameControls组件测试
 * 测试用例: TC-135 ~ TC-139 (5个测试)
 */

describe('GameControls组件', () => {
  /**
   * TC-135: GameControls重新开始按钮
   */
  it('TC-135: 重新开始按钮可点击', async () => {
    const onRestart = vi.fn();
    renderWithProviders(
      <GameControls
        gameStatus="playing"
        gameMode="pve"
        canUndo={true}
        undoCount={3}
        onRestart={onRestart}
        onUndo={vi.fn()}
        onMainMenu={vi.fn()}
      />
    );

    const restartBtn = screen.getByText('重新开始');
    expect(restartBtn).toBeInTheDocument();
    expect(restartBtn).not.toBeDisabled();

    await userEvent.click(restartBtn);
    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  /**
   * TC-136: GameControls返回菜单按钮
   */
  it('TC-136: 返回主菜单按钮可点击', async () => {
    const onMainMenu = vi.fn();
    renderWithProviders(
      <GameControls
        gameStatus="playing"
        gameMode="pve"
        canUndo={true}
        undoCount={3}
        onRestart={vi.fn()}
        onUndo={vi.fn()}
        onMainMenu={onMainMenu}
      />
    );

    const menuBtn = screen.getByText('返回主菜单');
    expect(menuBtn).toBeInTheDocument();
    expect(menuBtn).not.toBeDisabled();

    await userEvent.click(menuBtn);
    expect(onMainMenu).toHaveBeenCalledTimes(1);
  });

  /**
   * TC-137: GameControls悔棋按钮(PvP和PvE不同行为)
   */
  it('TC-137: 悔棋按钮显示剩余次数', async () => {
    const onUndo = vi.fn();
    renderWithProviders(
      <GameControls
        gameStatus="playing"
        gameMode="pvp"
        canUndo={true}
        undoCount={3}
        onRestart={vi.fn()}
        onUndo={onUndo}
        onMainMenu={vi.fn()}
      />
    );

    const undoBtn = screen.getByText('悔棋 (3)');
    expect(undoBtn).toBeInTheDocument();
    expect(undoBtn).not.toBeDisabled();

    await userEvent.click(undoBtn);
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('TC-137: 悔棋次数为0时禁用', () => {
    renderWithProviders(
      <GameControls
        gameStatus="playing"
        gameMode="pvp"
        canUndo={false}
        undoCount={0}
        onRestart={vi.fn()}
        onUndo={vi.fn()}
        onMainMenu={vi.fn()}
      />
    );

    const undoBtn = screen.getByText('悔棋 (0)');
    expect(undoBtn).toBeDisabled();
  });

  /**
   * TC-138: GameControls提示按钮
   */
  it('TC-138: 提示按钮在游戏进行时可用', async () => {
    const onHint = vi.fn();
    renderWithProviders(
      <GameControls
        gameStatus="playing"
        gameMode="pve"
        canUndo={true}
        undoCount={3}
        onRestart={vi.fn()}
        onUndo={vi.fn()}
        onMainMenu={vi.fn()}
        onHint={onHint}
      />
    );

    const hintBtn = screen.getByText(/提示/);
    expect(hintBtn).toBeInTheDocument();
    expect(hintBtn).not.toBeDisabled();

    await userEvent.click(hintBtn);
    expect(onHint).toHaveBeenCalledTimes(1);
  });

  it('TC-138: 游戏结束时提示按钮禁用', () => {
    renderWithProviders(
      <GameControls
        gameStatus="won"
        gameMode="pve"
        canUndo={true}
        undoCount={3}
        onRestart={vi.fn()}
        onUndo={vi.fn()}
        onMainMenu={vi.fn()}
        onHint={vi.fn()}
      />
    );

    const hintBtn = screen.getByText(/提示/);
    expect(hintBtn).toBeDisabled();
  });
});
