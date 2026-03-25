# Week 2 - WO文档（工作对象定义）

## 文档信息
- **文档版本**: v1.0
- **创建日期**: 2026-03-24
- **负责人**: 产品经理
- **阶段**: Phase 1 - MVP基础版本
- **周次**: Week 2

---

## 一、工作对象概述

### 1.1 定义
本周的工作对象是**棋盘渲染系统和基础游戏逻辑**，包括棋盘数据结构、Canvas渲染引擎、落子交互和游戏规则引擎。

### 1.2 目标
实现一个可交互的五子棋棋盘，用户可以在棋盘上落子，系统能够判断胜负。这是游戏核心功能的首次实现。

### 1.3 范围
- **包含**: 棋盘数据结构、Konva.js集成、棋盘渲染、棋子渲染、落子交互、胜负判断
- **不包含**: AI实现（Week 3）、高级UI（Week 4）、动画特效（Week 7）

---

## 二、工作对象分解

### 2.1 棋盘数据结构

**对象**: 15×15棋盘的完整数据模型

**数据结构设计**:
```typescript
// src/game/core/board.ts
export type BoardCell = 'black' | 'white' | null;
export type Board = BoardCell[][];

// 棋盘配置
export const BOARD_SIZE = 15;
export const CELL_SIZE = 40; // 像素
export const PADDING = 30;   // 边距

// 棋盘类
export class Board {
  private cells: Board;
  private size: number;

  constructor(size: number = BOARD_SIZE) {
    this.size = size;
    this.cells = this.createEmptyBoard();
  }

  // 创建空棋盘
  private createEmptyBoard(): Board {
    return Array(this.size)
      .fill(null)
      .map(() => Array(this.size).fill(null));
  }

  // 获取指定位置的棋子
  getCell(x: number, y: number): BoardCell {
    this.validatePosition(x, y);
    return this.cells[y][x];
  }

  // 设置指定位置的棋子
  setCell(x: number, y: number, value: BoardCell): void {
    this.validatePosition(x, y);
    this.cells[y][x] = value;
  }

  // 检查位置是否为空
  isEmpty(x: number, y: number): boolean {
    return this.getCell(x, y) === null;
  }

  // 检查位置是否有效
  isValid(x: number, y: number): boolean {
    return x >= 0 && x < this.size && y >= 0 && y < this.size;
  }

  // 验证位置合法性
  private validatePosition(x: number, y: number): void {
    if (!this.isValid(x, y)) {
      throw new Error(`Invalid position: (${x}, ${y})`);
    }
  }

  // 获取所有已落子位置
  getOccupiedPositions(): Position[] {
    const positions: Position[] = [];
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.cells[y][x] !== null) {
          positions.push({ x, y });
        }
      }
    }
    return positions;
  }

  // 清空棋盘
  clear(): void {
    this.cells = this.createEmptyBoard();
  }

  // 获取棋盘大小
  getSize(): number {
    return this.size;
  }

  // 克隆棋盘（用于AI计算）
  clone(): Board {
    const newBoard = new Board(this.size);
    newBoard.cells = this.cells.map(row => [...row]);
    return newBoard;
  }
}
```

**验收标准**:
- [ ] Board类已创建并实现所有方法
- [ ] 可以创建15×15的空棋盘
- [ ] 可以正确设置和获取棋子位置
- [ ] 位置验证功能正常（边界检查）
- [ ] isEmpty()方法正确判断空位
- [ ] getOccupiedPositions()返回所有已落子位置
- [ ] clear()方法可以重置棋盘
- [ ] clone()方法创建独立副本

---

### 2.2 Konva.js集成

**对象**: Canvas渲染引擎的基础配置

**安装与配置**:
```bash
npm install konva
npm install -D @types/konva
```

**Stage组件结构**:
```typescript
// src/components/Board/BoardStage.tsx
import { Stage, Layer } from 'react-konva';
import { useState, useEffect } from 'react';

interface BoardStageProps {
  size: number;
  onCellClick: (x: number, y: number) => void;
}

export function BoardStage({ size, onCellClick }: BoardStageProps) {
  const [stageSize, setStageSize] = useState(600);

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
  }, []);

  return (
    <Stage
      width={stageSize}
      height={stageSize}
      onClick={handleStageClick}
    >
      {/* 后续Layer将在这里添加 */}
    </Stage>
  );

  function handleStageClick(e: KonvaEventMap<MouseEvent>['click']) {
    // 将点击坐标转换为网格坐标
    const cellSize = stageSize / 15;
    const x = Math.floor(e.evt.offsetX / cellSize);
    const y = Math.floor(e.evt.offsetY / cellSize);

    if (x >= 0 && x < 15 && y >= 0 && y < 15) {
      onCellClick(x, y);
    }
  }
}
```

**验收标准**:
- [ ] Konva.js已安装并导入
- [ ] Stage组件可以正常渲染
- [ ] Stage大小响应式调整（最大600×600）
- [ ] 点击事件可以正确转换为网格坐标
- [ ] 窗口resize时Stage自动调整大小

---

### 2.3 棋盘背景渲染

**对象**: 棋盘网格线和星位点

**网格线渲染**:
```typescript
// src/components/Board/BoardLayer.tsx
import { Layer, Line, Circle } from 'react-konva';

interface BoardLayerProps {
  size: number;
  cellSize: number;
  padding: number;
}

export function BoardLayer({ size, cellSize, padding }: BoardLayerProps) {
  const lines = [];

  // 绘制横线（15条）
  for (let i = 0; i < 15; i++) {
    const y = padding + i * cellSize;
    lines.push(
      <Line
        key={`h-${i}`}
        points={[padding, y, padding + 14 * cellSize, y]}
        stroke="#8B4513"
        strokeWidth={1.5}
      />
    );
  }

  // 绘制竖线（15条）
  for (let i = 0; i < 15; i++) {
    const x = padding + i * cellSize;
    lines.push(
      <Line
        key={`v-${i}`}
        points={[x, padding, x, padding + 14 * cellSize]}
        stroke="#8B4513"
        strokeWidth={1.5}
      />
    );
  }

  // 星位点（5个：天元+四角星位）
  const starPoints = [
    { x: 3, y: 3 },
    { x: 11, y: 3 },
    { x: 7, y: 7 },  // 天元
    { x: 3, y: 11 },
    { x: 11, y: 11 },
  ];

  const stars = starPoints.map((point, index) => (
    <Circle
      key={`star-${index}`}
      x={padding + point.x * cellSize}
      y={padding + point.y * cellSize}
      radius={4}
      fill="#000000"
    />
  ));

  return (
    <Layer>
      {/* 棋盘背景 */}
      <Rect
        x={0}
        y={0}
        width={size}
        height={size}
        fill="#F5DEB3"
      />
      {lines}
      {stars}
    </Layer>
  );
}
```

**验收标准**:
- [ ] 棋盘背景颜色为木色(#F5DEB3)
- [ ] 15条横线和15条竖线正确渲染
- [ ] 网格线颜色为深棕色(#8B4513)
- [ ] 5个星位点正确显示在标准位置
- [ ] 棋盘边距(padding)正确应用
- [ ] 棋盘在不同屏幕尺寸下保持正方形

---

### 2.4 棋子渲染

**对象**: 黑白棋子的Canvas渲染

**棋子组件**:
```typescript
// src/components/Board/PiecesLayer.tsx
import { Layer, Circle } from 'react-konva';

interface Piece {
  x: number;
  y: number;
  player: 'black' | 'white';
}

interface PiecesLayerProps {
  pieces: Piece[];
  cellSize: number;
  padding: number;
  lastMove?: { x: number; y: number }; // 最新落子标记
}

export function PiecesLayer({ pieces, cellSize, padding, lastMove }: PiecesLayerProps) {
  return (
    <Layer>
      {pieces.map((piece, index) => {
        const x = padding + piece.x * cellSize;
        const y = padding + piece.y * cellSize;
        const radius = cellSize * 0.4;

        return (
          <g key={`${piece.x}-${piece.y}-${index}`}>
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
              shadowOffset={{ x: 2, y: 2 }}
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
          </g>
        );
      })}
    </Layer>
  );
}
```

**验收标准**:
- [ ] 黑棋颜色为深灰色(#2C2C2C)带高光
- [ ] 白棋颜色为纯白(#FFFFFF)带阴影
- [ ] 棋子位置正确对应网格交叉点
- [ ] 棋子大小约为格子的80%
- [ ] 棋子有立体感（阴影和高光）
- [ ] 最新落子有红色标记
- [ ] 所有棋子按正确顺序渲染

---

### 2.5 落子交互

**对象**: 用户点击棋盘落子的交互逻辑

**交互流程**:
```typescript
// src/game/core/game-engine.ts
import { Board } from './board';
import { Position, Player } from '../types/game';

export class GameEngine {
  private board: Board;
  private currentPlayer: Player;
  private moveHistory: Position[];
  private gameStatus: 'idle' | 'playing' | 'won' | 'draw';

  constructor() {
    this.board = new Board();
    this.currentPlayer = 'black';
    this.moveHistory = [];
    this.gameStatus = 'idle';
  }

  // 开始游戏
  startGame(): void {
    this.board.clear();
    this.currentPlayer = 'black';
    this.moveHistory = [];
    this.gameStatus = 'playing';
  }

  // 尝试落子
  makeMove(position: Position): MoveResult {
    // 1. 检查游戏状态
    if (this.gameStatus !== 'playing') {
      return { success: false, error: 'Game is not in playing state' };
    }

    // 2. 检查位置是否为空
    if (!this.board.isEmpty(position.x, position.y)) {
      return { success: false, error: 'Position is already occupied' };
    }

    // 3. 执行落子
    this.board.setCell(position.x, position.y, this.currentPlayer);
    this.moveHistory.push(position);

    // 4. 检查胜负
    const winLine = this.checkWin(position);
    if (winLine) {
      this.gameStatus = 'won';
      return {
        success: true,
        position,
        player: this.currentPlayer,
        winLine,
        gameStatus: 'won'
      };
    }

    // 5. 检查和棋
    if (this.isDraw()) {
      this.gameStatus = 'draw';
      return {
        success: true,
        position,
        player: this.currentPlayer,
        gameStatus: 'draw'
      };
    }

    // 6. 切换玩家
    this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';

    return {
      success: true,
      position,
      player: this.currentPlayer === 'black' ? 'white' : 'black', // 返回下一个玩家
      gameStatus: 'playing'
    };
  }

  // 获取当前玩家
  getCurrentPlayer(): Player {
    return this.currentPlayer;
  }

  // 获取游戏状态
  getGameStatus(): typeof this.gameStatus {
    return this.gameStatus;
  }

  // 获取棋盘
  getBoard(): Board {
    return this.board;
  }

  // 获取历史记录
  getMoveHistory(): Position[] {
    return [...this.moveHistory];
  }

  // 检查和棋
  private isDraw(): boolean {
    return this.moveHistory.length >= this.board.getSize() * this.board.getSize();
  }
}
```

**验收标准**:
- [ ] 点击棋盘空白处可以落子
- [ ] 点击已有棋子位置不会落子
- [ ] 黑棋先手，白棋后手
- [ ] 每次落子后自动切换玩家
- [ ] 游戏结束后无法继续落子
- [ ] 落子后立即更新棋盘显示
- [ ] 历史记录正确记录所有落子位置

---

### 2.6 游戏规则引擎（胜负判断）

**对象**: 五子棋胜负判断核心算法

**胜负判断逻辑**:
```typescript
// src/game/core/rules.ts
import { Board } from './board';
import { Position, Player } from '../types/game';

export class GameRules {
  // 检查是否获胜
  static checkWin(board: Board, lastMove: Position): Position[] | null {
    const player = board.getCell(lastMove.x, lastMove.y);
    if (!player) return null;

    const directions = [
      { dx: 1, dy: 0 },   // 横向
      { dx: 0, dy: 1 },   // 纵向
      { dx: 1, dy: 1 },   // 主对角线
      { dx: 1, dy: -1 },  // 副对角线
    ];

    for (const { dx, dy } of directions) {
      const line = this.getLine(board, lastMove, dx, dy, player);
      if (line.length >= 5) {
        return line;
      }
    }

    return null;
  }

  // 获取某个方向的连线
  private static getLine(
    board: Board,
    startPos: Position,
    dx: number,
    dy: number,
    player: Player
  ): Position[] {
    const line: Position[] = [startPos];

    // 正向查找
    for (let i = 1; i < 5; i++) {
      const nextPos = {
        x: startPos.x + dx * i,
        y: startPos.y + dy * i
      };

      if (!board.isValid(nextPos.x, nextPos.y)) break;
      if (board.getCell(nextPos.x, nextPos.y) !== player) break;

      line.push(nextPos);
    }

    // 反向查找
    for (let i = 1; i < 5; i++) {
      const prevPos = {
        x: startPos.x - dx * i,
        y: startPos.y - dy * i
      };

      if (!board.isValid(prevPos.x, prevPos.y)) break;
      if (board.getCell(prevPos.x, prevPos.y) !== player) break;

      line.unshift(prevPos);
    }

    return line;
  }

  // 检查是否为有效落子
  static isValidMove(board: Board, position: Position): boolean {
    return board.isValid(position.x, position.y) && board.isEmpty(position.x, position.y);
  }
}
```

**集成到GameEngine**:
```typescript
// 在GameEngine类中添加
private checkWin(lastMove: Position): Position[] | null {
  return GameRules.checkWin(this.board, lastMove);
}
```

**验收标准**:
- [ ] 横向5连正确识别
- [ ] 纵向5连正确识别
- [ ] 主对角线5连正确识别
- [ ] 副对角线5连正确识别
- [ ] 超过5子也判定为获胜
- [ ] 返回获胜连线的所有位置
- [ ] 边界情况处理正确
- [ ] 未达到5子返回null

---

### 2.7 状态管理扩展

**对象**: 扩展Zustand Store支持游戏状态

**Store更新**:
```typescript
// src/store/game-store.ts
import { create } from 'zustand';
import { Board } from '../game/core/board';
import { GameEngine } from '../game/core/game-engine';

interface GameState {
  // 游戏状态
  gameStatus: 'idle' | 'playing' | 'won' | 'draw';
  currentPlayer: 'black' | 'white';
  winner: 'black' | 'white' | null;
  winLine: Position[] | null;
  moveHistory: Position[];

  // Actions
  startGame: () => void;
  makeMove: (position: Position) => MoveResult;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  gameStatus: 'idle',
  currentPlayer: 'black',
  winner: null,
  winLine: null,
  moveHistory: [],

  // Actions
  startGame: () => {
    const engine = new GameEngine();
    engine.startGame();
    set({
      gameStatus: 'playing',
      currentPlayer: 'black',
      winner: null,
      winLine: null,
      moveHistory: [],
    });
  },

  makeMove: (position) => {
    const engine = get().engine;
    if (!engine) {
      return { success: false, error: 'Game not initialized' };
    }

    const result = engine.makeMove(position);

    if (result.success) {
      set({
        gameStatus: result.gameStatus,
        currentPlayer: result.player || engine.getCurrentPlayer(),
        winner: result.gameStatus === 'won' ? result.player : null,
        winLine: result.winLine || null,
        moveHistory: engine.getMoveHistory(),
      });
    }

    return result;
  },

  resetGame: () => {
    set({
      gameStatus: 'idle',
      currentPlayer: 'black',
      winner: null,
      winLine: null,
      moveHistory: [],
    });
  },
}));
```

**验收标准**:
- [ ] Store正确管理游戏状态
- [ ] startGame()初始化游戏
- [ ] makeMove()更新状态并返回结果
- [ ] 状态变化触发组件重渲染
- [ ] winLine正确存储获胜连线
- [ ] moveHistory记录所有落子

---

### 2.8 游戏页面组件

**对象**: 完整的游戏页面UI

**GamePage组件**:
```typescript
// src/pages/GamePage/index.tsx
import { useEffect } from 'react';
import { useGameStore } from '../../store/game-store';
import { BoardStage } from '../../components/Board/BoardStage';
import { BoardLayer } from '../../components/Board/BoardLayer';
import { PiecesLayer } from '../../components/Board/PiecesLayer';

export default function GamePage() {
  const { gameStatus, currentPlayer, winner, winLine, moveHistory, startGame, makeMove } = useGameStore();

  // 组件挂载时自动开始游戏
  useEffect(() => {
    if (gameStatus === 'idle') {
      startGame();
    }
  }, []);

  // 处理落子
  const handleCellClick = (x: number, y: number) => {
    if (gameStatus !== 'playing') return;
    makeMove({ x, y });
  };

  // 获取所有棋子
  const pieces = moveHistory.map((pos, index) => ({
    x: pos.x,
    y: pos.y,
    player: index % 2 === 0 ? 'black' : 'white',
  }));

  // 获取最新落子
  const lastMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex flex-col items-center justify-center p-4">
      {/* 游戏标题 */}
      <h1 className="text-4xl font-bold text-amber-900 mb-6">五子棋</h1>

      {/* 游戏状态显示 */}
      <div className="mb-6 text-center">
        {gameStatus === 'playing' && (
          <p className="text-xl text-amber-800">
            当前回合: {currentPlayer === 'black' ? '黑棋 ⚫' : '白棋 ⚪'}
          </p>
        )}
        {gameStatus === 'won' && (
          <p className="text-2xl font-bold text-green-600">
            {winner === 'black' ? '黑棋 ⚫' : '白棋 ⚪'} 获胜！
          </p>
        )}
        {gameStatus === 'draw' && (
          <p className="text-2xl font-bold text-gray-600">和棋！</p>
        )}
      </div>

      {/* 棋盘 */}
      <div className="bg-amber-200 p-4 rounded-lg shadow-2xl">
        <BoardStage size={600} onCellClick={handleCellClick}>
          <BoardLayer size={600} cellSize={40} padding={30} />
          <PiecesLayer
            pieces={pieces}
            cellSize={40}
            padding={30}
            lastMove={lastMove}
          />
        </BoardStage>
      </div>

      {/* 控制按钮 */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={startGame}
          className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          重新开始
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          返回主页
        </button>
      </div>

      {/* 落子历史 */}
      <div className="mt-6 text-center text-amber-800">
        <p>总落子数: {moveHistory.length}</p>
      </div>
    </div>
  );
}
```

**验收标准**:
- [ ] 页面正确显示游戏状态
- [ ] 棋盘正确渲染
- [ ] 可以点击棋盘落子
- [ ] 当前回合正确显示
- [ ] 获胜后显示获胜方
- [ ] 重新开始按钮有效
- [ ] 返回主页按钮有效
- [ ] 落子历史计数正确

---

## 三、门禁标准（Gate Criteria）

### 3.1 必须满足的标准
- [✅] 棋盘数据结构完整实现
- [✅] Konva.js正确集成
- [✅] 棋盘背景正确渲染（网格线、星位点）
- [✅] 黑白棋子正确渲染
- [✅] 点击落子交互正常
- [✅] 胜负判断逻辑正确（四个方向）
- [✅] 游戏状态管理正常
- [✅] TypeScript类型检查无错误

### 3.2 功能标准
- [✅] 黑棋先手，白棋后手
- [✅] 只能在空白位置落子
- [✅] 游戏结束后无法继续落子
- [✅] 任意方向连成5子即获胜
- [✅] 和棋检测正确（棋盘满）
- [✅] 最新落子有标记

### 3.3 质量标准
- [✅] 代码遵循TypeScript严格模式
- [✅] 所有函数有类型注解
- [✅] 代码格式符合Prettier规范
- [✅] 无ESLint警告或错误
- [✅] 单元测试覆盖率 > 70%

---

## 四、验收测试场景

### 场景1: 基础落子测试
```typescript
// 步骤
1. 启动游戏
2. 点击棋盘中心位置 (7, 7)
3. 观察棋盘变化

// 预期结果
- 黑棋出现在中心位置
- 当前回合变为白棋
- 落子历史增加1
```

### 场景2: 轮流落子测试
```typescript
// 步骤
1. 黑棋落子 (7, 7)
2. 白棋落子 (7, 8)
3. 黑棋落子 (7, 9)

// 预期结果
- 三个棋子正确显示
- 当前回合为白棋
- 棋子颜色交替正确
```

### 场景3: 横向5连胜利测试
```typescript
// 步骤
1. 黑棋依次落子: (5,7), (6,7), (7,7), (8,7), (9,7)

// 预期结果
- 黑棋获胜
- 显示"黑棋获胜"
- 5个棋子连成一线
- 无法继续落子
```

### 场景4: 重复落子测试
```typescript
// 步骤
1. 黑棋落子 (7, 7)
2. 再次点击 (7, 7)

// 预期结果
- 第二次点击无效
- 位置仍只有一个黑棋
- 当前回合仍为白棋
```

### 场景5: 边界落子测试
```typescript
// 步骤
1. 点击棋盘四个角: (0,0), (14,0), (0,14), (14,14)

// 预期结果
- 所有边界位置都可以正确落子
- 棋子位置正确
```

### 场景6: 纵向5连胜利测试
```typescript
// 步骤
1. 黑棋依次落子: (7,5), (7,6), (7,7), (7,8), (7,9)

// 预期结果
- 黑棋获胜
- 纵向5连正确识别
```

### 场景7: 对角线5连胜利测试
```typescript
// 步骤
1. 黑棋依次落子: (5,5), (6,6), (7,7), (8,8), (9,9)

// 预期结果
- 黑棋获胜
- 主对角线5连正确识别
```

### 场景8: 和棋测试
```typescript
// 步骤
1. 填满整个棋盘（225个位置）
2. 确保没有5连

// 预期结果
- 显示"和棋"
- 游戏结束
```

---

## 五、依赖关系

### 5.1 外部依赖
```json
{
  "dependencies": {
    "konva": "^9.2.0",
    "react-konva": "^18.2.10"
  }
}
```

### 5.2 内部依赖
- 依赖Week 1的项目框架
- 依赖Week 1的Zustand Store
- 依赖Week 1的路由配置

### 5.3 被依赖关系
- Week 3将基于本周实现AI功能
- Week 4将基于本周完善UI
- Week 6将基于本周实现棋局回放

---

## 六、风险与假设

### 6.1 风险
1. **Konva.js学习曲线**
   - 风险: 团队不熟悉Konva.js API
   - 缓解: 提前阅读文档，参考示例代码

2. **胜负判断边界情况**
   - 风险: 边界和角落的胜负判断可能有bug
   - 缓解: 编写全面的单元测试

3. **Canvas性能**
   - 风险: 大量棋子可能导致性能问题
   - 缓解: 本周只实现基础渲染，性能优化在Week 10

### 6.2 假设
- 开发者熟悉React Hooks
- 开发者了解Canvas基础概念
- 浏览器支持Canvas API
- 用户使用鼠标或触摸屏操作

---

## 七、成功指标

### 7.1 定量指标
- 棋盘渲染时间 < 100ms
- 落子响应时间 < 50ms
- 胜负判断时间 < 10ms
- 单元测试通过率 = 100%
- 测试覆盖率 > 70%

### 7.2 定性指标
- 代码结构清晰，易于扩展
- 胜负判断逻辑准确无误
- 用户体验流畅，无明显卡顿
- 为Week 3的AI开发打好基础

---

## 八、下一步

完成本周工作后，可以进入**Week 3: 人机对战（中等难度AI）**。

Week 3将基于本周的游戏引擎，实现AI对手和完整的游戏流程。

---

**文档结束**

**审核人**: 待指定
**审核日期**: 待定
**签字**: ____________
