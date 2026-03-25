# Week 3 - 测试用例文档

## 文档信息
- **文档版本**: v1.0
- **创建日期**: 2026-03-24
- **负责人**: QA工程师
- **阶段**: Phase 1 - MVP基础版本
- **周次**: Week 3
- **开发模式**: TDD（测试驱动开发）
- **关联文档**: week-3-WO.md, week-3-PL.md

---

## 一、测试概述

### 1.1 测试范围
本周测试覆盖人机对战功能，包括：
- 简单AI（SimpleAI）- 80%随机+20%基础防守
- 中等AI（MediumAI）- 评分系统
- AI Web Worker集成和通信
- 游戏流程控制（PVE模式）
- 游戏UI组件（计时器、状态显示、控制面板）

### 1.2 测试策略
- **单元测试**: 测试AI算法核心逻辑、棋型识别、评分系统（覆盖率目标 > 80%）
- **集成测试**: 测试AI Worker通信、游戏流程控制
- **E2E测试**: 测试完整的人机对局流程
- **性能测试**: AI响应时间、内存占用、UI流畅度

### 1.3 测试优先级定义
- **P0**: 核心功能，必须通过才能发布（AI落子、流程控制、胜负判断）
- **P1**: 重要功能，影响用户体验（计时器、状态显示、性能）
- **P2**: 边界情况和错误处理（超时、异常、降级方案）

### 1.4 测试环境
- **浏览器**: Chrome, Firefox, Safari, Edge
- **Node.js版本**: v18+
- **React版本**: 19.x
- **测试框架**: Jest + React Testing Library + Playwright

### 1.5 测试统计目标
- **新增测试用例**: 60+个
- **累计测试用例**: 13 + 70 + 60 = 143个
- **代码覆盖率目标**: >80%
- **核心AI模块覆盖率**: 100%

---

## 二、简单AI（SimpleAI）测试用例

### 2.1 基础功能测试

#### TC-084: 简单AI-空棋盘天元开局

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/simple-ai.test.ts`

**前置条件**:
- SimpleAI类已定义
- 空棋盘已创建

**测试步骤**:
1. 创建15×15的空棋盘
2. 创建SimpleAI实例
3. 调用calculateMove方法
4. 验证返回位置是否为天元(7,7)

**期望结果**:
```typescript
const board = new Board(15);
const ai = new SimpleAI();
const move = ai.calculateMove(board, 'black');
expect(move).toEqual({ x: 7, y: 7 });
```

**测试数据**:
- 棋盘大小: 15
- 预期位置: { x: 7, y: 7 }

---

#### TC-085: 简单AI-随机落子位置验证

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/simple-ai.test.ts`

**前置条件**:
- 棋盘已有部分棋子
- SimpleAI已初始化

**测试步骤**:
1. 创建一个有5个棋子的棋盘
2. 使用固定种子调用calculateMove 100次
3. 统计唯一位置的数量
4. 验证位置在有邻居的空位范围内

**期望结果**:
```typescript
const board = createTestBoard([
  { x: 7, y: 7, player: 'black' },
  { x: 7, y: 8, player: 'white' },
  { x: 6, y: 7, player: 'black' },
  { x: 8, y: 7, player: 'white' },
  { x: 7, y: 6, player: 'black' }
]);

const ai = new SimpleAI(0.12345); // 固定种子
const moves = Array.from({ length: 100 }, () =>
  ai.calculateMove(board, 'white')
);

// 验证随机性：至少有50个不同位置
const uniqueMoves = new Set(moves.map(m => `${m.x},${m.y}`));
expect(uniqueMoves.size).toBeGreaterThan(50);

// 验证位置有效性：所有位置应该是空位
moves.forEach(move => {
  expect(board.isEmpty(move.x, move.y)).toBe(true);
  expect(hasNeighbor(board, move, 2)).toBe(true);
});
```

**测试数据**:
- 已有棋子位置: [(7,7), (7,8), (6,7), (8,7), (7,6)]
- 测试次数: 100次
- 固定种子: 0.12345

---

#### TC-086: 简单AI-防守活三检测

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/simple-ai.test.ts`

**前置条件**:
- 棋盘上有对方的活三
- SimpleAI已初始化

**测试步骤**:
1. 创建一个包含黑棋活三的棋盘：`_XXX_`（空-黑-黑-黑-空）
2. 设置随机种子使防守概率触发（20%）
3. 调用calculateMove方法
4. 验证AI是否堵截了活三

**期望结果**:
```typescript
// 创建活三棋盘
const board = new Board(15);
board.placePiece({ x: 5, y: 7 }, 'black');
board.placePiece({ x: 6, y: 7 }, 'black');
board.placePiece({ x: 7, y: 7 }, 'black');
// 位置4和8为空，形成活三

const ai = new SimpleAI(0.8); // 触发20%防守概率
const move = ai.calculateMove(board, 'white');

// 应该堵截活三的一端
const isBlocking = move.x === 4 || move.x === 8;
expect(isBlocking).toBe(true);
```

**测试数据**:
- 活三位置: (5,7), (6,7), (7,7) - 黑棋
- 堵截位置: (4,7) 或 (8,7)
- 防守概率: 20%

---

#### TC-087: 简单AI-防守概率统计验证

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/simple-ai.test.ts`

**前置条件**:
- 棋盘上有对方活三
- SimpleAI已初始化

**测试步骤**:
1. 创建包含活三的棋盘
2. 使用不同随机种子调用calculateMove 1000次
3. 统计堵截活三的次数
4. 验证概率在15%-25%之间（允许误差）

**期望结果**:
```typescript
const board = createBoardWithLiveThree();
const ai = new SimpleAI();

let blockCount = 0;
for (let i = 0; i < 1000; i++) {
  const move = ai.calculateMove(board, 'white', i / 1000);
  if (isBlockingPosition(move, board)) {
    blockCount++;
  }
}

const probability = blockCount / 1000;
expect(probability).toBeGreaterThan(0.15); // 15%
expect(probability).toBeLessThan(0.25);   // 25%
```

**测试数据**:
- 测试次数: 1000次
- 期望概率: 20% ± 5%

---

### 2.2 边界情况测试

#### TC-088: 简单AI-棋盘只有一个空位

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/simple-ai.test.ts`

**前置条件**:
- 棋盘只剩最后一个空位

**测试步骤**:
1. 创建只剩一个空位的棋盘
2. 调用calculateMove
3. 验证AI选择了最后一个空位

**期望结果**:
```typescript
const board = createAlmostFullBoard(); // 只剩一个空位
const ai = new SimpleAI();
const move = ai.calculateMove(board, 'black');

const emptyPositions = board.getEmptyPositions();
expect(emptyPositions).toHaveLength(1);
expect(move).toEqual(emptyPositions[0]);
```

**测试数据**:
- 空位数量: 1个
- 空位位置: 任意有效位置

---

#### TC-089: 简单AI-棋盘已满

**优先级**: P2
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/simple-ai.test.ts`

**前置条件**:
- 棋盘已满，无空位

**测试步骤**:
1. 创建已满的棋盘
2. 调用calculateMove
3. 验证抛出异常或返回null

**期望结果**:
```typescript
const board = createFullBoard();
const ai = new SimpleAI();

expect(() => {
  ai.calculateMove(board, 'black');
}).toThrow('No empty positions available');
```

**测试数据**:
- 棋盘状态: 15×15已满（225个棋子）

---

#### TC-090: 简单AI-无邻居位置随机落子

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/simple-ai.test.ts`

**前置条件**:
- 棋盘上有孤立的棋子（周围2格无其他棋子）

**测试步骤**:
1. 创建棋盘，在(0,0)和(14,14)各放一子
2. 验证AI仍能正常落子
3. 验证AI会选择任意空位

**期望结果**:
```typescript
const board = new Board(15);
board.placePiece({ x: 0, y: 0 }, 'black');
board.placePiece({ x: 14, y: 14 }, 'white');

const ai = new SimpleAI();
const move = ai.calculateMove(board, 'black');

// 由于没有邻居位置，应该选择任意空位
expect(board.isValid(move.x, move.y)).toBe(true);
expect(board.isEmpty(move.x, move.y)).toBe(true);
```

**测试数据**:
- 孤立棋子: (0,0)黑棋, (14,14)白棋

---

### 2.3 性能测试

#### TC-091: 简单AI-响应时间测试

**优先级**: P0
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/simple-ai.test.ts`

**前置条件**:
- 中局棋盘（约50个棋子）

**测试步骤**:
1. 创建中局棋盘
2. 记录开始时间
3. 调用calculateMove
4. 记录结束时间并计算耗时
5. 验证响应时间<100ms

**期望结果**:
```typescript
const board = createMidGameBoard(50); // 50个棋子
const ai = new SimpleAI();

const start = performance.now();
const move = ai.calculateMove(board, 'black');
const duration = performance.now() - start;

expect(duration).toBeLessThan(100); // <100ms
console.log(`简单AI响应时间: ${duration.toFixed(2)}ms`);
```

**测试数据**:
- 棋盘棋子数: 50个
- 响应时间要求: <100ms
- 测试次数: 10次取平均值

---

#### TC-092: 简单AI-内存占用测试

**优先级**: P1
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/simple-ai.test.ts`

**前置条件**:
- 性能分析工具已准备

**测试步骤**:
1. 记录初始内存
2. 创建100次AI实例并执行计算
3. 记录最终内存
4. 验证内存增长<1MB

**期望结果**:
```typescript
const initialMemory = process.memoryUsage().heapUsed;

for (let i = 0; i < 100; i++) {
  const board = createRandomBoard();
  const ai = new SimpleAI();
  ai.calculateMove(board, 'black');
}

const finalMemory = process.memoryUsage().heapUsed;
const memoryGrowth = (finalMemory - initialMemory) / 1024 / 1024; // MB

expect(memoryGrowth).toBeLessThan(1); // <1MB
console.log(`内存增长: ${memoryGrowth.toFixed(2)}MB`);
```

**测试数据**:
- 测试次数: 100次
- 内存限制: <1MB

---

## 三、中等AI（MediumAI）测试用例

### 3.1 棋型识别测试

#### TC-093: 中等AI-识别连五（FIVE）

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/medium-ai.test.ts`

**前置条件**:
- 棋盘上有连五棋型

**测试步骤**:
1. 创建棋盘，放置4个黑棋连成一线
2. 在任意空位放置第5个黑棋形成连五
3. 验证detectPattern识别为FIVE
4. 验证得分为100000

**期望结果**:
```typescript
const board = new Board(15);
// 创建横向连五
board.placePiece({ x: 5, y: 7 }, 'black');
board.placePiece({ x: 6, y: 7 }, 'black');
board.placePiece({ x: 7, y: 7 }, 'black');
board.placePiece({ x: 8, y: 7 }, 'black');

const ai = new MediumAI();
const score = ai.evaluatePosition(board, { x: 9, y: 7 }, 'black');

expect(score).toBeGreaterThan(100000); // 应该识别为必胜位置
```

**测试数据**:
- 棋型: XXXXX（连五）
- 期望得分: 100000+

---

#### TC-094: 中等AI-识别活四（LIVE_FOUR）

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/medium-ai.test.ts`

**前置条件**:
- 棋盘上有活四棋型

**测试步骤**:
1. 创建棋盘：`_XXXX_`（空-黑-黑-黑-黑-空）
2. 验证AI识别为活四
3. 验证得分为10000

**期望结果**:
```typescript
const board = new Board(15);
board.placePiece({ x: 5, y: 7 }, 'black');
board.placePiece({ x: 6, y: 7 }, 'black');
board.placePiece({ x: 7, y: 7 }, 'black');
board.placePiece({ x: 8, y: 7 }, 'black');
// 位置4和9为空

const ai = new MediumAI();
const score1 = ai.evaluatePosition(board, { x: 4, y: 7 }, 'black');
const score2 = ai.evaluatePosition(board, { x: 9, y: 7 }, 'black');

// 两端都应该识别为活四的延伸
expect(Math.max(score1, score2)).toBeGreaterThanOrEqual(10000);
```

**测试数据**:
- 棋型: _XXXX_（活四）
- 期望得分: 10000+

---

#### TC-095: 中等AI-识别冲四（DEAD_FOUR）

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/medium-ai.test.ts`

**前置条件**:
- 棋盘上有冲四棋型

**测试步骤**:
1. 创建棋盘：`OXXXX_`（边界/白棋-黑-黑-黑-黑-空）
2. 验证AI识别为冲四
3. 验证得分为5000

**期望结果**:
```typescript
const board = new Board(15);
board.placePiece({ x: 0, y: 7 }, 'white'); // 一端被堵
board.placePiece({ x: 1, y: 7 }, 'black');
board.placePiece({ x: 2, y: 7 }, 'black');
board.placePiece({ x: 3, y: 7 }, 'black');
board.placePiece({ x: 4, y: 7 }, 'black');
board.placePiece({ x: 5, y: 7 }, null);   // 另一端空

const ai = new MediumAI();
const score = ai.evaluatePosition(board, { x: 5, y: 7 }, 'black');

expect(score).toBeGreaterThanOrEqual(5000); // 冲四得分
```

**测试数据**:
- 棋型: OXXXX_（冲四）
- 期望得分: 5000+

---

#### TC-096: 中等AI-识别活三（LIVE_THREE）

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/medium-ai.test.ts`

**前置条件**:
- 棋盘上有活三棋型

**测试步骤**:
1. 创建棋盘：`_XXX_`（空-黑-黑-黑-空）
2. 验证AI识别为活三
3. 验证得分为1000

**期望结果**:
```typescript
const board = new Board(15);
board.placePiece({ x: 5, y: 7 }, 'black');
board.placePiece({ x: 6, y: 7 }, 'black');
board.placePiece({ x: 7, y: 7 }, 'black');
// 位置4和8为空

const ai = new MediumAI();
const score1 = ai.evaluatePosition(board, { x: 4, y: 7 }, 'black');
const score2 = ai.evaluatePosition(board, { x: 8, y: 7 }, 'black');

expect(Math.max(score1, score2)).toBeGreaterThanOrEqual(1000);
```

**测试数据**:
- 棋型: _XXX_（活三）
- 期望得分: 1000+

---

#### TC-097: 中等AI-识别眠三（SLEEP_THREE）

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/medium-ai.test.ts`

**前置条件**:
- 棋盘上有眠三棋型

**测试步骤**:
1. 创建棋盘：`OXXX_`（边界-黑-黑-黑-空）
2. 验证AI识别为眠三
3. 验证得分为100

**期望结果**:
```typescript
const board = new Board(15);
board.placePiece({ x: 0, y: 7 }, 'white');
board.placePiece({ x: 1, y: 7 }, 'black');
board.placePiece({ x: 2, y: 7 }, 'black');
board.placePiece({ x: 3, y: 7 }, 'black');

const ai = new MediumAI();
const score = ai.evaluatePosition(board, { x: 4, y: 7 }, 'black');

expect(score).toBeGreaterThanOrEqual(100); // 眠三得分
```

**测试数据**:
- 棋型: OXXX_（眠三）
- 期望得分: 100+

---

#### TC-098: 中等AI-识别活二（LIVE_TWO）

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/medium-ai.test.ts`

**前置条件**:
- 棋盘上有活二棋型

**测试步骤**:
1. 创建棋盘：`_XX_`（空-黑-黑-空）
2. 验证AI识别为活二
3. 验证得分为10

**期望结果**:
```typescript
const board = new Board(15);
board.placePiece({ x: 5, y: 7 }, 'black');
board.placePiece({ x: 6, y: 7 }, 'black');

const ai = new MediumAI();
const score = ai.evaluatePosition(board, { x: 4, y: 7 }, 'black');

expect(score).toBeGreaterThanOrEqual(10); // 活二得分
```

**测试数据**:
- 棋型: _XX_（活二）
- 期望得分: 10+

---

#### TC-099: 中等AI-多方向棋型累加

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/medium-ai.test.ts`

**前置条件**:
- 棋盘上有十字交叉的棋型

**测试步骤**:
1. 创建十字交叉棋型（横向和纵向都有棋子）
2. 验证AI累加多个方向的得分
3. 验证总分 = 各方向得分之和

**期望结果**:
```typescript
const board = new Board(15);
// 创建十字：中心(7,7)，横向左右，纵向上下
board.placePiece({ x: 6, y: 7 }, 'black');
board.placePiece({ x: 7, y: 7 }, 'black');
board.placePiece({ x: 8, y: 7 }, 'black');
board.placePiece({ x: 7, y: 6 }, 'black');
board.placePiece({ x: 7, y: 8 }, 'black');

const ai = new MediumAI();
const score = ai.evaluatePosition(board, { x: 7, y: 5 }, 'black');

// 应该累加纵向（形成活三）和横向（形成活二）的得分
expect(score).toBeGreaterThan(1000); // 至少有一个活三
```

**测试数据**:
- 棋型: 十字交叉
- 期望得分: 多方向累加

---

### 3.2 评分系统测试

#### TC-100: 中等AI-进攻与防守权重

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/medium-ai.test.ts`

**前置条件**:
- 棋盘上AI和玩家都有威胁

**测试步骤**:
1. 创建棋盘：AI有活三，玩家也有活三
2. 计算进攻得分（AI视角）
3. 计算防守得分（玩家视角）
4. 验证总得分 = 进攻 + 防守 × 0.9

**期望结果**:
```typescript
const board = createBoardWithBothThreats();

const ai = new MediumAI();
const attackScore = ai.calculateAttackScore(board, { x: 5, y: 7 }, 'black');
const defenseScore = ai.calculateDefenseScore(board, { x: 5, y: 7 }, 'white');
const totalScore = attackScore + defenseScore * 0.9;

// AI应该优先选择总得分最高的位置
const move = ai.calculateMove(board, 'black');
const moveScore = ai.evaluatePosition(board, move, 'black');

expect(moveScore).toBeCloseTo(totalScore, 0);
```

**测试数据**:
- 进攻权重: 1.0
- 防守权重: 0.9

---

#### TC-101: 中等AI-优先选择连五

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/medium-ai.test.ts`

**前置条件**:
- 棋盘上有多个威胁，包括连五机会

**测试步骤**:
1. 创建棋盘：AI有连五机会，同时玩家有活四
2. 调用AI计算
3. 验证AI优先选择连五位置（胜利）

**期望结果**:
```typescript
const board = new Board(15);
// AI有连五机会
board.placePiece({ x: 5, y: 7 }, 'black');
board.placePiece({ x: 6, y: 7 }, 'black');
board.placePiece({ x: 7, y: 7 }, 'black');
board.placePiece({ x: 8, y: 7 }, 'black');

// 玩家有活四威胁
board.placePiece({ x: 5, y: 5 }, 'white');
board.placePiece({ x: 6, y: 5 }, 'white');
board.placePiece({ x: 7, y: 5 }, 'white');
board.placePiece({ x: 8, y: 5 }, 'white');

const ai = new MediumAI();
const move = ai.calculateMove(board, 'black');

// 应该优先选择连五位置(9,7)，而不是堵截玩家
expect(move).toEqual({ x: 9, y: 7 });
```

**测试数据**:
- 连五位置: (9,7)
- 玩家威胁: (4,5)或(9,5)

---

#### TC-102: 中等AI-必堵活四

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/medium-ai.test.ts`

**前置条件**:
- 玩家有活四威胁

**测试步骤**:
1. 创建棋盘：玩家有活四`_XXXX_`
2. AI没有必胜机会
3. 验证AI必须堵截玩家活四

**期望结果**:
```typescript
const board = new Board(15);
// 玩家活四
board.placePiece({ x: 5, y: 7 }, 'white');
board.placePiece({ x: 6, y: 7 }, 'white');
board.placePiece({ x: 7, y: 7 }, 'white');
board.placePiece({ x: 8, y: 7 }, 'white');

// AI没有威胁
board.placePiece({ x: 0, y: 0 }, 'black');

const ai = new MediumAI();
const move = ai.calculateMove(board, 'black');

// 必须堵截活四的一端
const isBlocking = move.x === 4 || move.x === 9;
expect(isBlocking).toBe(true);
```

**测试数据**:
- 玩家活四: (5,7)-(8,7)
- 堵截位置: (4,7)或(9,7)

---

#### TC-103: 中等AI-候选位置限制

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/medium-ai.test.ts`

**前置条件**:
- 开局棋盘（少量棋子）

**测试步骤**:
1. 创建开局棋盘（10个棋子）
2. 记录AI评估的位置数量
3. 验证不超过100个候选位置

**期望结果**:
```typescript
const board = createOpeningBoard(10);

const ai = new MediumAI();
const evaluateSpy = jest.spyOn(ai, 'evaluatePosition');

ai.calculateMove(board, 'black');

// 验证evaluatePosition调用次数<100
expect(evaluateSpy.mock.calls.length).toBeLessThan(100);
```

**测试数据**:
- 棋盘棋子数: 10个
- 候选位置上限: 100个

---

### 3.3 性能测试

#### TC-104: 中等AI-响应时间测试

**优先级**: P0
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/medium-ai.test.ts`

**前置条件**:
- 中局棋盘（约50个棋子）

**测试步骤**:
1. 创建中局棋盘
2. 记录开始时间
3. 调用calculateMove
4. 验证响应时间<500ms

**期望结果**:
```typescript
const board = createMidGameBoard(50);
const ai = new MediumAI();

const start = performance.now();
const move = ai.calculateMove(board, 'black');
const duration = performance.now() - start;

expect(duration).toBeLessThan(500); // <500ms
console.log(`中等AI响应时间: ${duration.toFixed(2)}ms`);
```

**测试数据**:
- 棋盘棋子数: 50个
- 响应时间要求: <500ms
- 测试次数: 10次取平均值

---

#### TC-105: 中等AI-内存占用测试

**优先级**: P1
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/medium-ai.test.ts`

**前置条件**:
- 性能分析工具已准备

**测试步骤**:
1. 记录初始内存
2. 执行100次AI计算
3. 验证内存增长<2MB

**期望结果**:
```typescript
const initialMemory = process.memoryUsage().heapUsed;

for (let i = 0; i < 100; i++) {
  const board = createRandomBoard();
  const ai = new MediumAI();
  ai.calculateMove(board, 'black');
}

const finalMemory = process.memoryUsage().heapUsed;
const memoryGrowth = (finalMemory - initialMemory) / 1024 / 1024;

expect(memoryGrowth).toBeLessThan(2); // <2MB
console.log(`内存增长: ${memoryGrowth.toFixed(2)}MB`);
```

**测试数据**:
- 测试次数: 100次
- 内存限制: <2MB

---

### 3.4 边界情况测试

#### TC-106: 中等AI-棋盘已满

**优先级**: P2
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/medium-ai.test.ts`

**前置条件**:
- 棋盘已满

**测试步骤**:
1. 创建已满的棋盘
2. 调用calculateMove
3. 验证抛出异常

**期望结果**:
```typescript
const board = createFullBoard();
const ai = new MediumAI();

expect(() => {
  ai.calculateMove(board, 'black');
}).toThrow('No empty positions available');
```

---

#### TC-107: 中等AI-多个相同得分位置

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/medium-ai.test.ts`

**前置条件**:
- 棋盘上有多个相同得分的最优位置

**测试步骤**:
1. 创建对称棋盘
2. 多次调用AI计算
3. 验证AI随机选择相同得分的位置

**期望结果**:
```typescript
const board = createSymmetricBoard();
const ai = new MediumAI();

const moves = Array.from({ length: 20 }, () =>
  ai.calculateMove(board, 'black')
);

// 应该有不同的位置（随机性）
const uniqueMoves = new Set(moves.map(m => `${m.x},${m.y}`));
expect(uniqueMoves.size).toBeGreaterThan(1);
```

**测试数据**:
- 测试次数: 20次
- 期望: 至少2个不同位置

---

## 四、AI Web Worker测试用例

### 4.1 Worker通信测试

#### TC-108: AI Worker-简单AI计算

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/ai-client.test.ts`

**前置条件**:
- AIClient已初始化
- Worker已启动

**测试步骤**:
1. 创建空棋盘
2. 调用aiClient.calculateMove(board, 'easy', 'black')
3. 等待Worker响应
4. 验证返回位置有效

**期望结果**:
```typescript
const aiClient = new AIClient();
const board = new Board(15);

const move = await aiClient.calculateMove(board, 'easy', 'black');

expect(move).toBeDefined();
expect(move.x).toBeGreaterThanOrEqual(0);
expect(move.x).toBeLessThan(15);
expect(move.y).toBeGreaterThanOrEqual(0);
expect(move.y).toBeLessThan(15);
expect(board.isEmpty(move.x, move.y)).toBe(true);
```

**测试数据**:
- 难度: easy
- AI执棋: black

---

#### TC-109: AI Worker-中等AI计算

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/ai-client.test.ts`

**前置条件**:
- AIClient已初始化

**测试步骤**:
1. 创建中局棋盘
2. 调用calculateMove(board, 'medium', 'white')
3. 等待响应
4. 验证返回位置

**期望结果**:
```typescript
const aiClient = new AIClient();
const board = createMidGameBoard(50);

const move = await aiClient.calculateMove(board, 'medium', 'white');

expect(move).toBeDefined();
expect(board.isValid(move.x, move.y)).toBe(true);
```

**测试数据**:
- 难度: medium
- AI执棋: white

---

#### TC-110: AI Worker-并发请求处理

**优先级**: P1
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/ai-client.test.ts`

**前置条件**:
- AIClient已初始化

**测试步骤**:
1. 同时发起3个AI计算请求
2. 等待所有请求完成
3. 验证每个请求返回正确结果

**期望结果**:
```typescript
const aiClient = new AIClient();
const boards = [
  createEmptyBoard(),
  createMidGameBoard(30),
  createMidGameBoard(50)
];

const results = await Promise.all(
  boards.map(board =>
    aiClient.calculateMove(board, 'easy', 'black')
  )
);

results.forEach(move => {
  expect(move).toBeDefined();
  expect(move.x).toBeGreaterThanOrEqual(0);
  expect(move.y).toBeGreaterThanOrEqual(0);
});
```

**测试数据**:
- 并发请求数: 3个

---

### 4.2 错误处理测试

#### TC-111: AI Worker-超时处理

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/ai-client.test.ts`

**前置条件**:
- AIClient已配置超时

**测试步骤**:
1. Mock AI计算，使其延迟超过超时时间
2. 调用calculateMove
3. 验证抛出TimeoutError
4. 验证使用降级方案（随机落子）

**期望结果**:
```typescript
const aiClient = new AIClient();
const board = createComplexBoard();

// Mock延迟响应
jest.spyOn(aiClient.worker, 'calculateMove')
  .mockImplementation(() => new Promise(resolve =>
    setTimeout(() => resolve({ x: 7, y: 7 }), 5000)
  ));

await expect(
  aiClient.calculateMove(board, 'medium', 'black')
).rejects.toThrow('AI timeout');

// 验证降级方案
const fallbackMove = aiClient.getFallbackMove(board);
expect(board.isValid(fallbackMove.x, fallbackMove.y)).toBe(true);
```

**测试数据**:
- 超时时间: 3000ms（medium）
- Mock延迟: 5000ms

---

#### TC-112: AI Worker-无效棋盘数据

**优先级**: P1
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/ai-client.test.ts`

**前置条件**:
- AIClient已初始化

**测试步骤**:
1. 传入null或undefined作为board参数
2. 调用calculateMove
3. 验证抛出适当异常

**期望结果**:
```typescript
const aiClient = new AIClient();

await expect(
  aiClient.calculateMove(null, 'easy', 'black')
).rejects.toThrow('Invalid board data');

await expect(
  aiClient.calculateMove(undefined, 'easy', 'black')
).rejects.toThrow('Invalid board data');
```

---

#### TC-113: AI Worker-Worker崩溃恢复

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/ai-client.test.ts`

**前置条件**:
- AIClient已初始化

**测试步骤**:
1. 模拟Worker崩溃
2. 调用calculateMove
3. 验证自动重新创建Worker
4. 验证计算成功完成

**期望结果**:
```typescript
const aiClient = new AIClient();
const board = createMidGameBoard(30);

// 模拟Worker崩溃
aiClient.worker.terminate();

// 应该自动恢复并完成计算
const move = await aiClient.calculateMove(board, 'easy', 'black');

expect(move).toBeDefined();
expect(aiClient.isWorkerAlive()).toBe(true);
```

---

### 4.3 中断处理测试

#### TC-114: AI Worker-中断计算

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/ai-client.test.ts`

**前置条件**:
- AIClient已初始化
- 正在进行AI计算

**测试步骤**:
1. 发起AI计算请求（medium难度，会较慢）
2. 立即调用cancelAiMove()
3. 验证计算被中断
4. 验证无错误抛出

**期望结果**:
```typescript
const aiClient = new AIClient();
const board = createComplexBoard();

// 发起计算
const promise = aiClient.calculateMove(board, 'medium', 'black');

// 立即中断
aiClient.cancelAiMove();

await expect(promise).rejects.toThrow('Aborted');

// 验证Worker仍可用
const move = await aiClient.calculateMove(board, 'easy', 'black');
expect(move).toBeDefined();
```

---

#### TC-115: AI Worker-多次中断

**优先级**: P1
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/ai-client.test.ts`

**前置条件**:
- AIClient已初始化

**测试步骤**:
1. 发起计算
2. 调用cancelAiMove()多次
3. 验证不报错
4. 验证可以正常重新计算

**期望结果**:
```typescript
const aiClient = new AIClient();
const board = createMidGameBoard(30);

const promise = aiClient.calculateMove(board, 'medium', 'black');

// 多次中断
aiClient.cancelAiMove();
aiClient.cancelAiMove();
aiClient.cancelAiMove();

await expect(promise).rejects.toThrow();

// 验证恢复
const move = await aiClient.calculateMove(board, 'easy', 'black');
expect(move).toBeDefined();
```

---

### 4.4 性能测试

#### TC-116: AI Worker-不阻塞UI

**优先级**: P0
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/ai-client.test.ts`

**前置条件**:
- 浏览器环境

**测试步骤**:
1. 发起AI计算（medium难度）
2. 同时更新UI状态
3. 验证UI更新不被阻塞

**期望结果**:
```typescript
const aiClient = new AIClient();
const board = createComplexBoard();

let uiUpdated = false;

// 发起AI计算
const promise = aiClient.calculateMove(board, 'medium', 'black');

// 同时尝试更新UI
setTimeout(() => {
  // 模拟UI更新
  document.body.style.backgroundColor = 'red';
  uiUpdated = true;
}, 50);

await promise;

expect(uiUpdated).toBe(true); // UI应该能正常更新
```

---

#### TC-117: AI Worker-内存泄漏检查

**优先级**: P1
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/ai-client.test.ts`

**前置条件**:
- 性能监控工具

**测试步骤**:
1. 记录初始内存
2. 创建和销毁AIClient 100次
3. 记录最终内存
4. 验证无内存泄漏

**期望结果**:
```typescript
const initialMemory = process.memoryUsage().heapUsed;

for (let i = 0; i < 100; i++) {
  const aiClient = new AIClient();
  const board = createRandomBoard();
  await aiClient.calculateMove(board, 'easy', 'black');
  aiClient.terminate();
}

global.gc(); // 手动触发垃圾回收

const finalMemory = process.memoryUsage().heapUsed;
const memoryGrowth = (finalMemory - initialMemory) / 1024 / 1024;

expect(memoryGrowth).toBeLessThan(5); // <5MB增长
console.log(`Worker内存增长: ${memoryGrowth.toFixed(2)}MB`);
```

**测试数据**:
- 测试次数: 100次
- 内存限制: <5MB

---

## 五、游戏流程控制测试用例

### 5.1 PVE模式初始化测试

#### TC-118: PVE模式-玩家执黑先手

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/game/core/__tests__/game-flow.test.ts`

**前置条件**:
- 游戏未开始
- 已选择PVE模式

**测试步骤**:
1. 调用startPVEGame('easy', true)
2. 验证游戏模式为pve
3. 验证难度为easy
4. 验证aiPlayer为white
5. 验证当前玩家为black
6. 验证游戏状态为playing

**期望结果**:
```typescript
const controller = new GameFlowController();
controller.startPVEGame('easy', true);

expect(controller.getGameMode()).toBe('pve');
expect(controller.getDifficulty()).toBe('easy');
expect(controller.getAiPlayer()).toBe('white');
expect(controller.getCurrentPlayer()).toBe('black');
expect(controller.getGameStatus()).toBe('playing');
expect(controller.isAiThinking()).toBe(false);
```

**测试数据**:
- 难度: easy
- 玩家先手: true
- AI执棋: white

---

#### TC-119: PVE模式-玩家执白后手

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/game/core/__tests__/game-flow.test.ts`

**前置条件**:
- 游戏未开始

**测试步骤**:
1. 调用startPVEGame('medium', false)
2. 验证aiPlayer为black
3. 验证AI立即落子
4. 验证落子后当前玩家为white

**期望结果**:
```typescript
const controller = new GameFlowController();
controller.startPVEGame('medium', false);

expect(controller.getAiPlayer()).toBe('black');
expect(controller.isAiThinking()).toBe(true);

// 等待AI落子
await waitFor(() => controller.isAiThinking() === false);

expect(controller.getCurrentPlayer()).toBe('white');
expect(controller.getBoard().getPiece(7, 7)).toBe('black'); // AI天元开局
```

**测试数据**:
- 难度: medium
- 玩家先手: false
- AI执棋: black

---

#### TC-120: PVE模式-难度切换

**优先级**: P1
**类型**: 集成测试
**测试文件**: `src/game/core/__tests__/game-flow.test.ts`

**前置条件**:
- PVE游戏进行中

**测试步骤**:
1. 开始easy难度游戏
2. 玩家落子
3. 切换到medium难度
4. 验证AI使用medium难度计算

**期望结果**:
```typescript
const controller = new GameFlowController();
controller.startPVEGame('easy', true);

controller.handlePlayerMove({ x: 7, y: 7 });
await waitForAiMove();

controller.setDifficulty('medium');
controller.handlePlayerMove({ x: 7, y: 8 });

// 验证使用medium难度
expect(controller.getDifficulty()).toBe('medium');
await waitFor(() => performance.now() - startTime > 100); // medium应该更慢
```

---

### 5.2 回合切换测试

#### TC-121: 回合切换-玩家落子触发AI

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/game/core/__tests__/game-flow.test.ts`

**前置条件**:
- PVE游戏进行中
- 玩家回合

**测试步骤**:
1. 玩家落子
2. 验证isAiThinking变为true
3. 验证棋盘被禁用
4. 等待AI计算完成
5. 验证AI已落子
6. 验证isAiThinking变为false

**期望结果**:
```typescript
const controller = new GameFlowController();
controller.startPVEGame('easy', true);

// 玩家落子
controller.handlePlayerMove({ x: 7, y: 7 });

// 验证状态
expect(controller.isAiThinking()).toBe(true);
expect(controller.canPlayerMakeMove()).toBe(false);

// 等待AI
await waitFor(() => controller.isAiThinking() === false);

// 验证AI落子
const lastMove = controller.getLastMove();
expect(lastMove.player).toBe('white');
expect(controller.getCurrentPlayer()).toBe('black');
expect(controller.canPlayerMakeMove()).toBe(true);
```

---

#### TC-122: 回合切换-AI执黑先手

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/game/core/__tests__/game-flow.test.ts`

**前置条件**:
- PVE模式，AI执黑

**测试步骤**:
1. 开始游戏（playerFirst: false）
2. 等待AI落子
3. 验证轮到玩家
4. 玩家落子
5. 验证触发AI回合

**期望结果**:
```typescript
const controller = new GameFlowController();
controller.startPVEGame('easy', false);

// AI应该立即落子
await waitFor(() => controller.isAiThinking() === false);

expect(controller.getCurrentPlayer()).toBe('white');
expect(controller.getLastMove().player).toBe('black');

// 玩家落子
controller.handlePlayerMove({ x: 7, y: 8 });
expect(controller.isAiThinking()).toBe(true);
```

---

#### TC-123: 回合切换-游戏结束不触发AI

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/game/core/__tests__/game-flow.test.ts`

**前置条件**:
- PVE游戏进行中
- 玩家有获胜机会

**测试步骤**:
1. 创建玩家即将获胜的棋盘（已有四连）
2. 玩家落子形成五连
3. 验证游戏结束
4. 验证AI不落子

**期望结果**:
```typescript
const controller = new GameFlowController();
const board = createBoardWithFourInRow('black'); // 黑棋四连
controller.setBoard(board);

controller.startPVEGame('easy', true);
controller.handlePlayerMove({ x: 9, y: 7 }); // 形成五连

// 验证游戏结束
expect(controller.getGameStatus()).toBe('won');
expect(controller.getWinner()).toBe('black');

// AI不应该思考
expect(controller.isAiThinking()).toBe(false);
```

---

### 5.3 错误处理测试

#### TC-124: AI计算失败降级

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/game/core/__tests__/game-flow.test.ts`

**前置条件**:
- PVE游戏进行中
- AI Worker异常

**测试步骤**:
1. Mock AI计算抛出异常
2. 玩家落子
3. 验证使用随机落子降级
4. 验证游戏继续进行

**期望结果**:
```typescript
const controller = new GameFlowController();
controller.startPVEGame('easy', true);

// Mock AI失败
jest.spyOn(controller.aiClient, 'calculateMove')
  .mockRejectedValue(new Error('AI failed'));

// 玩家落子
await controller.handlePlayerMove({ x: 7, y: 7 });

// 应该使用随机落子
expect(controller.getGameStatus()).toBe('playing');
expect(controller.getLastMove().player).toBe('white');
expect(controller.getCurrentPlayer()).toBe('black');
```

---

#### TC-125: AI超时降级

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/game/core/__tests__/game-flow.test.ts`

**前置条件**:
- PVE游戏进行中
- AI计算超时

**测试步骤**:
1. Mock AI计算延迟超过超时时间
2. 玩家落子
3. 验证超时后使用随机落子
4. 验证显示超时提示

**期望结果**:
```typescript
const controller = new GameFlowController();
controller.startPVEGame('medium', true);

// Mock超时
jest.spyOn(controller.aiClient, 'calculateMove')
  .mockImplementation(() => new Promise(
    resolve => setTimeout(() => resolve({ x: 7, y: 7 }), 5000)
  ));

const toastSpy = jest.spyOn(toast, 'show');

await controller.handlePlayerMove({ x: 7, y: 7 });

// 验证超时提示
expect(toastSpy).toHaveBeenCalledWith(
  expect.stringContaining('超时')
);

// 验证游戏继续
expect(controller.getGameStatus()).toBe('playing');
```

---

#### TC-126: 玩家AI思考时重复落子

**优先级**: P1
**类型**: 集成测试
**测试文件**: `src/game/core/__tests__/game-flow.test.ts`

**前置条件**:
- PVE游戏进行中
- AI思考中

**测试步骤**:
1. 玩家落子触发AI
2. AI思考期间玩家再次点击棋盘
3. 验证第二个落子被忽略
4. 验证显示提示信息

**期望结果**:
```typescript
const controller = new GameFlowController();
controller.startPVEGame('easy', true);

// 第一次落子
controller.handlePlayerMove({ x: 7, y: 7 });
expect(controller.isAiThinking()).toBe(true);

// 第二次落子（应该被忽略）
const result = controller.handlePlayerMove({ x: 7, y: 8 });
expect(result).toBe(false);
expect(controller.getBoard().isEmpty(7, 8)).toBe(true);
```

---

#### TC-127: 重新开始取消AI计算

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/game/core/__tests__/game-flow.test.ts`

**前置条件**:
- PVE游戏进行中
- AI思考中

**测试步骤**:
1. 玩家落子触发AI（medium）
2. AI计算期间点击重新开始
3. 验证AI计算被取消
4. 验证游戏重置

**期望结果**:
```typescript
const controller = new GameFlowController();
controller.startPVEGame('medium', true);

controller.handlePlayerMove({ x: 7, y: 7 });
expect(controller.isAiThinking()).toBe(true);

// 重新开始
controller.restartGame();

// 验证AI被取消
expect(controller.isAiThinking()).toBe(false);
expect(controller.getGameStatus()).toBe('idle');
expect(controller.getBoard().getPieceCount()).toBe(0);
```

---

### 5.4 状态一致性测试

#### TC-128: 状态版本控制-过期AI结果

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/game/core/__tests__/game-flow.test.ts`

**前置条件**:
- PVE游戏进行中

**测试步骤**:
1. 玩家落子触发AI
2. AI计算期间玩家重新开始游戏
3. AI计算完成
4. 验证过期结果被丢弃

**期望结果**:
```typescript
const controller = new GameFlowController();
controller.startPVEGame('medium', true);

// 玩家落子
controller.handlePlayerMove({ x: 7, y: 7 });

// 重新开始（使AI结果过期）
controller.restartGame();

// 等待原AI计算完成
await delay(500);

// 验证AI结果没有应用到新棋盘
expect(controller.getBoard().getPieceCount()).toBe(0);
expect(controller.getGameStatus()).toBe('idle');
```

---

#### TC-129: 快速操作防止竞态

**优先级**: P1
**类型**: 集成测试
**测试文件**: `src/game/core/__tests__/game-flow.test.ts`

**前置条件**:
- PVE游戏进行中

**测试步骤**:
1. 快速连续落子3次
2. 验证每次都正确触发AI
3. 验证无竞态条件

**期望结果**:
```typescript
const controller = new GameFlowController();
controller.startPVEGame('easy', true);

// 快速落子
await controller.handlePlayerMove({ x: 7, y: 7 });
await controller.handlePlayerMove({ x: 7, y: 8 });
await controller.handlePlayerMove({ x: 7, y: 9 });

// 验证正确状态
expect(controller.getBoard().getPieceCount()).toBe(6); // 3玩家 + 3AI
expect(controller.getGameStatus()).toBe('playing');
```

---

## 六、UI组件测试用例

### 6.1 计时器组件测试

#### TC-130: Timer-初始化状态

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/components/Game/__tests__/Timer.test.tsx`

**前置条件**:
- Timer组件已渲染

**测试步骤**:
1. 渲染Timer组件，isRunning=false
2. 验证显示00:00
3. 验证黑棋计时器高亮

**期望结果**:
```typescript
const { getByText } = render(
  <Timer
    isRunning={false}
    blackTime={0}
    whiteTime={0}
    currentPlayer="black"
  />
);

expect(getByText('黑棋: 00:00')).toBeInTheDocument();
expect(getByText('白棋: 00:00')).toBeInTheDocument();

const blackTimer = getByText('黑棋: 00:00');
expect(blackTimer).toHaveClass('active');
```

**测试数据**:
- 初始时间: 0秒
- 当前玩家: black

---

#### TC-131: Timer-时间累加

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/components/Game/__tests__/Timer.test.tsx`

**前置条件**:
- Timer组件运行中

**测试步骤**:
1. 渲染Timer，isRunning=true，blackTime=0
2. 等待1秒
3. 验证黑棋时间变为00:01
4. 等待60秒
5. 验证时间变为01:01

**期望结果**:
```typescript
const { getByText, rerender } = render(
  <Timer
    isRunning={true}
    blackTime={0}
    whiteTime={0}
    currentPlayer="black"
  />
);

// 1秒后
act(() => {
  jest.advanceTimersByTime(1000);
});
rerender(
  <Timer
    isRunning={true}
    blackTime={1}
    whiteTime={0}
    currentPlayer="black"
  />
);
expect(getByText('黑棋: 00:01')).toBeInTheDocument();

// 60秒后
act(() => {
  jest.advanceTimersByTime(60000);
});
rerender(
  <Timer
    isRunning={true}
    blackTime={61}
    whiteTime={0}
    currentPlayer="black"
  />
);
expect(getByText('黑棋: 01:01')).toBeInTheDocument();
```

**测试数据**:
- 时间增量: 1秒, 60秒
- 期望格式: MM:SS

---

#### TC-132: Timer-暂停和恢复

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/components/Game/__tests__/Timer.test.tsx`

**前置条件**:
- Timer组件运行中

**测试步骤**:
1. 启动计时器（isRunning=true）
2. 等待5秒
3. 暂停（isRunning=false）
4. 等待10秒
5. 恢复（isRunning=true）
6. 验证时间仍为5秒

**期望结果**:
```typescript
const { getByText, rerender } = render(
  <Timer
    isRunning={true}
    blackTime={0}
    whiteTime={0}
    currentPlayer="black"
  />
);

// 计时5秒
act(() => {
  jest.advanceTimersByTime(5000);
});
rerender(
  <Timer
    isRunning={false}
    blackTime={5}
    whiteTime={0}
    currentPlayer="black"
  />
);

// 暂停期间时间不增加
act(() => {
  jest.advanceTimersByTime(10000);
});
expect(getByText('黑棋: 00:05')).toBeInTheDocument();

// 恢复后继续计时
rerender(
  <Timer
    isRunning={true}
    blackTime={5}
    whiteTime={0}
    currentPlayer="black"
  />
);
act(() => {
  jest.advanceTimersByTime(1000);
});
expect(getByText('黑棋: 00:06')).toBeInTheDocument();
```

---

#### TC-133: Timer-回合切换

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/components/Game/__tests__/Timer.test.tsx`

**前置条件**:
- 计时器运行中

**测试步骤**:
1. 黑棋计时到10秒
2. 切换到白棋回合
3. 等待5秒
4. 验证白棋计时到5秒
5. 验证黑棋仍为10秒

**期望结果**:
```typescript
const { getByText, rerender } = render(
  <Timer
    isRunning={true}
    blackTime={10}
    whiteTime={0}
    currentPlayer="black"
  />
);

// 切换到白棋
rerender(
  <Timer
    isRunning={true}
    blackTime={10}
    whiteTime={0}
    currentPlayer="white"
  />
);

act(() => {
  jest.advanceTimersByTime(5000);
});
rerender(
  <Timer
    isRunning={true}
    blackTime={10}
    whiteTime={5}
    currentPlayer="white"
  />
);

expect(getByText('黑棋: 00:10')).toBeInTheDocument();
expect(getByText('白棋: 00:05')).toBeInTheDocument();

// 白棋计时器应该高亮
const whiteTimer = getByText('白棋: 00:05');
expect(whiteTimer).toHaveClass('active');
```

---

#### TC-134: Timer-时间格式化

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/components/Game/__tests__/Timer.test.tsx`

**前置条件**:
- Timer组件已渲染

**测试步骤**:
1. 测试各种时间的格式化
2. 验证格式正确（MM:SS）

**期望结果**:
```typescript
const testCases = [
  { seconds: 0, expected: '00:00' },
  { seconds: 5, expected: '00:05' },
  { seconds: 59, expected: '00:59' },
  { seconds: 60, expected: '01:00' },
  { seconds: 65, expected: '01:05' },
  { seconds: 366, expected: '06:06' },
  { seconds: 3600, expected: '60:00' }
];

testCases.forEach(({ seconds, expected }) => {
  const { getByText } = render(
    <Timer
      isRunning={false}
      blackTime={seconds}
      whiteTime={0}
      currentPlayer="black"
    />
  );

  expect(getByText(`黑棋: ${expected}`)).toBeInTheDocument();
});
```

**测试数据**:
- 测试时间: 0s, 5s, 59s, 60s, 65s, 366s, 3600s

---

### 6.2 状态提示组件测试

#### TC-135: StatusIndicator-准备开始

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/components/Game/__tests__/StatusIndicator.test.tsx`

**前置条件**:
- 组件已渲染

**测试步骤**:
1. 渲染StatusIndicator，status='idle'
2. 验证显示"准备开始"
3. 验证样式为灰色

**期望结果**:
```typescript
const { getByText } = render(
  <StatusIndicator
    gameStatus="idle"
    currentPlayer="black"
    winner={null}
    isAiThinking={false}
  />
);

expect(getByText('准备开始')).toBeInTheDocument();
expect(getByText('准备开始')).toHaveClass('status-idle');
```

---

#### TC-136: StatusIndicator-黑棋落子

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/components/Game/__tests__/StatusIndicator.test.tsx`

**前置条件**:
- 游戏进行中

**测试步骤**:
1. 渲染组件，status='playing', current='black'
2. 验证显示"黑棋落子"
3. 验证样式为绿色

**期望结果**:
```typescript
const { getByText } = render(
  <StatusIndicator
    gameStatus="playing"
    currentPlayer="black"
    winner={null}
    isAiThinking={false}
  />
);

expect(getByText('黑棋落子')).toBeInTheDocument();
expect(getByText('黑棋落子')).toHaveClass('status-playing');
```

---

#### TC-137: StatusIndicator-AI思考中

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/components/Game/__tests__/StatusIndicator.test.tsx`

**前置条件**:
- PVE模式，AI思考中

**测试步骤**:
1. 渲染组件，status='playing', isAiThinking=true
2. 验证显示"AI思考中..."
3. 验证样式为黄色且有闪烁动画

**期望结果**:
```typescript
const { getByText } = render(
  <StatusIndicator
    gameStatus="playing"
    currentPlayer="white"
    winner={null}
    isAiThinking={true}
  />
);

expect(getByText('AI思考中...')).toBeInTheDocument();
expect(getByText('AI思考中...')).toHaveClass('status-ai-thinking');
expect(getByText('AI思考中...')).toHaveClass('anim-pulse');
```

---

#### TC-138: StatusIndicator-黑棋获胜

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/components/Game/__tests__/StatusIndicator.test.tsx`

**前置条件**:
- 游戏结束

**测试步骤**:
1. 渲染组件，status='won', winner='black'
2. 验证显示"黑棋获胜！"
3. 验证样式为大号金色

**期望结果**:
```typescript
const { getByText } = render(
  <StatusIndicator
    gameStatus="won"
    currentPlayer="black"
    winner="black"
    isAiThinking={false}
  />
);

expect(getByText('黑棋获胜！')).toBeInTheDocument();
expect(getByText('黑棋获胜！')).toHaveClass('status-won');
expect(getByText('黑棋获胜！')).toHaveClass('text-xl');
```

---

#### TC-139: StatusIndicator-白棋获胜

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/components/Game/__tests__/StatusIndicator.test.tsx`

**前置条件**:
- 游戏结束

**测试步骤**:
1. 渲染组件，status='won', winner='white'
2. 验证显示"白棋获胜！"

**期望结果**:
```typescript
const { getByText } = render(
  <StatusIndicator
    gameStatus="won"
    currentPlayer="white"
    winner="white"
    isAiThinking={false}
  />
);

expect(getByText('白棋获胜！')).toBeInTheDocument();
```

---

#### TC-140: StatusIndicator-平局

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/components/Game/__tests__/StatusIndicator.test.tsx`

**前置条件**:
- 游戏结束，平局

**测试步骤**:
1. 渲染组件，status='draw'
2. 验证显示"平局！"

**期望结果**:
```typescript
const { getByText } = render(
  <StatusIndicator
    gameStatus="draw"
    currentPlayer="black"
    winner={null}
    isAiThinking={false}
  />
);

expect(getByText('平局！')).toBeInTheDocument();
```

---

### 6.3 游戏控制面板测试

#### TC-141: GameControls-重新开始按钮

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/components/Game/__tests__/GameControls.test.tsx`

**前置条件**:
- 组件已渲染
- 游戏进行中

**测试步骤**:
1. 渲染GameControls，status='playing'
2. 点击重新开始按钮
3. 验证onRestart被调用

**期望结果**:
```typescript
const onRestart = jest.fn();
const { getByText } = render(
  <GameControls
    onRestart={onRestart}
    onBackToMenu={jest.fn()}
    gameStatus="playing"
    isAiThinking={false}
  />
);

fireEvent.click(getByText('重新开始'));
expect(onRestart).toHaveBeenCalledTimes(1);
```

---

#### TC-142: GameControls-AI思考时禁用重新开始

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/components/Game/__tests__/GameControls.test.tsx`

**前置条件**:
- PVE模式，AI思考中

**测试步骤**:
1. 渲染组件，isAiThinking=true
2. 验证重新开始按钮禁用
3. 尝试点击
4. 验证onRestart不被调用

**期望结果**:
```typescript
const onRestart = jest.fn();
const { getByText } = render(
  <GameControls
    onRestart={onRestart}
    onBackToMenu={jest.fn()}
    gameStatus="playing"
    isAiThinking={true}
  />
);

const restartButton = getByText('重新开始');
expect(restartButton).toBeDisabled();

fireEvent.click(restartButton);
expect(onRestart).not.toHaveBeenCalled();
```

---

#### TC-143: GameControls-返回菜单按钮

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/components/Game/__tests__/GameControls.test.tsx`

**前置条件**:
- 组件已渲染

**测试步骤**:
1. 渲染GameControls
2. 点击返回菜单按钮
3. 验证onBackToMenu被调用

**期望结果**:
```typescript
const onBackToMenu = jest.fn();
const { getByText } = render(
  <GameControls
    onRestart={jest.fn()}
    onBackToMenu={onBackToMenu}
    gameStatus="playing"
    isAiThinking={false}
  />
);

fireEvent.click(getByText('返回菜单'));
expect(onBackToMenu).toHaveBeenCalledTimes(1);
```

---

#### TC-144: GameControls-游戏结束状态

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/components/Game/__tests__/GameControls.test.tsx`

**前置条件**:
- 游戏已结束

**测试步骤**:
1. 渲染组件，status='won'
2. 验证按钮可点击
3. 验证无禁用状态

**期望结果**:
```typescript
const { getByText } = render(
  <GameControls
    onRestart={jest.fn()}
    onBackToMenu={jest.fn()}
    gameStatus="won"
    isAiThinking={false}
  />
);

const restartButton = getByText('重新开始');
const backButton = getByText('返回菜单');

expect(restartButton).not.toBeDisabled();
expect(backButton).not.toBeDisabled();
```

---

## 七、E2E测试用例

### 7.1 完整游戏流程测试

#### TC-145: E2E-简单AI完整对局

**优先级**: P0
**类型**: E2E测试
**测试文件**: `e2e/week-3-pve-easy.spec.ts`

**前置条件**:
- 已打开游戏页面
- 已选择PVE模式

**测试步骤**:
1. 选择难度：简单
2. 选择先后手：执黑先手
3. 点击开始游戏
4. 玩家在天元(7,7)落子
5. 等待AI响应（<100ms）
6. 继续对局直到游戏结束
7. 验证游戏结果

**期望结果**:
```typescript
test('完整简单AI对局', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // 选择PVE模式
  await page.click('[data-testid="mode-pve"]');

  // 选择简单难度
  await page.click('[data-testid="difficulty-easy"]');

  // 选择执黑先手
  await page.click('[data-testid="player-first"]');

  // 开始游戏
  await page.click('[data-testid="start-game"]');

  // 验证游戏开始
  await expect(page.locator('[data-testid="game-status"]'))
    .toHaveText('黑棋落子');

  // 玩家落子
  await page.click('[data-testid="cell-7-7"]');

  // 等待AI响应
  await page.waitForSelector('[data-testid="last-move"]', {
    timeout: 1000
  });

  // 验证AI落子
  const lastMove = await page.locator('[data-testid="last-move"]');
  await expect(lastMove).toBeVisible();

  // 继续对局直到结束
  while (await page.locator('[data-testid="game-status"]')
    .textContent() !== '黑棋获胜！' &&
    await page.locator('[data-testid="game-status"]')
      .textContent() !== '白棋获胜！') {

    const cell = await getRandomEmptyCell(page);
    await page.click(cell);
    await page.waitForTimeout(500); // 等待AI
  }

  // 验证游戏结束
  const status = await page.locator('[data-testid="game-status"]').textContent();
  expect(status).toMatch(/获胜！/);
});
```

**测试数据**:
- 难度: easy
- 先手: 玩家执黑

---

#### TC-146: E2E-中等AI完整对局

**优先级**: P0
**类型**: E2E测试
**测试文件**: `e2e/week-3-pve-medium.spec.ts`

**前置条件**:
- 已打开游戏页面

**测试步骤**:
1. 选择PVE模式
2. 选择中等难度
3. 选择执白后手
4. 开始游戏
5. 等待AI先手落子
6. 玩家落子
7. 继续对局
8. 验证AI响应时间<500ms

**期望结果**:
```typescript
test('完整中等AI对局', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // 选择PVE模式
  await page.click('[data-testid="mode-pve"]');

  // 选择中等难度
  await page.click('[data-testid="difficulty-medium"]');

  // 选择执白后手
  await page.click('[data-testid="player-second"]');

  // 开始游戏
  const startTime = Date.now();
  await page.click('[data-testid="start-game"]');

  // 等待AI先手
  await page.waitForSelector('[data-testid="last-move"]', {
    timeout: 3000
  });
  const aiResponseTime = Date.now() - startTime;
  expect(aiResponseTime).toBeLessThan(500);

  // 验证AI执黑
  const lastMove = await page.locator('[data-testid="last-move"]');
  await expect(lastMove).toHaveAttribute('data-player', 'black');

  // 玩家落子
  await page.click('[data-testid="cell-7-8"]');

  // 继续对局
  await playGameUntilEnd(page);
});
```

**测试数据**:
- 难度: medium
- 先手: AI执黑
- 响应时间: <500ms

---

#### TC-147: E2E-计时器功能验证

**优先级**: P1
**类型**: E2E测试
**测试文件**: `e2e/week-3-timer.spec.ts`

**前置条件**:
- 游戏进行中

**测试步骤**:
1. 开始PVE游戏
2. 玩家落子
3. 观察黑棋计时器增加
4. 等待AI落子
5. 观察白棋计时器增加
6. 验证计时器格式正确

**期望结果**:
```typescript
test('计时器正常工作', async ({ page }) => {
  await startPVEGame(page, 'easy', true);

  // 获取初始时间
  const blackTime = await page.locator('[data-testid="timer-black"]').textContent();
  expect(blackTime).toBe('00:00');

  // 等待5秒
  await page.waitForTimeout(5000);

  // 验证时间增加
  const newBlackTime = await page.locator('[data-testid="timer-black"]').textContent();
  expect(newBlackTime).toBe('00:05');

  // 玩家落子
  await page.click('[data-testid="cell-7-7"]');

  // 等待AI落子
  await page.waitForSelector('[data-testid="last-move"]');

  // 验证白棋计时器启动
  const whiteTime = await page.locator('[data-testid="timer-white"]').textContent();
  expect(whiteTime).toMatch(/\d{2}:\d{2}/);
});
```

**测试数据**:
- 计时时间: 5秒
- 格式: MM:SS

---

#### TC-148: E2E-状态提示正确性

**优先级**: P1
**类型**: E2E测试
**测试文件**: `e2e/week-3-status.spec.ts`

**前置条件**:
- 游戏进行中

**测试步骤**:
1. 开始游戏，验证"黑棋落子"
2. 玩家落子，验证"AI思考中..."
3. AI落子后，验证"白棋落子"
4. 游戏结束，验证获胜提示

**期望结果**:
```typescript
test('状态提示正确', async ({ page }) => {
  await startPVEGame(page, 'easy', true);

  // 验证初始状态
  await expect(page.locator('[data-testid="game-status"]'))
    .toHaveText('黑棋落子');

  // 玩家落子
  await page.click('[data-testid="cell-7-7"]');

  // 验证AI思考中
  await expect(page.locator('[data-testid="game-status"]'))
    .toHaveText('AI思考中...');

  // 等待AI落子
  await page.waitForSelector('[data-testid="last-move"]');

  // 验证回到玩家回合
  await expect(page.locator('[data-testid="game-status"]'))
    .toHaveText('黑棋落子');
});
```

---

#### TC-149: E2E-重新开始功能

**优先级**: P0
**类型**: E2E测试
**测试文件**: `e2e/week-3-restart.spec.ts`

**前置条件**:
- 游戏进行中

**测试步骤**:
1. 开始PVE游戏
2. 落子3-5步
3. 点击重新开始
4. 验证棋盘清空
5. 验证计时器重置
6. 验证游戏状态回到准备开始

**期望结果**:
```typescript
test('重新开始游戏', async ({ page }) => {
  await startPVEGame(page, 'easy', true);

  // 落子几步
  await page.click('[data-testid="cell-7-7"]');
  await page.waitForTimeout(500);
  await page.click('[data-testid="cell-7-8"]');
  await page.waitForTimeout(500);

  // 点击重新开始
  await page.click('[data-testid="restart-button"]');

  // 验证棋盘清空
  const pieces = await page.locator('[data-testid^="piece-"]').count();
  expect(pieces).toBe(0);

  // 验证计时器重置
  await expect(page.locator('[data-testid="timer-black"]'))
    .toHaveText('00:00');
  await expect(page.locator('[data-testid="timer-white"]'))
    .toHaveText('00:00');
});
```

---

#### TC-150: E2E-返回菜单功能

**优先级**: P1
**类型**: E2E测试
**测试文件**: `e2e/week-3-back-menu.spec.ts`

**前置条件**:
- 游戏进行中

**测试步骤**:
1. 开始PVE游戏
2. 落子几步
3. 点击返回菜单
4. 验证返回主菜单
5. 验证可以重新开始游戏

**期望结果**:
```typescript
test('返回主菜单', async ({ page }) => {
  await startPVEGame(page, 'easy', true);

  await page.click('[data-testid="cell-7-7"]');
  await page.waitForTimeout(500);

  // 点击返回菜单
  await page.click('[data-testid="back-button"]');

  // 验证返回主菜单
  await expect(page).toHaveURL(/.*\/menu/);
  await expect(page.locator('[data-testid="main-menu"]')).toBeVisible();

  // 验证可以重新开始
  await page.click('[data-testid="mode-pve"]');
  await expect(page.locator('[data-testid="difficulty-selection"]'))
    .toBeVisible();
});
```

---

### 7.2 性能测试

#### TC-151: E2E-简单AI响应时间

**优先级**: P0
**类型**: 性能测试
**测试文件**: `e2e/week-3-performance.spec.ts`

**前置条件**:
- PVE游戏进行中

**测试步骤**:
1. 开始简单AI游戏
2. 测量10次AI响应时间
3. 验证平均响应时间<100ms
4. 验证最大响应时间<200ms

**期望结果**:
```typescript
test('简单AI响应时间', async ({ page }) => {
  await startPVEGame(page, 'easy', true);

  const responseTimes = [];

  for (let i = 0; i < 10; i++) {
    const startTime = Date.now();
    await page.click('[data-testid="cell-7-7"]');
    await page.waitForSelector('[data-testid="last-move"]', {
      timeout: 1000
    });
    const duration = Date.now() - startTime;
    responseTimes.push(duration);
  }

  const avgTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
  const maxTime = Math.max(...responseTimes);

  expect(avgTime).toBeLessThan(100);
  expect(maxTime).toBeLessThan(200);

  console.log(`简单AI平均响应时间: ${avgTime.toFixed(2)}ms`);
  console.log(`简单AI最大响应时间: ${maxTime}ms`);
});
```

**测试数据**:
- 测试次数: 10次
- 平均时间: <100ms
- 最大时间: <200ms

---

#### TC-152: E2E-中等AI响应时间

**优先级**: P0
**类型**: 性能测试
**测试文件**: `e2e/week-3-performance.spec.ts`

**前置条件**:
- PVE游戏进行中

**测试步骤**:
1. 开始中等AI游戏
2. 测量10次AI响应时间
3. 验证平均响应时间<500ms

**期望结果**:
```typescript
test('中等AI响应时间', async ({ page }) => {
  await startPVEGame(page, 'medium', true);

  const responseTimes = [];

  for (let i = 0; i < 10; i++) {
    const startTime = Date.now();
    await page.click('[data-testid="cell-7-7"]');
    await page.waitForSelector('[data-testid="last-move"]', {
      timeout: 1000
    });
    const duration = Date.now() - startTime;
    responseTimes.push(duration);
  }

  const avgTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;

  expect(avgTime).toBeLessThan(500);
  console.log(`中等AI平均响应时间: ${avgTime.toFixed(2)}ms`);
});
```

**测试数据**:
- 测试次数: 10次
- 平均时间: <500ms

---

#### TC-153: E2E-内存占用测试

**优先级**: P1
**类型**: 性能测试
**测试文件**: `e2e/week-3-memory.spec.ts`

**前置条件**:
- 浏览器开发者工具

**测试步骤**:
1. 开始PVE游戏
2. 进行5局完整对局
3. 每局后记录内存
4. 验证无内存泄漏

**期望结果**:
```typescript
test('内存占用', async ({ page, context }) => {
  const memories = [];

  for (let i = 0; i < 5; i++) {
    await startPVEGame(page, 'easy', true);
    await playGameUntilEnd(page);
    await page.click('[data-testid="restart-button"]');

    // 获取内存
    const metrics = await page.metrics();
    memories.push(metrics.JSHeapUsedSize / 1024 / 1024); // MB
  }

  // 验证内存增长<10MB
  const memoryGrowth = memories[memories.length - 1] - memories[0];
  expect(memoryGrowth).toBeLessThan(10);

  console.log('内存占用:', memories.map(m => `${m.toFixed(2)}MB`).join(', '));
});
```

**测试数据**:
- 游戏局数: 5局
- 内存增长: <10MB

---

## 八、回归测试

### 8.1 Week 1功能回归

#### TC-154: 回归-Week 1所有测试通过

**优先级**: P0
**类型**: 回归测试
**测试文件**: 自动运行所有Week 1测试

**前置条件**:
- Week 3代码已完成

**测试步骤**:
1. 运行Week 1所有测试
2. 验证13个测试全部通过
3. 验证无回归问题

**期望结果**:
```bash
npm test -- src/store/__tests__/ --testPathPattern="week-1"
```
- 测试通过率: 100%
- 测试数量: 13个

---

### 8.2 Week 2功能回归

#### TC-155: 回归-Week 2所有测试通过

**优先级**: P0
**类型**: 回归测试
**测试文件**: 自动运行所有Week 2测试

**前置条件**:
- Week 3代码已完成

**测试步骤**:
1. 运行Week 2所有测试
2. 验证70个测试全部通过
3. 验证无回归问题

**期望结果**:
```bash
npm test -- src/game/core/__tests__/ --testPathPattern="week-2"
```
- 测试通过率: 100%
- 测试数量: 70个

---

## 九、测试统计

### 9.1 测试覆盖统计

| 模块 | 测试用例数 | 覆盖率目标 |
|------|-----------|-----------|
| 简单AI | 9个（TC-084~092） | 100% |
| 中等AI | 15个（TC-093~107） | 100% |
| AI Worker | 10个（TC-108~117） | >90% |
| 游戏流程 | 12个（TC-118~129） | >90% |
| UI组件 | 15个（TC-130~144） | >80% |
| E2E测试 | 9个（TC-145~153） | 关键路径100% |
| 回归测试 | 2个（TC-154~155） | 100% |
| **合计** | **72个** | **>80%** |

### 9.2 优先级统计

| 优先级 | 数量 | 占比 |
|--------|------|------|
| P0 | 40个 | 55.6% |
| P1 | 25个 | 34.7% |
| P2 | 7个 | 9.7% |

### 9.3 测试类型统计

| 类型 | 数量 | 占比 |
|------|------|------|
| 单元测试 | 40个 | 55.6% |
| 集成测试 | 16个 | 22.2% |
| E2E测试 | 9个 | 12.5% |
| 性能测试 | 5个 | 6.9% |
| 回归测试 | 2个 | 2.8% |

---

## 十、验收标准

### 10.1 功能验收
- [ ] 所有72个测试用例通过
- [ ] 简单AI能够完成对局
- [ ] 中等AI能够完成对局
- [ ] PVE模式流程完整
- [ ] 计时器正确工作
- [ ] 状态提示准确
- [ ] 重新开始功能正常

### 10.2 性能验收
- [ ] 简单AI响应时间<100ms
- [ ] 中等AI响应时间<500ms
- [ ] AI计算不阻塞UI
- [ ] 内存占用<50MB
- [ ] 页面流畅度>60fps

### 10.3 质量验收
- [ ] 代码覆盖率>80%
- [ ] 核心AI模块覆盖率100%
- [ ] Week 1测试全部通过（13个）
- [ ] Week 2测试全部通过（70个）
- [ ] 无ESLint错误
- [ ] 无TypeScript类型错误

### 10.4 稳定性验收
- [ ] AI超时有降级方案
- [ ] Worker崩溃能够恢复
- [ ] 状态版本控制防止竞态
- [ ] 错误处理完善
- [ ] 无内存泄漏

---

## 十一、测试执行计划

### 11.1 TDD开发流程

1. **阶段1: 简单AI开发（第1-2天）**
   - 编写TC-084~092测试用例
   - 实现SimpleAI类
   - 运行测试直到全部通过
   - 验证性能指标

2. **阶段2: 中等AI开发（第3-4天）**
   - 编写TC-093~107测试用例
   - 实现MediumAI类
   - 运行测试直到全部通过
   - 验证评分系统准确性

3. **阶段3: AI Worker集成（第5天）**
   - 编写TC-108~117测试用例
   - 实现AIWorker和AIClient
   - 测试通信协议
   - 验证错误处理

4. **阶段4: 游戏流程控制（第6天）**
   - 编写TC-118~129测试用例
   - 实现GameFlowController
   - 集成AI到游戏流程
   - 测试状态一致性

5. **阶段5: UI组件开发（第7天）**
   - 编写TC-130~144测试用例
   - 实现Timer、StatusIndicator、GameControls
   - 测试组件交互
   - 验证UI更新流畅度

6. **阶段6: E2E测试（第8天）**
   - 编写TC-145~153测试用例
   - 测试完整游戏流程
   - 性能测试和优化
   - 回归测试

### 11.2 每日测试检查清单

**每日必做**:
- [ ] 运行所有新增测试
- [ ] 运行Week 1和Week 2回归测试
- [ ] 检查测试覆盖率
- [ ] 运行ESLint和TypeScript检查
- [ ] 性能基准测试

**测试通过标准**:
- 新增测试100%通过
- 回归测试100%通过
- 覆盖率达标
- 无严重Bug

---

## 十二、已知限制和风险

### 12.1 测试限制

1. **AI随机性测试**
   - 使用固定种子控制随机性
   - 统计验证需要大样本（100+次）

2. **性能测试波动**
   - 响应时间可能因环境波动
   - 取多次平均值提高可靠性

3. **浏览器兼容性**
   - Web Worker在部分旧浏览器不支持
   - 需要提供降级方案

### 12.2 测试风险

1. **AI算法复杂度**
   - 中等AI评估位置多，测试时间长
   - 需要优化候选位置数量

2. **异步测试稳定性**
   - AI计算是异步的，测试可能不稳定
   - 使用适当的等待和超时设置

3. **E2E测试维护**
   - UI变化可能影响E2E测试
   - 使用稳定的data-testid定位

---

## 十三、附录

### 13.1 测试工具和库

```json
{
  "dependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@playwright/test": "^1.40.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0"
  }
}
```

### 13.2 测试命令

```bash
# 运行所有测试
npm test

# 运行单元测试
npm test -- --testPathPattern="unit"

# 运行集成测试
npm test -- --testPathPattern="integration"

# 运行E2E测试
npm run test:e2e

# 生成覆盖率报告
npm test -- --coverage

# 运行性能测试
npm test -- --testPathPattern="performance"

# 运行回归测试
npm test -- --testPathPattern="regression"
```

### 13.3 Mock数据示例

```typescript
// 创建测试棋盘
function createTestBoard(pieces: Array<{x: number, y: number, player: Player}>): Board {
  const board = new Board(15);
  pieces.forEach(({ x, y, player }) => {
    board.placePiece({ x, y }, player);
  });
  return board;
}

// 创建中局棋盘
function createMidGameBoard(pieceCount: number): Board {
  const board = new Board(15);
  for (let i = 0; i < pieceCount; i++) {
    const pos = getRandomEmptyPosition(board);
    board.placePiece(pos, i % 2 === 0 ? 'black' : 'white');
  }
  return board;
}

// 创建有活三的棋盘
function createBoardWithLiveThree(): Board {
  const board = new Board(15);
  board.placePiece({ x: 5, y: 7 }, 'black');
  board.placePiece({ x: 6, y: 7 }, 'black');
  board.placePiece({ x: 7, y: 7 }, 'black');
  return board;
}
```

---

**文档结束**

**下一步**: 开发工程师根据测试用例开始TDD开发（先写测试，再写代码）
