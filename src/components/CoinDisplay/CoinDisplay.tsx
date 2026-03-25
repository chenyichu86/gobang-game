/**
 * Week 9: 金币显示组件
 * TDD Phase: GREEN - 实现完成
 */

import React from 'react';
import { useUserStore } from '../../store/user-store';

export interface CoinDisplayProps {
  showLabel?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
}

export const CoinDisplay: React.FC<CoinDisplayProps> = ({
  showLabel = true,
  clickable = true,
  onClick,
  className = '',
}) => {
  const coins = useUserStore((state) => state.coins);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  // 格式化数字（1,250）
  const formattedCoins = coins.toLocaleString();

  return (
    <div
      className={`flex items-center gap-2 ${clickable ? 'cursor-pointer' : ''} ${className}`}
      onClick={clickable ? handleClick : undefined}
    >
      {/* 金币图标 */}
      <span className="text-2xl">🪙</span>

      {/* 金币数量 */}
      <span className="text-xl font-bold text-yellow-600">{formattedCoins}</span>

      {/* 金币标签 */}
      {showLabel && <span className="text-sm text-gray-600">金币</span>}
    </div>
  );
};
