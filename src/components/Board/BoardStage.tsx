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
}

export function BoardStage({ size, onCellClick, children }: BoardStageProps) {
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

    // 转换为网格坐标
    const gridX = Math.floor(pointerPos.x / cellSize);
    const gridY = Math.floor(pointerPos.y / cellSize);

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
