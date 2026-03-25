# Week 2 - PL文档（产品逻辑规范）

## 文档信息
- **文档版本**: v1.0
- **创建日期**: 2026-03-24
- **负责人**: 产品经理
- **阶段**: Phase 1 - MVP基础版本
- **周次**: Week 2
- **关联文档**: week-2-WO.md

---

## 一、产品逻辑概述

### 1.1 本周目标
实现五子棋游戏的核心交互逻辑，使用户能够在棋盘上落子并进行完整的对局。

### 1.2 核心原则
- **规则准确**: 严格按照五子棋标准规则实现
- **交互流畅**: 落子响应迅速，反馈清晰
- **状态清晰**: 游戏状态、当前回合、胜负判定一目了然
- **可扩展性**: 为AI、悔棋、提示等功能预留接口

### 1.3 不包含的逻辑
- AI对战逻辑（Week 3）
- 悔棋功能（Week 5）
- 提示功能（Week 6）
- 动画特效（Week 7）
- 禁手规则（可选，暂不实现）

---

## 二、数据结构逻辑

### 2.1 棋盘数据模型

#### 2.1.1 坐标系统
```typescript
// 坐标定义
interface Position {
  x: number; // 0-14, 从左到右
  y: number; // 0-14, 从上到下
}

// 坐标示例
// (0, 0)     (1, 0)     ... (14, 0)
// (0, 1)     (1, 1)     ... (14, 1)
//   ...       ...       ...   ...
// (0, 14)    (1, 14)    ... (14, 14)
```

**逻辑说明**:
- 原点(0,0)在左上角
- x轴向右递增
- y轴向下递增
- 有效范围: 0 ≤ x ≤ 14, 0 ≤ y ≤ 14

#### 2.1.2 棋盘状态
```typescript
// 棋盘单元状态
type BoardCell = 'black' | 'white' | null;

// 棋盘状态（15×15二维数组）
type Board = BoardCell[][];

// 初始状态：所有单元格为null
const initialBoard: Board = Array(15).fill(null).map(() =>
  Array(15).fill(null)
);
```

**逻辑说明**:
- `null`: 空位，可以落子
- `'black'`: 黑棋
- `'white'`: 白棋
- 数组索引: `board[y][x]`（注意y在前，x在后）

#### 2.1.3 棋子表示
```typescript
// 棋子类型
type Player = 'black' | 'white';

// 棋子对象
interface Piece {
  x: number;
  y: number;
  player: Player;
  timestamp?: number; // 落子时间戳（可选）
}
```

**逻辑说明**:
- 黑棋用黑色圆圈表示
- 白棋用白色圆圈表示
- 棋子一旦落下不可移动或移除

---

### 2.2 游戏状态逻辑

#### 2.2.1 游戏状态枚举
```typescript
type GameStatus = 'idle' | 'playing' | 'won' | 'draw';

// 状态转换规则
// idle -> playing: startGame()
// playing -> won: 落子后检查到5连
// playing -> draw: 棋盘填满且无5连
// playing/won/draw -> playing: resetGame() + startGame()
```

**状态转换图**:
```
    startGame()
     ┌────────┐
     │  idle  │
     └───┬────┘
         │
         │ startGame()
         ▼
     ┌────────┐    checkWin() === true
     │playing │ ────────────────────┐
     └───┬────┘                     │
         │                          ▼
         │ checkDraw() === true   ┌─────┐
         └───────────────────────│ won │
                                └─────┘

         checkDraw() === true
              ┌────────┐
              │  draw  │
              └────────┘
```

#### 2.2.2 游戏上下文
```typescript
interface GameState {
  gameStatus: GameStatus;
  currentPlayer: Player;
  winner: Player | null;
  winLine: Position[] | null; // 获胜连线的所有位置
  moveHistory: Position[];    // 按顺序的落子历史
  board: Board;              // 棋盘快照
}

// 初始状态
const initialState: GameState = {
  gameStatus: 'idle',
  currentPlayer: 'black',
  winner: null,
  winLine: null,
  moveHistory: [],
  board: createEmptyBoard(),
};
```

**逻辑说明**:
- `currentPlayer`: 当前轮到哪方落子
- `winner`: 获胜方，游戏结束后才有值
- `winLine`: 存储获胜连线的5个位置，用于高亮显示
- `moveHistory`: 按落子顺序记录所有位置

---

### 2.3 落子逻辑

#### 2.3.1 落子规则
```typescript
function canPlacePiece(board: Board, position: Position): boolean {
  // 规则1: 位置必须在棋盘范围内
  if (!isInBounds(position)) {
    return false;
  }

  // 规则2: 位置必须为空
  if (!board[position.y][position.x]) {
    return false;
  }

  // 规则3: 游戏必须在进行中
  if (gameStatus !== 'playing') {
    return false;
  }

  return true;
}

function isInBounds(pos: Position): boolean {
  return pos.x >= 0 && pos.x < 15 && pos.y >= 0 && pos.y < 15;
}
```

**落子流程**:
```
用户点击棋盘
    ↓
坐标转换 (屏幕坐标 → 网格坐标)
    ↓
合法性检查
    ↓
更新棋盘数据
    ↓
检查胜负
    ↓
切换玩家
    ↓
更新UI
```

#### 2.3.2 落子顺序
```typescript
// 标准落子顺序
moveHistory[0] -> 黑棋
moveHistory[1] -> 白棋
moveHistory[2] -> 黑棋
moveHistory[3] -> 白棋
...

// 判断棋子颜色的逻辑
function getPiecePlayer(moveIndex: number): Player {
  return moveIndex % 2 === 0 ? 'black' : 'white';
}
```

**逻辑说明**:
- 黑棋总是先手（moveHistory索引为偶数）
- 白棋总是后手（moveHistory索引为奇数）
- 当前玩家 = moveHistory.length % 2 === 0 ? 'black' : 'white'

---

### 2.4 胜负判断逻辑

#### 2.4.1 胜负条件
```typescript
// 获胜条件
const WIN_CONDITION = 5; // 连成5子

// 判断函数
function checkWin(board: Board, lastMove: Position): Position[] | null {
  const player = board[lastMove.y][lastMove.x];
  if (!player) return null;

  // 检查四个方向
  const directions = [
    { name: 'horizontal', dx: 1, dy: 0 },    // 横向
    { name: 'vertical', dx: 0, dy: 1 },     // 纵向
    { name: 'diagonal', dx: 1, dy: 1 },     // 主对角线 \
    { name: 'anti-diagonal', dx: 1, dy: -1 } // 副对角线 /
  ];

  for (const dir of directions) {
    const line = getLineInDirection(board, lastMove, dir, player);
    if (line.length >= WIN_CONDITION) {
      return line;
    }
  }

  return null;
}
```

**判断逻辑**:
1. 只检查最后一次落子的四个方向
2. 如果任意方向达到或超过5连，则获胜
3. 返回获胜连线的所有位置（用于高亮显示）

#### 2.4.2 连线计算算法
```typescript
function getLineInDirection(
  board: Board,
  startPos: Position,
  direction: { dx: number; dy: number },
  player: Player
): Position[] {
  const line: Position[] = [startPos];

  // 正向查找
  for (let i = 1; i < 5; i++) {
    const nextPos = {
      x: startPos.x + direction.dx * i,
      y: startPos.y + direction.dy * i
    };

    if (!isInBounds(nextPos)) break;
    if (board[nextPos.y][nextPos.x] !== player) break;

    line.push(nextPos);
  }

  // 反向查找
  for (let i = 1; i < 5; i++) {
    const prevPos = {
      x: startPos.x - direction.dx * i,
      y: startPos.y - direction.dy * i
    };

    if (!isInBounds(prevPos)) break;
    if (board[prevPos.y][prevPos.x] !== player) break;

    line.unshift(prevPos);
  }

  return line;
}
```

**算法说明**:
- 从最后落子位置开始，向两个方向延伸
- 每个方向最多查找4步（加上中心点最多5个）
- 遇到边界或不同颜色的棋子停止
- 返回所有同色棋子的位置

#### 2.4.3 和棋判断
```typescript
function checkDraw(board: Board): boolean {
  // 棋盘满且无获胜方
  const totalCells = 15 * 15; // 225
  const occupiedCells = countOccupiedCells(board);

  return occupiedCells === totalCells;
}

function countOccupiedCells(board: Board): number {
  let count = 0;
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < 15; x++) {
      if (board[y][x] !== null) {
        count++;
      }
    }
  }
  return count;
}
```

**和棋条件**:
- 棋盘所有225个位置都已落子
- 且没有任何一方达成5连

---

### 2.5 坐标转换逻辑

#### 2.5.1 屏幕坐标到网格坐标
```typescript
// 点击事件处理
function handleBoardClick(event: MouseEvent): Position | null {
  // 获取Canvas元素
  const canvas = event.target as HTMLCanvasElement;
  const rect = canvas.getBoundingClientRect();

  // 计算点击位置相对于Canvas的坐标
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;

  // 计算格子大小
  const canvasSize = rect.width;
  const padding = 30;
  const effectiveSize = canvasSize - 2 * padding;
  const cellSize = effectiveSize / 14; // 14个格子，15条线

  // 转换为网格坐标
  const gridX = Math.round((clickX - padding) / cellSize);
  const gridY = Math.round((clickY - padding) / cellSize);

  // 验证坐标
  if (gridX >= 0 && gridX < 15 && gridY >= 0 && gridY < 15) {
    return { x: gridX, y: gridY };
  }

  return null;
}
```

**转换逻辑**:
```
屏幕坐标 (px)
    ↓
减去边距 (padding)
    ↓
除以格子大小 (cellSize)
    ↓
四舍五入到最近的整数
    ↓
网格坐标 (0-14)
```

#### 2.5.2 网格坐标到屏幕坐标
```typescript
// 渲染棋子时使用
function gridToScreen(
  gridPos: Position,
  canvasSize: number,
  padding: number
): { x: number; y: number } {
  const effectiveSize = canvasSize - 2 * padding;
  const cellSize = effectiveSize / 14;

  return {
    x: padding + gridPos.x * cellSize,
    y: padding + gridPos.y * cellSize
  };
}
```

---

### 2.6 渲染逻辑

#### 2.6.1 棋盘渲染
```typescript
// 棋盘渲染参数
interface BoardRenderConfig {
  canvasSize: number;    // Canvas大小（响应式）
  padding: number;        // 边距
  lineCount: 15;         // 线条数量
  cellSize: number;      // 格子大小（动态计算）
  backgroundColor: string; // '#F5DEB3'
  lineColor: string;     // '#8B4513'
  lineWidth: number;     // 1.5
}

// 星位点位置
const STAR_POINTS: Position[] = [
  { x: 3, y: 3 },
  { x: 11, y: 3 },
  { x: 7, y: 7 },  // 天元
  { x: 3, y: 11 },
  { x: 11, y: 11 },
];
```

**渲染顺序**:
1. 绘制木色背景
2. 绘制15条横线
3. 绘制15条竖线
4. 绘制5个星位点

#### 2.6.2 棋子渲染
```typescript
// 棋子渲染参数
interface PieceRenderConfig {
  radius: number;           // cellSize * 0.4
  blackColor: string;       // '#2C2C2C'
  whiteColor: string;       // '#FFFFFF'
  shadowColor: string;      // 'rgba(0, 0, 0, 0.3)'
  shadowBlur: number;       // 10
  shadowOffset: { x: number; y: number }; // {x: 2, y: 2}
}

// 黑棋高光
const highlight = {
  offsetX: -radius * 0.3,
  offsetY: -radius * 0.3,
  radius: radius * 0.2,
  color: 'rgba(255, 255, 255, 0.3)'
};
```

**渲染顺序**:
1. 绘制阴影（所有棋子）
2. 绘制棋子本体（黑白圆圈）
3. 绘制黑棋高光
4. 绘制最新落子标记（红圈）

---

## 三、交互规则逻辑

### 3.1 游戏流程

#### 3.1.1 完整游戏流程
```
进入游戏页面
    ↓
自动初始化游戏（gameStatus: idle → playing）
    ↓
黑棋先行（currentPlayer: 'black'）
    ↓
用户点击棋盘
    ↓
验证落子合法性
    ↓
[非法] → 提示用户，返回等待状态
    ↓
[合法] → 执行落子
    ↓
检查胜负
    ↓
[有胜者] → gameStatus: 'won' → 显示获胜信息 → 禁止落子
    ↓
[和棋] → gameStatus: 'draw' → 显示和棋信息 → 禁止落子
    ↓
[继续] → 切换玩家 → 等待下一方落子
```

#### 3.1.2 状态机逻辑
```typescript
// 游戏状态机
const gameStateMachine = {
  idle: {
    startGame: 'playing',
    makeMove: 'idle' // 忽略
  },
  playing: {
    makeMove: {
      hasWinner: 'won',
      isDraw: 'draw',
      continue: 'playing'
    }
  },
  won: {
    makeMove: 'won', // 忽略
    resetGame: 'playing'
  },
  draw: {
    makeMove: 'draw', // 忽略
    resetGame: 'playing'
  }
};
```

### 3.2 用户交互逻辑

#### 3.2.1 点击响应
```typescript
// 点击事件处理流程
function onBoardClick(event: MouseEvent): void {
  // 1. 检查游戏状态
  if (gameStatus !== 'playing') {
    return; // 游戏结束后不响应
  }

  // 2. 转换坐标
  const gridPos = screenToGrid(event);
  if (!gridPos) return;

  // 3. 检查位置合法性
  if (!canPlacePiece(gridPos)) {
    showFeedback('该位置已有棋子');
    return;
  }

  // 4. 执行落子
  const result = makeMove(gridPos);

  // 5. 更新UI
  updateUI(result);
}
```

#### 3.2.2 交互反馈
```typescript
// 交互反馈规则
interface InteractionFeedback {
  // 成功落子
  validMove: {
    visual: '棋子立即出现',
    audio: '落子音效（Week 4）',
    marker: '红色标记最新落子'
  },

  // 无效操作
  invalidMove: {
    occupied: '该位置已有棋子',
    outOfBounds: '点击位置无效',
    gameEnded: '游戏已结束'
  },

  // 胜负反馈
  gameWon: {
    visual: '获胜连线闪烁',
    text: '黑/白棋获胜！',
    audio: '胜利音效（Week 4）'
  },

  // 和棋反馈
  gameDraw: {
    text: '和棋！',
    audio: '和棋音效（Week 4）'
  }
};
```

---

## 四、边界条件处理

### 4.1 棋盘边界

#### 4.1.1 边界落子
```typescript
// 边界位置测试
const boundaryPositions = [
  { x: 0, y: 0 },      // 左上角
  { x: 14, y: 0 },     // 右上角
  { x: 0, y: 14 },     // 左下角
  { x: 14, y: 14 },    // 右下角
  { x: 7, y: 0 },      // 上边中点
  { x: 7, y: 14 },     // 下边中点
  { x: 0, y: 7 },      // 左边中点
  { x: 14, y: 7 }      // 右边中点
];

// 边界胜负判断
// 例如: (0,0)到(4,0)的横向5连
```

**边界逻辑**:
- 边界位置必须能正常落子
- 胜负判断必须正确处理边界情况
- 不能访问超出0-14范围的索引

#### 4.1.2 越界保护
```typescript
// 坐标越界检查
function isInBounds(pos: Position): boolean {
  return pos.x >= 0 && pos.x < 15 && pos.y >= 0 && pos.y < 15;
}

// 数组访问保护
function safeGetCell(board: Board, x: number, y: number): BoardCell {
  if (!isInBounds({ x, y })) {
    return null; // 越界返回null
  }
  return board[y][x];
}
```

### 4.2 游戏结束边界

#### 4.2.1 最快胜利
```typescript
// 最少步数胜利（黑棋）
const fastestWin = [
  { x: 7, y: 7 },  // 黑1
  { x: 6, y: 7 },  // 白1
  { x: 8, y: 7 },  // 黑2
  { x: 6, y: 8 },  // 白2
  { x: 9, y: 7 },  // 黑3
  { x: 6, y: 9 },  // 白3
  { x: 10, y: 7 }, // 黑4
  { x: 6, y: 10 }, // 白4
  { x: 11, y: 7 }  // 黑5 - 获胜
];
// 总步数: 9步（黑棋5步，白棋4步）
```

#### 4.2.2 最长对局
```typescript
// 最长对局（和棋）
const maxMoves = 225; // 15×15棋盘填满
// 假设每步平均3秒，游戏时长约11分钟
```

### 4.3 特殊棋型

#### 4.3.1 多条线同时达成
```typescript
// 例如: 横向和纵向同时达成5连
// 这种情况下，应该返回先检查到的方向
// 但不影响胜负判定结果
```

#### 4.3.2 超过5子
```typescript
// 例如: 连成6子或更多
const sixInRow = [
  { x: 5, y: 7 },
  { x: 6, y: 7 },
  { x: 7, y: 7 },
  { x: 8, y: 7 },
  { x: 9, y: 7 },
  { x: 10, y: 7 } // 第6子
];
// 判定: 仍然获胜（line.length >= 5）
```

---

## 五、错误处理逻辑

### 5.1 输入验证

#### 5.1.1 位置验证
```typescript
function validateMove(position: Position): ValidationResult {
  // 检查1: 坐标类型
  if (typeof position.x !== 'number' || typeof position.y !== 'number') {
    return { valid: false, error: 'INVALID_TYPE' };
  }

  // 检查2: 坐标范围
  if (!isInBounds(position)) {
    return { valid: false, error: 'OUT_OF_BOUNDS' };
  }

  // 检查3: 位置是否为空
  if (!board.isEmpty(position.x, position.y)) {
    return { valid: false, error: 'POSITION_OCCUPIED' };
  }

  // 检查4: 游戏状态
  if (gameStatus !== 'playing') {
    return { valid: false, error: 'GAME_NOT_PLAYING' };
  }

  return { valid: true };
}
```

#### 5.1.2 错误类型
```typescript
type MoveError =
  | 'INVALID_TYPE'       // 坐标不是数字
  | 'OUT_OF_BOUNDS'      // 坐标超出范围
  | 'POSITION_OCCUPIED'  // 位置已有棋子
  | 'GAME_NOT_PLAYING';  // 游戏未进行

// 错误提示映射
const errorMessages: Record<MoveError, string> = {
  INVALID_TYPE: '无效的坐标类型',
  OUT_OF_BOUNDS: '位置超出棋盘范围',
  POSITION_OCCUPIED: '该位置已有棋子',
  GAME_NOT_PLAYING: '游戏已结束'
};
```

### 5.2 异常情况处理

#### 5.2.1 状态不一致
```typescript
// 检测状态不一致
function detectStateInconsistency(): boolean {
  const moveCount = moveHistory.length;
  const boardPieceCount = countPiecesOnBoard();

  if (moveCount !== boardPieceCount) {
    console.error('State inconsistency detected');
    return true;
  }

  return false;
}

// 恢复一致性
function restoreConsistency(): void {
  // 重新从moveHistory重建棋盘
  board.clear();
  for (const pos of moveHistory) {
    const player = getPiecePlayer(moveHistory.indexOf(pos));
    board.setCell(pos.x, pos.y, player);
  }
}
```

#### 5.2.2 渲染错误
```typescript
// Canvas渲染错误处理
try {
  renderBoard();
} catch (error) {
  console.error('Render error:', error);
  // 降级方案：显示简单的文本信息
  showFallbackUI();
}
```

---

## 六、性能逻辑

### 6.1 渲染性能

#### 6.1.1 重绘优化
```typescript
// 只重绘变化的部分
function shouldRenderPiece(piece: Piece, lastMove: Position): boolean {
  // 最新落子必须渲染
  if (piece.x === lastMove.x && piece.y === lastMove.y) {
    return true;
  }

  // 其他棋子如果没有变化则跳过
  return false;
}
```

#### 6.1.2 批量渲染
```typescript
// 批量渲染棋子
function renderPieces(pieces: Piece[]): void {
  // 使用requestAnimationFrame批量更新
  requestAnimationFrame(() => {
    pieces.forEach(piece => {
      drawPiece(piece);
    });
  });
}
```

### 6.2 计算性能

#### 6.2.1 胜负判断优化
```typescript
// 优化点1: 只检查最后落子的位置
// 不需要遍历整个棋盘

// 优化点2: 使用早期返回
function checkWin(board: Board, lastMove: Position): Position[] | null {
  const player = board[lastMove.y][lastMove.x];
  if (!player) return null; // 早期返回

  for (const dir of directions) {
    const line = getLineInDirection(board, lastMove, dir, player);
    if (line.length >= 5) {
      return line; // 找到就立即返回
    }
  }

  return null;
}
```

---

## 七、测试逻辑

### 7.1 单元测试

#### 7.1.1 棋盘测试
```typescript
describe('Board', () => {
  test('should create empty board', () => {
    const board = new Board();
    expect(board.getSize()).toBe(15);
    expect(board.isEmpty(7, 7)).toBe(true);
  });

  test('should place piece correctly', () => {
    const board = new Board();
    board.setCell(7, 7, 'black');
    expect(board.getCell(7, 7)).toBe('black');
    expect(board.isEmpty(7, 7)).toBe(false);
  });

  test('should validate position', () => {
    const board = new Board();
    expect(board.isValid(0, 0)).toBe(true);
    expect(board.isValid(14, 14)).toBe(true);
    expect(board.isValid(-1, 0)).toBe(false);
    expect(board.isValid(15, 0)).toBe(false);
  });
});
```

#### 7.1.2 胜负判断测试
```typescript
describe('GameRules', () => {
  test('should detect horizontal win', () => {
    const board = new Board();
    // 设置横向5连
    for (let i = 5; i < 10; i++) {
      board.setCell(i, 7, 'black');
    }

    const winLine = GameRules.checkWin(board, { x: 7, y: 7 });
    expect(winLine).toHaveLength(5);
  });

  test('should not detect win with 4 in row', () => {
    const board = new Board();
    for (let i = 5; i < 9; i++) {
      board.setCell(i, 7, 'black');
    }

    const winLine = GameRules.checkWin(board, { x: 7, y: 7 });
    expect(winLine).toBeNull();
  });
});
```

### 7.2 集成测试

#### 7.2.1 完整对局测试
```typescript
describe('GameEngine', () => {
  test('should complete full game', () => {
    const engine = new GameEngine();
    engine.startGame();

    // 模拟完整对局
    const moves = [
      { x: 7, y: 7 },
      { x: 7, y: 8 },
      // ... 更多落子
    ];

    for (const move of moves) {
      const result = engine.makeMove(move);
      expect(result.success).toBe(true);

      if (result.gameStatus === 'won') {
        break;
      }
    }

    expect(engine.getGameStatus()).toBe('won');
  });
});
```

---

## 八、数据持久化逻辑

### 8.1 棋局数据格式

```typescript
// 棋局记录格式（为Week 6回放功能做准备）
interface GameRecord {
  id: string;
  date: Date;
  mode: 'pve' | 'pvp';
  result: 'black' | 'white' | 'draw';
  moves: Position[]; // 只记录落子位置，不记录棋盘状态
  duration: number;   // 游戏时长（秒）
}

// 序列化
function serializeGame(gameState: GameState): string {
  const record: GameRecord = {
    id: generateId(),
    date: new Date(),
    mode: 'pvp', // Week 2只有双人
    result: gameState.winner || 'draw',
    moves: gameState.moveHistory,
    duration: calculateDuration()
  };

  return JSON.stringify(record);
}

// 反序列化
function deserializeGame(data: string): GameRecord {
  return JSON.parse(data);
}
```

---

## 九、可访问性逻辑

### 9.1 键盘操作（可选）

```typescript
// 键盘导航支持（为后续增强功能做准备）
function handleKeyboard(event: KeyboardEvent): void {
  const keys = {
    ArrowUp: { dx: 0, dy: -1 },
    ArrowDown: { dx: 0, dy: 1 },
    ArrowLeft: { dx: -1, dy: 0 },
    ArrowRight: { dx: 1, dy: 0 },
    Enter: 'confirm',
    Space: 'confirm'
  };

  const action = keys[event.key];
  if (!action) return;

  if (action === 'confirm') {
    // 在当前位置落子
    makeMove(currentCursorPosition);
  } else {
    // 移动光标
    moveCursor(action.dx, action.dy);
  }
}
```

---

## 十、验收标准汇总

### 10.1 功能验收
- [ ] 棋盘正确渲染（15×15网格，5个星位点）
- [ ] 黑白棋子正确渲染，有立体感
- [ ] 点击空白处可以落子
- [ ] 黑棋先手，白棋后手
- [ ] 落子后自动切换玩家
- [ ] 四个方向都能正确判断5连
- [ ] 获胜后显示获胜方
- [ ] 游戏结束后无法继续落子
- [ ] 和棋判断正确
- [ ] 最新落子有红色标记

### 10.2 性能验收
- [ ] 棋盘初始渲染 < 100ms
- [ ] 落子响应 < 50ms
- [ ] 胜负判断 < 10ms
- [ ] 无明显卡顿

### 10.3 质量验收
- [ ] TypeScript类型检查通过
- [ ] ESLint检查通过
- [ ] 单元测试覆盖率 > 70%
- [ ] 边界情况处理正确
- [ ] 错误处理完善

---

## 十一、常见问题与解决方案

### 11.1 坐标计算错误
**问题**: 点击位置和实际落子位置不匹配
**解决**: 检查padding和cellSize计算，确保坐标转换公式正确

### 11.2 胜负判断不准确
**问题**: 5连未识别或误判
**解决**: 检查方向向量和边界检查，确保算法覆盖所有情况

### 11.3 游戏状态不同步
**问题**: UI显示与内部状态不一致
**解决**: 确保状态更新和UI更新是原子操作

---

## 十二、下一步

完成本周后，Week 3将：
1. 实现简单AI和中等AI
2. 实现游戏流程控制（回合切换）
3. 完善游戏UI界面
4. 实现PVE模式

---

**文档结束**

**审核人**: 待指定
**审核日期**: 待定
**签字**: ____________
