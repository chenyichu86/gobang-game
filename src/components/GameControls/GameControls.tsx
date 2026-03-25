import React from 'react';

/**
 * GameControls组件 - 游戏控制面板
 * Week 4 UI组件测试 (TC-135 ~ TC-139)
 *
 * @param gameStatus - 游戏状态
 * @param gameMode - 游戏模式
 * @param canUndo - 是否可悔棋
 * @param undoCount - 剩余悔棋次数
 * @param onRestart - 重新开始回调
 * @param onUndo - 悔棋回调
 * @param onMainMenu - 返回主菜单回调
 * @param onHint - 提示回调
 * @param className - 自定义类名
 */
interface GameControlsProps {
  gameStatus: 'playing' | 'paused' | 'won' | 'draw';
  gameMode: 'pve' | 'pvp';
  canUndo: boolean;
  undoCount: number;
  onRestart: () => void;
  onUndo: () => void;
  onMainMenu: () => void;
  onHint?: () => void;
  className?: string;
}

export const GameControls: React.FC<GameControlsProps> = ({
  gameStatus,
  gameMode,
  canUndo,
  undoCount,
  onRestart,
  onUndo,
  onMainMenu,
  onHint,
  className = '',
}) => {
  // 悔棋按钮是否禁用
  const isUndoDisabled = !canUndo || gameStatus !== 'playing';

  // 提示按钮是否禁用
  const isHintDisabled = gameStatus !== 'playing' || !onHint;

  // 悔棋按钮文本
  const undoButtonText = `悔棋 (${undoCount})`;

  return (
    <div className={`game-controls flex gap-4 flex-wrap ${className}`} data-testid="game-controls">
      {/* 重新开始按钮 */}
      <button
        onClick={onRestart}
        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="重新开始"
      >
        重新开始
      </button>

      {/* 悔棋按钮 */}
      <button
        onClick={onUndo}
        disabled={isUndoDisabled}
        className="px-4 py-2 bg-blue-200 hover:bg-blue-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="悔棋"
      >
        {undoButtonText}
      </button>

      {/* 提示按钮(如果提供) */}
      {onHint && (
        <button
          onClick={onHint}
          disabled={isHintDisabled}
          className="px-4 py-2 bg-green-200 hover:bg-green-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="提示"
        >
          💡 提示
        </button>
      )}

      {/* 返回主菜单按钮 */}
      <button
        onClick={onMainMenu}
        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="返回主菜单"
      >
        返回主菜单
      </button>
    </div>
  );
};
