/**
 * BoardLayer组件 - 棋盘渲染层
 * Week 2 - WO 2.3
 */

import { Layer, Line, Circle, Rect } from 'react-konva';

interface BoardLayerProps {
  size: number;
  padding: number;
}

export function BoardLayer({ size, padding }: BoardLayerProps) {
  const lines = [];
  const effectiveSize = size - 2 * padding;

  // 绘制横线（15条）
  for (let i = 0; i < 15; i++) {
    const y = padding + (i * effectiveSize) / 14;
    lines.push(
      <Line
        key={`h-${i}`}
        points={[padding, y, padding + effectiveSize, y]}
        stroke="#8B4513"
        strokeWidth={1.5}
      />
    );
  }

  // 绘制竖线（15条）
  for (let i = 0; i < 15; i++) {
    const x = padding + (i * effectiveSize) / 14;
    lines.push(
      <Line
        key={`v-${i}`}
        points={[x, padding, x, padding + effectiveSize]}
        stroke="#8B4513"
        strokeWidth={1.5}
      />
    );
  }

  // 星位点（5个：天元+四角星位）
  const starPoints = [
    { x: 3, y: 3 },
    { x: 11, y: 3 },
    { x: 7, y: 7 },
    { x: 3, y: 11 },
    { x: 11, y: 11 },
  ];

  const stars = starPoints.map((point, index) => (
    <Circle
      key={`star-${index}`}
      x={padding + (point.x * effectiveSize) / 14}
      y={padding + (point.y * effectiveSize) / 14}
      radius={4}
      fill="#000000"
    />
  ));

  return (
    <Layer>
      {/* 棋盘背景 */}
      <Rect x={0} y={0} width={size} height={size} fill="#F5DEB3" />
      {lines}
      {stars}
    </Layer>
  );
}
