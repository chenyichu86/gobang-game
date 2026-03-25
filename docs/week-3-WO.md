# Week 3 - WO文档（工作对象定义）

## 文档信息
- **文档版本**: v1.0
- **创建日期**: 2026-03-24
- **负责人**: 产品经理
- **阶段**: Phase 1 - MVP基础版本
- **周次**: Week 3
- **关联文档**: week-3-PL.md

---

## 一、工作对象概述

### 1.1 定义
本周的工作对象是**AI对战系统和游戏流程控制**，包括简单AI、中等AI、AI Web Worker集成、游戏流程控制和游戏UI界面。

### 1.2 目标
实现人机对战功能，玩家可以与AI对手进行完整的五子棋对局，支持简单和中等两种难度，并提供完整的游戏流程控制（先后手选择、回合切换、计时器等）。

### 1.3 范围
- **包含**: 简单AI、中等AI、AI Web Worker、游戏流程控制、游戏UI（计时器、状态显示）
- **不包含**: 困难/大师AI（Week 8-9）、高级动画（Week 7）、悔棋功能（Week 5）

---

## 二、工作对象分解

### 2.1 简单AI（SimpleAI）

**对象**: 基于随机和基础防守策略的AI对手

**难度**: 简单

**数据结构设计**:
```typescript
// src/game/ai/simple-ai.ts
import type { Board, Position } from '../types';

export class SimpleAI {
  /**
   * 计算AI下一步的落子位置
   * 策略：80%随机落子 + 20%基础防守（堵截对方活三）
   */
  calculateMove(board: Board): Position;

  /**
   * 获取所有空位
   */
  private getEmptyPositions(board: Board): Position[];

  /**
   * 随机选择一个空位
   */
  private getRandomMove(board: Board): Position;

  /**
   * 基础防守：检测对方是否有活三，如果有则堵截
   * 返回防守位置，如果没有威胁则返回null
   */
  private findDefensiveMove(board: Board): Position | null;
}
```

**核心逻辑**:
1. 首先检查是否需要防守（检测对方活三）
2. 80%概率随机落子，20%概率执行防守
3. 优先选择已有棋子周围2格范围内的位置（提高相关性）
4. 如果棋盘为空，优先占据中心位置（7,7）

**性能要求**:
- 响应时间: <100ms
- 内存占用: <1MB

---

### 2.2 中等AI（MediumAI）

**对象**: 基于评分系统的AI对手

**难度**: 中等

**数据结构设计**:
```typescript
// src/game/ai/medium-ai.ts
import type { Board, Position } from '../types';

// 棋型定义
interface Pattern {
  type: string;
  score: number;
  count: number;
}

export class MediumAI {
  /**
   * 计算AI下一步的落子位置
   * 策略：基于评分系统，选择最优位置
   */
  calculateMove(board: Board): Position;

  /**
   * 评估所有空位的得分
   * 返回按得分排序的位置列表
   */
  private evaluateAllPositions(board: Board): Array<{
    position: Position;
    score: number;
  }>;

  /**
   * 评估指定位置的得分
   * 考虑进攻和防守两个方面
   */
  private evaluatePosition(board: Board, position: Position): number;

  /**
   * 检测某个位置在某方向的棋型
   * 返回：棋型类型和数量
   */
  private detectPattern(
    board: Board,
    position: Position,
    direction: [number, number],
    player: 'black' | 'white'
  ): Pattern;

  /**
   * 计算进攻得分（对AI有利）
   */
  private calculateAttackScore(
    board: Board,
    position: Position
  ): number;

  /**
   * 计算防守得分（阻止玩家）
   */
  private calculateDefenseScore(
    board: Board,
    position: Position
  ): number;
}
```

**评分系统**:
```typescript
// 棋型评分表
const PATTERN_SCORES = {
  // 连五
  FIVE: 100000,

  // 活四（两端都空，再下一子即成五）
  LIVE_FOUR: 10000,

  // 冲四（一端被堵，再下一子即成五）
  DEAD_FOUR: 5000,

  // 活三（两端都空，再下一子成活四）
  LIVE_THREE: 1000,

  // 眠三（一端被堵）
  SLEEP_THREE: 100,

  // 活二
  LIVE_TWO: 10,

  // 眠二
  SLEEP_TWO: 1,
};
```

**核心算法**:
1. 遍历所有空位，计算每个位置的得分
2. 得分 = 进攻得分 + 防守得分
3. 进攻得分：假设AI在此落子，形成各种棋型的评分
4. 防守得分：假设玩家在此落子，形成各种棋型的评分（权重略低）
5. 选择得分最高的位置落子
6. 优先考虑已有棋子周围2格范围内的位置（优化性能）

**性能要求**:
- 响应时间: <500ms
- 评估位置数: <100个（只考虑有邻居的空位）
- 内存占用: <2MB

---

### 2.3 AI Web Worker（AIWorker）

**对象**: 在独立线程中运行AI计算，避免阻塞UI

**文件路径**: `src/game/ai/ai.worker.ts`

**数据结构设计**:
```typescript
// src/game/ai/ai.worker.ts
import { expose } from 'comlink';
import { SimpleAI } from './simple-ai';
import { MediumAI } from './medium-ai';
import type { Board, Position, Difficulty } from '../types';

export class AIWorker {
  /**
   * 在Worker线程中计算AI移动
   * @param board 当前棋盘状态
   * @param difficulty AI难度
   * @param aiPlayer AI执棋颜色
   * @returns AI选择的落子位置
   */
  async calculateMove(
    board: Board,
    difficulty: Difficulty,
    aiPlayer: 'black' | 'white'
  ): Promise<Position>;

  private simpleAI: SimpleAI;
  private mediumAI: MediumAI;
}

// 暴露Worker接口
expose(new AIWorker());
```

**Worker使用方式**:
```typescript
// src/game/ai/ai-client.ts
import { wrap } from 'comlink';
import AIWorker from './ai.worker?worker';

export class AIClient {
  private worker: any;

  constructor() {
    const worker = new AIWorker();
    this.worker = wrap(worker);
  }

  /**
   * 调用AI计算移动
   */
  async calculateMove(
    board: Board,
    difficulty: Difficulty,
    aiPlayer: 'black' | 'white'
  ): Promise<Position> {
    return this.worker.calculateMove(board, difficulty, aiPlayer);
  }

  /**
   * 终止Worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker[Symbol.dispose]();
    }
  }
}
```

**技术要求**:
- 使用`comlink`库简化Worker通信
- Worker独立文件，不依赖React组件
- 支持中断计算（用户重新开始游戏时）
- 错误处理和超时机制（3秒超时）

---

### 2.4 游戏流程控制（GameFlowController）

**对象**: 管理人机对战的完整流程

**文件路径**: `src/game/core/game-flow.ts`

**数据结构设计**:
```typescript
// src/game/core/game-flow.ts
import type { Player, GameMode, Position, Difficulty } from '../types';
import { AIClient } from '../ai/ai-client';

export interface GameFlowOptions {
  mode: GameMode;        // 'pvp' | 'pve'
  difficulty?: Difficulty; // 'easy' | 'medium' | 'hard' | 'master'
  firstPlayer: Player;   // 'black' | 'white'
  aiPlayer?: Player;     // AI执棋颜色（PVE模式）
}

export class GameFlowController {
  private options: GameFlowOptions;
  private aiClient: AIClient | null;
  private isAiThinking: boolean;

  constructor(options: GameFlowOptions) {
    this.options = options;
    this.aiClient = options.mode === 'pve' ? new AIClient() : null;
    this.isAiThinking = false;
  }

  /**
   * 玩家尝试落子
   * @returns 是否允许落子（PVE模式下AI回合不允许玩家落子）
   */
  canPlayerMakeMove(): boolean;

  /**
   * 玩家落子后，触发AI回合
   * @param position 玩家落子位置
   * @returns AI的落子位置
   */
  async handlePlayerMove(position: Position): Promise<Position>;

  /**
   * AI自动落子
   */
  private async makeAiMove(): Promise<Position>;

  /**
   * 检查是否是AI回合
   */
  private isAiTurn(): boolean;

  /**
   * 取消AI计算（用于重置游戏）
   */
  cancelAiMove(): void;

  /**
   * 清理资源
   */
  dispose(): void;
}
```

**核心流程**:
```
1. 游戏开始
   ↓
2. 检查游戏模式
   - PVP: 玩家vs玩家（Week 2已实现）
   - PVE: 玩家vs AI（Week 3新增）
   ↓
3. PVE模式流程：
   a) 玩家选择先后手
   b) 玩家落子 → 触发AI回合
   c) AI计算 → 自动落子 → 回到玩家回合
   d) 重复b-c直到游戏结束
   ↓
4. 游戏结束 → 清理AI Worker
```

**状态管理**:
```typescript
// 扩展game-store.ts
interface GameStore {
  // 新增状态
  gameMode: GameMode;
  difficulty: Difficulty;
  aiPlayer: Player;
  isAiThinking: boolean;

  // 新增actions
  setDifficulty: (difficulty: Difficulty) => void;
  startPVEGame: (difficulty: Difficulty, playerFirst: boolean) => void;
  cancelAiMove: () => void;
}
```

---

### 2.5 游戏UI界面（GameUI）

**对象**: 游戏页面中的状态显示和控制组件

**组件结构**:
```
src/pages/GamePage.tsx
├── GameHeader (游戏头部)
│   ├── 玩家信息（黑棋/白棋）
│   ├── 游戏模式显示（PVP/PVE）
│   └── 难度显示（PVE模式）
│
├── BoardStage (棋盘 - Week 2已实现)
│
└── GameControls (游戏控制)
    ├── 计时器组件
    ├── 状态提示
    ├── 重新开始按钮
    └── 返回按钮
```

#### 2.5.1 计时器组件（Timer）

**文件路径**: `src/components/Game/Timer.tsx`

**数据结构**:
```typescript
interface TimerProps {
  isRunning: boolean;
  onTimeUpdate?: (seconds: number) => void;
  onTimeOut?: () => void;
  timeLimit?: number; // 可选：限时模式（秒）
}

interface TimerState {
  blackTime: number;  // 黑棋用时（秒）
  whiteTime: number;  // 白棋用时（秒）
  isRunning: boolean;
}
```

**功能要求**:
- 显示双方玩家用时
- 只显示当前回合的计时器高亮
- 支持暂停/继续
- 支持重置
- 可选：支持限时模式（倒计时）

**UI布局**:
```
┌─────────────────────────────┐
│  黑棋: 00:05  白棋: 00:03    │
│  ↑当前回合                    │
└─────────────────────────────┘
```

#### 2.5.2 状态提示组件（StatusIndicator）

**文件路径**: `src/components/Game/StatusIndicator.tsx`

**数据结构**:
```typescript
interface StatusIndicatorProps {
  gameStatus: GameStatus;
  currentPlayer: Player;
  winner: Player | null;
  isAiThinking: boolean;
}

// 显示文本
const getStatusMessage = (props): string => {
  switch (gameStatus) {
    case 'idle': return '准备开始';
    case 'playing':
      if (isAiThinking) return 'AI思考中...';
      return currentPlayer === 'black' ? '黑棋落子' : '白棋落子';
    case 'won': return `${winner === 'black' ? '黑棋' : '白棋'}获胜！`;
    case 'draw': return '平局！';
  }
};
```

**UI样式**:
- 游戏进行中：绿色文字
- AI思考中：闪烁的黄色提示
- 游戏结束：大号胜利文字

#### 2.5.3 游戏控制面板（GameControls）

**文件路径**: `src/components/Game/GameControls.tsx`

**数据结构**:
```typescript
interface GameControlsProps {
  onRestart: () => void;
  onBackToMenu: () => void;
  gameStatus: GameStatus;
}

// Week 5扩展功能（不在本周范围）
interface ExtendedControlsProps extends GameControlsProps {
  onUndo?: () => void;        // 悔棋（Week 5）
  onHint?: () => void;        // 提示（Week 6）
}
```

**功能要求**:
- 重新开始按钮
- 返回菜单按钮
- 禁用状态（AI思考时禁用重新开始）

---

## 三、接口定义

### 3.1 类型定义

```typescript
// src/types/game.ts - 扩展类型
export type Difficulty = 'easy' | 'medium' | 'hard' | 'master';

export type GameMode = 'pvp' | 'pve';

export interface AIConfig {
  difficulty: Difficulty;
  aiPlayer: Player;
  responseTimeLimit: number; // 毫秒
}

export interface GameResult {
  winner: Player | null;
  gameStatus: GameStatus;
  moveCount: number;
  duration: number; // 秒
}
```

### 3.2 Store接口

```typescript
// src/store/game-store.ts - 扩展接口
export interface GameStore {
  // AI相关状态
  gameMode: GameMode;
  difficulty: Difficulty;
  aiPlayer: Player;
  isAiThinking: boolean;

  // 游戏流程控制
  startPVEGame: (difficulty: Difficulty, playerFirst: boolean) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  cancelAiMove: () => void;

  // 计时器相关
  blackTime: number;
  whiteTime: number;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
}
```

---

## 四、依赖关系

### 4.1 外部依赖
```json
{
  "comlink": "^6.0.0"  // Web Worker通信库
}
```

### 4.2 内部依赖
- **依赖Week 2**:
  - `Board` - 棋盘数据结构
  - `GameEngine` - 游戏引擎
  - `GameRules` - 胜负判断规则
- **依赖Week 1**:
  - `game-store` - 状态管理
  - `GamePage` - 游戏页面

### 4.3 文件结构
```
src/
├── game/
│   ├── ai/                    # Week 3新增
│   │   ├── simple-ai.ts       # 简单AI
│   │   ├── medium-ai.ts       # 中等AI
│   │   ├── ai.worker.ts       # AI Worker
│   │   ├── ai-client.ts       # AI客户端
│   │   └── __tests__/         # AI测试
│   │       ├── simple-ai.test.ts
│   │       ├── medium-ai.test.ts
│   │       └── ai-client.test.ts
│   │
│   └── core/
│       └── game-flow.ts       # Week 3新增：游戏流程控制
│
├── components/
│   └── Game/                  # Week 3新增
│       ├── Timer.tsx          # 计时器组件
│       ├── StatusIndicator.tsx # 状态提示
│       ├── GameControls.tsx   # 游戏控制面板
│       └── __tests__/
│           ├── Timer.test.tsx
│           ├── StatusIndicator.test.tsx
│           └── GameControls.test.tsx
│
├── store/
│   └── game-store.ts          # 扩展：支持PVE模式
│
└── pages/
    └── GamePage.tsx           # 扩展：集成AI和UI组件
```

---

## 五、验收标准

### 5.1 功能验收
- [ ] 简单AI正常工作，能够完成对局
- [ ] 中等AI正常工作，能够完成对局
- [ ] AI响应时间<3秒（简单<100ms，中等<500ms）
- [ ] PVE模式流程完整，玩家可选择先后手
- [ ] AI思考时UI有明确提示
- [ ] 计时器正常工作，显示双方用时
- [ ] 游戏状态提示清晰准确
- [ ] 重新开始功能正常，能够清理AI Worker

### 5.2 性能验收
- [ ] AI计算不阻塞UI主线程
- [ ] AI思考时页面仍可交互（除落子外）
- [ ] 计时器更新流畅（1秒刷新）
- [ ] 内存占用合理（<50MB）

### 5.3 质量验收
- [ ] 所有新测试通过（目标60+个测试）
- [ ] Week 1和Week 2的测试全部通过（78个）
- [ ] 测试覆盖率>80%
- [ ] 代码通过ESLint检查
- [ ] TypeScript无类型错误

### 5.4 兼容性验收
- [ ] Chrome浏览器正常运行
- [ ] Firefox浏览器正常运行
- [ ] Safari浏览器正常运行
- [ ] 移动端浏览器正常运行

---

## 六、风险与注意事项

### 6.1 技术风险
1. **Web Worker兼容性**
   - 风险：某些浏览器不支持Worker
   - 缓解：提供降级方案（同步计算）

2. **AI性能**
   - 风险：中等AI响应时间过长
   - 缓解：限制评估位置数量，优化算法

3. **状态同步**
   - 风险：AI计算时玩家继续操作导致状态不一致
   - 缓解：AI思考时禁用落子操作

### 6.2 开发风险
1. **测试复杂度**
   - 风险：AI逻辑难以测试
   - 缓解：使用固定种子测试，模拟棋盘状态

2. **异步流程**
   - 风险：AI计算是异步的，可能导致竞态条件
   - 缓解：使用状态机严格控制流程

### 6.3 注意事项
- AI代码必须完全独立，不依赖React
- Worker文件必须单独打包，使用`?worker`后缀
- 所有AI操作必须有超时保护
- 计时器必须使用`requestAnimationFrame`或`setInterval`，不能用`setTimeout`累积
- 组件卸载时必须清理定时器和Worker

---

## 七、参考资料

### 7.1 技术文档
- [Comlink官方文档](https://github.com/GoogleChromeLabs/comlink)
- [Web Worker MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [五子棋AI算法](https://www.gomokuworld.com/gomoku/strategy)

### 7.2 内部文档
- `ARCHITECTURE.md` - AI算法设计章节
- `week-2-WO.md` - Week 2工作对象（棋盘和规则）
- `week-2-PL.md` - Week 2产品逻辑

---

**文档结束**

**下一步**: 产品经理编写Week 3 PL文档（产品逻辑规范）
