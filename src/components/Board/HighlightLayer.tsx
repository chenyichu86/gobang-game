/**
 * HighlightLayer组件 - 高亮显示层（获胜连线等）
 * Week 2 - WO 2.5
 */

import { Layer, Line, Circle } from 'react-konva';
import type { Position } from '../../game/core/rules';

interface HighlightLayerProps {
  size: number;
  padding: number;
  cellSize: number;
  winLine?: Position[] | null;
}

export function HighlightLayer({
  size,
  padding,
  cellSize,
  winLine,
}: HighlightLayerProps) {
  const cellSpacing = cellSize;

  return (
    <Layer>
      {/* 获胜连线 */}
      {winLine && winLine.length > 0 && (
        <>
          {/* 连线 */}
          <Line
            points={winLine
              .map((pos) => [
                padding + pos.x * cellSpacing,
                padding + pos.y * cellSpacing,
              ])
              .flat()}
            stroke="#FF0000"
            strokeWidth={cellSpacing * 0.15}
            lineCap="round"
            lineJoin="round"
            shadowColor="rgba(255, 0, 0, 0.5)"
            shadowBlur={10}
            shadowOpacity={0.8}
          />

          {/* 获胜棋子的高亮圆圈 */}
          {winLine.map((pos, index) => {
            const x = padding + pos.x * cellSpacing;
            const y = padding + pos.y * cellSpacing;
            const radius = cellSpacing * 0.45;

            return (
              <Circle
                key={`win-${pos.x}-${pos.y}-${index}`}
                x={x}
                y={y}
                radius={radius}
                stroke="#FF0000"
                strokeWidth={3}
                dash={[10, 5]}
                shadowColor="rgba(255, 0, 0, 0.8)"
                shadowBlur={15}
              />
            );
          })}
        </>
      )}
    </Layer>
  );
}
