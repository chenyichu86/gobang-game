# Week 4 - WO文档（工作对象定义）

## 文档信息
- **文档版本**: v1.0
- **创建日期**: 2026-03-24
- **负责人**: 产品经理
- **阶段**: Phase 1 - MVP基础版本
- **周次**: Week 4
- **关联文档**: week-4-PL.md

---

## 一、工作对象概述

### 1.1 定义
本周的工作对象是**双人对战系统和UI优化**，包括本地双人对战模式、UI组件实现、提示功能、悔棋功能完善、游戏记录和回放基础，以及测试框架配置。

### 1.2 目标
实现完整的双人对战功能，玩家可以本地双人进行五子棋对局；实现核心UI组件（Timer、StatusIndicator、GameControls）；提供AI提示功能；完善悔棋功能；实现基础的游戏记录和回放；配置UI测试和E2E测试框架。

### 1.3 范围
- **包含**:
  - 本地双人对战模式
  - UI组件（Timer、StatusIndicator、GameControls）
  - 提示功能（AI推荐落子位置）
  - 悔棋功能完善（双人对战中限3次）
  - 游戏记录和回放基础
  - React Testing Library配置
  - Playwright配置
  - UI组件测试（15个）
  - E2E测试（9个）

- **不包含**:
  - 在线对战（Phase 2）
  - 困难/大师AI（Week 5-7）
  - 完整的棋谱回放（Week 6）
  - 动画特效（Week 7）

---

## 二、工作对象分解

### 2.1 双人对战模式（PvPMode）

**对象**: 本地双人对战游戏模式

**模式**: 本地双人（两名玩家轮流在同一设备上落子）

**数据结构设计**:
```typescript
// src/store/game-store.ts (扩展)
interface GameStore {
  // 新增字段
  gameMode: 'pve' | 'pvp';  // 游戏模式：人机或双人
  pvpSettings: {
    maxUndos: number;  // 每方悔棋次数限制
    blackUndos: number;  // 黑棋剩余悔棋次数
    whiteUndos: number;  // 白棋剩余悔棋次数
  };

  // 新增方法
  setGameMode(mode: 'pve' | 'pvp'): void;
  requestUndo(): { success: boolean; message: string };
  undoPvPMove(): void;
}
```

**核心逻辑**:
1. 玩家在模式选择界面选择"双人对战"模式
2. 黑棋和白棋玩家轮流落子
3. 每方最多悔棋3次（独立计数）
4. 游戏结束时记录对局数据
5. 支持重新开始和返回主菜单

**性能要求**:
- 模式切换响应时间: <100ms
- 落子响应时间: <50ms
- 内存占用: <2MB

---

### 2.2 UI组件：Timer（计时器组件）

**对象**: 游戏计时器，显示对局时间

**数据结构设计**:
```typescript
// src/components/Timer/index.tsx
interface TimerProps {
  isRunning: boolean;
  onTimeUpdate?: (seconds: number) => void;
  className?: string;
}

export const Timer: React.FC<TimerProps> = ({
  isRunning,
  onTimeUpdate,
  className
}) => {
  // 组件实现
};

// 组件状态
interface TimerState {
  seconds: number;
  formattedTime: string;  // "MM:SS"
}
```

**核心逻辑**:
1. 游戏开始时自动启动计时
2. 游戏暂停时停止计时
3. 游戏结束时停止计时
4. 显示格式为"分:秒"（如 05:30）
5. 每秒更新一次显示

**性能要求**:
- 计时精度: ±1秒
- 内存占用: <100KB
- 渲染性能: 60fps

**测试要求**:
- 组件渲染测试（2个）
- 计时功能测试（3个）
- 暂停/恢复测试（2个）
- 格式化显示测试（2个）
- 边界条件测试（1个）

---

### 2.3 UI组件：StatusIndicator（状态指示器组件）

**对象**: 游戏状态指示器，显示当前游戏状态

**数据结构设计**:
```typescript
// src/components/StatusIndicator/index.tsx
interface StatusIndicatorProps {
  gameStatus: 'playing' | 'paused' | 'won' | 'draw';
  currentPlayer: 'black' | 'white';
  winner?: 'black' | 'white' | null;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  gameStatus,
  currentPlayer,
  winner,
  className
}) => {
  // 组件实现
};
```

**核心逻辑**:
1. 显示当前游戏状态（进行中、暂停、结束）
2. 显示当前轮到哪方落子
3. 游戏结束时显示获胜方
4. 使用不同颜色和图标区分状态
5. 支持主题切换

**性能要求**:
- 状态更新响应时间: <50ms
- 内存占用: <100KB
- 渲染性能: 60fps

**测试要求**:
- 组件渲染测试（3个）
- 状态显示测试（4个）
- 主题切换测试（2个）
- 边界条件测试（1个）

---

### 2.4 UI组件：GameControls（游戏控制面板组件）

**对象**: 游戏控制面板，提供游戏操作按钮

**数据结构设计**:
```typescript
// src/components/GameControls/index.tsx
interface GameControlsProps {
  gameStatus: 'playing' | 'paused' | 'won' | 'draw';
  gameMode: 'pve' | 'pvp';
  canUndo: boolean;
  undoCount: number;
  onRestart: () => void;
  onUndo: () => void;
  onPause: () => void;
  onResume: () => void;
  onMainMenu: () => void;
  className?: string;
}

export const GameControls: React.FC<GameControlsProps> = ({
  gameStatus,
  gameMode,
  canUndo,
  undoCount,
  onRestart,
  onUndo,
  onPause,
  onResume,
  onMainMenu,
  className
}) => {
  // 组件实现
};
```

**核心逻辑**:
1. 提供"重新开始"按钮
2. 提供"悔棋"按钮（显示剩余次数）
3. 提供"暂停/继续"按钮
4. 提供"返回主菜单"按钮
5. 根据游戏状态动态禁用按钮
6. 悔棋次数显示（如"悔棋(3)"）

**性能要求**:
- 按钮点击响应时间: <50ms
- 内存占用: <200KB
- 渲染性能: 60fps

**测试要求**:
- 组件渲染测试（3个）
- 按钮交互测试（5个）
- 按钮状态测试（3个）
- 边界条件测试（2个）

---

### 2.5 提示功能（HintFeature）

**对象**: AI推荐落子位置功能

**数据结构设计**:
```typescript
// src/game/hint/hint-system.ts
interface HintResult {
  position: Position;
  score: number;
  reason: string;
}

export class HintSystem {
  /**
   * 获取推荐落子位置
   * 使用中等AI算法计算最佳位置
   */
  getHint(board: Board, player: Player): HintResult;

  /**
   * 清除提示
   */
  clearHint(): void;
}

// src/store/game-store.ts (扩展)
interface GameStore {
  hintPosition: Position | null;
  showHint: boolean;

  requestHint(): Promise<void>;
  clearHint(): void;
}
```

**核心逻辑**:
1. 玩家点击"提示"按钮
2. 系统使用中等AI算法计算推荐位置
3. 在棋盘上高亮显示推荐位置（使用不同颜色）
4. 显示推荐理由（如"进攻：活三"）
5. 提示标记在落子后自动消失
6. 限制每局使用次数（可选，如5次）

**性能要求**:
- 提示计算时间: <500ms
- 内存占用: <1MB
- 提示渲染响应: <50ms

**UI表现**:
- 在推荐位置显示半透明的提示标记
- 使用蓝色或绿色高亮
- 显示推荐理由文本

---

### 2.6 悔棋功能完善（UndoFeature）

**对象**: 完善的悔棋功能，支持双人对战

**数据结构设计**:
```typescript
// src/store/game-store.ts (扩展)
interface GameStore {
  // PvE模式
  maxUndos: number;  // 最大悔棋次数
  undoCount: number;  // 已使用次数

  // PvP模式
  pvpSettings: {
    maxUndos: number;
    blackUndos: number;
    whiteUndos: number;
  };

  // 通用方法
  canUndo(): boolean;
  undo(): { success: boolean; message: string };

  // PvE方法
  undoPVEMove(): void;

  // PvP方法
  undoPvPMove(): void;
}
```

**核心逻辑**:

**PvE模式**:
1. 玩家点击"悔棋"按钮
2. 撤销玩家和AI的最后一步（共2步）
3. 检查剩余次数，如果为0则禁用按钮
4. 更新棋盘显示
5. 最多悔棋3次

**PvP模式**:
1. 当前玩家点击"悔棋"按钮
2. 只有对手同意才能悔棋（简化版：直接悔棋）
3. 撤销最后一步（对手的棋）
4. 扣除当前玩家的悔棋次数
5. 每方独立计数，各3次
6. 如果双方都剩余0次，禁用按钮

**性能要求**:
- 悔棋响应时间: <100ms
- 内存占用: <500KB

**UI表现**:
- 显示剩余次数（如"悔棋(3)"）
- 悔棋时显示提示消息
- 次数用尽时禁用按钮

---

### 2.7 游戏记录和回放基础（GameRecordBasic）

**对象**: 基础的游戏记录和回放功能

**数据结构设计**:
```typescript
// src/types/game.ts (扩展)
interface GameRecord {
  id: string;
  date: Date;
  mode: 'pve' | 'pvp';
  difficulty?: 'easy' | 'medium';
  result: 'black' | 'white' | 'draw';
  duration: number;  // 对局时长（秒）
  moves: Move[];  // 所有落子记录
  finalBoard: Board;  // 最终棋盘状态
}

interface Move {
  position: Position;
  player: 'black' | 'white';
  timestamp: number;  // 落子时间戳
  moveNumber: number;  // 步数
}

// src/services/storage-service.ts (扩展)
interface StorageService {
  saveGameRecord(record: GameRecord): void;
  getGameRecords(limit?: number): GameRecord[];
  getGameRecord(id: string): GameRecord | null;
  deleteGameRecord(id: string): void;
}

// src/store/game-store.ts (扩展)
interface GameStore {
  currentGameRecord: Partial<GameRecord>;

  startRecording(): void;
  recordMove(move: Move): void;
  endRecording(result: 'black' | 'white' | 'draw'): void;
  saveRecord(): void;
}
```

**核心逻辑**:
1. 游戏开始时初始化记录
2. 每次落子时记录详细信息（位置、玩家、时间）
3. 游戏结束时保存完整记录到LocalStorage
4. 支持查看历史记录列表
5. 支持查看单局记录详情
6. 基础回放：按顺序自动重放对局

**存储方案**:
- 使用LocalStorage存储最近50局
- 数据结构：`gobang_game_records`
- 超过50局时自动删除最旧的记录

**性能要求**:
- 记录保存时间: <100ms
- 记录查询时间: <200ms
- 内存占用: <2MB

**UI要求**:
- 历史记录列表页面
- 单局记录详情页面
- 基础回放功能（自动播放）

**测试要求**:
- 记录保存测试（3个）
- 记录查询测试（2个）
- 记录删除测试（1个）
- 回放功能测试（3个）

---

### 2.8 测试框架配置（TestingFrameworkSetup）

**对象**: React Testing Library和Playwright配置

#### 2.8.1 React Testing Library配置

**目的**: UI组件单元测试

**安装**:
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**配置文件**:
```typescript
// vitest.config.ts (扩展)
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});

// src/test/setup.ts
import '@testing-library/jest-dom';
```

**测试工具函数**:
```typescript
// src/test/utils.tsx
import { render } from '@testing-library/react';

export function renderWithProviders(
  ui: React.ReactElement,
  options = {}
) {
  // 配置Zustand store
  // 配置Router
  return render(ui, options);
}
```

#### 2.8.2 Playwright配置

**目的**: E2E测试

**安装**:
```bash
npm install --save-dev @playwright/test
```

**配置文件**:
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
});
```

**E2E测试基类**:
```typescript
// tests/e2e/fixtures.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  gamePage: async ({ page }, use) => {
    await page.goto('/');
    await use(page);
  },
});
```

---

## 三、工作对象关系图

```
┌─────────────────────────────────────────────────────┐
│                   Week 4 工作对象                     │
└─────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────┴─────────────────┐
        ↓                                     ↓
┌─────────────────┐                 ┌─────────────────┐
│  PvP对战模式     │                 │  UI组件         │
│  - 双人对战      │                 │  - Timer        │
│  - 悔棋独立计数  │                 │  - Status       │
│  - 游戏记录      │                 │  - Controls     │
└─────────────────┘                 └─────────────────┘
        ↓                                     ↓
        └─────────────────┬─────────────────┘
                          ↓
                ┌─────────────────┐
                │  提示功能        │
                │  - AI推荐        │
                │  - 高亮显示      │
                └─────────────────┘
                          ↓
                ┌─────────────────┐
                │  测试框架        │
                │  - RTL配置       │
                │  - Playwright    │
                └─────────────────┘
```

---

## 四、接口定义

### 4.1 GameStore扩展接口

```typescript
// src/store/game-store.ts (完整扩展)
interface GameStore {
  // 游戏模式
  gameMode: 'pve' | 'pvp';

  // 悔棋（PvE）
  maxUndos: number;
  undoCount: number;

  // 悔棋（PvP）
  pvpSettings: {
    maxUndos: number;
    blackUndos: number;
    whiteUndos: number;
  };

  // 提示功能
  hintPosition: Position | null;
  showHint: boolean;

  // 游戏记录
  currentGameRecord: Partial<GameRecord>;

  // 方法
  setGameMode(mode: 'pve' | 'pvp'): void;
  canUndo(): boolean;
  undo(): { success: boolean; message: string };
  undoPVEMove(): void;
  undoPvPMove(): void;
  requestHint(): Promise<void>;
  clearHint(): void;
  startRecording(): void;
  recordMove(move: Move): void;
  endRecording(result: 'black' | 'white' | 'draw'): void;
  saveRecord(): void;
}
```

### 4.2 组件Props接口汇总

```typescript
// Timer组件
interface TimerProps {
  isRunning: boolean;
  onTimeUpdate?: (seconds: number) => void;
  className?: string;
}

// StatusIndicator组件
interface StatusIndicatorProps {
  gameStatus: 'playing' | 'paused' | 'won' | 'draw';
  currentPlayer: 'black' | 'white';
  winner?: 'black' | 'white' | null;
  className?: string;
}

// GameControls组件
interface GameControlsProps {
  gameStatus: 'playing' | 'paused' | 'won' | 'draw';
  gameMode: 'pve' | 'pvp';
  canUndo: boolean;
  undoCount: number;
  onRestart: () => void;
  onUndo: () => void;
  onPause: () => void;
  onResume: () => void;
  onMainMenu: () => void;
  className?: string;
}
```

---

## 五、数据流设计

### 5.1 双人对战流程

```
用户选择"双人对战"
       ↓
设置gameMode = 'pvp'
       ↓
初始化pvpSettings（blackUndos=3, whiteUndos=3）
       ↓
黑棋玩家落子
       ↓
记录落子（recordMove）
       ↓
切换到白棋
       ↓
白棋玩家落子
       ↓
记录落子（recordMove）
       ↓
检查胜负
       ↓
如果结束 → 保存记录 → 显示结果
如果继续 → 切换到黑棋
```

### 5.2 提示功能流程

```
用户点击"提示"按钮
       ↓
调用requestHint()
       ↓
使用MediumAI计算最佳位置
       ↓
设置hintPosition和showHint=true
       ↓
在棋盘上渲染提示标记
       ↓
用户落子
       ↓
自动清除提示（clearHint）
```

### 5.3 悔棋功能流程（PvP）

```
当前玩家点击"悔棋"按钮
       ↓
检查canUndo()（剩余次数>0）
       ↓
如果是，执行undoPvPMove()
       ↓
撤销最后一步（removePiece）
       ↓
扣除当前玩家的悔棋次数
       ↓
切换回上一个玩家
       ↓
更新棋盘显示
```

---

## 六、非功能性需求

### 6.1 性能要求

| 功能 | 响应时间 | 内存占用 |
|------|----------|----------|
| 模式切换 | <100ms | <1MB |
| 落子操作 | <50ms | <500KB |
| 悔棋操作 | <100ms | <500KB |
| 提示计算 | <500ms | <1MB |
| 计时器更新 | <10ms | <100KB |
| 记录保存 | <100ms | <2MB |

### 6.2 兼容性要求

- 浏览器: Chrome 90+, Firefox 88+, Safari 14+
- 屏幕尺寸: 320px - 1920px宽度
- 操作系统: Windows 10+, macOS 11+, iOS 14+, Android 10+

### 6.3 可访问性要求

- 所有按钮支持键盘操作
- 状态变化有视觉反馈
- 使用ARIA属性标记
- 支持高对比度模式

---

## 七、测试策略

### 7.1 UI组件测试（React Testing Library）

**目标**: 15个测试用例

| 组件 | 测试类型 | 用例数 |
|------|----------|--------|
| Timer | 渲染、功能、边界 | 10 |
| StatusIndicator | 渲染、状态、主题 | 10 |
| GameControls | 渲染、交互、状态 | 13 |

### 7.2 E2E测试（Playwright）

**目标**: 9个测试用例

| 场景 | 用例数 |
|------|--------|
| 双人对战完整流程 | 3 |
| 悔棋功能测试 | 2 |
| 提示功能测试 | 2 |
| 游戏记录查看 | 1 |
| 基础回放功能 | 1 |

### 7.3 集成测试

| 模块 | 测试类型 | 用例数 |
|------|----------|--------|
| PvP模式 | 端到端 | 10 |
| 悔棋功能 | 功能测试 | 8 |
| 提示功能 | 功能测试 | 5 |
| 游戏记录 | 数据测试 | 6 |

---

## 八、验收标准

### 8.1 功能验收

- [ ] 双人对战模式正常工作
- [ ] UI组件全部实现且功能正常
- [ ] 提示功能正常（AI推荐准确）
- [ ] 悔棋功能完善（PvP独立计数）
- [ ] 游戏记录正确保存和查询
- [ ] 基础回放功能可用

### 8.2 测试验收

- [ ] UI组件测试全部通过（15个）
- [ ] E2E测试全部通过（9个）
- [ ] Week 1-3的所有测试保持通过（124个）
- [ ] 总测试数量: 148个（124 + 15 + 9）
- [ ] 测试覆盖率: >90%

### 8.3 性能验收

- [ ] 所有功能响应时间符合要求
- [ ] 内存占用符合要求
- [ ] 无内存泄漏
- [ ] 渲染性能60fps

### 8.4 代码质量

- [ ] ESLint检查通过（0错误）
- [ ] TypeScript类型检查通过
- [ ] 代码注释完整
- [ ] 遵循代码规范

---

## 九、风险与依赖

### 9.1 技术风险

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| React Testing Library配置复杂 | 中 | 中 | 参考官方文档，预留配置时间 |
| Playwright学习曲线陡峭 | 中 | 中 | 先写简单测试，逐步增加复杂度 |
| UI组件测试经验不足 | 中 | 高 | 参考最佳实践，多次迭代 |
| E2E测试不稳定 | 高 | 中 | 增加重试机制，优化等待时间 |

### 9.2 依赖关系

- **前置依赖**: Week 1-3的所有功能必须冻结
- **技术依赖**: Konva.js、Zustand、Vitest
- **测试依赖**: React Testing Library、Playwright

---

## 十、交付物清单

### 10.1 代码交付物

- [ ] PvP对战模式代码
- [ ] UI组件代码（Timer、StatusIndicator、GameControls）
- [ ] 提示功能代码
- [ ] 悔棋功能代码（完善版）
- [ ] 游戏记录和回放代码
- [ ] 测试框架配置代码
- [ ] UI组件测试代码
- [ ] E2E测试代码

### 10.2 文档交付物

- [ ] WO文档（本文档）✅
- [ ] PL文档 ⏳
- [ ] 测试用例文档 ⏳
- [ ] 测试报告 ⏳
- [ ] 验收报告 ⏳

---

**文档版本**: v1.0
**创建日期**: 2026-03-24
**负责人**: 产品经理
**最后更新**: 2026-03-24
