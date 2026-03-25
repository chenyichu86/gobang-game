/**
 * PiecesLayer组件 - 棋子渲染层
 * Week 2 - WO 2.4
 */

import { Layer, Circle, Group } from 'react-konva';

interface Piece {
  x: number;
  y: number;
  player: 'black' | 'white';
}

interface PiecesLayerProps {
  pieces: Piece[];
  cellSize: number;
  padding: number;
  lastMove?: { x: number; y: number };
}

export function PiecesLayer({
  pieces,
  cellSize,
  padding,
  lastMove,
}: PiecesLayerProps) {
  const effectiveSize = cellSize;

  // 计算格子间距（15条线，14个间隔）
  const cellSpacing = cellSize;

  return (
    <Layer>
      {pieces.map((piece, index) => {
        const x = padding + piece.x * cellSpacing;
        const y = padding + piece.y * cellSpacing;
        const radius = cellSpacing * 0.4;

        return (
          <Group key={`${piece.x}-${piece.y}-${index}`}>
            {/* 棋子阴影 */}
            <Circle
              x={x + 2}
              y={y + 2}
              radius={radius}
              fill="rgba(0, 0, 0, 0.3)"
            />

            {/* 棋子本体 */}
            <Circle
              x={x}
              y={y}
              radius={radius}
              fill={piece.player === 'black' ? '#2C2C2C' : '#FFFFFF'}
              stroke={piece.player === 'white' ? '#CCCCCC' : '#000000'}
              strokeWidth={piece.player === 'white' ? 1 : 0}
              shadowColor="rgba(0, 0, 0, 0.5)"
              shadowBlur={10}
              shadowOffsetX={2}
              shadowOffsetY={2}
              shadowOpacity={0.3}
            />

            {/* 黑棋高光效果 */}
            {piece.player === 'black' && (
              <Circle
                x={x - radius * 0.3}
                y={y - radius * 0.3}
                radius={radius * 0.2}
                fill="rgba(255, 255, 255, 0.3)"
              />
            )}

            {/* 最新落子标记 */}
            {lastMove && lastMove.x === piece.x && lastMove.y === piece.y && (
              <Circle
                x={x}
                y={y}
                radius={radius * 0.3}
                stroke="#FF0000"
                strokeWidth={2}
                fill="rgba(255, 0, 0, 0.3)"
              />
            )}
          </Group>
        );
      })}
    </Layer>
  );
}
