import { useState, useEffect } from 'react';
import React from 'react';

/**
 * Timer组件 - 游戏计时器
 * Week 4 UI组件测试 (TC-125 ~ TC-129)
 *
 * @param isRunning - 计时器是否运行
 * @param onTimeUpdate - 时间更新回调
 * @param className - 自定义类名
 */
interface TimerProps {
  isRunning: boolean;
  onTimeUpdate?: (seconds: number) => void;
  className?: string;
}

export const Timer: React.FC<TimerProps> = ({
  isRunning,
  onTimeUpdate,
  className = '',
}) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        const newSeconds = prev + 1;
        onTimeUpdate?.(newSeconds);
        return newSeconds;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onTimeUpdate]);

  // 格式化时间为MM:SS
  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className={`timer ${className}`} data-testid="timer">
      <span className="timer-display">{formatTime(seconds)}</span>
    </div>
  );
};
