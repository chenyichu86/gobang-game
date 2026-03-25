/**
 * BoardStage组件 - Konva舞台组件
 * Week 2 - WO 2.2
 */

import { Stage } from 'react-konva';
import { useState, useEffect } from 'react';

interface BoardStageProps {
  size: number;
  onCellClick: (x: number, y: number) => void;
  children?: React.ReactNode;
  padding?: number; // 添加 padding 参数
}

export function BoardStage({ size, onCellClick, children, padding = 0 }: BoardStageProps) {
  const [stageSize, setStageSize] = useState(size);

  // 响应式计算舞台大小
  useEffect(() => {
    const calculateSize = () => {
      const maxWidth = Math.min(window.innerWidth * 0.95, 600);
      const maxHeight = Math.min(window.innerHeight * 0.7, 600);
      return Math.min(maxWidth, maxHeight);
    };

    setStageSize(calculateSize());

    const handleResize = () => {
      setStageSize(calculateSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [size]);

  const cellSize = stageSize / 15;

  const handleStageClick = (e: any) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // 减去 padding 后转换为网格坐标
    const adjustedX = pointerPos.x - padding;
    const adjustedY = pointerPos.y - padding;

    // 计算格子间距（15条线，14个间隔）
    const cellSpacing = cellSize;

    const gridX = Math.round(adjustedX / cellSpacing);
    const gridY = Math.round(adjustedY / cellSpacing);

    if (gridX >= 0 && gridX < 15 && gridY >= 0 && gridY < 15) {
      onCellClick(gridX, gridY);
    }
  };

  return (
    <Stage
      width={stageSize}
      height={stageSize}
      onClick={handleStageClick}
      style={{ cursor: 'pointer' }}
    >
      {children}
    </Stage>
  );
}
