# Week 3 - PL文档（产品逻辑规范）

## 文档信息
- **文档版本**: v1.0
- **创建日期**: 2026-03-24
- **负责人**: 产品经理
- **阶段**: Phase 1 - MVP基础版本
- **周次**: Week 3
- **关联文档**: week-3-WO.md

---

## 一、产品逻辑概述

### 1.1 本周目标
实现完整的人机对战功能，让玩家能够与AI进行流畅的五子棋对局，体验真实的游戏节奏和竞技感。

### 1.2 核心原则
- **智能体验**: AI要有基本棋力，不能太蠢（简单）或太慢（中等）
- **流畅交互**: AI响应迅速，状态反馈及时，UI更新流畅
- **清晰状态**: 玩家始终清楚当前是谁的回合、AI是否在思考
- **公平竞争**: 黑棋先手，玩家可选择执黑或执白
- **性能优先**: AI计算不阻塞UI，页面响应流畅

### 1.3 本周不包含的逻辑
- 困难/大师AI（Minimax算法，Week 8-9）
- 悔棋功能（Week 5）
- 提示功能（Week 6）
- 胜负动画（Week 7）
- 限时模式（Week 5）

---

## 二、AI算法逻辑

### 2.1 简单AI（Easy Difficulty）

#### 2.1.1 算法流程
```
1. 检查棋盘是否为空
   ├─ 是 → 落子在天元（中心点7,7）
   └─ 否 → 继续

2. 检测对方威胁（防守检测）
   ├─ 扫描所有对方棋子
   ├─ 检测是否有活三（两端都空的三连）
   ├─ 如果有 → 20%概率堵截
   └─ 如果无 → 继续随机

3. 随机落子（80%概率）
   ├─ 收集所有空位
   ├─ 优先选择已有棋子周围2格内的位置
   ├─ 如果没有邻居位置，选择任意空位
   └─ 随机返回一个位置
```

#### 2.1.2 防守检测逻辑

**活三定义**: 连续3个同色棋子，且两端都为空

**检测算法**:
```typescript
function detectLiveThree(
  board: Board,
  player: Player
): Position[] {
  const threats: Position[] = [];

  // 遍历所有对方棋子
  for (const pos of getOccupiedPositions(board, player)) {
    // 检查4个方向
    for (const dir of DIRECTIONS) {
      const line = getLine(board, pos, dir, 4);

      // 检查是否是活三：_XXX_
      if (line.pattern === 'empty-three-empty') {
        // 找到堵截位置（两端的空位）
        threats.push(...line.blockPositions);
      }
    }
  }

  return threats; // 返回所有需要堵截的位置
}
```

**优先级**:
- 如果有多个威胁，随机选择一个堵截
- 如果没有威胁，进入随机落子流程

#### 2.1.3 随机落子优化

**问题**: 完全随机会让AI下得很散，缺乏相关性

**优化**: 优先选择有邻居的位置
```typescript
function getCandidatePositions(board: Board): Position[] {
  const allEmpty = getAllEmptyPositions(board);
  const occupied = getOccupiedPositions(board);

  // 如果棋盘为空，返回中心点
  if (occupied.length === 0) {
    return [{ x: 7, y: 7 }];
  }

  // 找出所有有邻居的空位（周围2格内有棋子）
  const candidates = allEmpty.filter(pos => {
    return hasNeighbor(board, pos, 2);
  });

  // 如果没有候选位置，返回所有空位
  return candidates.length > 0 ? candidates : allEmpty;
}
```

**预期效果**:
- 开局：占据天元
- 中局：围绕已有棋子落子，形成对抗
- 偶尔的防守：20%概率堵截对方活三

---

### 2.2 中等AI（Medium Difficulty）

#### 2.2.1 算法流程
```
1. 生成候选位置
   ├─ 只考虑有邻居的空位（周围2格内有棋子）
   ├─ 限制最多100个候选位置（性能优化）
   └─ 如果棋盘为空，优先天元

2. 评估每个候选位置
   ├─ 计算进攻得分：假设AI在此落子，形成的棋型评分
   ├─ 计算防守得分：假设玩家在此落子，形成的棋型评分
   └─ 总得分 = 进攻得分 + 防守得分 × 0.9（略低于进攻）

3. 选择最优位置
   ├─ 按得分降序排序
   ├─ 选择得分最高的位置
   └─ 如果有多个相同得分，随机选择
```

#### 2.2.2 棋型识别逻辑

**扫描方向**: 从某个位置向4个方向扫描，检测棋型

**棋型定义**:
```typescript
enum PatternType {
  // 连五（已获胜）
  FIVE = 'XXXXX',

  // 活四：_XXXX_（必胜）
  LIVE_FOUR = '_XXXX_',

  // 冲四：OXXXX_ 或 _XXXXO（一端被堵）
  DEAD_FOUR = 'OXXXX_',

  // 活三：_XXX_（威胁）
  LIVE_THREE = '_XXX_',

  // 眠三：OXXX_ 或 _XXXO（一端被堵）
  SLEEP_THREE = 'OXXX_',

  // 活二：_XX_
  LIVE_TWO = '_XX_',

  // 眠二：OXX_ 或 _XXO
  SLEEP_TWO = 'OXX_',

  // 活一：_X_
  LIVE_ONE = '_X_',
}
```

**识别算法**:
```typescript
function recognizePattern(
  board: Board,
  center: Position,
  direction: [number, number],
  player: Player
): Pattern {
  // 从中心向两端延伸，获取9个位置的状态
  // 格式：[left4, left3, left2, left1, center, right1, right2, right3, right4]
  const line = getLineState(board, center, direction, 4);

  // 转换为字符串模式
  // X: 己方棋子, O: 对方棋子/边界, _: 空位
  const pattern = convertToPatternString(line, player);

  // 匹配棋型
  return matchPattern(pattern);
}
```

#### 2.2.3 评分函数

**进攻评分**（假设AI在此落子）:
```typescript
function calculateAttackScore(
  board: Board,
  position: Position,
  aiPlayer: Player
): number {
  let totalScore = 0;

  // 检查4个方向
  for (const dir of DIRECTIONS) {
    const pattern = recognizePattern(board, position, dir, aiPlayer);

    // 根据棋型累加得分
    totalScore += PATTERN_SCORES[pattern.type];
  }

  return totalScore;
}
```

**防守评分**（假设玩家在此落子）:
```typescript
function calculateDefenseScore(
  board: Board,
  position: Position,
  humanPlayer: Player
): number {
  // 逻辑同进攻评分，但从玩家角度计算
  // 这样可以评估玩家在这个位置的威胁程度
  return calculateAttackScore(board, position, humanPlayer);
}
```

**总分计算**:
```typescript
const attackScore = calculateAttackScore(board, pos, aiPlayer);
const defenseScore = calculateDefenseScore(board, pos, humanPlayer);
const totalScore = attackScore + defenseScore * 0.9;
```

**权重说明**:
- 进攻权重 1.0：AI优先考虑自己的进攻
- 防守权重 0.9：也会考虑防守，但略低
- 这样可以让AI更具进攻性，同时不失防守

#### 2.2.4 评分表设计

```typescript
const PATTERN_SCORES: Record<PatternType, number> = {
  // 连五：已经赢了
  FIVE: 100000,

  // 活四：必胜棋型，优先级最高
  LIVE_FOUR: 10000,

  // 冲四：威胁很大，但对方可以堵
  DEAD_FOUR: 5000,

  // 活三：形成活四的前置
  LIVE_THREE: 1000,

  // 眠三：有一定威胁
  SLEEP_THREE: 100,

  // 活二：布局阶段
  LIVE_TWO: 10,

  // 眠二：威胁较小
  SLEEP_TWO: 1,

  // 活一：几乎无威胁
  LIVE_ONE: 0,
};
```

**评分原则**:
1. 连五 >> 活四 >> 冲四 >> 活三 >> 眠三 >> 活二 >> 眠二
2. 每级之间至少相差2-5倍，确保优先级清晰
3. 活四(10000)接近连五(100000)，因为活四基本必胜
4. 冲四(5000)虽然也强，但对方可以堵，所以得分较低

#### 2.2.5 性能优化

**候选位置过滤**:
```typescript
function getCandidatePositions(board: Board): Position[] {
  const empty = getAllEmptyPositions(board);

  // 只考虑有邻居的位置（周围2格内有棋子）
  const withNeighbor = empty.filter(pos => {
    return hasNeighborInDistance(board, pos, 2);
  });

  // 如果候选太多，按距离中心的远近排序，取前100个
  if (withNeighbor.length > 100) {
    return withNeighbor
      .sort((a, b) => distanceToCenter(a) - distanceToCenter(b))
      .slice(0, 100);
  }

  return withNeighbor;
}
```

**优化效果**:
- 候选位置从225个（15×15）降到<100个
- 评估时间从~500ms降到<100ms
- 保持棋力基本不变

---

### 2.3 AI Web Worker通信

#### 2.3.1 通信协议

**请求格式**:
```typescript
interface AIMoveRequest {
  type: 'calculate';
  board: Board;           // 当前棋盘状态
  difficulty: Difficulty; // AI难度
  aiPlayer: Player;       // AI执棋颜色
}
```

**响应格式**:
```typescript
interface AIMoveResponse {
  type: 'success' | 'error';
  position?: Position;    // AI选择的落子位置
  error?: string;         // 错误信息
  thinkTime?: number;     // 思考时间（毫秒）
}
```

#### 2.3.2 超时处理

**超时设置**:
```typescript
const TIMEOUTS = {
  easy: 1000,      // 简单AI：1秒
  medium: 3000,    // 中等AI：3秒
  hard: 5000,      // 困难AI：5秒（Week 8）
  master: 10000,   // 大师AI：10秒（Week 8）
};
```

**超时处理逻辑**:
```typescript
async function makeAiMoveWithTimeout(
  board: Board,
  difficulty: Difficulty,
  aiPlayer: Player
): Promise<Position> {
  const timeout = TIMEOUTS[difficulty];

  const result = await Promise.race([
    aiClient.calculateMove(board, difficulty, aiPlayer),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI timeout')), timeout)
    ),
  ]);

  return result as Position;
}
```

**超时后的降级策略**:
1. 记录错误日志
2. 显示"AI响应超时"提示
3. 使用随机落子作为降级方案
4. 不中断游戏流程

#### 2.3.3 中断处理

**使用场景**: 玩家在AI思考时重新开始游戏

```typescript
// 游戏流程控制器
class GameFlowController {
  private abortController: AbortController | null = null;

  async handlePlayerMove(position: Position): Promise<Position> {
    // 取消之前的AI计算
    if (this.abortController) {
      this.abortController.abort();
    }

    // 创建新的中断控制器
    this.abortController = new AbortController();

    try {
      // 传递中断信号
      const aiMove = await this.aiClient.calculateMove(
        board,
        difficulty,
        aiPlayer,
        this.abortController.signal
      );

      return aiMove;
    } catch (error) {
      if (error.name === 'AbortError') {
        // 被中断，忽略
        return null;
      }
      throw error;
    }
  }

  cancelAiMove(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
```

---

## 三、游戏流程控制逻辑

### 3.1 PVE模式状态机

```
状态定义：
- IDLE: 游戏未开始
- PLAYER_TURN: 玩家回合
- AI_THINKING: AI思考中
- GAME_OVER: 游戏结束

状态转换：
IDLE → PLAYER_TURN
    ↓
PLAYER_TURN → (玩家落子) → AI_THINKING
    ↓
AI_THINKING → (AI落子) → PLAYER_TURN
    ↓
(任意状态) → (胜负判定) → GAME_OVER
```

### 3.2 回合切换逻辑

**玩家回合 → AI回合**:
```typescript
async function handlePlayerMove(position: Position): Promise<void> {
  // 1. 玩家落子
  const result = engine.makeMove(position);

  // 2. 检查游戏是否结束
  if (result.gameStatus === 'won') {
    showVictory(result.winner);
    return;
  }

  // 3. 进入AI回合
  setAiThinking(true);
  disableBoard();

  // 4. 等待AI计算
  const aiMove = await aiClient.calculateMove(...);

  // 5. AI落子
  const aiResult = engine.makeMove(aiMove);

  // 6. 检查游戏是否结束
  if (aiResult.gameStatus === 'won') {
    showVictory(aiResult.winner);
  }

  // 7. 回到玩家回合
  setAiThinking(false);
  enableBoard();
}
```

**错误处理**:
```typescript
try {
  const aiMove = await aiClient.calculateMove(...);
  // AI落子逻辑
} catch (error) {
  // AI出错，显示错误提示
  showError('AI计算失败，请重试');

  // 恢复玩家回合
  setAiThinking(false);
  enableBoard();
}
```

### 3.3 先后手选择逻辑

**选择界面**:
```
┌─────────────────────┐
│   选择先后手         │
├─────────────────────┤
│  ○ 执黑先手         │
│  ○ 执白后手         │
│                     │
│  [开始游戏]         │
└─────────────────────┘
```

**逻辑说明**:
1. 玩家执黑先手：
   - 玩家先落子
   - AI执白，后手

2. 玩家执白后手：
   - AI执黑，先手
   - AI立即落子（玩家等待）
   - 然后玩家回合

**实现方式**:
```typescript
function startPVEGame(
  difficulty: Difficulty,
  playerFirst: boolean
): void {
  const aiPlayer: Player = playerFirst ? 'white' : 'black';

  engine.startGame();
  setAiPlayer(aiPlayer);
  setDifficulty(difficulty);

  // 如果AI执黑先手，立即触发AI落子
  if (!playerFirst) {
    triggerAiMove();
  }
}
```

---

## 四、UI交互逻辑

### 4.1 计时器逻辑

#### 4.1.1 计时规则
- 分别记录黑棋和白棋的用时
- 只在游戏进行时计时
- 暂停时停止计时
- 游戏结束后停止计时

#### 4.1.2 时间格式化
```typescript
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 示例：
// 5 → "00:05"
// 65 → "01:05"
// 366 → "06:06"
```

#### 4.1.3 计时器更新
```typescript
useEffect(() => {
  let interval: NodeJS.Timeout;

  if (isRunning) {
    interval = setInterval(() => {
      if (currentPlayer === 'black') {
        setBlackTime(prev => prev + 1);
      } else {
        setWhiteTime(prev => prev + 1);
      }
    }, 1000);
  }

  return () => {
    if (interval) clearInterval(interval);
  };
}, [isRunning, currentPlayer]);
```

### 4.2 状态提示逻辑

**状态提示映射表**:
```typescript
const STATUS_MESSAGES: Record<
  GameStatus,
  (currentPlayer: Player, isAiThinking: boolean) => string
> = {
  idle: () => '准备开始',

  playing: (current, isAiThinking) => {
    if (isAiThinking) {
      return 'AI思考中...';
    }
    return current === 'black' ? '黑棋落子' : '白棋落子';
  },

  won: (_, __, winner) => {
    return winner === 'black' ? '黑棋获胜！' : '白棋获胜！';
  },

  draw: () => '平局！',
};
```

**视觉反馈**:
- 游戏进行中：绿色文字
- AI思考中：黄色闪烁文字 + 动画效果
- 游戏结束：大号金色文字 + 庆祝动画（Week 7）

### 4.3 交互控制逻辑

**AI思考时的禁用状态**:
```typescript
const isBoardDisabled = () => {
  return gameStatus !== 'playing' || isAiThinking;
};
```

**禁用效果**:
- 棋盘不响应点击
- 鼠标悬停无效果
- 显示半透明遮罩（可选）
- 显示"AI思考中..."提示

**按钮状态**:
- 重新开始：AI思考时禁用（防止中断）
- 返回菜单：AI思考时禁用（防止中断）
- 悔棋/提示：AI思考时禁用（Week 5-6）

---

## 五、边界情况处理

### 5.1 AI计算异常

**场景1: AI超时**
```typescript
// 处理逻辑
try {
  const move = await withTimeout(
    aiClient.calculateMove(...),
    TIMEOUTS[difficulty]
  );
} catch (error) {
  if (error instanceof TimeoutError) {
    // 使用随机落子降级
    const randomMove = getRandomMove(board);
    engine.makeMove(randomMove);
    showToast('AI响应超时，已使用随机落子');
  }
}
```

**场景2: AI Worker崩溃**
```typescript
// 检测Worker是否存活
function isWorkerAlive(worker: Worker): boolean {
  return worker.readyState === Worker.ACTIVE;
}

// 如果Worker崩溃，重新创建
if (!isWorkerAlive(worker)) {
  worker = new Worker('./ai.worker.ts');
  showToast('AI异常，已重置');
}
```

**场景3: AI返回无效位置**
```typescript
// 验证AI返回的位置
function validateAiMove(position: Position, board: Board): boolean {
  return (
    isValidPosition(position) &&
    board.isEmpty(position.x, position.y)
  );
}

// 如果无效，使用随机落子
if (!validateAiMove(aiMove, board)) {
  console.error('AI返回无效位置:', aiMove);
  aiMove = getRandomMove(board);
}
```

### 5.2 玩家操作异常

**场景1: AI思考时玩家点击棋盘**
```typescript
// 禁用点击
const handleBoardClick = (position: Position) => {
  if (isAiThinking) {
    showToast('AI思考中，请稍候');
    return;
  }

  if (gameStatus !== 'playing') {
    return;
  }

  // 正常落子逻辑
  makeMove(position);
};
```

**场景2: AI思考时玩家点击重新开始**
```typescript
const handleRestart = () => {
  if (isAiThinking) {
    // 取消AI计算
    gameFlow.cancelAiMove();

    // 清理Worker
    aiClient.terminate();

    // 显示提示
    showToast('已取消AI计算，重新开始游戏');
  }

  // 重置游戏
  resetGame();
};
```

**场景3: 快速点击导致竞态条件**
```typescript
// 使用锁机制
let isProcessingMove = false;

async function handlePlayerMove(position: Position) {
  if (isProcessingMove) {
    return; // 忽略重复点击
  }

  isProcessingMove = true;

  try {
    // 落子逻辑
    await processMove(position);
  } finally {
    isProcessingMove = false;
  }
}
```

### 5.3 状态一致性

**问题**: AI计算完成后，游戏状态可能已改变

**解决方案**: 状态版本控制
```typescript
class GameFlowController {
  private stateVersion: number = 0;

  async handlePlayerMove(position: Position): Promise<void> {
    const currentVersion = ++this.stateVersion;

    // 玩家落子
    engine.makeMove(position);

    // AI计算
    const aiMove = await aiClient.calculateMove(...);

    // 检查状态版本
    if (currentVersion !== this.stateVersion) {
      // 状态已改变，丢弃AI结果
      console.log('AI结果已过期，丢弃');
      return;
    }

    // 状态未变，执行AI落子
    engine.makeMove(aiMove);
  }

  cancelAiMove(): void {
    // 递增版本号，使AI结果失效
    this.stateVersion++;
  }
}
```

---

## 六、性能要求

### 6.1 响应时间目标

| 操作 | 目标时间 | 测量方式 |
|------|---------|---------|
| 简单AI计算 | <100ms | 从玩家落子完成到AI落子完成 |
| 中等AI计算 | <500ms | 同上 |
| 状态更新 | <16ms (60fps) | React reflow时间 |
| 计时器更新 | <16ms | setInterval回调时间 |
| Worker启动 | <50ms | 创建Worker并初始化 |

### 6.2 内存占用目标

| 模块 | 目标占用 | 测量方式 |
|------|---------|---------|
| 简单AI | <1MB | Chrome DevTools Memory |
| 中等AI | <2MB | 同上 |
| AI Worker | <5MB | 同上 |
| 游戏总内存 | <50MB | 同上 |

### 6.3 优化策略

**AI计算优化**:
1. 限制候选位置数量（<100个）
2. 使用Web Worker避免阻塞UI
3. 缓存棋型识别结果
4. 使用TypedArray优化数据结构

**UI渲染优化**:
1. 使用React.memo避免不必要的重渲染
2. 使用useCallback缓存事件处理函数
3. 使用requestAnimationFrame更新计时器
4. 批量更新状态（避免多次setState）

**内存优化**:
1. 游戏结束时清理Worker
2. 组件卸载时清理定时器
3. 使用WeakMap存储临时数据
4. 避免闭包导致的内存泄漏

---

## 七、测试策略

### 7.1 单元测试

**简单AI测试**:
```typescript
describe('SimpleAI', () => {
  it('应该在天元落子（棋盘为空）', () => {
    const board = createEmptyBoard();
    const ai = new SimpleAI();
    const move = ai.calculateMove(board);
    expect(move).toEqual({ x: 7, y: 7 });
  });

  it('应该随机落子（80%概率）', () => {
    // 使用固定种子测试
    const board = createTestBoard([...]);
    const ai = new SimpleAI();
    const moves = Array.from({ length: 100 }, () =>
      ai.calculateMove(board)
    );

    // 验证随机性
    const uniqueMoves = new Set(moves);
    expect(uniqueMoves.size).toBeGreaterThan(50);
  });

  it('应该堵截对方活三（20%概率）', () => {
    // 构造有活三的棋盘
    const board = createBoardWithLiveThree();
    const ai = new SimpleAI();

    // 多次测试，验证20%概率
    const blockCount = Array.from({ length: 100 }, () => {
      const move = ai.calculateMove(board);
      return isBlockPosition(move, board);
    }).filter(Boolean).length;

    expect(blockCount).toBeGreaterThan(10);
    expect(blockCount).toBeLessThan(30);
  });
});
```

**中等AI测试**:
```typescript
describe('MediumAI', () => {
  it('应该优先选择连五', () => {
    const board = createBoardWithFourInRow();
    const ai = new MediumAI();
    const move = ai.calculateMove(board);

    // 验证AI选择了连五的位置
    expect(isWinningMove(move, board)).toBe(true);
  });

  it('应该堵截对方活四', () => {
    const board = createBoardWithOpponentLiveFour();
    const ai = new MediumAI();
    const move = ai.calculateMove(board);

    // 验证AI选择了堵截位置
    expect(isBlockPosition(move, board)).toBe(true);
  });

  it('应该选择得分最高的位置', () => {
    const board = createComplexBoard();
    const ai = new MediumAI();

    // 评估所有位置
    const scores = evaluateAllPositions(board, ai);

    // 获取AI选择
    const move = ai.calculateMove(board);

    // 验证是最高分位置
    const maxScore = Math.max(...scores.map(s => s.score));
    const moveScore = scores.find(s => s.position === move)?.score;
    expect(moveScore).toBe(maxScore);
  });
});
```

### 7.2 集成测试

**PVE流程测试**:
```typescript
describe('PVE Game Flow', () => {
  it('应该完成完整的人机对局', async () => {
    const { startGame, makeMove, gameStatus } = renderGame();

    // 开始PVE游戏
    startGame({ mode: 'pve', difficulty: 'easy', playerFirst: true });

    // 玩家落子
    await makeMove({ x: 7, y: 7 });

    // 等待AI响应
    await waitFor(() => {
      expect(getLastMove()).not.toBe({ x: 7, y: 7 });
    });

    // 验证回合切换
    expect(getCurrentPlayer()).toBe('black');

    // 继续游戏直到结束
    while (gameStatus() === 'playing') {
      await makeMove(getPlayerMove());
      await waitForAiMove();
    }

    // 验证游戏结束
    expect(gameStatus()).toBe('won');
  });
});
```

### 7.3 性能测试

**AI响应时间测试**:
```typescript
describe('AI Performance', () => {
  it('简单AI响应时间应该<100ms', async () => {
    const board = createMidGameBoard();
    const ai = new SimpleAI();

    const start = performance.now();
    await ai.calculateMove(board);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100);
  });

  it('中等AI响应时间应该<500ms', async () => {
    const board = createMidGameBoard();
    const ai = new MediumAI();

    const start = performance.now();
    await ai.calculateMove(board);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(500);
  });
});
```

---

## 八、验收清单

### 8.1 功能验收
- [ ] 简单AI能够正常落子
- [ ] 中等AI能够正常落子
- [ ] PVE模式流程完整
- [ ] 玩家可选择执黑或执白
- [ ] AI执黑时能够先手
- [ ] 计时器正确显示双方用时
- [ ] 状态提示准确反映当前状态
- [ ] AI思考时有明确提示
- [ ] 重新开始功能正常

### 8.2 性能验收
- [ ] 简单AI响应时间<100ms
- [ ] 中等AI响应时间<500ms
- [ ] AI计算不阻塞UI
- [ ] 页面流畅度>60fps
- [ ] 内存占用<50MB

### 8.3 稳定性验收
- [ ] AI超时时有降级方案
- [ ] Worker崩溃时能够恢复
- [ ] 状态版本控制防止竞态
- [ ] 错误处理完善
- [ ] 边界情况处理正确

### 8.4 用户体验验收
- [ ] UI反馈及时
- [ ] 状态提示清晰
- [ ] 交互流畅自然
- [ ] 错误提示友好
- [ ] 整体体验良好

---

**文档结束**

**下一步**: 测试Agent根据WO/PL文档设计测试用例
