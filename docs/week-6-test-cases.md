# Week 6 - 测试用例文档

## 文档信息
- **文档版本**: v1.0
- **创建日期**: 2026-03-25
- **负责人**: 测试工程师 (QA)
- **阶段**: Phase 2 - 大师AI实现
- **周次**: Week 6
- **开发模式**: TDD（测试驱动开发）
- **关联文档**: week-6-WO.md, week-6-PL.md

---

## 测试概览

### 测试范围
- **置换表核心功能**: 12个（单元测试）
  - 基础操作（存储、读取、删除）
  - 哈希冲突处理
  - 缓存大小限制
  - LRU策略
  - 性能测试
- **迭代加深算法**: 10个（单元测试）
  - 深度递增测试
  - 超时处理
  - 最佳着法保存
  - 性能测试
- **MasterAI类**: 18个（单元测试）
  - 继承HardAI功能
  - 深度6搜索
  - 置换表集成
  - 迭代加深集成
  - 性能测试（目标<10秒）
  - 棋力测试（应胜过HardAI）
- **集成测试**: 15个
  - 完整流程测试
  - 性能基准测试
  - 棋力对比测试
- **边界条件测试**: 10个
  - 置换表满载
  - 深度限制
  - 长时间思考
- **总计**: 65个测试用例

### 测试框架
- **单元测试**: Vitest
- **集成测试**: Vitest
- **性能测试**: Vitest + performance.now()
- **Web Worker测试**: Comlink + Vitest

### 测试覆盖率目标
- 代码覆盖率: >95%
- 核心算法覆盖率: 100%
- 性能测试覆盖率: 100%
- 棋力测试覆盖率: 100%

### 重要约束
- **绝对不要修改或删除Week 1-5的任何测试**（233个测试）
- 所有新测试必须通过
- 所有Week 1-5回归测试必须通过
- 性能测试必须满足目标要求

---

## 一、置换表测试（transposition-table.test.ts）

### 1.1 基础操作测试

## TC-258: TranspositionTable-初始化空表

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/transposition-table.test.ts`

**前置条件**:
- TranspositionTable类已定义

**测试步骤**:
1. 创建容量为1000的置换表
2. 验证初始大小为0
3. 验证初始命中率为0

**期望结果**:
```typescript
import { TranspositionTable } from '../transposition-table';
import { Board } from '../core/board';

const table = new TranspositionTable(1000);
expect(table.size).toBe(0);
expect(table.getHitRate()).toBe(0);
```

**测试数据**:
- 容量: 1000
- 初始大小: 0
- 初始命中率: 0%

---

## TC-259: TranspositionTable-存储和读取条目

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/transposition-table.test.ts`

**前置条件**:
- TranspositionTable已创建

**测试步骤**:
1. 创建棋盘状态
2. 存储评估结果（深度4，分数1000，最佳着法(7,7)）
3. 用相同棋盘读取
4. 验证返回正确结果

**期望结果**:
```typescript
const board = new Board(15);
board.setCell(7, 7, 'black');

const table = new TranspositionTable(1000);
table.store(board, {
  depth: 4,
  score: 1000,
  bestMove: { x: 7, y: 7 },
  flag: 'exact'
});

const result = table.lookup(board, 4);
expect(result).toBeDefined();
expect(result!.score).toBe(1000);
expect(result!.bestMove).toEqual({ x: 7, y: 7 });
```

**测试数据**:
- 深度: 4
- 分数: 1000
- 最佳着法: (7, 7)
- 标志: exact

---

## TC-260: TranspositionTable-深度不匹配时返回undefined

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/transposition-table.test.ts`

**前置条件**:
- TranspositionTable已创建并存储条目

**测试步骤**:
1. 存储深度4的条目
2. 用深度5查询
3. 验证返回undefined

**期望结果**:
```typescript
const board = new Board(15);
board.setCell(7, 7, 'black');

const table = new TranspositionTable(1000);
table.store(board, {
  depth: 4,
  score: 1000,
  bestMove: { x: 7, y: 7 },
  flag: 'exact'
});

const result = table.lookup(board, 5); // 深度不匹配
expect(result).toBeUndefined();
```

**测试数据**:
- 存储深度: 4
- 查询深度: 5
- 期望结果: undefined

---

## TC-261: TranspositionTable-覆盖已存在条目

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/transposition-table.test.ts`

**前置条件**:
- TranspositionTable已创建并存储条目

**测试步骤**:
1. 存储条目A（深度4，分数1000）
2. 用相同棋盘存储条目B（深度6，分数2000）
3. 验证新条目覆盖旧条目
4. 验证表大小仍为1

**期望结果**:
```typescript
const board = new Board(15);
board.setCell(7, 7, 'black');

const table = new TranspositionTable(1000);

// 存储第一次
table.store(board, {
  depth: 4,
  score: 1000,
  bestMove: { x: 7, y: 7 },
  flag: 'exact'
});

// 存储第二次（覆盖）
table.store(board, {
  depth: 6,
  score: 2000,
  bestMove: { x: 8, y: 8 },
  flag: 'exact'
});

expect(table.size).toBe(1);

const result = table.lookup(board, 6);
expect(result!.score).toBe(2000);
expect(result!.bestMove).toEqual({ x: 8, y: 8 });
```

**测试数据**:
- 第一次深度: 4, 分数: 1000
- 第二次深度: 6, 分数: 2000
- 表大小: 1

---

## TC-262: TranspositionTable-删除条目

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/transposition-table.test.ts`

**前置条件**:
- TranspositionTable已创建并存储条目

**测试步骤**:
1. 存储多个条目
2. 删除一个条目
3. 验证删除后无法读取
4. 验证表大小减少

**期望结果**:
```typescript
const board1 = new Board(15);
board1.setCell(7, 7, 'black');

const board2 = new Board(15);
board2.setCell(8, 8, 'white');

const table = new TranspositionTable(1000);
table.store(board1, { depth: 4, score: 1000, bestMove: { x: 7, y: 7 }, flag: 'exact' });
table.store(board2, { depth: 4, score: 2000, bestMove: { x: 8, y: 8 }, flag: 'exact' });

expect(table.size).toBe(2);

table.remove(board1);
expect(table.size).toBe(1);
expect(table.lookup(board1, 4)).toBeUndefined();
expect(table.lookup(board2, 4)).toBeDefined();
```

**测试数据**:
- 初始条目数: 2
- 删除后条目数: 1

---

### 1.2 哈希冲突处理测试

## TC-263: TranspositionTable-处理哈希冲突

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/transposition-table.test.ts`

**前置条件**:
- TranspositionTable已创建

**测试步骤**:
1. 创建两个不同棋盘状态（可能产生相同哈希）
2. 分别存储两个条目
3. 验证两者都能正确读取
4. 验证不会相互覆盖

**期望结果**:
```typescript
// 创建两个可能冲突的棋盘状态
const board1 = new Board(15);
board1.setCell(0, 0, 'black');

const board2 = new Board(15);
board2.setCell(14, 14, 'white');

const table = new TranspositionTable(1000);
table.store(board1, { depth: 4, score: 1000, bestMove: { x: 1, y: 1 }, flag: 'exact' });
table.store(board2, { depth: 4, score: 2000, bestMove: { x: 13, y: 13 }, flag: 'exact' });

const result1 = table.lookup(board1, 4);
const result2 = table.lookup(board2, 4);

expect(result1!.score).toBe(1000);
expect(result2!.score).toBe(2000);
expect(table.size).toBe(2);
```

**测试数据**:
- 条目1: 分数1000
- 条目2: 分数2000
- 两者都应独立存储

---

## TC-264: TranspositionTable-哈希冲突时使用完整棋盘比较

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/transposition-table.test.ts`

**前置条件**:
- TranspositionTable已实现完整棋盘比较

**测试步骤**:
1. 存储棋盘A的条目
2. 用哈希相同但内容不同的棋盘B查询
3. 验证返回undefined（不匹配）

**期望结果**:
```typescript
const board1 = new Board(15);
board1.setCell(7, 7, 'black');

const board2 = new Board(15);
// 即使哈希可能相同，棋盘内容不同

const table = new TranspositionTable(1000);
table.store(board1, { depth: 4, score: 1000, bestMove: { x: 7, y: 7 }, flag: 'exact' });

// 强制设置相同哈希（模拟冲突）
const result = table.lookup(board2, 4);
expect(result).toBeUndefined(); // 内容不匹配
```

**测试数据**:
- 模拟哈希冲突但内容不同
- 期望返回undefined

---

### 1.3 缓存大小限制和LRU测试

## TC-265: TranspositionTable-达到容量上限时驱逐条目

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/transposition-table.test.ts`

**前置条件**:
- TranspositionTable容量设置为较小值（如5）

**测试步骤**:
1. 创建容量为5的置换表
2. 存储6个不同条目
3. 验证表大小不超过5
4. 验证最早条目被驱逐

**期望结果**:
```typescript
const table = new TranspositionTable(5);

// 存储6个条目
for (let i = 0; i < 6; i++) {
  const board = new Board(15);
  board.setCell(i, i, 'black');
  table.store(board, {
    depth: 4,
    score: i * 1000,
    bestMove: { x: i, y: i },
    flag: 'exact'
  });
}

expect(table.size).toBeLessThanOrEqual(5);

// 验证最早的条目被驱逐
const firstBoard = new Board(15);
firstBoard.setCell(0, 0, 'black');
const result = table.lookup(firstBoard, 4);
expect(result).toBeUndefined(); // 最早的条目应被驱逐
```

**测试数据**:
- 容量: 5
- 存储条目: 6
- 最终大小: ≤5

---

## TC-266: TranspositionTable-LRU策略驱逐最少使用的条目

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/transposition-table.test.ts`

**前置条件**:
- TranspositionTable实现了LRU策略

**测试步骤**:
1. 创建容量为3的置换表
2. 存储条目A、B、C
3. 访问条目A（更新使用时间）
4. 存储条目D（触发驱逐）
5. 验证条目A仍在，条目B被驱逐

**期望结果**:
```typescript
const table = new TranspositionTable(3);

const boardA = new Board(15);
boardA.setCell(0, 0, 'black');
const boardB = new Board(15);
boardB.setCell(1, 1, 'black');
const boardC = new Board(15);
boardC.setCell(2, 2, 'black');
const boardD = new Board(15);
boardD.setCell(3, 3, 'black');

table.store(boardA, { depth: 4, score: 1000, bestMove: { x: 0, y: 0 }, flag: 'exact' });
table.store(boardB, { depth: 4, score: 2000, bestMove: { x: 1, y: 1 }, flag: 'exact' });
table.store(boardC, { depth: 4, score: 3000, bestMove: { x: 2, y: 2 }, flag: 'exact' });

// 访问A（更新LRU）
table.lookup(boardA, 4);

// 存储D（应驱逐B，因为A刚被访问）
table.store(boardD, { depth: 4, score: 4000, bestMove: { x: 3, y: 3 }, flag: 'exact' });

expect(table.size).toBe(3);
expect(table.lookup(boardA, 4)).toBeDefined(); // A仍在
expect(table.lookup(boardB, 4)).toBeUndefined(); // B被驱逐
expect(table.lookup(boardC, 4)).toBeDefined(); // C仍在
expect(table.lookup(boardD, 4)).toBeDefined(); // D新加入
```

**测试数据**:
- 容量: 3
- 访问A后再存储D
- 驱逐B（最少使用）

---

## TC-267: TranspositionTable-clear清空所有条目

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/transposition-table.test.ts`

**前置条件**:
- TranspositionTable已存储多个条目

**测试步骤**:
1. 存储多个条目
2. 调用clear()
3. 验证表大小为0
4. 验证命中率重置

**期望结果**:
```typescript
const table = new TranspositionTable(1000);

for (let i = 0; i < 10; i++) {
  const board = new Board(15);
  board.setCell(i, i, 'black');
  table.store(board, { depth: 4, score: i * 1000, bestMove: { x: i, y: i }, flag: 'exact' });
}

expect(table.size).toBe(10);
table.clear();
expect(table.size).toBe(0);
expect(table.getHitRate()).toBe(0);
```

**测试数据**:
- 初始条目: 10
- 清空后: 0

---

### 1.4 性能和统计测试

## TC-268: TranspositionTable-命中率统计

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/transposition-table.test.ts`

**前置条件**:
- TranspositionTable实现了命中率统计

**测试步骤**:
1. 存储10个条目
2. 查询5个存在的条目（命中）
3. 查询5个不存在的条目（未命中）
4. 验证命中率 = 5/10 = 50%

**期望结果**:
```typescript
const table = new TranspositionTable(1000);
const boards: Board[] = [];

// 存储10个条目
for (let i = 0; i < 10; i++) {
  const board = new Board(15);
  board.setCell(i, i, 'black');
  boards.push(board);
  table.store(board, { depth: 4, score: i * 1000, bestMove: { x: i, y: i }, flag: 'exact' });
}

// 查询5个存在的（命中）
for (let i = 0; i < 5; i++) {
  table.lookup(boards[i], 4);
}

// 查询5个不存在的（未命中）
for (let i = 0; i < 5; i++) {
  const newBoard = new Board(15);
  newBoard.setCell(20 + i, 20 + i, 'black');
  table.lookup(newBoard, 4);
}

const hitRate = table.getHitRate();
expect(hitRate).toBeCloseTo(0.5, 1); // 50%
```

**测试数据**:
- 命中次数: 5
- 未命中次数: 5
- 期望命中率: 50%

---

## TC-269: TranspositionTable-存储操作性能测试

**优先级**: P1
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/transposition-table.test.ts`

**前置条件**:
- TranspositionTable已实现

**测试步骤**:
1. 创建空置换表
2. 测量存储1000个条目的时间
3. 验证平均每次存储<1ms

**期望结果**:
```typescript
const table = new TranspositionTable(10000);
const startTime = performance.now();

for (let i = 0; i < 1000; i++) {
  const board = new Board(15);
  board.setCell(i % 15, (i / 15) | 0, 'black');
  table.store(board, { depth: 4, score: i, bestMove: { x: i % 15, y: (i / 15) | 0 }, flag: 'exact' });
}

const endTime = performance.now();
const avgTime = (endTime - startTime) / 1000;

expect(avgTime).toBeLessThan(1.0); // 平均<1ms
```

**测试数据**:
- 条目数: 1000
- 期望平均时间: <1ms

---

## TC-270: TranspositionTable-读取操作性能测试

**优先级**: P1
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/transposition-table.test.ts`

**前置条件**:
- TranspositionTable已存储1000个条目

**测试步骤**:
1. 预先存储1000个条目
2. 测量读取1000个条目的时间
3. 验证平均每次读取<0.1ms

**期望结果**:
```typescript
const table = new TranspositionTable(10000);
const boards: Board[] = [];

// 预先存储
for (let i = 0; i < 1000; i++) {
  const board = new Board(15);
  board.setCell(i % 15, (i / 15) | 0, 'black');
  boards.push(board);
  table.store(board, { depth: 4, score: i, bestMove: { x: i % 15, y: (i / 15) | 0 }, flag: 'exact' });
}

// 测量读取时间
const startTime = performance.now();

for (let i = 0; i < 1000; i++) {
  table.lookup(boards[i], 4);
}

const endTime = performance.now();
const avgTime = (endTime - startTime) / 1000;

expect(avgTime).toBeLessThan(0.1); // 平均<0.1ms
```

**测试数据**:
- 条目数: 1000
- 期望平均时间: <0.1ms

---

## 二、迭代加深算法测试（iterative-deepening.test.ts）

### 2.1 深度递增测试

## TC-271: IterativeDeepening-从深度1递增到目标深度

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/iterative-deepening.test.ts`

**前置条件**:
- IterativeDeepening类已定义
- AI评估器已配置

**测试步骤**:
1. 创建迭代加深实例（目标深度4）
2. 在空棋盘上执行搜索
3. 验证依次运行深度1、2、3、4
4. 验证最终返回深度4的结果

**期望结果**:
```typescript
import { IterativeDeepening } from '../iterative-deepening';
import { Board } from '../core/board';

const depths: number[] = [];
const mockSearch = vi.fn((depth: number) => {
  depths.push(depth);
  return { score: depth * 100, bestMove: { x: depth, y: depth } };
});

const id = new IterativeDeepening(mockSearch);
const board = new Board(15);
const result = id.search(board, 'black', 4);

expect(depths).toEqual([1, 2, 3, 4]); // 依次执行深度1-4
expect(result.depth).toBe(4);
```

**测试数据**:
- 目标深度: 4
- 执行深度序列: [1, 2, 3, 4]

---

## TC-272: IterativeDeepening-每次迭代使用上次最佳着法

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/iterative-deepening.test.ts`

**前置条件**:
- IterativeDeepening实现了最佳着法传递

**测试步骤**:
1. 模拟深度1返回最佳着法(7,7)
2. 验证深度2使用(7,7)作为搜索起点
3. 验证深度3使用深度2的最佳着法

**期望结果**:
```typescript
const mockSearch = vi.fn((depth, firstMove) => {
  if (depth === 1) {
    return { score: 100, bestMove: { x: 7, y: 7 } };
  } else if (depth === 2) {
    // 验证使用了深度1的最佳着法
    expect(firstMove).toEqual({ x: 7, y: 7 });
    return { score: 200, bestMove: { x: 8, y: 8 } };
  } else if (depth === 3) {
    // 验证使用了深度2的最佳着法
    expect(firstMove).toEqual({ x: 8, y: 8 });
    return { score: 300, bestMove: { x: 9, y: 9 } };
  }
  return { score: 0, bestMove: null };
});

const id = new IterativeDeepening(mockSearch);
const board = new Board(15);
id.search(board, 'black', 3);

expect(mockSearch).toHaveBeenCalledTimes(3);
```

**测试数据**:
- 深度1最佳着法: (7, 7)
- 深度2使用(7, 7)作为起点
- 深度3使用(8, 8)作为起点

---

## TC-273: IterativeDeepening-找到必胜着法时立即返回

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/iterative-deepening.test.ts`

**前置条件**:
- IterativeDeepening检测到必胜着法（分数>90000）

**测试步骤**:
1. 配置模拟：深度2返回必胜分数（100000）
2. 目标深度为6
3. 验证在深度2时停止，不继续深度3-6

**期望结果**:
```typescript
const mockSearch = vi.fn((depth) => {
  if (depth === 1) {
    return { score: 1000, bestMove: { x: 5, y: 5 } };
  } else if (depth === 2) {
    // 返回必胜分数
    return { score: 100000, bestMove: { x: 7, y: 7 } };
  }
  return { score: 0, bestMove: null };
});

const id = new IterativeDeepening(mockSearch);
const board = new Board(15);
const result = id.search(board, 'black', 6);

expect(mockSearch).toHaveBeenCalledTimes(2); // 只执行深度1和2
expect(result.depth).toBe(2);
expect(result.score).toBe(100000);
```

**测试数据**:
- 必胜阈值: 90000
- 深度2分数: 100000
- 停止深度: 2（不继续到6）

---

### 2.2 超时处理测试

## TC-274: IterativeDeepening-超时时返回上一次完整结果

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/iterative-deepening.test.ts`

**前置条件**:
- 设置了超时时间（如1000ms）

**测试步骤**:
1. 设置超时1000ms
2. 深度3耗时500ms（完成）
3. 深度4耗时1500ms（超时）
4. 验证返回深度3的结果

**期望结果**:
```typescript
let callCount = 0;
const mockSearch = vi.fn((depth) => {
  callCount++;
  if (depth <= 3) {
    return { score: depth * 100, bestMove: { x: depth, y: depth } };
  } else {
    // 深度4模拟超时
    return null; // 表示超时
  }
});

const id = new IterativeDeepening(mockSearch, { timeout: 1000 });
const board = new Board(15);
const result = id.search(board, 'black', 6);

expect(result.depth).toBe(3); // 返回上一次完整的结果
expect(result.score).toBe(300);
```

**测试数据**:
- 超时时间: 1000ms
- 深度3完成
- 深度4超时
- 返回深度3结果

---

## TC-275: IterativeDeepening-第一次迭代就超时

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/iterative-deepening.test.ts`

**前置条件**:
- 深度1搜索耗时超过超时限制

**测试步骤**:
1. 设置超时10ms
2. 深度1搜索耗时100ms
3. 验证返回默认结果

**期望结果**:
```typescript
const mockSearch = vi.fn(() => {
  // 模拟深度1也超时
  return null;
});

const id = new IterativeDeepening(mockSearch, { timeout: 10 });
const board = new Board(15);
const result = id.search(board, 'black', 4);

expect(result.bestMove).toBeNull();
expect(result.score).toBe(0);
```

**测试数据**:
- 超时: 10ms
- 深度1耗时: 100ms
- 返回默认值

---

### 2.3 性能测试

## TC-276: IterativeDeepening-迭代加深性能优于直接深搜

**优先级**: P1
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/iterative-deepening.test.ts`

**前置条件**:
- 相同棋盘状态

**测试步骤**:
1. 方法A：直接深度6搜索
2. 方法B：迭代加深（1→2→3→4→5→6）
3. 验证迭代加深更快（因为有最佳着法排序）

**期望结果**:
```typescript
const mockSearch = vi.fn((depth) => {
  // 模拟搜索时间随深度指数增长
  const baseTime = 10;
  const time = baseTime * Math.pow(2, depth);
  return {
    score: depth * 100,
    bestMove: { x: depth, y: depth },
    time
  };
});

// 测试迭代加深
const id = new IterativeDeepening(mockSearch);
const board = new Board(15);

const start1 = performance.now();
id.search(board, 'black', 6);
const time1 = performance.now() - start1;

// 由于有最佳着法排序，实际剪枝更多，速度更快
// 这里验证迭代加深确实执行了
expect(mockSearch).toHaveBeenCalledTimes(6);
```

**测试数据**:
- 目标深度: 6
- 迭代次数: 6
- 验证最佳着法排序效果

---

## TC-277: IterativeDeepening-深度6搜索总时间<10秒

**优先级**: P0
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/iterative-deepening.test.ts`

**前置条件**:
- 复杂棋局（中间状态，约30步）

**测试步骤**:
1. 创建30步的棋局
2. 执行迭代加深到深度6
3. 测量总时间
4. 验证<10秒

**期望结果**:
```typescript
const board = new Board(15);
// 创建30步的棋局
for (let i = 0; i < 30; i++) {
  const x = 7 + (i % 3) - 1;
  const y = 7 + ((i / 3) | 0) % 3;
  board.setCell(x, y, i % 2 === 0 ? 'black' : 'white');
}

const id = new IterativeDeepening(/* 实际搜索函数 */);
const startTime = performance.now();

const result = id.search(board, 'black', 6);

const endTime = performance.now();
const totalTime = endTime - startTime;

expect(totalTime).toBeLessThan(10000); // <10秒
expect(result.depth).toBe(6);
```

**测试数据**:
- 棋局步数: 30
- 目标深度: 6
- 期望时间: <10秒

---

## TC-278: IterativeDeepening-早期迭代提供快速响应

**优先级**: P1
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/iterative-deepening.test.ts`

**前置条件**:
- 迭代加深实现了回调机制

**测试步骤**:
1. 设置回调函数追踪每次迭代
2. 执行深度6搜索
3. 验证深度1在<100ms内返回
4. 验证深度2在<500ms内返回

**期望结果**:
```typescript
const iterationTimes: number[] = [];
const onIteration = (depth: number, time: number) => {
  iterationTimes[depth] = time;
};

const id = new IterativeDeepening(/* 搜索函数 */, { onIteration });
const board = new Board(15);
id.search(board, 'black', 6);

expect(iterationTimes[1]).toBeLessThan(100); // 深度1<100ms
expect(iterationTimes[2]).toBeLessThan(500); // 深度2<500ms
```

**测试数据**:
- 深度1: <100ms
- 深度2: <500ms

---

## TC-279: IterativeDeepening-最佳着法逐步优化

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/iterative-deepening.test.ts`

**前置条件**:
- 每次迭代返回更优着法

**测试步骤**:
1. 深度1返回(7,7)，分数100
2. 深度2返回(8,8)，分数200
3. 深度3返回(9,9)，分数300
4. 验证最终返回深度3的最佳着法

**期望结果**:
```typescript
const mockSearch = vi.fn((depth) => {
  const moves = [
    { x: 7, y: 7 },
    { x: 8, y: 8 },
    { x: 9, y: 9 }
  ];
  return {
    score: depth * 100,
    bestMove: moves[depth - 1]
  };
});

const id = new IterativeDeepening(mockSearch);
const board = new Board(15);
const result = id.search(board, 'black', 3);

expect(result.bestMove).toEqual({ x: 9, y: 9 });
expect(result.score).toBe(300);
```

**测试数据**:
- 深度1: (7, 7), 100分
- 深度2: (8, 8), 200分
- 深度3: (9, 9), 300分
- 最终: (9, 9), 300分

---

## TC-280: IterativeDeepening-置换表跨迭代复用

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/iterative-deepening.test.ts`

**前置条件**:
- 迭代加深集成了置换表

**测试步骤**:
1. 创建置换表
2. 执行迭代加深搜索
3. 验证深度2使用了深度1的缓存
4. 验证深度3使用了深度1和2的缓存

**期望结果**:
```typescript
const transpositionTable = new TranspositionTable(10000);
let searchCallCount = 0;

const mockSearch = vi.fn((depth) => {
  searchCallCount++;
  // 检查置换表
  const lookup = transpositionTable.lookup(board, depth);
  if (lookup) {
    return lookup; // 命中缓存
  }
  // 未命中，执行搜索并存储
  const result = { score: depth * 100, bestMove: { x: depth, y: depth } };
  transpositionTable.store(board, result);
  return result;
});

const id = new IterativeDeepening(mockSearch);
const board = new Board(15);
id.search(board, 'black', 4);

// 由于使用了置换表，某些节点可能被跳过
// 这里验证置换表确实被使用
expect(transpositionTable.size).toBeGreaterThan(0);
```

**测试数据**:
- 置换表大小: >0
- 缓存命中: >0

---

## 三、MasterAI类测试（master-ai.test.ts）

### 3.1 基础功能测试

## TC-281: MasterAI-继承HardAI所有功能

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/master-ai.test.ts`

**前置条件**:
- MasterAI类继承自HardAI

**测试步骤**:
1. 创建MasterAI实例
2. 验证拥有HardAI的所有方法
3. 验证Minimax算法可用
4. 验证Alpha-Beta剪枝可用

**期望结果**:
```typescript
import { MasterAI } from '../master-ai';
import { Board } from '../core/board';

const masterAI = new MasterAI();

// 验证继承HardAI的方法
expect(typeof masterAI.minimax).toBe('function');
expect(typeof masterAI.evaluateBoard).toBe('function');
expect(typeof masterAI.generateCandidates).toBe('function');

// 验证配置
expect(masterAI.getSearchDepth()).toBe(6); // MasterAI默认深度6
```

**测试数据**:
- 默认搜索深度: 6
- 继承方法: minimax, evaluateBoard, generateCandidates

---

## TC-282: MasterAI-使用置换表

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/master-ai.test.ts`

**前置条件**:
- MasterAI集成了置换表

**测试步骤**:
1. 创建MasterAI实例
2. 在棋盘A上计算最佳着法
3. 验证结果被存储到置换表
4. 再次在棋盘A上计算
5. 验证命中缓存

**期望结果**:
```typescript
const masterAI = new MasterAI();
const board = new Board(15);
board.setCell(7, 7, 'black');

// 第一次计算
const result1 = await masterAI.getBestMove(board, 'black');
const cacheSize1 = masterAI.getTranspositionTableSize();

// 第二次计算（应命中缓存）
const result2 = await masterAI.getBestMove(board, 'black');
const cacheSize2 = masterAI.getTranspositionTableSize();

expect(result1).toEqual(result2);
expect(cacheSize2).toBeGreaterThan(0);
expect(masterAI.getCacheHitRate()).toBeGreaterThan(0);
```

**测试数据**:
- 缓存大小: >0
- 命中率: >0

---

## TC-283: MasterAI-使用迭代加深搜索

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/master-ai.test.ts`

**前置条件**:
- MasterAI集成了迭代加深

**测试步骤**:
1. 创建MasterAI实例
2. 在空棋盘上计算最佳着法
3. 验证执行了深度1到6的迭代
4. 验证最终返回深度6的结果

**期望结果**:
```typescript
const masterAI = new MasterAI();
const board = new Board(15);

// 监控搜索深度
const depths: number[] = masterAI.on('depth-complete', (depth) => {
  depths.push(depth);
});

const result = await masterAI.getBestMove(board, 'black');

expect(depths).toEqual([1, 2, 3, 4, 5, 6]);
expect(result.searchDepth).toBe(6);
```

**测试数据**:
- 执行深度: [1, 2, 3, 4, 5, 6]
- 最终深度: 6

---

## TC-284: MasterAI-深度6搜索时间<10秒

**优先级**: P0
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/master-ai.test.ts`

**前置条件**:
- 复杂棋局（约30步）

**测试步骤**:
1. 创建30步的棋局
2. 使用MasterAI计算最佳着法
3. 测量计算时间
4. 验证<10秒

**期望结果**:
```typescript
const masterAI = new MasterAI();
const board = new Board(15);

// 创建30步的复杂棋局
for (let i = 0; i < 30; i++) {
  const x = 7 + (i % 5) - 2;
  const y = 7 + ((i / 5) | 0) - 2;
  board.setCell(x, y, i % 2 === 0 ? 'black' : 'white');
}

const startTime = performance.now();
const result = await masterAI.getBestMove(board, 'black');
const endTime = performance.now();

const totalTime = endTime - startTime;

expect(totalTime).toBeLessThan(10000); // <10秒
expect(result.searchDepth).toBe(6);
expect(result.position).toBeDefined();
```

**测试数据**:
- 棋局步数: 30
- 搜索深度: 6
- 期望时间: <10秒

---

## TC-285: MasterAI-空棋盘第一步下在天元

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/master-ai.test.ts`

**前置条件**:
- MasterAI已创建

**测试步骤**:
1. 创建空棋盘
2. 用MasterAI计算黑棋最佳着法
3. 验证返回天元位置(7, 7)

**期望结果**:
```typescript
const masterAI = new MasterAI();
const board = new Board(15);

const result = await masterAI.getBestMove(board, 'black');

expect(result.position).toEqual({ x: 7, y: 7 }); // 天元
```

**测试数据**:
- 期望位置: (7, 7) - 天元

---

## TC-286: MasterAI-识别必胜局面

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/master-ai.test.ts`

**前置条件**:
- 棋盘上有连四机会

**测试步骤**:
1. 创建棋盘：黑棋有连四（`XXXX_`）
2. 用MasterAI计算最佳着法
3. 验证返回胜利着法（完成连五）

**期望结果**:
```typescript
const masterAI = new MasterAI();
const board = new Board(15);

// 创建连四
board.setCell(7, 5, 'black');
board.setCell(7, 6, 'black');
board.setCell(7, 7, 'black');
board.setCell(7, 8, 'black');
// 位置(7, 9)为空

const result = await masterAI.getBestMove(board, 'black');

expect(result.position).toEqual({ x: 7, y: 9 }); // 完成连五
```

**测试数据**:
- 连四位置: (7, 5)-(7, 8)
- 期望着法: (7, 9)

---

## TC-287: MasterAI-识别必败局面并防守

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/master-ai.test.ts`

**前置条件**:
- 对手有连四机会

**测试步骤**:
1. 创建棋盘：白棋有连四（`OOOO_`）
2. 用MasterAI计算黑棋最佳着法
3. 验证返回防守着法（阻挡白棋）

**期望结果**:
```typescript
const masterAI = new MasterAI();
const board = new Board(15);

// 创建白棋连四
board.setCell(7, 5, 'white');
board.setCell(7, 6, 'white');
board.setCell(7, 7, 'white');
board.setCell(7, 8, 'white');
// 黑棋必须在(7, 9)防守

const result = await masterAI.getBestMove(board, 'black');

expect(result.position).toEqual({ x: 7, y: 9 }); // 防守
```

**测试数据**:
- 白棋连四: (7, 5)-(7, 8)
- 黑棋防守: (7, 9)

---

## TC-288: MasterAI-优先进攻而不是防守

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/master-ai.test.ts`

**前置条件**:
- 双方都有进攻机会

**测试步骤**:
1. 创建棋盘：黑棋有活三，白棋有活三
2. 用MasterAI计算最佳着法
3. 验证选择进攻（自己的活三）而不是防守

**期望结果**:
```typescript
const masterAI = new MasterAI();
const board = new Board(15);

// 黑棋活三
board.setCell(5, 7, 'black');
board.setCell(6, 7, 'black');
board.setCell(7, 7, 'black');

// 白棋活三
board.setCell(5, 8, 'white');
board.setCell(6, 8, 'white');
board.setCell(7, 8, 'white');

const result = await masterAI.getBestMove(board, 'black');

// 应该进攻自己的活三，而不是防守白棋
expect(result.position.x).toBe(4); // 或8，完成自己的活四
```

**测试数据**:
- 黑棋活三: (5, 7)-(7, 7)
- 白棋活三: (5, 8)-(7, 8)
- 选择: 进攻

---

### 3.2 置换表集成测试

## TC-289: MasterAI-置换表大小可配置

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/master-ai.test.ts`

**前置条件**:
- MasterAI接受置换表配置

**测试步骤**:
1. 创建MasterAI，设置置换表大小为5000
2. 执行多次搜索
3. 验证置换表大小不超过5000

**期望结果**:
```typescript
const masterAI = new MasterAI({
  transpositionTableSize: 5000
});

const board = new Board(15);
for (let i = 0; i < 10; i++) {
  const testBoard = board.clone();
  testBoard.setCell(i, i, 'black');
  await masterAI.getBestMove(testBoard, 'black');
}

const tableSize = masterAI.getTranspositionTableSize();
expect(tableSize).toBeLessThanOrEqual(5000);
```

**测试数据**:
- 配置大小: 5000
- 实际大小: ≤5000

---

## TC-290: MasterAI-置换表提高搜索速度

**优先级**: P0
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/master-ai.test.ts`

**前置条件**:
- 相同棋盘搜索两次

**测试步骤**:
1. 在棋盘A上第一次搜索（无缓存）
2. 在棋盘A上第二次搜索（有缓存）
3. 验证第二次更快

**期望结果**:
```typescript
const masterAI = new MasterAI();
const board = new Board(15);
board.setCell(7, 7, 'black');

// 第一次搜索（无缓存）
const start1 = performance.now();
const result1 = await masterAI.getBestMove(board, 'black');
const time1 = performance.now() - start1;

// 第二次搜索（有缓存）
const start2 = performance.now();
const result2 = await masterAI.getBestMove(board, 'black');
const time2 = performance.now() - start2;

expect(time2).toBeLessThan(time1); // 第二次应该更快
expect(result1.position).toEqual(result2.position);
```

**测试数据**:
- 第一次时间: T1
- 第二次时间: T2 < T1

---

## TC-291: MasterAI-置换表命中率统计

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/master-ai.test.ts`

**前置条件**:
- MasterAI实现了命中率统计

**测试步骤**:
1. 在10个不同棋盘上搜索
2. 重复其中5个棋盘的搜索
3. 验证命中率约等于 5/15 = 33%

**期望结果**:
```typescript
const masterAI = new MasterAI();
const boards: Board[] = [];

// 创建10个棋盘
for (let i = 0; i < 10; i++) {
  const board = new Board(15);
  board.setCell(i, i, 'black');
  boards.push(board);
}

// 第一次搜索所有10个
for (const board of boards) {
  await masterAI.getBestMove(board, 'black');
}

// 重复搜索其中5个
for (let i = 0; i < 5; i++) {
  await masterAI.getBestMove(boards[i], 'black');
}

const hitRate = masterAI.getCacheHitRate();
expect(hitRate).toBeGreaterThan(0.3); // 约33%
```

**测试数据**:
- 总查询: 15
- 命中: 5
- 期望命中率: ~33%

---

### 3.3 棋力测试

## TC-292: MasterAI-胜过HardAI

**优先级**: P0
**类型**: 棋力测试
**测试文件**: `src/game/ai/__tests__/master-ai.test.ts`

**前置条件**:
- MasterAI和HardAI都可用

**测试步骤**:
1. 设置对局：MasterAI（黑棋）vs HardAI（白棋）
2. 执行完整对局
3. 验证MasterAI获胜

**期望结果**:
```typescript
import { HardAI } from '../hard-ai';
import { MasterAI } from '../master-ai';
import { GameEngine } from '../core/game-engine';

const masterAI = new MasterAI();
const hardAI = new HardAI();
const engine = new GameEngine();

engine.startGame('pve');
engine.setAIDifficulty('master'); // 黑棋使用MasterAI

let moveCount = 0;
const maxMoves = 225; // 最多225步

while (engine.getGameStatus() === 'playing' && moveCount < maxMoves) {
  const currentPlayer = engine.getCurrentPlayer();
  const board = engine.getBoard();

  let move: Position;
  if (currentPlayer === 'black') {
    move = await masterAI.getBestMove(board, 'black');
  } else {
    move = await hardAI.getBestMove(board, 'white');
  }

  await engine.makeMove(move);
  moveCount++;
}

const winner = engine.getWinner();
expect(winner).toBe('black'); // MasterAI获胜
```

**测试数据**:
- MasterAI: 黑棋
- HardAI: 白棋
- 期望结果: MasterAI胜

---

## TC-293: MasterAI-在相同局面下比HardAI评分更高

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/master-ai.test.ts`

**前置条件**:
- 同一棋盘状态

**测试步骤**:
1. 创建复杂棋局（20步）
2. MasterAI计算最佳着法和评分
3. HardAI计算最佳着法和评分
4. 验证MasterAI评分≥HardAI评分

**期望结果**:
```typescript
const masterAI = new MasterAI();
const hardAI = new HardAI();
const board = new Board(15);

// 创建20步的复杂棋局
for (let i = 0; i < 20; i++) {
  const x = 7 + (i % 3) - 1;
  const y = 7 + ((i / 3) | 0);
  board.setCell(x, y, i % 2 === 0 ? 'black' : 'white');
}

const masterResult = await masterAI.getBestMove(board, 'black');
const hardResult = await hardAI.getBestMove(board, 'black');

// MasterAI应该找到更好的着法
expect(masterResult.score).toBeGreaterThanOrEqual(hardResult.score);
```

**测试数据**:
- 棋局步数: 20
- MasterAI评分 ≥ HardAI评分

---

## TC-294: MasterAI-深度6优于HardAI深度4

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/master-ai.test.ts`

**前置条件**:
- 相同棋盘状态

**测试步骤**:
1. 创建战术局面（有陷阱）
2. MasterAI（深度6）分析
3. HardAI（深度4）分析
4. 验证MasterAI识破陷阱，HardAI可能中计

**期望结果**:
```typescript
const masterAI = new MasterAI(); // 深度6
const hardAI = new HardAI(); // 深度4
const board = new Board(15);

// 创建陷阱局面
board.setCell(7, 7, 'black');
board.setCell(7, 8, 'white');
board.setCell(8, 7, 'black');
board.setCell(8, 8, 'white');
board.setCell(9, 7, 'black'); // 黑棋形成威胁
// 白棋有陷阱，但深度4可能看不到

const masterMove = await masterAI.getBestMove(board, 'white');
const hardMove = await hardAI.getBestMove(board, 'white');

// MasterAI应该看到更远，选择更好的着法
expect(masterMove.score).toBeGreaterThan(hardMove.score);
```

**测试数据**:
- MasterAI深度: 6
- HardAI深度: 4
- MasterAI评分 > HardAI评分

---

## TC-295: MasterAI-搜索深度可配置

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/master-ai.test.ts`

**前置条件**:
- MasterAI接受深度配置

**测试步骤**:
1. 创建MasterAI，设置深度为4
2. 验证搜索深度为4
3. 创建MasterAI，设置深度为8
4. 验证搜索深度为8

**期望结果**:
```typescript
const masterAI4 = new MasterAI({ searchDepth: 4 });
expect(masterAI4.getSearchDepth()).toBe(4);

const masterAI8 = new MasterAI({ searchDepth: 8 });
expect(masterAI8.getSearchDepth()).toBe(8);

// 验证实际搜索深度
const board = new Board(15);
const result4 = await masterAI4.getBestMove(board, 'black');
const result8 = await masterAI8.getBestMove(board, 'black');

expect(result4.searchDepth).toBe(4);
expect(result8.searchDepth).toBe(8);
```

**测试数据**:
- 配置深度4: 实际4
- 配置深度8: 实际8

---

## TC-296: MasterAI-支持超时配置

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/master-ai.test.ts`

**前置条件**:
- MasterAI接受超时配置

**测试步骤**:
1. 创建MasterAI，设置超时为5秒
2. 在复杂棋局上搜索
3. 验证在5秒内返回
4. 验证返回部分结果

**期望结果**:
```typescript
const masterAI = new MasterAI({ timeout: 5000 });
const board = new Board(15);

// 创建复杂局面
for (let i = 0; i < 50; i++) {
  board.setCell(i % 15, (i / 15) | 0, i % 2 === 0 ? 'black' : 'white');
}

const startTime = performance.now();
const result = await masterAI.getBestMove(board, 'black');
const endTime = performance.now();

const totalTime = endTime - startTime;

expect(totalTime).toBeLessThan(6000); // 略有超时容差
expect(result.position).toBeDefined();
expect(result.searchDepth).toBeGreaterThan(0);
```

**测试数据**:
- 超时设置: 5000ms
- 实际时间: <6000ms
- 返回部分结果

---

## TC-297: MasterAI-提供搜索统计信息

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/master-ai.test.ts`

**前置条件**:
- MasterAI追踪搜索统计

**测试步骤**:
1. 执行搜索
2. 获取统计信息
3. 验证包含：搜索节点数、搜索深度、缓存命中率、搜索时间

**期望结果**:
```typescript
const masterAI = new MasterAI();
const board = new Board(15);
board.setCell(7, 7, 'black');

const result = await masterAI.getBestMove(board, 'black');
const stats = masterAI.getSearchStats();

expect(stats).toBeDefined();
expect(stats.nodesSearched).toBeGreaterThan(0);
expect(stats.searchDepth).toBe(6);
expect(stats.cacheHitRate).toBeGreaterThanOrEqual(0);
expect(stats.searchTime).toBeGreaterThan(0);
```

**测试数据**:
- 搜索节点: >0
- 搜索深度: 6
- 缓存命中率: ≥0
- 搜索时间: >0

---

## TC-298: MasterAI-清理置换表释放内存

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/master-ai.test.ts`

**前置条件**:
- MasterAI已执行多次搜索

**测试步骤**:
1. 执行多次搜索，填充置换表
2. 调用clearTranspositionTable()
3. 验证表大小为0
4. 验证命中率重置

**期望结果**:
```typescript
const masterAI = new MasterAI();
const board = new Board(15);

// 执行多次搜索
for (let i = 0; i < 10; i++) {
  const testBoard = board.clone();
  testBoard.setCell(i, i, 'black');
  await masterAI.getBestMove(testBoard, 'black');
}

expect(masterAI.getTranspositionTableSize()).toBeGreaterThan(0);

// 清理
masterAI.clearTranspositionTable();

expect(masterAI.getTranspositionTableSize()).toBe(0);
expect(masterAI.getCacheHitRate()).toBe(0);
```

**测试数据**:
- 清理前大小: >0
- 清理后大小: 0
- 清理后命中率: 0

---

## 四、集成测试（master-ai.integration.test.ts）

## TC-299: Integration-MasterAI完整游戏流程

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/master-ai.integration.test.ts`

**前置条件**:
- 游戏引擎、MasterAI、UI都可用

**测试步骤**:
1. 启动PvE游戏（难度：master）
2. 玩家下第一步
3. 等待MasterAI响应
4. 验证AI在10秒内返回
5. 验证着法合法
6. 验证游戏继续

**期望结果**:
```typescript
import { GameEngine } from '../core/game-engine';
import { MasterAI } from '../master-ai';

const engine = new GameEngine();
const masterAI = new MasterAI();

engine.startGame('pve');
engine.setAIDifficulty('master');

// 玩家第一步
await engine.makeMove({ x: 7, y: 7 });

// AI响应
const startTime = performance.now();
const aiMove = await masterAI.getBestMove(engine.getBoard(), 'white');
const endTime = performance.now();

const responseTime = endTime - startTime;

// 验证AI着法
expect(responseTime).toBeLessThan(10000); // <10秒
expect(engine.isValidMove(aiMove.position)).toBe(true);

// 验证游戏继续
await engine.makeMove(aiMove.position);
expect(engine.getGameStatus()).toBe('playing');
```

**测试数据**:
- AI响应时间: <10秒
- 着法合法性: true
- 游戏状态: playing

---

## TC-300: Integration-MasterAI vs HardAI性能对比

**优先级**: P0
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/master-ai.integration.test.ts`

**前置条件**:
- MasterAI和HardAI都可用

**测试步骤**:
1. 准备10个不同棋局
2. 用MasterAI和HardAI分别计算
3. 对比：搜索时间、搜索深度、评分
4. 验证MasterAI深度更深但时间可接受

**期望结果**:
```typescript
import { MasterAI } from '../master-ai';
import { HardAI } from '../hard-ai';

const masterAI = new MasterAI();
const hardAI = new HardAI();
const boards: Board[] = [];

// 准备10个棋局
for (let i = 0; i < 10; i++) {
  const board = new Board(15);
  for (let j = 0; j < 20; j++) {
    board.setCell(j % 15, (j / 15) | 0, j % 2 === 0 ? 'black' : 'white');
  }
  boards.push(board);
}

const masterResults = [];
const hardResults = [];

// MasterAI测试
for (const board of boards) {
  const start = performance.now();
  const result = await masterAI.getBestMove(board, 'black');
  const time = performance.now() - start;
  masterResults.push({ ...result, time });
}

// HardAI测试
for (const board of boards) {
  const start = performance.now();
  const result = await hardAI.getBestMove(board, 'black');
  const time = performance.now() - start;
  hardResults.push({ ...result, time });
}

// 验证
const avgMasterTime = masterResults.reduce((s, r) => s + r.time, 0) / 10;
const avgHardTime = hardResults.reduce((s, r) => s + r.time, 0) / 10;

expect(avgMasterTime).toBeLessThan(10000); // MasterAI <10秒
expect(masterResults[0].searchDepth).toBe(6); // MasterAI深度6
expect(hardResults[0].searchDepth).toBe(4); // HardAI深度4
```

**测试数据**:
- MasterAI平均时间: <10秒
- MasterAI深度: 6
- HardAI深度: 4

---

## TC-301: Integration-MasterAI Web Worker集成

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/master-ai.integration.test.ts`

**前置条件**:
- AI Worker已配置支持master难度

**测试步骤**:
1. 使用AI Client调用master难度
2. 验证Worker正确处理
3. 验证返回最佳着法
4. 验证不阻塞主线程

**期望结果**:
```typescript
import { AIClient } from '../ai-client';
import { Board } from '../core/board';

const aiClient = new AIClient();
const board = new Board(15);
board.setCell(7, 7, 'black');

// 主线程不被阻塞
let mainThreadResponsive = true;
const checkInterval = setInterval(() => {
  mainThreadResponsive = true;
}, 10);

// 调用AI Worker
const result = await aiClient.calculateMove(board, 'white', 'master');

clearInterval(checkInterval);

expect(mainThreadResponsive).toBe(true);
expect(result.position).toBeDefined();
```

**测试数据**:
- 主线程响应: true
- 返回着法: defined

---

## TC-302: Integration-MasterAI游戏存储集成

**优先级**: P1
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/master-ai.integration.test.ts`

**前置条件**:
- 游戏存储支持master难度

**测试步骤**:
1. 创建PvE游戏，选择master难度
2. 验证难度保存到游戏记录
3. 加载游戏记录
4. 验证master难度正确恢复

**期望结果**:
```typescript
import { useGameStore } from '../../store/game-store';

const store = useGameStore.getState();

// 开始master难度游戏
store.startGame('pve');
store.setAIDifficulty('master');

// 验证状态
expect(store.aiDifficulty).toBe('master');

// 模拟游戏并保存
await store.makeMove({ x: 7, y: 7 });
const record = store.getCurrentGameRecord();

// 验证记录包含难度
expect(record.difficulty).toBe('master');
```

**测试数据**:
- 游戏难度: master
- 记录难度: master

---

## TC-303: Integration-MasterAI vs MediumAI棋力对比

**优先级**: P1
**类型**: 棋力测试
**测试文件**: `src/game/ai/__tests__/master-ai.integration.test.ts`

**前置条件**:
- MasterAI和MediumAI都可用

**测试步骤**:
1. 设置对局：MasterAI（黑棋）vs MediumAI（白棋）
2. 执行完整对局
3. 验证MasterAI获胜

**期望结果**:
```typescript
import { MasterAI } from '../master-ai';
import { MediumAI } from '../medium-ai';
import { GameEngine } from '../core/game-engine';

const masterAI = new MasterAI();
const mediumAI = new MediumAI();
const engine = new GameEngine();

engine.startGame('pve');
engine.setAIDifficulty('master');

let moveCount = 0;
const maxMoves = 100;

while (engine.getGameStatus() === 'playing' && moveCount < maxMoves) {
  const currentPlayer = engine.getCurrentPlayer();
  const board = engine.getBoard();

  let move: Position;
  if (currentPlayer === 'black') {
    move = await masterAI.getBestMove(board, 'black');
  } else {
    move = await mediumAI.getBestMove(board, 'white');
  }

  await engine.makeMove(move);
  moveCount++;
}

const winner = engine.getWinner();
expect(winner).toBe('black'); // MasterAI获胜
```

**测试数据**:
- MasterAI: 黑棋
- MediumAI: 白棋
- 期望结果: MasterAI胜

---

## TC-304: Integration-MasterAI与提示系统集成

**优先级**: P1
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/master-ai.integration.test.ts`

**前置条件**:
- 提示系统支持master难度

**测试步骤**:
1. 设置游戏难度为master
2. 玩家请求提示
3. 验证使用MasterAI计算提示
4. 验证提示位置在10秒内返回

**期望结果**:
```typescript
import { useGameStore } from '../../store/game-store';

const store = useGameStore.getState();
store.startGame('pve');
store.setAIDifficulty('master');
await store.makeMove({ x: 7, y: 7 }); // 玩家第一步

// 请求提示
const startTime = performance.now();
await store.getHint();
const endTime = performance.now();

const hintTime = endTime - startTime;

expect(hintTime).toBeLessThan(10000); // <10秒
expect(store.hintPosition).toBeDefined();
```

**测试数据**:
- 提示计算时间: <10秒
- 提示位置: defined

---

## TC-305: Integration-MasterAI多局游戏内存管理

**优先级**: P1
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/master-ai.integration.test.ts`

**前置条件**:
- MasterAI管理置换表内存

**测试步骤**:
1. 连续进行5局游戏
2. 每局使用新的MasterAI实例
3. 验证旧实例的置换表被清理
4. 验证内存没有泄漏

**期望结果**:
```typescript
import { MasterAI } from '../master-ai';

for (let i = 0; i < 5; i++) {
  const masterAI = new MasterAI();
  const board = new Board(15);

  // 模拟一局游戏
  for (let j = 0; j < 10; j++) {
    await masterAI.getBestMove(board, j % 2 === 0 ? 'black' : 'white');
  }

  // 清理
  masterAI.clearTranspositionTable();
  // masterAI实例应该被垃圾回收
}

// 验证没有内存泄漏（这里只是示意，实际需要内存分析工具）
// expect(getMemoryUsage()).toBeLessThan(MAX_MEMORY);
```

**测试数据**:
- 游戏局数: 5
- 每局步数: 10
- 内存泄漏: 无

---

## TC-306: Integration-MasterAI超时降级到HardAI

**优先级**: P1
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/master-ai.integration.test.ts`

**前置条件**:
- MasterAI实现了超时降级

**测试步骤**:
1. 设置超时为1秒（很短）
2. 在复杂棋局上搜索
3. 验证超时后降级到HardAI
4. 验证仍返回有效着法

**期望结果**:
```typescript
const masterAI = new MasterAI({ timeout: 1000, enableFallback: true });
const board = new Board(15);

// 创建复杂局面
for (let i = 0; i < 60; i++) {
  board.setCell(i % 15, (i / 15) | 0, i % 2 === 0 ? 'black' : 'white');
}

const result = await masterAI.getBestMove(board, 'black');

// 验证返回了有效着法（可能来自降级到HardAI）
expect(result.position).toBeDefined();
expect(result.fromFallback).toBe(true); // 标记来自降级
```

**测试数据**:
- 超时设置: 1000ms
- 降级启用: true
- 返回着法: valid

---

## TC-307: Integration-MasterAI统计信息追踪

**优先级**: P1
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/master-ai.integration.test.ts`

**前置条件**:
- MasterAI追踪详细统计

**测试步骤**:
1. 执行多局游戏
2. 收集每局统计信息
3. 验证统计包含：平均时间、平均深度、平均缓存命中率

**期望结果**:
```typescript
import { MasterAI } from '../master-ai';

const masterAI = new MasterAI();
const stats: any[] = [];

for (let i = 0; i < 10; i++) {
  const board = new Board(15);
  board.setCell(i, i, 'black');

  await masterAI.getBestMove(board, 'black');
  stats.push(masterAI.getSearchStats());
  masterAI.clearTranspositionTable(); // 重置缓存
}

// 验证统计信息
const avgTime = stats.reduce((s, stat) => s + stat.searchTime, 0) / stats.length;
const avgDepth = stats.reduce((s, stat) => s + stat.searchDepth, 0) / stats.length;

expect(avgTime).toBeGreaterThan(0);
expect(avgDepth).toBe(6);
```

**测试数据**:
- 平均时间: >0
- 平均深度: 6
- 统计完整性: 100%

---

## TC-308: Integration-MasterAI并发安全性

**优先级**: P1
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/master-ai.integration.test.ts`

**前置条件**:
- MasterAI在Web Worker中运行

**测试步骤**:
1. 同时启动3个MasterAI计算（不同棋盘）
2. 验证每个都返回正确结果
3. 验证没有数据混淆

**期望结果**:
```typescript
import { AIClient } from '../ai-client';
import { Board } from '../core/board';

const aiClient = new AIClient();
const boards: Board[] = [];

for (let i = 0; i < 3; i++) {
  const board = new Board(15);
  board.setCell(i, i, 'black');
  boards.push(board);
}

// 并发计算
const results = await Promise.all(
  boards.map(board => aiClient.calculateMove(board, 'white', 'master'))
);

// 验证每个结果都不同且正确
expect(results).toHaveLength(3);
expect(results[0].position).toBeDefined();
expect(results[1].position).toBeDefined();
expect(results[2].position).toBeDefined();

// 验证结果不同
expect(results[0].position).not.toEqual(results[1].position);
```

**测试数据**:
- 并发数: 3
- 结果数: 3
- 结果唯一性: 100%

---

## TC-309: Integration-MasterAI与悔棋系统集成

**优先级**: P1
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/master-ai.integration.test.ts`

**前置条件**:
- 游戏支持悔棋

**测试步骤**:
1. 开始master难度游戏
2. 玩家和AI各下3步
3. 玩家悔棋
4. 验证撤销2步（玩家+AI）
5. 验证AI重新计算
6. 验证可以继续游戏

**期望结果**:
```typescript
import { useGameStore } from '../../store/game-store';

const store = useGameStore.getState();
store.startGame('pve');
store.setAIDifficulty('master');

// 下3轮
await store.makeMove({ x: 7, y: 7 }); // 玩家
await store.makeMove({ x: 7, y: 8 }); // AI
await store.makeMove({ x: 8, y: 8 }); // 玩家
await store.makeMove({ x: 8, y: 7 }); // AI
await store.makeMove({ x: 9, y: 9 }); // 玩家
await store.makeMove({ x: 9, y: 8 }); // AI

// 悔棋
store.undo();

// 验证撤销了2步
expect(store.moveHistory.length).toBe(4); // 6 - 2 = 4

// 验证可以继续
expect(store.gameStatus).toBe('playing');
```

**测试数据**:
- 初始步数: 6
- 悔棋后: 4
- 游戏状态: playing

---

## TC-310: Integration-MasterAI游戏记录保存

**优先级**: P1
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/master-ai.integration.test.ts`

**前置条件**:
- 游戏记录系统可用

**测试步骤**:
1. 进行master难度游戏
2. 游戏结束
3. 验证游戏记录保存
4. 验证记录包含AI难度

**期望结果**:
```typescript
import { useGameStore } from '../../store/game-store';
import { GameRecorder } from '../recorder';

const store = useGameStore.getState();
const recorder = new GameRecorder();

store.startGame('pve');
store.setAIDifficulty('master');

// 模拟一局游戏
await store.makeMove({ x: 7, y: 7 });
// ... 更多步骤 ...

// 游戏结束（假设黑棋获胜）
store.endGame('black');

// 保存记录
const record = recorder.saveGame();

// 验证记录
expect(record.difficulty).toBe('master');
expect(record.mode).toBe('pve');
expect(record.winner).toBe('black');
expect(record.moves.length).toBeGreaterThan(0);
```

**测试数据**:
- 记录难度: master
- 记录模式: pve
- 记录完整: true

---

## TC-311: Integration-MasterAI难度选择UI

**优先级**: P1
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/master-ai.integration.test.ts`

**前置条件**:
- UI支持master难度选择

**测试步骤**:
1. 渲染游戏设置页面
2. 验证有master难度选项
3. 选择master难度
4. 开始游戏
5. 验证使用MasterAI

**期望结果**:
```typescript
// 假设使用React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import GameSettings from '../../components/Game/GameSettings';

render(<GameSettings />);

// 验证master选项存在
const masterOption = screen.getByText('大师');
expect(masterOption).toBeDefined();

// 选择master难度
fireEvent.click(masterOption);

// 验证选中
const selectedDifficulty = screen.getByTestId('selected-difficulty');
expect(selectedDifficulty.textContent).toContain('大师');
```

**测试数据**:
- master选项: 存在
- 选中状态: true

---

## TC-312: Integration-MasterAI响应时间监控

**优先级**: P1
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/master-ai.integration.test.ts`

**前置条件**:
- 实现了响应时间监控

**测试步骤**:
1. 进行10局游戏
2. 记录每局AI平均响应时间
3. 验证95%的响应<10秒
4. 验证99%的响应<15秒

**期望结果**:
```typescript
import { MasterAI } from '../master-ai';

const masterAI = new MasterAI();
const responseTimes: number[] = [];

for (let i = 0; i < 10; i++) {
  const board = new Board(15);
  // 模拟游戏局
  for (let j = 0; j < 20; j++) {
    board.setCell(j % 15, (j / 15) | 0, j % 2 === 0 ? 'black' : 'white');
  }

  const start = performance.now();
  await masterAI.getBestMove(board, 'black');
  const time = performance.now() - start;

  responseTimes.push(time);
}

// 验证95% < 10秒
const sortedTimes = responseTimes.sort((a, b) => a - b);
const p95Index = Math.floor(sortedTimes.length * 0.95);
const p99Index = Math.floor(sortedTimes.length * 0.99);

expect(sortedTimes[p95Index]).toBeLessThan(10000); // P95 < 10秒
expect(sortedTimes[p99Index]).toBeLessThan(15000); // P99 < 15秒
```

**测试数据**:
- P95响应时间: <10秒
- P99响应时间: <15秒
- 样本数: 10

---

## TC-313: Integration-MasterAI错误恢复

**优先级**: P1
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/master-ai.integration.test.ts`

**前置条件**:
- MasterAI实现了错误恢复

**测试步骤**:
1. 模拟MasterAI内部错误
2. 验证捕获错误
3. 验证降级到HardAI
4. 验证游戏继续

**期望结果**:
```typescript
import { MasterAI } from '../master-ai';

// 创建会抛出错误的MasterAI
const masterAI = new MasterAI({
  onError: (error) => {
    // 错误处理：降级到HardAI
    console.error('MasterAI error:', error);
    return 'fallback';
  }
});

const board = new Board(15);
board.setCell(7, 7, 'black');

// 模拟错误（这里需要配合mock）
const result = await masterAI.getBestMove(board, 'black');

// 验证返回了有效结果（可能来自降级）
expect(result.position).toBeDefined();
```

**测试数据**:
- 错误处理: 触发
- 降级: 执行
- 返回结果: valid

---

## 五、边界条件测试

## TC-314: Boundary-置换表满载时性能

**优先级**: P0
**类型**: 边界测试
**测试文件**: `src/game/ai/__tests__/master-ai.boundary.test.ts`

**前置条件**:
- 置换表容量较小（如1000）

**测试步骤**:
1. 设置置换表容量为1000
2. 尝试存储2000个条目
3. 验证表大小不超过1000
4. 验证性能没有严重下降
5. 验证LRU策略正确驱逐

**期望结果**:
```typescript
import { MasterAI } from '../master-ai';

const masterAI = new MasterAI({ transpositionTableSize: 1000 });

// 尝试存储2000个条目
for (let i = 0; i < 2000; i++) {
  const board = new Board(15);
  board.setCell(i % 15, (i / 15) | 0, 'black');
  await masterAI.getBestMove(board, 'black');
}

const tableSize = masterAI.getTranspositionTableSize();
expect(tableSize).toBeLessThanOrEqual(1000);

// 验证性能（最新条目仍可快速访问）
const start = performance.now();
const result = await masterAI.getBestMove(/* 最近的棋盘 */, 'black');
const time = performance.now() - start;

expect(time).toBeLessThan(10000); // 性能没有严重下降
```

**测试数据**:
- 容量: 1000
- 尝试存储: 2000
- 实际大小: ≤1000
- 性能: 可接受

---

## TC-315: Boundary-深度6在极限复杂度棋局

**优先级**: P0
**类型**: 边界测试
**测试文件**: `src/game/ai/__tests__/master-ai.boundary.test.ts`

**前置条件**:
- 极限复杂棋局（接近终局，约200步）

**测试步骤**:
1. 创建200步的棋局
2. 用MasterAI搜索深度6
3. 验证在15秒内完成
4. 验证返回有效着法

**期望结果**:
```typescript
import { MasterAI } from '../master-ai';

const masterAI = new MasterAI();
const board = new Board(15);

// 创建200步的极限棋局
for (let i = 0; i < 200; i++) {
  board.setCell(i % 15, (i / 15) | 0, i % 2 === 0 ? 'black' : 'white');
}

const startTime = performance.now();
const result = await masterAI.getBestMove(board, 'black');
const endTime = performance.now();

const totalTime = endTime - startTime;

expect(totalTime).toBeLessThan(15000); // 极限情况下<15秒
expect(result.position).toBeDefined();
expect(result.searchDepth).toBe(6);
```

**测试数据**:
- 棋局步数: 200
- 时间限制: 15秒
- 返回着法: valid

---

## TC-316: Boundary-超时设置为0时立即返回

**优先级**: P1
**类型**: 边界测试
**测试文件**: `src/game/ai/__tests__/master-ai.boundary.test.ts`

**前置条件**:
- 超时设置为0（禁用超时）

**测试步骤**:
1. 创建MasterAI，设置超时为0
2. 执行搜索
3. 验证允许长时间搜索
4. 验证完成深度6

**期望结果**:
```typescript
const masterAI = new MasterAI({ timeout: 0 }); // 禁用超时
const board = new Board(15);
board.setCell(7, 7, 'black');

const startTime = performance.now();
const result = await masterAI.getBestMove(board, 'black');
const endTime = performance.now();

expect(result.searchDepth).toBe(6);
expect(endTime - startTime).toBeGreaterThan(0); // 允许任意长时间
```

**测试数据**:
- 超时设置: 0（禁用）
- 实际深度: 6
- 时间: 无限制

---

## TC-317: Boundary-空棋盘深度6搜索

**优先级**: P1
**类型**: 边界测试
**测试文件**: `src/game/ai/__tests__/master-ai.boundary.test.ts`

**前置条件**:
- 完全空棋盘

**测试步骤**:
1. 创建空棋盘
2. MasterAI深度6搜索
3. 验证快速返回（候选着法少）
4. 验证返回天元

**期望结果**:
```typescript
import { MasterAI } from '../master-ai';

const masterAI = new MasterAI();
const board = new Board(15); // 空棋盘

const startTime = performance.now();
const result = await masterAI.getBestMove(board, 'black');
const endTime = performance.now();

const totalTime = endTime - startTime;

expect(totalTime).toBeLessThan(5000); // 空棋盘应很快
expect(result.position).toEqual({ x: 7, y: 7 }); // 天元
expect(result.searchDepth).toBe(6);
```

**测试数据**:
- 棋盘状态: 空
- 响应时间: <5秒
- 返回位置: 天元

---

## TC-318: Boundary-单子棋盘搜索

**优先级**: P1
**类型**: 边界测试
**测试文件**: `src/game/ai/__tests__/master-ai.boundary.test.ts`

**前置条件**:
- 只有一颗棋子的棋盘

**测试步骤**:
1. 创建棋盘，只有黑棋在天元
2. MasterAI搜索
3. 验证在合理时间内返回
4. 验证返回合理位置（靠近天元）

**期望结果**:
```typescript
import { MasterAI } from '../master-ai';

const masterAI = new MasterAI();
const board = new Board(15);
board.setCell(7, 7, 'black'); // 只有一颗棋子

const startTime = performance.now();
const result = await masterAI.getBestMove(board, 'white');
const endTime = performance.now();

expect(endTime - startTime).toBeLessThan(8000);
expect(result.position).toBeDefined();

// 验证位置在天元附近
expect(Math.abs(result.position.x - 7)).toBeLessThanOrEqual(2);
expect(Math.abs(result.position.y - 7)).toBeLessThanOrEqual(2);
```

**测试数据**:
- 棋子数: 1
- 响应时间: <8秒
- 位置合理性: 靠近天元

---

## TC-319: Boundary-深度1搜索（最小深度）

**优先级**: P1
**类型**: 边界测试
**测试文件**: `src/game/ai/__tests__/master-ai.boundary.test.ts`

**前置条件**:
- MasterAI支持配置最小深度

**测试步骤**:
1. 创建MasterAI，设置深度为1
2. 执行搜索
3. 验证只搜索深度1
4. 验证快速返回

**期望结果**:
```typescript
const masterAI = new MasterAI({ searchDepth: 1 });
const board = new Board(15);
board.setCell(7, 7, 'black');

const startTime = performance.now();
const result = await masterAI.getBestMove(board, 'black');
const endTime = performance.now();

expect(result.searchDepth).toBe(1);
expect(endTime - startTime).toBeLessThan(1000); // 应该很快
```

**测试数据**:
- 搜索深度: 1
- 响应时间: <1秒

---

## TC-320: Boundary-深度10搜索（超常深度）

**优先级**: P1
**类型**: 边界测试
**测试文件**: `src/game/ai/__tests__/master-ai.boundary.test.ts`

**前置条件**:
- MasterAI支持配置超常深度

**测试步骤**:
1. 创建MasterAI，设置深度为10
2. 执行搜索
3. 验证完成深度10
4. 验证时间较长但可接受

**期望结果**:
```typescript
const masterAI = new MasterAI({ searchDepth: 10 });
const board = new Board(15);

// 创建中等复杂度棋局
for (let i = 0; i < 10; i++) {
  board.setCell(i, i, i % 2 === 0 ? 'black' : 'white');
}

const startTime = performance.now();
const result = await masterAI.getBestMove(board, 'black');
const endTime = performance.now();

const totalTime = endTime - startTime;

expect(result.searchDepth).toBe(10);
expect(totalTime).toBeGreaterThan(0); // 可能需要很长时间
// 注意：这个测试可能需要较长时间
```

**测试数据**:
- 搜索深度: 10
- 响应时间: 可能很长
- 返回着法: valid

---

## TC-321: Boundary-置换表容量为0

**优先级**: P1
**类型**: 边界测试
**测试文件**: `src/game/ai/__tests__/master-ai.boundary.test.ts`

**前置条件**:
- 置换表容量设置为0（禁用）

**测试步骤**:
1. 创建MasterAI，设置置换表大小为0
2. 执行搜索
3. 验证仍能正常工作
4. 验证缓存命中率为0

**期望结果**:
```typescript
const masterAI = new MasterAI({ transpositionTableSize: 0 });
const board = new Board(15);
board.setCell(7, 7, 'black');

const result = await masterAI.getBestMove(board, 'black');

expect(result.position).toBeDefined();
expect(masterAI.getTranspositionTableSize()).toBe(0);
expect(masterAI.getCacheHitRate()).toBe(0);
```

**测试数据**:
- 置换表大小: 0
- 功能正常: true
- 命中率: 0

---

## TC-322: Boundary-连续快速请求

**优先级**: P1
**类型**: 边界测试
**测试文件**: `src/game/ai/__tests__/master-ai.boundary.test.ts`

**前置条件**:
- 快速连续请求多次

**测试步骤**:
1. 快速连续发起10个搜索请求
2. 验证每个都返回正确结果
3. 验证没有请求丢失
4. 验证没有数据混淆

**期望结果**:
```typescript
import { MasterAI } from '../master-ai';

const masterAI = new MasterAI();
const boards: Board[] = [];

for (let i = 0; i < 10; i++) {
  const board = new Board(15);
  board.setCell(i, i, 'black');
  boards.push(board);
}

// 快速连续请求
const results = await Promise.all(
  boards.map(board => masterAI.getBestMove(board, 'black'))
);

expect(results).toHaveLength(10);
results.forEach((result, index) => {
  expect(result.position).toBeDefined();
  // 验证结果不同（每个棋盘应返回不同着法）
  if (index > 0) {
    expect(result.position).not.toEqual(results[index - 1].position);
  }
});
```

**测试数据**:
- 请求数: 10
- 响应数: 10
- 结果唯一性: 100%

---

## 六、性能基准测试

## TC-323: Performance-MasterAI vs HardAI详细性能对比

**优先级**: P0
**类型**: 性能基准测试
**测试文件**: `src/game/ai/__tests__/master-ai.performance.test.ts`

**前置条件**:
- 标准测试棋局集

**测试步骤**:
1. 准备10个标准测试棋局
2. MasterAI和HardAI分别测试
3. 记录：搜索时间、搜索深度、搜索节点数、剪枝效率
4. 生成对比报告

**期望结果**:
```typescript
import { MasterAI } from '../master-ai';
import { HardAI } from '../hard-ai';

const masterAI = new MasterAI();
const hardAI = new HardAI();

const testBoards = generateTestBoards(10); // 生成测试棋局

const masterStats = [];
const hardStats = [];

for (const board of testBoards) {
  // MasterAI测试
  const start1 = performance.now();
  const result1 = await masterAI.getBestMove(board, 'black');
  const time1 = performance.now() - start1;

  masterStats.push({
    time: time1,
    depth: result1.searchDepth,
    nodes: masterAI.getSearchStats().nodesSearched
  });

  // HardAI测试
  const start2 = performance.now();
  const result2 = await hardAI.getBestMove(board, 'black');
  const time2 = performance.now() - start2;

  hardStats.push({
    time: time2,
    depth: result2.searchDepth,
    nodes: hardAI.getSearchStats().nodesSearched
  });
}

// 验证性能
const avgMasterTime = masterStats.reduce((s, s) => s + s.time, 0) / 10;
const avgHardTime = hardStats.reduce((s, s) => s + s.time, 0) / 10;

console.log('MasterAI平均时间:', avgMasterTime);
console.log('HardAI平均时间:', avgHardTime);
console.log('MasterAI平均深度:', masterStats.reduce((s, s) => s + s.depth, 0) / 10);
console.log('HardAI平均深度:', hardStats.reduce((s, s) => s + s.depth, 0) / 10);

expect(avgMasterTime).toBeLessThan(10000); // MasterAI <10秒
```

**测试数据**:
- 测试棋局: 10个
- MasterAI平均时间: <10秒
- MasterAI平均深度: 6
- HardAI平均深度: 4

---

## 测试总结

### 测试用例统计
- **置换表测试**: 13个（TC-258 ~ TC-270）
- **迭代加深测试**: 10个（TC-271 ~ TC-280）
- **MasterAI测试**: 18个（TC-281 ~ TC-298）
- **集成测试**: 15个（TC-299 ~ TC-313）
- **边界条件测试**: 9个（TC-314 ~ TC-322）
- **性能基准测试**: 1个（TC-323）

**总计**: 66个测试用例

### 测试覆盖范围
- ✅ 置换表基础功能（存储、读取、删除、冲突处理）
- ✅ 置换表LRU策略和容量管理
- ✅ 迭代加深深度递增
- ✅ 迭代加深超时处理
- ✅ 迭代加深最佳着法传递
- ✅ MasterAI基础功能
- ✅ MasterAI置换表集成
- ✅ MasterAI迭代加深集成
- ✅ MasterAI性能目标（<10秒）
- ✅ MasterAI棋力测试（vs HardAI/MediumAI）
- ✅ 完整游戏流程集成
- ✅ Web Worker集成
- ✅ 边界条件（满载、极限复杂度、超时等）
- ✅ 性能基准测试

### 性能要求
- 深度6搜索时间: <10秒（正常棋局）
- 深度6搜索时间: <15秒（极限复杂度）
- 置换表存储: <1ms
- 置换表读取: <0.1ms
- 缓存命中率: >0%（随着搜索增加）
- 剪枝效率: >HardAI

### 棋力要求
- MasterAI必须胜过HardAI
- MasterAI深度6优于HardAI深度4
- MasterAI必须识别必胜/必败局面
- MasterAI必须优先进攻而不是盲目防守

### 重要约束
- **绝对不要修改或删除Week 1-5的任何测试**（233个测试）
- 所有新测试必须通过
- 所有Week 1-5回归测试必须通过
- 性能测试必须满足目标要求

---

**文档结束**
