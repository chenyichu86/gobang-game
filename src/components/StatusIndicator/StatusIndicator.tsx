import React from 'react';

/**
 * StatusIndicator组件 - 游戏状态指示器
 * Week 4 UI组件测试 (TC-130 ~ TC-134)
 *
 * @param gameStatus - 游戏状态
 * @param currentPlayer - 当前玩家
 * @param winner - 获胜方
 * @param className - 自定义类名
 */
interface StatusIndicatorProps {
  gameStatus: 'playing' | 'paused' | 'won' | 'draw';
  currentPlayer: 'black' | 'white';
  winner?: 'black' | 'white' | null;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  gameStatus,
  currentPlayer,
  winner,
  className = '',
}) => {
  const getStatusText = (): string => {
    switch (gameStatus) {
      case 'playing':
        return `轮到${currentPlayer === 'black' ? '黑棋' : '白棋'}落子`;
      case 'paused':
        return '游戏已暂停';
      case 'won':
        return winner === 'black' ? '黑棋获胜' : '白棋获胜';
      case 'draw':
        return '平局';
      default:
        return '';
    }
  };

  const getStatusIcon = (): string => {
    switch (gameStatus) {
      case 'playing':
        return currentPlayer === 'black' ? '⚫' : '⚪';
      case 'paused':
        return '⏸️';
      case 'won':
        return '🏆';
      case 'draw':
        return '🤝';
      default:
        return '';
    }
  };

  const getStatusColor = (): string => {
    switch (gameStatus) {
      case 'playing':
        return currentPlayer === 'black' ? 'text-gray-900' : 'text-gray-600';
      case 'paused':
        return 'text-yellow-600';
      case 'won':
        return 'text-green-600';
      case 'draw':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`status-indicator ${getStatusColor()} ${className}`} data-testid="status-indicator">
      <span className="status-icon mr-2">{getStatusIcon()}</span>
      <span className="status-text">{getStatusText()}</span>
    </div>
  );
};
