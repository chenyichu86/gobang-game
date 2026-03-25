/**
 * 坐标转换工具
 * Week 2 - TC-026 至 TC-029
 */

export interface Position {
  x: number;
  y: number;
}

export interface ScreenPosition {
  x: number;
  y: number;
}

/**
 * 屏幕坐标转网格坐标
 * @param screenX 屏幕X坐标
 * @param screenY 屏幕Y坐标
 * @param canvasSize Canvas大小
 * @param padding 边距
 * @returns 网格坐标或null（如果超出范围）
 */
export function screenToGrid(
  screenX: number,
  screenY: number,
  canvasSize: number,
  padding: number
): Position | null {
  const effectiveSize = canvasSize - 2 * padding;
  const cellSize = effectiveSize / 14;

  const gridX = Math.round((screenX - padding) / cellSize);
  const gridY = Math.round((screenY - padding) / cellSize);

  // 验证坐标范围（严格检查）
  if (gridX >= 0 && gridX < 15 && gridY >= 0 && gridY < 15) {
    return { x: gridX, y: gridY };
  }

  return null;
}

/**
 * 网格坐标转屏幕坐标
 * @param gridX 网格X坐标
 * @param gridY 网格Y坐标
 * @param canvasSize Canvas大小
 * @param padding 边距
 * @returns 屏幕坐标
 */
export function gridToScreen(
  gridX: number,
  gridY: number,
  canvasSize: number,
  padding: number
): ScreenPosition {
  const effectiveSize = canvasSize - 2 * padding;
  const cellSize = effectiveSize / 14;

  return {
    x: padding + gridX * cellSize,
    y: padding + gridY * cellSize,
  };
}
