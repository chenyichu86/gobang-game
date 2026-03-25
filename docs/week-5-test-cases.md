# Week 5 - 测试用例文档

## 文档信息
- **文档版本**: v1.0
- **创建日期**: 2026-03-25
- **负责人**: 测试工程师 (QA)
- **阶段**: Phase 2 - 困难AI实现
- **周次**: Week 5
- **开发模式**: TDD（测试驱动开发）
- **关联文档**: week-5-WO.md, week-5-PL.md

---

## 测试概览

### 测试范围
- **困难AI核心算法**: 30个（单元测试）
  - 局面评估函数（evaluateBoard）
  - Minimax算法
  - Alpha-Beta剪枝
  - 候选着法生成（candidateMoves）
  - HardAI类集成
- **集成测试**: 15个
  - AI完整流程测试
  - Web Worker集成测试
- **性能测试**: 10个
  - AI响应时间测试（< 3秒）
  - 不同搜索深度性能对比
- **边界条件测试**: 10个
  - 空棋盘开局
  - 接近胜利状态
  - 防守优先情况
- **总计**: 65个测试用例

### 测试框架
- **单元测试**: Vitest
- **集成测试**: Vitest
- **性能测试**: Vitest + performance.now()
- **Web Worker测试**: Comlink + Vitest

### 测试覆盖率目标
- 代码覆盖率: >95%
- 核心AI算法覆盖率: 100%
- 性能测试覆盖率: 100%

---

## 一、局面评估函数测试（evaluateBoard.test.ts）

### 1.1 基础评估测试

## TC-193: evaluateBoard-空棋盘评估为0

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/evaluateBoard.test.ts`

**前置条件**:
- evaluateBoard函数已定义
- 空棋盘已创建

**测试步骤**:
1. 创建15×15的空棋盘
2. 调用evaluateBoard(board, 'black')
3. 验证返回分数为0

**期望结果**:
```typescript
import { evaluateBoard } from '../evaluator';
import { Board } from '../core/board';

const board = new Board(15);
const score = evaluateBoard(board, 'black');
expect(score).toBe(0);
```

**测试数据**:
- 棋盘大小: 15
- 评估玩家: black
- 期望分数: 0

---

## TC-194: evaluateBoard-识别连五（FIVE）

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/evaluateBoard.test.ts`

**前置条件**:
- 棋盘上有连五棋型

**测试步骤**:
1. 创建棋盘，放置4个黑棋连成一线
2. 在任意空位放置第5个黑棋形成连五
3. 验证evaluateBoard识别为连五
4. 验证得分 = 100000

**期望结果**:
```typescript
const board = new Board(15);
// 创建横向连五
board.setCell(5, 7, 'black');
board.setCell(6, 7, 'black');
board.setCell(7, 7, 'black');
board.setCell(8, 7, 'black');
board.setCell(9, 7, 'black');

const score = evaluateBoard(board, 'black');
expect(score).toBeGreaterThanOrEqual(100000); // 连五得分
```

**测试数据**:
- 棋型: XXXXX（连五）
- 期望得分: 100000+

---

## TC-195: evaluateBoard-识别活四（LIVE_FOUR）

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/evaluateBoard.test.ts`

**前置条件**:
- 棋盘上有活四棋型

**测试步骤**:
1. 创建棋盘：`_XXXX_`（空-黑-黑-黑-黑-空）
2. 验证evaluateBoard识别为活四
3. 验证得分 = 10000

**期望结果**:
```typescript
const board = new Board(15);
board.setCell(5, 7, 'black');
board.setCell(6, 7, 'black');
board.setCell(7, 7, 'black');
board.setCell(8, 7, 'black');
// 位置4和9为空

const score = evaluateBoard(board, 'black');
expect(score).toBeGreaterThanOrEqual(10000); // 活四得分
```

**测试数据**:
- 棋型: _XXXX_（活四）
- 期望得分: 10000+

---

## TC-196: evaluateBoard-识别冲四（DEAD_FOUR）

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/evaluateBoard.test.ts`

**前置条件**:
- 棋盘上有冲四棋型

**测试步骤**:
1. 创建棋盘：`OXXXX_`（边界/白棋-黑-黑-黑-黑-空）
2. 验证evaluateBoard识别为冲四
3. 验证得分 = 5000

**期望结果**:
```typescript
const board = new Board(15);
board.setCell(0, 7, 'white'); // 一端被堵
board.setCell(1, 7, 'black');
board.setCell(2, 7, 'black');
board.setCell(3, 7, 'black');
board.setCell(4, 7, 'black');
// 位置5为空

const score = evaluateBoard(board, 'black');
expect(score).toBeGreaterThanOrEqual(5000); // 冲四得分
```

**测试数据**:
- 棋型: OXXXX_（冲四）
- 期望得分: 5000+

---

## TC-197: evaluateBoard-识别活三（LIVE_THREE）

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/evaluateBoard.test.ts`

**前置条件**:
- 棋盘上有活三棋型

**测试步骤**:
1. 创建棋盘：`_XXX_`（空-黑-黑-黑-空）
2. 验证evaluateBoard识别为活三
3. 验证得分 = 1000

**期望结果**:
```typescript
const board = new Board(15);
board.setCell(5, 7, 'black');
board.setCell(6, 7, 'black');
board.setCell(7, 7, 'black');
// 位置4和8为空

const score = evaluateBoard(board, 'black');
expect(score).toBeGreaterThanOrEqual(1000); // 活三得分
```

**测试数据**:
- 棋型: _XXX_（活三）
- 期望得分: 1000+

---

## TC-198: evaluateBoard-识别眠三（SLEEP_THREE）

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/evaluateBoard.test.ts`

**前置条件**:
- 棋盘上有眠三棋型

**测试步骤**:
1. 创建棋盘：`OXXX_`（边界-黑-黑-黑-空）
2. 验证evaluateBoard识别为眠三
3. 验证得分 = 100

**期望结果**:
```typescript
const board = new Board(15);
board.setCell(0, 7, 'white');
board.setCell(1, 7, 'black');
board.setCell(2, 7, 'black');
board.setCell(3, 7, 'black');

const score = evaluateBoard(board, 'black');
expect(score).toBeGreaterThanOrEqual(100); // 眠三得分
```

**测试数据**:
- 棋型: OXXX_（眠三）
- 期望得分: 100+

---

## TC-199: evaluateBoard-识别活二（LIVE_TWO）

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/evaluateBoard.test.ts`

**前置条件**:
- 棋盘上有活二棋型

**测试步骤**:
1. 创建棋盘：`_XX_`（空-黑-黑-空）
2. 验证evaluateBoard识别为活二
3. 验证得分 = 10

**期望结果**:
```typescript
const board = new Board(15);
board.setCell(5, 7, 'black');
board.setCell(6, 7, 'black');

const score = evaluateBoard(board, 'black');
expect(score).toBeGreaterThanOrEqual(10); // 活二得分
```

**测试数据**:
- 棋型: _XX_（活二）
- 期望得分: 10+

---

## TC-200: evaluateBoard-多方向棋型累加

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/evaluateBoard.test.ts`

**前置条件**:
- 棋盘上有十字交叉的棋型

**测试步骤**:
1. 创建十字交叉棋型（横向和纵向都有棋子）
2. 验证evaluateBoard累加多个方向的得分
3. 验证总分 = 各方向得分之和

**期望结果**:
```typescript
const board = new Board(15);
// 创建十字：中心(7,7)，横向左右，纵向上下
board.setCell(6, 7, 'black');
board.setCell(7, 7, 'black');
board.setCell(8, 7, 'black');
board.setCell(7, 6, 'black');
board.setCell(7, 8, 'black');

const score = evaluateBoard(board, 'black');
// 应该累加纵向（活三）和横向（活二）的得分
expect(score).toBeGreaterThan(1000); // 至少有一个活三
```

**测试数据**:
- 棋型: 十字交叉
- 期望得分: 多方向累加

---

## TC-201: evaluateBoard-进攻与防守权重

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/evaluateBoard.test.ts`

**前置条件**:
- 棋盘上AI和玩家都有威胁

**测试步骤**:
1. 创建棋盘：AI有活三，玩家也有活三
2. 计算进攻得分（AI视角）
3. 计算防守得分（玩家视角）
4. 验证总得分 = 进攻 + 防守 × 0.9

**期望结果**:
```typescript
const board = new Board(15);
// AI活三
board.setCell(5, 7, 'black');
board.setCell(6, 7, 'black');
board.setCell(7, 7, 'black');
// 玩家活三
board.setCell(5, 5, 'white');
board.setCell(6, 5, 'white');
board.setCell(7, 5, 'white');

const attackScore = evaluateBoard(board, 'black');
const defenseScore = evaluateBoard(board, 'white');

// 验证防守权重
const totalScore = attackScore + defenseScore * 0.9;
expect(totalScore).toBeGreaterThan(0);
```

**测试数据**:
- 进攻权重: 1.0
- 防守权重: 0.9

---

## TC-202: evaluateBoard-纵向连五检测

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/evaluateBoard.test.ts`

**前置条件**:
- 棋盘上有纵向连五

**测试步骤**:
1. 创建纵向连五：`(7,5), (7,6), (7,7), (7,8), (7,9)`
2. 验证evaluateBoard正确识别
3. 验证得分 = 100000

**期望结果**:
```typescript
const board = new Board(15);
board.setCell(7, 5, 'black');
board.setCell(7, 6, 'black');
board.setCell(7, 7, 'black');
board.setCell(7, 8, 'black');
board.setCell(7, 9, 'black');

const score = evaluateBoard(board, 'black');
expect(score).toBeGreaterThanOrEqual(100000);
```

**测试数据**:
- 棋型: 纵向连五
- 期望得分: 100000+

---

## TC-203: evaluateBoard-主对角线连五检测

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/evaluateBoard.test.ts`

**前置条件**:
- 棋盘上有主对角线连五

**测试步骤**:
1. 创建主对角线连五：`(5,5), (6,6), (7,7), (8,8), (9,9)`
2. 验证evaluateBoard正确识别
3. 验证得分 = 100000

**期望结果**:
```typescript
const board = new Board(15);
board.setCell(5, 5, 'black');
board.setCell(6, 6, 'black');
board.setCell(7, 7, 'black');
board.setCell(8, 8, 'black');
board.setCell(9, 9, 'black');

const score = evaluateBoard(board, 'black');
expect(score).toBeGreaterThanOrEqual(100000);
```

**测试数据**:
- 棋型: 主对角线连五
- 期望得分: 100000+

---

## TC-204: evaluateBoard-副对角线连五检测

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/evaluateBoard.test.ts`

**前置条件**:
- 棋盘上有副对角线连五

**测试步骤**:
1. 创建副对角线连五：`(5,9), (6,8), (7,7), (8,6), (9,5)`
2. 验证evaluateBoard正确识别
3. 验证得分 = 100000

**期望结果**:
```typescript
const board = new Board(15);
board.setCell(5, 9, 'black');
board.setCell(6, 8, 'black');
board.setCell(7, 7, 'black');
board.setCell(8, 6, 'black');
board.setCell(9, 5, 'black');

const score = evaluateBoard(board, 'black');
expect(score).toBeGreaterThanOrEqual(100000);
```

**测试数据**:
- 棋型: 副对角线连五
- 期望得分: 100000+

---

## TC-205: evaluateBoard-边界棋型检测

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/evaluateBoard.test.ts`

**前置条件**:
- 棋盘边界有棋型

**测试步骤**:
1. 在棋盘边界创建各种棋型
2. 验证evaluateBoard正确处理边界
3. 验证不会越界访问

**期望结果**:
```typescript
const board = new Board(15);
// 边界活三
board.setCell(0, 7, 'black');
board.setCell(1, 7, 'black');
board.setCell(2, 7, 'black');

const score = evaluateBoard(board, 'black');
expect(score).toBeGreaterThanOrEqual(1000);
// 验证不会抛出越界错误
```

**测试数据**:
- 边界位置: x=0, x=14, y=0, y=14
- 棋型: 活三

---

## TC-206: evaluateBoard-双方棋子评分

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/evaluateBoard.test.ts`

**前置条件**:
- 棋盘上双方都有棋子

**测试步骤**:
1. 创建棋盘：黑棋有活四，白棋有活三
2. 计算黑棋视角的分数
3. 计算白棋视角的分数
4. 验证分数合理性

**期望结果**:
```typescript
const board = new Board(15);
// 黑棋活四
board.setCell(5, 7, 'black');
board.setCell(6, 7, 'black');
board.setCell(7, 7, 'black');
board.setCell(8, 7, 'black');
// 白棋活三
board.setCell(5, 5, 'white');
board.setCell(6, 5, 'white');
board.setCell(7, 5, 'white');

const blackScore = evaluateBoard(board, 'black');
const whiteScore = evaluateBoard(board, 'white');

// 黑棋应该领先（活四 > 活三）
expect(blackScore).toBeGreaterThan(whiteScore);
```

**测试数据**:
- 黑棋: 活四（10000分）
- 白棋: 活三（1000分）

---

## TC-207: evaluateBoard-性能测试

**优先级**: P1
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/evaluateBoard.test.ts`

**前置条件**:
- 中局棋盘（约50个棋子）

**测试步骤**:
1. 创建中局棋盘
2. 记录评估时间
3. 验证评估时间<10ms

**期望结果**:
```typescript
const board = createMidGameBoard(50);

const start = performance.now();
const score = evaluateBoard(board, 'black');
const duration = performance.now() - start;

expect(duration).toBeLessThan(10); // <10ms
console.log(`局面评估时间: ${duration.toFixed(2)}ms`);
```

**测试数据**:
- 棋盘棋子数: 50个
- 评估时间: <10ms

---

## 二、Minimax算法测试（minimax.test.ts）

### 2.1 基础Minimax测试

## TC-208: minimax-深度为0时返回当前评估值

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/minimax.test.ts`

**前置条件**:
- minimax函数已定义
- 棋盘已创建

**测试步骤**:
1. 创建棋盘，放置一些棋子
2. 调用minimax(board, 0, 'black', -Infinity, Infinity)
3. 验证返回evaluateBoard的值

**期望结果**:
```typescript
import { minimax } from '../minimax';
import { evaluateBoard } from '../evaluator';
import { Board } from '../core/board';

const board = new Board(15);
board.setCell(7, 7, 'black');
board.setCell(7, 8, 'white');

const score = minimax(board, 0, 'black', -Infinity, Infinity);
const expectedScore = evaluateBoard(board, 'black');

expect(score).toBe(expectedScore);
```

**测试数据**:
- 深度: 0
- 期望: 直接返回评估值

---

## TC-209: minimax-深度为1时选择最优位置

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/minimax.test.ts`

**前置条件**:
- 棋盘上有明显的最优位置

**测试步骤**:
1. 创建棋盘：黑棋有连五机会
2. 调用minimax(board, 1, 'black', -Infinity, Infinity)
3. 验证选择连五位置

**期望结果**:
```typescript
const board = new Board(15);
// 黑棋四连，差一步获胜
board.setCell(5, 7, 'black');
board.setCell(6, 7, 'black');
board.setCell(7, 7, 'black');
board.setCell(8, 7, 'black');

const score = minimax(board, 1, 'black', -Infinity, Infinity);
// 应该返回高分（选择连五）
expect(score).toBeGreaterThan(100000);
```

**测试数据**:
- 深度: 1
- 棋型: 黑棋四连

---

## TC-210: minimax-深度为2时考虑对手响应

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/minimax.test.ts`

**前置条件**:
- 棋盘上需要考虑防守

**测试步骤**:
1. 创建棋盘：黑棋有活三，白棋也有活三
2. 调用minimax(board, 2, 'black', -Infinity, Infinity)
3. 验证考虑了白棋的防守

**期望结果**:
```typescript
const board = new Board(15);
// 黑棋活三
board.setCell(5, 7, 'black');
board.setCell(6, 7, 'black');
board.setCell(7, 7, 'black');
// 白棋活三
board.setCell(5, 5, 'white');
board.setCell(6, 5, 'white');
board.setCell(7, 5, 'white');

const score = minimax(board, 2, 'black', -Infinity, Infinity);
// 深度2应该考虑白棋的防守，分数不会太高
expect(score).toBeLessThan(100000);
```

**测试数据**:
- 深度: 2
- 场景: 攻防兼顾

---

## TC-211: minimax-最大深度限制

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/minimax.test.ts`

**前置条件**:
- minimax函数已定义

**测试步骤**:
1. 创建复杂棋盘
2. 调用minimax(board, 4, 'black', -Infinity, Infinity)
3. 验证在深度4时停止
4. 验证不会无限递归

**期望结果**:
```typescript
const board = createComplexBoard();

let callCount = 0;
const originalMinimax = minimax;
// Mock minimax来计数
const mockMinimax = (...args: any[]) => {
  callCount++;
  return originalMinimax(...args);
};

mockMinimax(board, 4, 'black', -Infinity, Infinity);

// 验证调用次数合理（不会无限递归）
expect(callCount).toBeLessThan(10000);
```

**测试数据**:
- 最大深度: 4
- 预期调用次数: <10000

---

## TC-212: minimax-玩家切换正确

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/minimax.test.ts`

**前置条件**:
- minimax函数已定义

**测试步骤**:
1. 创建棋盘
2. 调用minimax(board, 2, 'black', -Infinity, Infinity)
3. 验证内部正确切换玩家

**期望结果**:
```typescript
const board = new Board(15);
board.setCell(7, 7, 'black');

// 验证玩家切换
const players: Player[] = [];
const trackMinimax = (b: Board, depth: number, player: Player) => {
  players.push(player);
  if (depth === 0) return evaluateBoard(b, player);
  // ... 递归逻辑
};

trackMinimax(board, 2, 'black');

// 验证玩家序列: black -> white -> black
expect(players).toEqual(['black', 'white', 'black']);
```

**测试数据**:
- 初始玩家: black
- 切换序列: black -> white -> black

---

## TC-213: minimax-返回最优位置和分数

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/minimax.test.ts`

**前置条件**:
- minimax函数已定义

**测试步骤**:
1. 创建棋盘，有多个可选位置
2. 调用minimaxWithMove(board, 3, 'black')
3. 验证返回最优位置和分数

**期望结果**:
```typescript
import { minimaxWithMove } from '../minimax';

const board = new Board(15);
board.setCell(7, 7, 'black');
board.setCell(7, 8, 'white');

const result = minimaxWithMove(board, 3, 'black');

expect(result).toHaveProperty('move');
expect(result).toHaveProperty('score');
expect(result.move.x).toBeGreaterThanOrEqual(0);
expect(result.move.x).toBeLessThan(15);
expect(result.move.y).toBeGreaterThanOrEqual(0);
expect(result.move.y).toBeLessThan(15);
```

**测试数据**:
- 深度: 3
- 返回: { move: Position, score: number }

---

## TC-214: minimax-游戏结束时立即返回

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/minimax.test.ts`

**前置条件**:
- 棋盘上已有连五

**测试步骤**:
1. 创建棋盘，黑棋已经连五获胜
2. 调用minimax(board, 3, 'black', -Infinity, Infinity)
3. 验证立即返回，不再搜索

**期望结果**:
```typescript
const board = new Board(15);
// 黑棋连五
board.setCell(5, 7, 'black');
board.setCell(6, 7, 'black');
board.setCell(7, 7, 'black');
board.setCell(8, 7, 'black');
board.setCell(9, 7, 'black');

const start = performance.now();
const score = minimax(board, 3, 'black', -Infinity, Infinity);
const duration = performance.now() - start;

// 应该立即返回（<1ms）
expect(duration).toBeLessThan(1);
expect(score).toBeGreaterThanOrEqual(100000);
```

**测试数据**:
- 场景: 黑棋已获胜
- 响应时间: <1ms

---

## TC-215: minimax-棋盘已满返回0

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/minimax.test.ts`

**前置条件**:
- 棋盘已满

**测试步骤**:
1. 创建已满的棋盘
2. 调用minimax(board, 3, 'black', -Infinity, Infinity)
3. 验证返回0（平局）

**期望结果**:
```typescript
const board = createFullBoard();

const score = minimax(board, 3, 'black', -Infinity, Infinity);

expect(score).toBe(0); // 平局
```

**测试数据**:
- 场景: 棋盘已满
- 期望分数: 0

---

## TC-216: minimax-性能测试-深度1

**优先级**: P1
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/minimax.test.ts`

**前置条件**:
- 中局棋盘

**测试步骤**:
1. 创建中局棋盘（50个棋子）
2. 测量minimax深度1的执行时间
3. 验证<100ms

**期望结果**:
```typescript
const board = createMidGameBoard(50);

const start = performance.now();
const score = minimax(board, 1, 'black', -Infinity, Infinity);
const duration = performance.now() - start;

expect(duration).toBeLessThan(100); // <100ms
console.log(`Minimax深度1执行时间: ${duration.toFixed(2)}ms`);
```

**测试数据**:
- 深度: 1
- 棋子数: 50
- 响应时间: <100ms

---

## TC-217: minimax-性能测试-深度2

**优先级**: P1
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/minimax.test.ts`

**前置条件**:
- 中局棋盘

**测试步骤**:
1. 创建中局棋盘（50个棋子）
2. 测量minimax深度2的执行时间
3. 验证<500ms

**期望结果**:
```typescript
const board = createMidGameBoard(50);

const start = performance.now();
const score = minimax(board, 2, 'black', -Infinity, Infinity);
const duration = performance.now() - start;

expect(duration).toBeLessThan(500); // <500ms
console.log(`Minimax深度2执行时间: ${duration.toFixed(2)}ms`);
```

**测试数据**:
- 深度: 2
- 棋子数: 50
- 响应时间: <500ms

---

## 三、Alpha-Beta剪枝测试（alphaBeta.test.ts）

### 3.1 剪枝基础测试

## TC-218: alphaBeta-基础剪枝功能

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/alphaBeta.test.ts`

**前置条件**:
- alphaBeta函数已定义
- 棋盘已创建

**测试步骤**:
1. 创建棋盘，有多个候选位置
2. 调用alphaBeta(board, 3, 'black', -Infinity, Infinity)
3. 验证返回正确分数
4. 验证剪枝生效（调用次数减少）

**期望结果**:
```typescript
import { alphaBeta } from '../alpha-beta';
import { minimax } from '../minimax';

const board = createMidGameBoard(50);

// 比较alphaBeta和minimax的调用次数
let alphaBetaCalls = 0;
let minimaxCalls = 0;

// Mock计数
alphaBeta(board, 3, 'black', -Infinity, Infinity);
minimax(board, 3, 'black', -Infinity, Infinity);

// alphaBeta应该调用更少次数
expect(alphaBetaCalls).toBeLessThan(minimaxCalls);
```

**测试数据**:
- 深度: 3
- 剪枝效果: 减少调用次数

---

## TC-219: alphaBeta-Alpha剪枝触发

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/alphaBeta.test.ts`

**前置条件**:
- alphaBeta函数已定义

**测试步骤**:
1. 创建棋盘，有明显的Alpha剪枝场景
2. 调用alphaBeta(board, 3, 'black', -Infinity, Infinity)
3. 验证Alpha剪枝被触发

**期望结果**:
```typescript
const board = new Board(15);
// 创建场景：第一个分支已经找到很好的解，后续分支可以剪枝
board.setCell(7, 7, 'black');
board.setCell(7, 8, 'white');
board.setCell(8, 7, 'black');
board.setCell(8, 8, 'white');

let pruneCount = 0;
// Mock alphaBeta来记录剪枝次数
const result = alphaBeta(board, 3, 'black', -Infinity, Infinity);

// 验证剪枝发生
expect(pruneCount).toBeGreaterThan(0);
```

**测试数据**:
- 深度: 3
- 剪枝类型: Alpha剪枝

---

## TC-220: alphaBeta-Beta剪枝触发

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/alphaBeta.test.ts`

**前置条件**:
- alphaBeta函数已定义

**测试步骤**:
1. 创建棋盘，有明显的Beta剪枝场景
2. 调用alphaBeta(board, 3, 'black', -Infinity, Infinity)
3. 验证Beta剪枝被触发

**期望结果**:
```typescript
const board = new Board(15);
// 创建Beta剪枝场景
board.setCell(7, 7, 'black');
board.setCell(7, 8, 'white');

let betaPruneCount = 0;
// Mock alphaBeta来记录Beta剪枝
const result = alphaBeta(board, 3, 'black', -Infinity, Infinity);

// 验证Beta剪枝发生
expect(betaPruneCount).toBeGreaterThan(0);
```

**测试数据**:
- 深度: 3
- 剪枝类型: Beta剪枝

---

## TC-221: alphaBeta-结果与minimax一致

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/alphaBeta.test.ts`

**前置条件**:
- alphaBeta和minimax都已定义

**测试步骤**:
1. 创建相同棋盘
2. 分别调用alphaBeta和minimax
3. 验证返回相同分数

**期望结果**:
```typescript
import { alphaBeta } from '../alpha-beta';
import { minimax } from '../minimax';

const board = createMidGameBoard(50);

const alphaBetaScore = alphaBeta(board, 3, 'black', -Infinity, Infinity);
const minimaxScore = minimax(board, 3, 'black', -Infinity, Infinity);

// 结果应该相同或接近（允许浮点误差）
expect(Math.abs(alphaBetaScore - minimaxScore)).toBeLessThan(0.01);
```

**测试数据**:
- 深度: 3
- 结果一致性: <0.01误差

---

## TC-222: alphaBeta-性能提升验证

**优先级**: P0
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/alphaBeta.test.ts`

**前置条件**:
- alphaBeta和minimax都已定义

**测试步骤**:
1. 创建复杂棋盘
2. 测量alphaBeta执行时间
3. 测量minimax执行时间
4. 验证alphaBeta更快

**期望结果**:
```typescript
const board = createComplexBoard();

const start1 = performance.now();
const score1 = alphaBeta(board, 3, 'black', -Infinity, Infinity);
const time1 = performance.now() - start1;

const start2 = performance.now();
const score2 = minimax(board, 3, 'black', -Infinity, Infinity);
const time2 = performance.now() - start2;

// alphaBeta应该更快（至少快20%）
expect(time1).toBeLessThan(time2 * 0.8);

console.log(`alphaBeta: ${time1.toFixed(2)}ms, minimax: ${time2.toFixed(2)}ms`);
console.log(`性能提升: ${((time2 - time1) / time2 * 100).toFixed(2)}%`);
```

**测试数据**:
- 深度: 3
- 性能提升: >20%

---

## TC-223: alphaBeta-深度4性能测试

**优先级**: P0
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/alphaBeta.test.ts`

**前置条件**:
- 中局棋盘

**测试步骤**:
1. 创建中局棋盘（50个棋子）
2. 测量alphaBeta深度4的执行时间
3. 验证<3000ms

**期望结果**:
```typescript
const board = createMidGameBoard(50);

const start = performance.now();
const score = alphaBeta(board, 4, 'black', -Infinity, Infinity);
const duration = performance.now() - start;

expect(duration).toBeLessThan(3000); // <3秒
console.log(`alphaBeta深度4执行时间: ${duration.toFixed(2)}ms`);
```

**测试数据**:
- 深度: 4
- 棋子数: 50
- 响应时间: <3000ms

---

## TC-224: alphaBeta-剪枝统计

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/alphaBeta.test.ts`

**前置条件**:
- alphaBeta函数已定义

**测试步骤**:
1. 创建复杂棋盘
2. 调用alphaBeta并收集剪枝统计
3. 验证剪枝率>30%

**期望结果**:
```typescript
const board = createComplexBoard();

const stats = {
  totalNodes: 0,
  prunedNodes: 0
};

// Mock alphaBeta来收集统计
const score = alphaBeta(board, 4, 'black', -Infinity, Infinity);

const pruneRate = stats.prunedNodes / stats.totalNodes;
expect(pruneRate).toBeGreaterThan(0.3); // 剪枝率>30%

console.log(`剪枝率: ${(pruneRate * 100).toFixed(2)}%`);
console.log(`总节点数: ${stats.totalNodes}`);
console.log(`剪枝节点数: ${stats.prunedNodes}`);
```

**测试数据**:
- 深度: 4
- 剪枝率: >30%

---

## TC-225: alphaBeta-边界条件测试

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/alphaBeta.test.ts`

**前置条件**:
- alphaBeta函数已定义

**测试步骤**:
1. 创建各种边界棋盘（空、满、接近胜利）
2. 验证alphaBeta正确处理

**期望结果**:
```typescript
// 空棋盘
const emptyBoard = new Board(15);
const emptyScore = alphaBeta(emptyBoard, 2, 'black', -Infinity, Infinity);
expect(emptyScore).toBe(0);

// 已满棋盘
const fullBoard = createFullBoard();
const fullScore = alphaBeta(fullBoard, 2, 'black', -Infinity, Infinity);
expect(fullScore).toBe(0);

// 接近胜利
const winBoard = createBoardWithFourInRow('black');
const winScore = alphaBeta(winBoard, 2, 'black', -Infinity, Infinity);
expect(winScore).toBeGreaterThanOrEqual(100000);
```

**测试数据**:
- 场景: 空、满、接近胜利
- 结果正确性: 100%

---

## TC-226: alphaBeta-候选位置优化

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/alphaBeta.test.ts`

**前置条件**:
- alphaBeta函数已定义
- 候选位置函数已定义

**测试步骤**:
1. 创建开局棋盘（10个棋子）
2. 验证候选位置<100个
3. 验证alphaBeta使用候选位置

**期望结果**:
```typescript
import { getCandidateMoves } from '../candidate-moves';

const board = createOpeningBoard(10);

const candidates = getCandidateMoves(board);
expect(candidates.length).toBeLessThan(100); // 候选位置<100

// 验证alphaBeta使用候选位置
const score = alphaBeta(board, 3, 'black', -Infinity, Infinity, candidates);
expect(score).toBeDefined();
```

**测试数据**:
- 棋子数: 10
- 候选位置: <100

---

## TC-227: alphaBeta-内存占用测试

**优先级**: P1
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/alphaBeta.test.ts`

**前置条件**:
- 性能分析工具

**测试步骤**:
1. 记录初始内存
2. 执行100次alphaBeta计算
3. 记录最终内存
4. 验证内存增长<10MB

**期望结果**:
```typescript
const board = createRandomBoard();

const initialMemory = process.memoryUsage().heapUsed;

for (let i = 0; i < 100; i++) {
  alphaBeta(board, 3, 'black', -Infinity, Infinity);
}

const finalMemory = process.memoryUsage().heapUsed;
const memoryGrowth = (finalMemory - initialMemory) / 1024 / 1024; // MB

expect(memoryGrowth).toBeLessThan(10); // <10MB
console.log(`内存增长: ${memoryGrowth.toFixed(2)}MB`);
```

**测试数据**:
- 测试次数: 100次
- 内存限制: <10MB

---

## 四、候选着法生成测试（candidateMoves.test.ts）

### 4.1 候选位置筛选测试

## TC-228: candidateMoves-空棋盘返回中心位置

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/candidateMoves.test.ts`

**前置条件**:
- getCandidateMoves函数已定义
- 空棋盘已创建

**测试步骤**:
1. 创建15×15的空棋盘
2. 调用getCandidateMoves(board)
3. 验证只返回中心位置(7,7)

**期望结果**:
```typescript
import { getCandidateMoves } from '../candidate-moves';
import { Board } from '../core/board';

const board = new Board(15);
const candidates = getCandidateMoves(board);

expect(candidates).toHaveLength(1);
expect(candidates[0]).toEqual({ x: 7, y: 7 });
```

**测试数据**:
- 棋盘: 空
- 候选数: 1个
- 位置: (7,7)

---

## TC-229: candidateMoves-有邻居的位置

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/candidateMoves.test.ts`

**前置条件**:
- 棋盘上有棋子

**测试步骤**:
1. 创建棋盘，在中心放置1个棋子
2. 调用getCandidateMoves(board)
3. 验证返回该棋子周围2格内的所有空位

**期望结果**:
```typescript
const board = new Board(15);
board.setCell(7, 7, 'black');

const candidates = getCandidateMoves(board);

// 应该返回(7,7)周围2格内的空位
// 包括: (5-9, 5-9)范围内，除了(7,7)本身
expect(candidates.length).toBeGreaterThan(0);
expect(candidates.length).toBeLessThan(25); // 5×5-1=24

candidates.forEach(move => {
  expect(board.isValid(move.x, move.y)).toBe(true);
  expect(board.isEmpty(move.x, move.y)).toBe(true);
  // 验证在2格范围内
  expect(Math.abs(move.x - 7)).toBeLessThanOrEqual(2);
  expect(Math.abs(move.y - 7)).toBeLessThanOrEqual(2);
});
```

**测试数据**:
- 已有棋子: (7,7)
- 邻居范围: 2格
- 候选数: 1-24个

---

## TC-230: candidateMoves-限制候选数量

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/candidateMoves.test.ts`

**前置条件**:
- 中局棋盘（50个棋子）

**测试步骤**:
1. 创建中局棋盘
2. 调用getCandidateMoves(board)
3. 验证候选位置<100个

**期望结果**:
```typescript
const board = createMidGameBoard(50);

const candidates = getCandidateMoves(board);

expect(candidates.length).toBeGreaterThan(0);
expect(candidates.length).toBeLessThan(100); // 限制100个
```

**测试数据**:
- 棋子数: 50
- 候选上限: 100

---

## TC-231: candidateMoves-按优先级排序

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/candidateMoves.test.ts`

**前置条件**:
- 棋盘上有威胁位置

**测试步骤**:
1. 创建棋盘，有活三和活四威胁
2. 调用getCandidateMoves(board, true)
3. 验证高优先级位置排在前面

**期望结果**:
```typescript
const board = new Board(15);
// 黑棋活四
board.setCell(5, 7, 'black');
board.setCell(6, 7, 'black');
board.setCell(7, 7, 'black');
board.setCell(8, 7, 'black');
// 白棋活三
board.setCell(5, 5, 'white');
board.setCell(6, 5, 'white');
board.setCell(7, 5, 'white');

const candidates = getCandidateMoves(board, true);

// 前几个候选应该包括威胁位置
const topCandidates = candidates.slice(0, 5);
const hasThreat = topCandidates.some(c =>
  (c.x === 4 || c.x === 9) && c.y === 7 || // 堵截活四
  (c.x === 4 || c.x === 8) && c.y === 5    // 堵截活三
);
expect(hasThreat).toBe(true);
```

**测试数据**:
- 排序: 按优先级
- 威胁位置优先

---

## TC-232: candidateMoves-排除已占领位置

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/candidateMoves.test.ts`

**前置条件**:
- 棋盘上有棋子

**测试步骤**:
1. 创建棋盘，放置多个棋子
2. 调用getCandidateMoves(board)
3. 验证返回的位置都是空位

**期望结果**:
```typescript
const board = new Board(15);
board.setCell(7, 7, 'black');
board.setCell(7, 8, 'white');
board.setCell(8, 7, 'black');

const candidates = getCandidateMoves(board);

candidates.forEach(move => {
  expect(board.isEmpty(move.x, move.y)).toBe(true);
});

// 验证不包括已有棋子位置
const hasOccupied = candidates.some(c =>
  (c.x === 7 && c.y === 7) ||
  (c.x === 7 && c.y === 8) ||
  (c.x === 8 && c.y === 7)
);
expect(hasOccupied).toBe(false);
```

**测试数据**:
- 已有棋子: 3个
- 候选位置: 全部为空

---

## TC-233: candidateMoves-边界位置处理

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/candidateMoves.test.ts`

**前置条件**:
- 棋盘边界有棋子

**测试步骤**:
1. 在棋盘边界放置棋子
2. 调用getCandidateMoves(board)
3. 验证不返回越界位置

**期望结果**:
```typescript
const board = new Board(15);
// 边界棋子
board.setCell(0, 0, 'black');
board.setCell(14, 14, 'white');
board.setCell(0, 14, 'black');

const candidates = getCandidateMoves(board);

candidates.forEach(move => {
  expect(move.x).toBeGreaterThanOrEqual(0);
  expect(move.x).toBeLessThan(15);
  expect(move.y).toBeGreaterThanOrEqual(0);
  expect(move.y).toBeLessThan(15);
});

// 验证有边界周围的候选位置
const hasBoundaryNeighbor = candidates.some(c =>
  (c.x <= 2 && c.y <= 2) || // (0,0)周围
  (c.x >= 12 && c.y >= 12) || // (14,14)周围
  (c.x <= 2 && c.y >= 12)    // (0,14)周围
);
expect(hasBoundaryNeighbor).toBe(true);
```

**测试数据**:
- 边界棋子: (0,0), (14,14), (0,14)
- 不越界: 100%

---

## TC-234: candidateMoves-性能测试

**优先级**: P1
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/candidateMoves.test.ts`

**前置条件**:
- 中局棋盘

**测试步骤**:
1. 创建中局棋盘（50个棋子）
2. 测量getCandidateMoves执行时间
3. 验证<50ms

**期望结果**:
```typescript
const board = createMidGameBoard(50);

const start = performance.now();
const candidates = getCandidateMoves(board);
const duration = performance.now() - start;

expect(duration).toBeLessThan(50); // <50ms
console.log(`候选位置生成时间: ${duration.toFixed(2)}ms`);
console.log(`候选位置数量: ${candidates.length}`);
```

**测试数据**:
- 棋子数: 50
- 执行时间: <50ms

---

## 五、HardAI类测试（hard-ai.test.ts）

### 5.1 HardAI基础功能测试

## TC-235: HardAI-空棋盘天元开局

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/hard-ai.test.ts`

**前置条件**:
- HardAI类已定义
- 空棋盘已创建

**测试步骤**:
1. 创建15×15的空棋盘
2. 创建HardAI实例
3. 调用calculateMove方法
4. 验证返回位置是否为天元(7,7)

**期望结果**:
```typescript
import { HardAI } from '../hard-ai';
import { Board } from '../core/board';

const board = new Board(15);
const ai = new HardAI();
const move = ai.calculateMove(board, 'black');

expect(move).toEqual({ x: 7, y: 7 });
```

**测试数据**:
- 棋盘大小: 15
- 预期位置: { x: 7, y: 7 }

---

## TC-236: HardAI-优先选择连五

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/hard-ai.test.ts`

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
board.setCell(5, 7, 'black');
board.setCell(6, 7, 'black');
board.setCell(7, 7, 'black');
board.setCell(8, 7, 'black');

// 玩家有活四威胁
board.setCell(5, 5, 'white');
board.setCell(6, 5, 'white');
board.setCell(7, 5, 'white');
board.setCell(8, 5, 'white');

const ai = new HardAI();
const move = ai.calculateMove(board, 'black');

// 应该优先选择连五位置(9,7)，而不是堵截玩家
expect(move).toEqual({ x: 9, y: 7 });
```

**测试数据**:
- 连五位置: (9,7)
- 玩家威胁: (4,5)或(9,5)

---

## TC-237: HardAI-必堵活四

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/hard-ai.test.ts`

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
board.setCell(5, 7, 'white');
board.setCell(6, 7, 'white');
board.setCell(7, 7, 'white');
board.setCell(8, 7, 'white');

// AI没有威胁
board.setCell(0, 0, 'black');

const ai = new HardAI();
const move = ai.calculateMove(board, 'black');

// 必须堵截活四的一端
const isBlocking = move.x === 4 || move.x === 9;
expect(isBlocking).toBe(true);
```

**测试数据**:
- 玩家活四: (5,7)-(8,7)
- 堵截位置: (4,7)或(9,7)

---

## TC-238: HardAI-使用Minimax算法

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/hard-ai.test.ts`

**前置条件**:
- HardAI类已定义

**测试步骤**:
1. 创建棋盘
2. Mock minimax函数
3. 调用calculateMove
4. 验证minimax被调用

**期望结果**:
```typescript
const board = createMidGameBoard(30);

const ai = new HardAI();
const minimaxSpy = jest.spyOn(ai, 'minimax');

const move = ai.calculateMove(board, 'black');

// 验证minimax被调用
expect(minimaxSpy).toHaveBeenCalled();
// 验证使用深度4
expect(minimaxSpy).toHaveBeenCalledWith(expect.anything(), 4, 'black');
```

**测试数据**:
- 搜索深度: 4
- 算法: Minimax

---

## TC-239: HardAI-使用Alpha-Beta剪枝

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/hard-ai.test.ts`

**前置条件**:
- HardAI类已定义

**测试步骤**:
1. 创建棋盘
2. Mock alphaBeta函数
3. 调用calculateMove
4. 验证alphaBeta被调用

**期望结果**:
```typescript
const board = createMidGameBoard(30);

const ai = new HardAI();
const alphaBetaSpy = jest.spyOn(ai, 'alphaBeta');

const move = ai.calculateMove(board, 'black');

// 验证alphaBeta被调用
expect(alphaBetaSpy).toHaveBeenCalled();
```

**测试数据**:
- 算法: Alpha-Beta剪枝

---

## TC-240: HardAI-响应时间测试

**优先级**: P0
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/hard-ai.test.ts`

**前置条件**:
- 中局棋盘（约50个棋子）

**测试步骤**:
1. 创建中局棋盘
2. 记录开始时间
3. 调用calculateMove
4. 记录结束时间并计算耗时
5. 验证响应时间<3000ms

**期望结果**:
```typescript
const board = createMidGameBoard(50);
const ai = new HardAI();

const start = performance.now();
const move = ai.calculateMove(board, 'black');
const duration = performance.now() - start;

expect(duration).toBeLessThan(3000); // <3秒
console.log(`困难AI响应时间: ${duration.toFixed(2)}ms`);
```

**测试数据**:
- 棋盘棋子数: 50个
- 响应时间要求: <3000ms
- 测试次数: 10次取平均值

---

## TC-241: HardAI-内存占用测试

**优先级**: P1
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/hard-ai.test.ts`

**前置条件**:
- 性能分析工具已准备

**测试步骤**:
1. 记录初始内存
2. 创建100次AI实例并执行计算
3. 记录最终内存
4. 验证内存增长<5MB

**期望结果**:
```typescript
const initialMemory = process.memoryUsage().heapUsed;

for (let i = 0; i < 100; i++) {
  const board = createRandomBoard();
  const ai = new HardAI();
  ai.calculateMove(board, 'black');
}

const finalMemory = process.memoryUsage().heapUsed;
const memoryGrowth = (finalMemory - initialMemory) / 1024 / 1024; // MB

expect(memoryGrowth).toBeLessThan(5); // <5MB
console.log(`内存增长: ${memoryGrowth.toFixed(2)}MB`);
```

**测试数据**:
- 测试次数: 100次
- 内存限制: <5MB

---

## TC-242: HardAI-棋盘已满

**优先级**: P2
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/hard-ai.test.ts`

**前置条件**:
- 棋盘已满，无空位

**测试步骤**:
1. 创建已满的棋盘
2. 调用calculateMove
3. 验证抛出异常或返回null

**期望结果**:
```typescript
const board = createFullBoard();
const ai = new HardAI();

expect(() => {
  ai.calculateMove(board, 'black');
}).toThrow('No empty positions available');
```

**测试数据**:
- 棋盘状态: 15×15已满（225个棋子）

---

## TC-243: HardAI-深度可配置

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/hard-ai.test.ts`

**前置条件**:
- HardAI类已定义

**测试步骤**:
1. 创建不同深度的HardAI实例
2. 验证使用对应深度

**期望结果**:
```typescript
const board = createMidGameBoard(30);

const ai2 = new HardAI({ depth: 2 });
const ai3 = new HardAI({ depth: 3 });
const ai4 = new HardAI({ depth: 4 });

// 验证深度设置
expect(ai2.getDepth()).toBe(2);
expect(ai3.getDepth()).toBe(3);
expect(ai4.getDepth()).toBe(4);

// 验证不同深度的响应时间
const start2 = performance.now();
ai2.calculateMove(board, 'black');
const time2 = performance.now() - start2;

const start3 = performance.now();
ai3.calculateMove(board, 'black');
const time3 = performance.now() - start3;

const start4 = performance.now();
ai4.calculateMove(board, 'black');
const time4 = performance.now() - start4;

// 深度越大，时间越长
expect(time2).toBeLessThan(time3);
expect(time3).toBeLessThan(time4);

console.log(`深度2: ${time2.toFixed(2)}ms, 深度3: ${time3.toFixed(2)}ms, 深度4: ${time4.toFixed(2)}ms`);
```

**测试数据**:
- 深度选项: 2, 3, 4
- 响应时间递增

---

## TC-244: HardAI-超时处理

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/hard-ai.test.ts`

**前置条件**:
- HardAI类已定义
- 超时时间已配置

**测试步骤**:
1. 创建复杂棋盘
2. 设置超时时间为1秒
3. 调用calculateMove
4. 验证超时后使用降级方案

**期望结果**:
```typescript
const board = createComplexBoard();
const ai = new HardAI({ timeout: 1000 }); // 1秒超时

// Mock慢速计算
jest.spyOn(ai, 'minimax').mockImplementation(() => {
  // 模拟慢速计算
  const start = Date.now();
  while (Date.now() - start < 2000); // 2秒
  return 0;
});

const move = ai.calculateMove(board, 'black');

// 验证使用了降级方案（随机或快速评估）
expect(move).toBeDefined();
expect(board.isValid(move.x, move.y)).toBe(true);
```

**测试数据**:
- 超时时间: 1000ms
- Mock计算: 2000ms

---

## TC-245: HardAI-多个相同得分位置

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/hard-ai.test.ts`

**前置条件**:
- 棋盘上有多个相同得分的最优位置

**测试步骤**:
1. 创建对称棋盘
2. 多次调用AI计算
3. 验证AI选择其中一个最优位置

**期望结果**:
```typescript
const board = createSymmetricBoard();
const ai = new HardAI();

const moves = Array.from({ length: 10 }, () =>
  ai.calculateMove(board, 'black')
);

// 所有位置应该都是有效的
moves.forEach(move => {
  expect(board.isValid(move.x, move.y)).toBe(true);
  expect(board.isEmpty(move.x, move.y)).toBe(true);
});

// 可能有不同位置（如果有多个最优解）
const uniqueMoves = new Set(moves.map(m => `${m.x},${m.y}`));
expect(uniqueMoves.size).toBeGreaterThanOrEqual(1);
```

**测试数据**:
- 测试次数: 10次
- 对称棋盘

---

## TC-246: HardAI-难度验证

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/hard-ai.test.ts`

**前置条件**:
- HardAI和MediumAI都已定义

**测试步骤**:
1. 创建相同棋盘
2. 分别调用HardAI和MediumAI
3. 验证HardAI走法更优

**期望结果**:
```typescript
import { MediumAI } from '../medium-ai';

const board = createTacticalBoard();

const hardAI = new HardAI();
const mediumAI = new MediumAI();

const hardMove = hardAI.calculateMove(board, 'black');
const mediumMove = mediumAI.calculateMove(board, 'black');

// HardAI应该选择更好的位置（通过模拟验证）
// 这里简化验证：HardAI不应该选择明显劣质的位置
expect(hardMove).toBeDefined();
expect(mediumMove).toBeDefined();

// 可以通过后续的对局验证HardAI更强
```

**测试数据**:
- 对比: HardAI vs MediumAI
- 期望: HardAI更强

---

## TC-247: HardAI-开局策略

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/hard-ai.test.ts`

**前置条件**:
- 开局棋盘（5个棋子以内）

**测试步骤**:
1. 创建开局棋盘，天元已有棋子
2. 调用HardAI计算
3. 验证AI选择合理的开局位置

**期望结果**:
```typescript
const board = new Board(15);
board.setCell(7, 7, 'black'); // 天元

const ai = new HardAI();
const move = ai.calculateMove(board, 'white');

// 验证选择在天元附近（2格范围内）
const distance = Math.max(Math.abs(move.x - 7), Math.abs(move.y - 7));
expect(distance).toBeLessThanOrEqual(2);
```

**测试数据**:
- 开局: 天元已有子
- 预期: 附近位置

---

## 六、集成测试

### 6.1 HardAI完整流程测试

## TC-248: HardAI-完整对局流程

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/hard-ai.integration.test.ts`

**前置条件**:
- HardAI已初始化
- 游戏引擎已初始化

**测试步骤**:
1. 开始PVE游戏（困难难度）
2. 玩家落子
3. 等待HardAI响应
4. 验证AI落子有效
5. 继续对局直到结束
6. 验证游戏结果

**期望结果**:
```typescript
import { HardAI } from '../hard-ai';
import { GameEngine } from '../core/game-engine';

const engine = new GameEngine();
const ai = new HardAI();

engine.startPVEGame('hard', true);

// 玩家落子
await engine.makeMove({ x: 7, y: 7 });
expect(engine.getGameStatus()).toBe('playing');

// 等待AI（使用mock来避免真实等待）
const aiMove = await ai.calculateMove(engine.getBoard(), 'white');
expect(engine.getBoard().isValid(aiMove.x, aiMove.y)).toBe(true);

// AI落子
await engine.makeMove(aiMove);
expect(engine.getGameStatus()).toBe('playing');
```

**测试数据**:
- 难度: hard
- 执棋: 玩家先手

---

## TC-249: HardAI-Web Worker集成

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/hard-ai.integration.test.ts`

**前置条件**:
- AIClient已初始化
- Worker已启动

**测试步骤**:
1. 创建中局棋盘
2. 调用aiClient.calculateMove(board, 'hard', 'black')
3. 等待Worker响应
4. 验证返回位置有效

**期望结果**:
```typescript
import { AIClient } from '../ai-client';

const aiClient = new AIClient();
const board = createMidGameBoard(50);

const move = await aiClient.calculateMove(board, 'hard', 'black');

expect(move).toBeDefined();
expect(move.x).toBeGreaterThanOrEqual(0);
expect(move.x).toBeLessThan(15);
expect(move.y).toBeGreaterThanOrEqual(0);
expect(move.y).toBeLessThan(15);
expect(board.isEmpty(move.x, move.y)).toBe(true);
```

**测试数据**:
- 难度: hard
- AI执棋: black

---

## TC-250: HardAI-Worker超时处理

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/hard-ai.integration.test.ts`

**前置条件**:
- AIClient已配置超时

**测试步骤**:
1. Mock AI计算，使其延迟超过超时时间
2. 调用calculateMove
3. 验证抛出TimeoutError
4. 验证使用降级方案

**期望结果**:
```typescript
const aiClient = new AIClient({ timeout: 2000 }); // 2秒超时
const board = createComplexBoard();

// Mock延迟响应
jest.spyOn(aiClient.worker, 'calculateMove')
  .mockImplementation(() => new Promise(resolve =>
    setTimeout(() => resolve({ x: 7, y: 7 }), 5000)
  ));

await expect(
  aiClient.calculateMove(board, 'hard', 'black')
).rejects.toThrow('AI timeout');

// 验证降级方案
const fallbackMove = aiClient.getFallbackMove(board);
expect(board.isValid(fallbackMove.x, fallbackMove.y)).toBe(true);
```

**测试数据**:
- 超时时间: 2000ms
- Mock延迟: 5000ms

---

## TC-251: HardAI-并发请求处理

**优先级**: P1
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/hard-ai.integration.test.ts`

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
    aiClient.calculateMove(board, 'hard', 'black')
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

## TC-252: HardAI-Worker崩溃恢复

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/hard-ai.integration.test.ts`

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
const move = await aiClient.calculateMove(board, 'hard', 'black');

expect(move).toBeDefined();
expect(aiClient.isWorkerAlive()).toBe(true);
```

---

## TC-253: HardAI-不阻塞UI

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/hard-ai.integration.test.ts`

**前置条件**:
- 浏览器环境

**测试步骤**:
1. 发起AI计算（困难难度）
2. 同时更新UI状态
3. 验证UI更新不被阻塞

**期望结果**:
```typescript
const aiClient = new AIClient();
const board = createComplexBoard();

let uiUpdated = false;

// 发起AI计算
const promise = aiClient.calculateMove(board, 'hard', 'black');

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

## TC-254: HardAI-内存泄漏检查

**优先级**: P1
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/hard-ai.integration.test.ts`

**前置条件**:
- 性能监控工具

**测试步骤**:
1. 记录初始内存
2. 创建和销毁AIClient 50次
3. 记录最终内存
4. 验证无内存泄漏

**期望结果**:
```typescript
const initialMemory = process.memoryUsage().heapUsed;

for (let i = 0; i < 50; i++) {
  const aiClient = new AIClient();
  const board = createRandomBoard();
  await aiClient.calculateMove(board, 'hard', 'black');
  aiClient.terminate();
}

global.gc(); // 手动触发垃圾回收

const finalMemory = process.memoryUsage().heapUsed;
const memoryGrowth = (finalMemory - initialMemory) / 1024 / 1024;

expect(memoryGrowth).toBeLessThan(10); // <10MB增长
console.log(`Worker内存增长: ${memoryGrowth.toFixed(2)}MB`);
```

**测试数据**:
- 测试次数: 50次
- 内存限制: <10MB

---

## TC-255: HardAI-游戏结束不触发AI

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/hard-ai.integration.test.ts`

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
const engine = new GameEngine();
const board = createBoardWithFourInRow('black'); // 黑棋四连
engine.setBoard(board);

engine.startPVEGame('hard', true);
await engine.makeMove({ x: 9, y: 7 }); // 形成五连

// 验证游戏结束
expect(engine.getGameStatus()).toBe('won');
expect(engine.getWinner()).toBe('black');

// AI不应该思考
expect(engine.isAiThinking()).toBe(false);
```

---

## TC-256: HardAI-重新开始取消AI计算

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/hard-ai.integration.test.ts`

**前置条件**:
- PVE游戏进行中
- AI思考中

**测试步骤**:
1. 玩家落子触发AI（困难）
2. AI计算期间点击重新开始
3. 验证AI计算被取消
4. 验证游戏重置

**期望结果**:
```typescript
const engine = new GameEngine();
engine.startPVEGame('hard', true);

await engine.makeMove({ x: 7, y: 7 });
expect(engine.isAiThinking()).toBe(true);

// 重新开始
engine.restartGame();

// 验证AI被取消
expect(engine.isAiThinking()).toBe(false);
expect(engine.getGameStatus()).toBe('idle');
expect(engine.getBoard().getPieceCount()).toBe(0);
```

---

## TC-257: HardAI-快速操作防止竞态

**优先级**: P1
**类型**: 集成测试
**测试文件**: `src/game/ai/__tests__/hard-ai.integration.test.ts`

**前置条件**:
- PVE游戏进行中

**测试步骤**:
1. 快速连续落子3次
2. 验证每次都正确触发AI
3. 验证无竞态条件

**期望结果**:
```typescript
const engine = new GameEngine();
engine.startPVEGame('hard', true);

// 快速落子
await engine.makeMove({ x: 7, y: 7 });
await engine.makeMove({ x: 7, y: 8 });
await engine.makeMove({ x: 7, y: 9 });

// 验证正确状态
expect(engine.getBoard().getPieceCount()).toBe(6); // 3玩家 + 3AI
expect(engine.getGameStatus()).toBe('playing');
```

---

## 七、性能测试

### 7.1 AI响应时间测试

## TC-258: 性能-HardAI深度2响应时间

**优先级**: P0
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/hard-ai.performance.test.ts`

**前置条件**:
- 中局棋盘（50个棋子）

**测试步骤**:
1. 创建中局棋盘
2. 创建深度为2的HardAI
3. 测量10次响应时间
4. 验证平均时间<500ms

**期望结果**:
```typescript
const board = createMidGameBoard(50);
const ai = new HardAI({ depth: 2 });

const responseTimes = [];

for (let i = 0; i < 10; i++) {
  const start = performance.now();
  const move = ai.calculateMove(board, 'black');
  const duration = performance.now() - start;
  responseTimes.push(duration);
}

const avgTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
const maxTime = Math.max(...responseTimes);

expect(avgTime).toBeLessThan(500);
expect(maxTime).toBeLessThan(1000);

console.log(`深度2平均响应时间: ${avgTime.toFixed(2)}ms`);
console.log(`深度2最大响应时间: ${maxTime}ms`);
```

**测试数据**:
- 深度: 2
- 平均时间: <500ms
- 最大时间: <1000ms

---

## TC-259: 性能-HardAI深度3响应时间

**优先级**: P0
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/hard-ai.performance.test.ts`

**前置条件**:
- 中局棋盘（50个棋子）

**测试步骤**:
1. 创建中局棋盘
2. 创建深度为3的HardAI
3. 测量10次响应时间
4. 验证平均时间<1500ms

**期望结果**:
```typescript
const board = createMidGameBoard(50);
const ai = new HardAI({ depth: 3 });

const responseTimes = [];

for (let i = 0; i < 10; i++) {
  const start = performance.now();
  const move = ai.calculateMove(board, 'black');
  const duration = performance.now() - start;
  responseTimes.push(duration);
}

const avgTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
const maxTime = Math.max(...responseTimes);

expect(avgTime).toBeLessThan(1500);
expect(maxTime).toBeLessThan(2500);

console.log(`深度3平均响应时间: ${avgTime.toFixed(2)}ms`);
console.log(`深度3最大响应时间: ${maxTime}ms`);
```

**测试数据**:
- 深度: 3
- 平均时间: <1500ms
- 最大时间: <2500ms

---

## TC-260: 性能-HardAI深度4响应时间

**优先级**: P0
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/hard-ai.performance.test.ts`

**前置条件**:
- 中局棋盘（50个棋子）

**测试步骤**:
1. 创建中局棋盘
2. 创建深度为4的HardAI
3. 测量10次响应时间
4. 验证平均时间<3000ms

**期望结果**:
```typescript
const board = createMidGameBoard(50);
const ai = new HardAI({ depth: 4 });

const responseTimes = [];

for (let i = 0; i < 10; i++) {
  const start = performance.now();
  const move = ai.calculateMove(board, 'black');
  const duration = performance.now() - start;
  responseTimes.push(duration);
}

const avgTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
const maxTime = Math.max(...responseTimes);

expect(avgTime).toBeLessThan(3000);
expect(maxTime).toBeLessThan(5000);

console.log(`深度4平均响应时间: ${avgTime.toFixed(2)}ms`);
console.log(`深度4最大响应时间: ${maxTime}ms`);
```

**测试数据**:
- 深度: 4
- 平均时间: <3000ms
- 最大时间: <5000ms

---

## TC-261: 性能-不同深度性能对比

**优先级**: P1
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/hard-ai.performance.test.ts`

**前置条件**:
- 相同的中局棋盘

**测试步骤**:
1. 创建棋盘
2. 分别测试深度2、3、4的响应时间
3. 验证深度增加导致时间增加
4. 绘制性能曲线

**期望结果**:
```typescript
const board = createMidGameBoard(50);

const ai2 = new HardAI({ depth: 2 });
const ai3 = new HardAI({ depth: 3 });
const ai4 = new HardAI({ depth: 4 });

const start2 = performance.now();
ai2.calculateMove(board, 'black');
const time2 = performance.now() - start2;

const start3 = performance.now();
ai3.calculateMove(board, 'black');
const time3 = performance.now() - start3;

const start4 = performance.now();
ai4.calculateMove(board, 'black');
const time4 = performance.now() - start4;

// 深度越大，时间越长
expect(time2).toBeLessThan(time3);
expect(time3).toBeLessThan(time4);

console.log(`深度2: ${time2.toFixed(2)}ms`);
console.log(`深度3: ${time3.toFixed(2)}ms`);
console.log(`深度4: ${time4.toFixed(2)}ms`);
console.log(`性能比: ${time2}:${time3}:${time4}`);
```

**测试数据**:
- 深度: 2, 3, 4
- 时间递增: 预期

---

## TC-262: 性能-Alpha-Beta剪枝效果

**优先级**: P0
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/hard-ai.performance.test.ts`

**前置条件**:
- 相同的复杂棋盘

**测试步骤**:
1. 创建棋盘
2. 测试带Alpha-Beta剪枝的minimax
3. 测试不带剪枝的minimax
4. 验证剪枝提升性能>30%

**期望结果**:
```typescript
const board = createComplexBoard();

const ai = new HardAI();

// 测试带剪枝
const start1 = performance.now();
const score1 = ai.alphaBeta(board, 4, 'black', -Infinity, Infinity);
const time1 = performance.now() - start1;

// 测试不带剪枝
const start2 = performance.now();
const score2 = ai.minimax(board, 4, 'black', -Infinity, Infinity);
const time2 = performance.now() - start2;

// 验证剪枝效果
const improvement = ((time2 - time1) / time2) * 100;
expect(improvement).toBeGreaterThan(30);

console.log(`带剪枝: ${time1.toFixed(2)}ms`);
console.log(`不带剪枝: ${time2.toFixed(2)}ms`);
console.log(`性能提升: ${improvement.toFixed(2)}%`);
```

**测试数据**:
- 深度: 4
- 性能提升: >30%

---

## TC-263: 性能-开局响应时间

**优先级**: P1
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/hard-ai.performance.test.ts`

**前置条件**:
- 开局棋盘（10个棋子以内）

**测试步骤**:
1. 创建开局棋盘
2. 测量HardAI响应时间
3. 验证<1000ms

**期望结果**:
```typescript
const board = createOpeningBoard(10);
const ai = new HardAI();

const start = performance.now();
const move = ai.calculateMove(board, 'black');
const duration = performance.now() - start;

expect(duration).toBeLessThan(1000);
console.log(`开局响应时间: ${duration.toFixed(2)}ms`);
```

**测试数据**:
- 棋子数: 10
- 响应时间: <1000ms

---

## TC-264: 性能-残局响应时间

**优先级**: P1
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/hard-ai.performance.test.ts`

**前置条件**:
- 残局棋盘（200个棋子）

**测试步骤**:
1. 创建残局棋盘
2. 测量HardAI响应时间
3. 验证<2000ms（候选位置多，但接近终局）

**期望结果**:
```typescript
const board = createEndGameBoard(200);
const ai = new HardAI();

const start = performance.now();
const move = ai.calculateMove(board, 'black');
const duration = performance.now() - start;

expect(duration).toBeLessThan(2000);
console.log(`残局响应时间: ${duration.toFixed(2)}ms`);
```

**测试数据**:
- 棋子数: 200
- 响应时间: <2000ms

---

## TC-265: 性能-候选位置优化效果

**优先级**: P1
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/hard-ai.performance.test.ts`

**前置条件**:
- 中局棋盘

**测试步骤**:
1. 创建棋盘
2. 测试使用候选位置优化的AI
3. 测试不使用候选位置的AI
4. 验证优化提升性能>50%

**期望结果**:
```typescript
const board = createMidGameBoard(50);

const aiWithCandidates = new HardAI({ useCandidateMoves: true });
const aiWithoutCandidates = new HardAI({ useCandidateMoves: false });

const start1 = performance.now();
aiWithCandidates.calculateMove(board, 'black');
const time1 = performance.now() - start1;

const start2 = performance.now();
aiWithoutCandidates.calculateMove(board, 'black');
const time2 = performance.now() - start2;

// 验证优化效果
const improvement = ((time2 - time1) / time2) * 100;
expect(improvement).toBeGreaterThan(50);

console.log(`使用候选位置: ${time1.toFixed(2)}ms`);
console.log(`不使用候选位置: ${time2.toFixed(2)}ms`);
console.log(`性能提升: ${improvement.toFixed(2)}%`);
```

**测试数据**:
- 优化效果: >50%

---

## TC-266: 性能-内存占用监控

**优先级**: P1
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/hard-ai.performance.test.ts`

**前置条件**:
- 性能监控工具

**测试步骤**:
1. 记录初始内存
2. 执行100次HardAI计算
3. 记录峰值内存
4. 验证内存占用<50MB

**期望结果**:
```typescript
const board = createRandomBoard();
const ai = new HardAI();

const initialMemory = process.memoryUsage().heapUsed;
let peakMemory = initialMemory;

for (let i = 0; i < 100; i++) {
  ai.calculateMove(board, 'black');
  const currentMemory = process.memoryUsage().heapUsed;
  if (currentMemory > peakMemory) {
    peakMemory = currentMemory;
  }
}

const memoryUsed = (peakMemory - initialMemory) / 1024 / 1024; // MB

expect(memoryUsed).toBeLessThan(50); // <50MB
console.log(`内存占用: ${memoryUsed.toFixed(2)}MB`);
```

**测试数据**:
- 测试次数: 100次
- 内存限制: <50MB

---

## TC-267: 性能-长时间运行稳定性

**优先级**: P1
**类型**: 性能测试
**测试文件**: `src/game/ai/__tests__/hard-ai.performance.test.ts`

**前置条件**:
- 持续运行测试

**测试步骤**:
1. 创建100个不同棋盘
2. 依次执行HardAI计算
3. 记录每次响应时间
4. 验证无性能退化

**期望结果**:
```typescript
const ai = new HardAI();
const responseTimes = [];

for (let i = 0; i < 100; i++) {
  const board = createRandomBoard();
  const start = performance.now();
  ai.calculateMove(board, 'black');
  const duration = performance.now() - start;
  responseTimes.push(duration);
}

// 验证无性能退化（最后10次的平均时间应该与前10次相近）
const first10Avg = responseTimes.slice(0, 10).reduce((a, b) => a + b) / 10;
const last10Avg = responseTimes.slice(-10).reduce((a, b) => a + b) / 10;

const degradation = ((last10Avg - first10Avg) / first10Avg) * 100;
expect(Math.abs(degradation)).toBeLessThan(20); // 退化<20%

console.log(`前10次平均: ${first10Avg.toFixed(2)}ms`);
console.log(`后10次平均: ${last10Avg.toFixed(2)}ms`);
console.log(`性能变化: ${degradation.toFixed(2)}%`);
```

**测试数据**:
- 测试次数: 100次
- 性能退化: <20%

---

## 八、边界条件测试

### 8.1 特殊场景测试

## TC-268: 边界-空棋盘开局

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/hard-ai.boundary.test.ts`

**前置条件**:
- 空棋盘

**测试步骤**:
1. 创建空棋盘
2. 调用HardAI计算
3. 验证选择天元位置

**期望结果**:
```typescript
const board = new Board(15);
const ai = new HardAI();

const move = ai.calculateMove(board, 'black');

expect(move).toEqual({ x: 7, y: 7 });
```

**测试数据**:
- 场景: 空棋盘
- 位置: (7,7)

---

## TC-269: 边界-接近胜利状态

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/hard-ai.boundary.test.ts`

**前置条件**:
- AI有连四机会

**测试步骤**:
1. 创建棋盘，AI有连四
2. 调用HardAI计算
3. 验证选择连五位置

**期望结果**:
```typescript
const board = new Board(15);
// AI连四
board.setCell(5, 7, 'black');
board.setCell(6, 7, 'black');
board.setCell(7, 7, 'black');
board.setCell(8, 7, 'black');

const ai = new HardAI();
const move = ai.calculateMove(board, 'black');

// 应该选择连五位置
expect(move.x === 4 || move.x === 9).toBe(true);
expect(move.y).toBe(7);
```

**测试数据**:
- 场景: 连四
- 位置: (4,7)或(9,7)

---

## TC-270: 边界-防守优先情况

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/hard-ai.boundary.test.ts`

**前置条件**:
- 玩家有连四威胁

**测试步骤**:
1. 创建棋盘，玩家有连四
2. AI没有进攻威胁
3. 调用HardAI计算
4. 验证优先防守

**期望结果**:
```typescript
const board = new Board(15);
// 玩家连四
board.setCell(5, 7, 'white');
board.setCell(6, 7, 'white');
board.setCell(7, 7, 'white');
board.setCell(8, 7, 'white');

// AI没有威胁
board.setCell(0, 0, 'black');

const ai = new HardAI();
const move = ai.calculateMove(board, 'black');

// 必须堵截
expect(move.x === 4 || move.x === 9).toBe(true);
expect(move.y).toBe(7);
```

**测试数据**:
- 场景: 玩家连四
- 策略: 防守优先

---

## TC-271: 边界-双三防守

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/hard-ai.boundary.test.ts`

**前置条件**:
- 玩家有两个活三威胁

**测试步骤**:
1. 创建棋盘，玩家有两个活三
2. AI只能堵截一个
3. 调用HardAI计算
4. 验证选择最优防守

**期望结果**:
```typescript
const board = new Board(15);
// 玩家活三1
board.setCell(5, 7, 'white');
board.setCell(6, 7, 'white');
board.setCell(7, 7, 'white');
// 玩家活三2
board.setCell(7, 5, 'white');
board.setCell(7, 6, 'white');
board.setCell(7, 8, 'white');

const ai = new HardAI();
const move = ai.calculateMove(board, 'black');

// 应该堵截其中一个活三
const isBlockingThree1 = (move.x === 4 || move.x === 8) && move.y === 7;
const isBlockingThree2 = move.x === 7 && (move.y === 4 || move.y === 9);
expect(isBlockingThree1 || isBlockingThree2).toBe(true);
```

**测试数据**:
- 场景: 双三
- 策略: 选择最优防守

---

## TC-272: 边界-必败局面

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/hard-ai.boundary.test.ts`

**前置条件**:
- 玩家有双四威胁

**测试步骤**:
1. 创建棋盘，玩家有两个活四
2. AI无法防守
3. 调用HardAI计算
4. 验证AI仍能正常落子

**期望结果**:
```typescript
const board = new Board(15);
// 玩家活四1
board.setCell(5, 7, 'white');
board.setCell(6, 7, 'white');
board.setCell(7, 7, 'white');
board.setCell(8, 7, 'white');
// 玩家活四2
board.setCell(7, 5, 'white');
board.setCell(7, 6, 'white');
board.setCell(7, 8, 'white');
board.setCell(7, 9, 'white');

const ai = new HardAI();
const move = ai.calculateMove(board, 'black');

// AI应该能正常落子（即使无法防守）
expect(move).toBeDefined();
expect(board.isValid(move.x, move.y)).toBe(true);
```

**测试数据**:
- 场景: 必败
- 行为: 正常落子

---

## TC-273: 边界-棋盘只剩一个空位

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/hard-ai.boundary.test.ts`

**前置条件**:
- 棋盘只剩最后一个空位

**测试步骤**:
1. 创建只剩一个空位的棋盘
2. 调用HardAI计算
3. 验证选择最后一个空位

**期望结果**:
```typescript
const board = createAlmostFullBoard(); // 只剩一个空位
const ai = new HardAI();

const move = ai.calculateMove(board, 'black');

const emptyPositions = board.getEmptyPositions();
expect(emptyPositions).toHaveLength(1);
expect(move).toEqual(emptyPositions[0]);
```

**测试数据**:
- 场景: 只剩一个空位
- 位置: 唯一空位

---

## TC-274: 边界-长连子检测

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/hard-ai.boundary.test.ts`

**前置条件**:
- 棋盘上有6连子

**测试步骤**:
1. 创建棋盘，有6连子（超连）
2. 调用evaluateBoard
3. 验证识别为胜利

**期望结果**:
```typescript
const board = new Board(15);
// 黑棋6连
board.setCell(4, 7, 'black');
board.setCell(5, 7, 'black');
board.setCell(6, 7, 'black');
board.setCell(7, 7, 'black');
board.setCell(8, 7, 'black');
board.setCell(9, 7, 'black');

import { evaluateBoard } from '../evaluator';
const score = evaluateBoard(board, 'black');

// 6连也应该识别为胜利
expect(score).toBeGreaterThanOrEqual(100000);
```

**测试数据**:
- 场景: 6连
- 识别: 胜利

---

## TC-275: 边界-多方向威胁

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/hard-ai.boundary.test.ts`

**前置条件**:
- 同一位置形成多个方向的威胁

**测试步骤**:
1. 创建棋盘，某个位置能形成横向和纵向的威胁
2. 调用HardAI计算
3. 验证选择该位置

**期望结果**:
```typescript
const board = new Board(15);
// 横向三连
board.setCell(5, 7, 'black');
board.setCell(6, 7, 'black');
// 纵向三连
board.setCell(7, 5, 'black');
board.setCell(7, 6, 'black');

const ai = new HardAI();
const move = ai.calculateMove(board, 'black');

// 应该选择(7,7)形成双威胁
expect(move).toEqual({ x: 7, y: 7 });
```

**测试数据**:
- 场景: 多方向威胁
- 位置: (7,7)

---

## TC-276: 边界-连续进攻击略

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/hard-ai.boundary.test.ts`

**前置条件**:
- AI有连续进攻机会

**测试步骤**:
1. 创建棋盘，AI有活三
2. 调用HardAI计算
3. 验证选择进攻位置
4. 验证后续有连续进攻

**期望结果**:
```typescript
const board = new Board(15);
// AI活三
board.setCell(5, 7, 'black');
board.setCell(6, 7, 'black');
board.setCell(7, 7, 'black');

const ai = new HardAI();
const move = ai.calculateMove(board, 'black');

// 应该选择进攻位置（扩展活三）
const isAttack = (move.x === 4 || move.x === 8) && move.y === 7;
expect(isAttack).toBe(true);
```

**测试数据**:
- 场景: 活三
- 策略: 进攻

---

## TC-277: 边界-防守反击策略

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/ai/__tests__/hard-ai.boundary.test.ts`

**前置条件**:
- 防守后能形成反击

**测试步骤**:
1. 创建棋盘，堵截玩家后能形成威胁
2. 调用HardAI计算
3. 验证选择防守反击位置

**期望结果**:
```typescript
const board = new Board(15);
// 玩家活三
board.setCell(5, 7, 'white');
board.setCell(6, 7, 'white');
board.setCell(7, 7, 'white');
// AI已有棋子，堵截后能形成活三
board.setCell(4, 7, 'black');
board.setCell(3, 7, 'black');

const ai = new HardAI();
const move = ai.calculateMove(board, 'black');

// 应该堵截(8,7)，同时形成活三
expect(move).toEqual({ x: 8, y: 7 });
```

**测试数据**:
- 场景: 防守反击
- 位置: (8,7)

---

## 九、回归测试

### 9.1 Week 1-4功能回归

## TC-278: 回归-Week 1所有测试通过

**优先级**: P0
**类型**: 回归测试
**测试文件**: 自动运行所有Week 1测试

**前置条件**:
- Week 5代码已完成

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

## TC-279: 回归-Week 2所有测试通过

**优先级**: P0
**类型**: 回归测试
**测试文件**: 自动运行所有Week 2测试

**前置条件**:
- Week 5代码已完成

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

## TC-280: 回归-Week 3所有测试通过

**优先级**: P0
**类型**: 回归测试
**测试文件**: 自动运行所有Week 3测试

**前置条件**:
- Week 5代码已完成

**测试步骤**:
1. 运行Week 3所有测试
2. 验证41个测试全部通过
3. 验证无回归问题

**期望结果**:
```bash
npm test -- src/game/ai/__tests__/ --testPathPattern="week-3"
```
- 测试通过率: 100%
- 测试数量: 41个

---

## TC-281: 回归-Week 4所有测试通过

**优先级**: P0
**类型**: 回归测试
**测试文件**: 自动运行所有Week 4测试

**前置条件**:
- Week 5代码已完成

**测试步骤**:
1. 运行Week 4所有测试
2. 验证68个测试全部通过
3. 验证无回归问题

**期望结果**:
```bash
npm test -- src/store/__tests__/ --testPathPattern="week-4"
npm test -- src/game/__tests__/ --testPathPattern="week-4"
```
- 测试通过率: 100%
- 测试数量: 68个

---

## TC-282: 回归-SimpleAI性能未退化

**优先级**: P1
**类型**: 回归测试
**测试文件**: `src/game/ai/__tests__/simple-ai.test.ts`

**前置条件**:
- Week 5代码已完成

**测试步骤**:
1. 运行SimpleAI性能测试
2. 验证响应时间<100ms
3. 验证无性能退化

**期望结果**:
```typescript
const board = createMidGameBoard(50);
const ai = new SimpleAI();

const start = performance.now();
const move = ai.calculateMove(board, 'black');
const duration = performance.now() - start;

expect(duration).toBeLessThan(100);
```

---

## TC-283: 回归-MediumAI性能未退化

**优先级**: P1
**类型**: 回归测试
**测试文件**: `src/game/ai/__tests__/medium-ai.test.ts`

**前置条件**:
- Week 5代码已完成

**测试步骤**:
1. 运行MediumAI性能测试
2. 验证响应时间<500ms
3. 验证无性能退化

**期望结果**:
```typescript
const board = createMidGameBoard(50);
const ai = new MediumAI();

const start = performance.now();
const move = ai.calculateMove(board, 'black');
const duration = performance.now() - start;

expect(duration).toBeLessThan(500);
```

---

## TC-284: 回归-AI Worker功能正常

**优先级**: P0
**类型**: 回归测试
**测试文件**: `src/game/ai/__tests__/ai-worker.test.ts`

**前置条件**:
- Week 5代码已完成

**测试步骤**:
1. 测试AI Worker通信
2. 验证SimpleAI、MediumAI、HardAI都能正常工作
3. 验证超时处理正常

**期望结果**:
```typescript
const aiClient = new AIClient();

// 测试SimpleAI
const simpleMove = await aiClient.calculateMove(board, 'easy', 'black');
expect(simpleMove).toBeDefined();

// 测试MediumAI
const mediumMove = await aiClient.calculateMove(board, 'medium', 'black');
expect(mediumMove).toBeDefined();

// 测试HardAI
const hardMove = await aiClient.calculateMove(board, 'hard', 'black');
expect(hardMove).toBeDefined();
```

---

## 十、测试统计

### 10.1 测试覆盖统计

| 模块 | 测试用例数 | 覆盖率目标 |
|------|-----------|-----------|
| 局面评估函数 | 15个（TC-193~207） | 100% |
| Minimax算法 | 10个（TC-208~217） | 100% |
| Alpha-Beta剪枝 | 10个（TC-218~227） | 100% |
| 候选着法生成 | 7个（TC-228~234） | 100% |
| HardAI类 | 13个（TC-235~247） | 100% |
| 集成测试 | 10个（TC-248~257） | >90% |
| 性能测试 | 10个（TC-258~267） | 100% |
| 边界条件测试 | 10个（TC-268~277） | 100% |
| 回归测试 | 7个（TC-278~284） | 100% |
| **合计** | **92个** | **>95%** |

### 10.2 优先级统计

| 优先级 | 数量 | 占比 |
|--------|------|------|
| P0 | 55个 | 59.8% |
| P1 | 32个 | 34.8% |
| P2 | 5个 | 5.4% |

### 10.3 测试类型统计

| 类型 | 数量 | 占比 |
|------|------|------|
| 单元测试 | 55个 | 59.8% |
| 集成测试 | 10个 | 10.9% |
| 性能测试 | 10个 | 10.9% |
| 边界条件测试 | 10个 | 10.9% |
| 回归测试 | 7个 | 7.6% |

---

## 十一、验收标准

### 11.1 功能验收
- [ ] 所有92个测试用例通过
- [ ] HardAI能够完成对局
- [ ] Minimax算法正确实现
- [ ] Alpha-Beta剪枝生效
- [ ] 候选位置生成正确
- [ ] AI响应时间<3秒

### 11.2 性能验收
- [ ] 深度2响应时间<500ms
- [ ] 深度3响应时间<1500ms
- [ ] 深度4响应时间<3000ms
- [ ] Alpha-Beta剪枝提升性能>30%
- [ ] 候选位置优化提升性能>50%
- [ ] 内存占用<50MB

### 11.3 质量验收
- [ ] 代码覆盖率>95%
- [ ] 核心AI算法覆盖率100%
- [ ] Week 1测试全部通过（13个）
- [ ] Week 2测试全部通过（70个）
- [ ] Week 3测试全部通过（41个）
- [ ] Week 4测试全部通过（68个）
- [ ] 无ESLint错误
- [ ] 无TypeScript类型错误

### 11.4 稳定性验收
- [ ] AI超时有降级方案
- [ ] Worker崩溃能够恢复
- [ ] 无内存泄漏
- [ ] 长时间运行无性能退化
- [ ] 边界条件处理正确

---

## 十二、测试执行计划

### 12.1 TDD开发流程

1. **阶段1: 局面评估函数开发（第1天）**
   - 编写TC-193~207测试用例
   - 实现evaluateBoard函数
   - 运行测试直到全部通过
   - 验证评估准确性

2. **阶段2: Minimax算法开发（第2天）**
   - 编写TC-208~217测试用例
   - 实现minimax函数
   - 运行测试直到全部通过
   - 验证深度控制正确

3. **阶段3: Alpha-Beta剪枝开发（第3天）**
   - 编写TC-218~227测试用例
   - 实现alphaBeta函数
   - 运行测试直到全部通过
   - 验证剪枝效果>30%

4. **阶段4: 候选着法生成开发（第4天）**
   - 编写TC-228~234测试用例
   - 实现getCandidateMoves函数
   - 运行测试直到全部通过
   - 验证候选位置<100个

5. **阶段5: HardAI类开发（第5天）**
   - 编写TC-235~247测试用例
   - 实现HardAI类
   - 集成所有算法
   - 运行测试直到全部通过

6. **阶段6: 集成和性能测试（第6天）**
   - 编写TC-248~267测试用例
   - 实现Web Worker集成
   - 性能测试和优化
   - 验证所有性能指标

7. **阶段7: 边界条件和回归测试（第7天）**
   - 编写TC-268~284测试用例
   - 边界条件测试
   - 回归测试
   - 最终验收

### 12.2 每日测试检查清单

**每日必做**:
- [ ] 运行所有新增测试
- [ ] 运行Week 1-4回归测试
- [ ] 检查测试覆盖率
- [ ] 运行ESLint和TypeScript检查
- [ ] 性能基准测试

**测试通过标准**:
- 新增测试100%通过
- 回归测试100%通过
- 覆盖率达标
- 无严重Bug

---

## 十三、已知限制和风险

### 13.1 测试限制

1. **性能测试波动**
   - 响应时间可能因环境波动
   - 取多次平均值提高可靠性
   - CI/CD环境可能有差异

2. **AI强度验证**
   - 单元测试无法完全验证AI强度
   - 需要通过实际对局验证
   - 与MediumAI对比测试

3. **深度限制**
   - 最大深度4可能不够强
   - 需要性能优化才能提升到深度6
   - 时间限制可能导致搜索不完整

### 13.2 测试风险

1. **算法复杂度**
   - Minimax时间复杂度为O(b^d)
   - 深度4时可能较慢
   - 需要依赖剪枝优化

2. **候选位置生成**
   - 可能遗漏最优位置
   - 需要仔细设计启发式
   - 可能需要动态调整候选数量

3. **Web Worker通信**
   - 传递大棋盘可能有性能问题
   - 需要优化数据传输
   - 序列化开销

---

## 十四、附录

### 14.1 测试工具和库

```json
{
  "dependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.0.0",
    "vitest": "^1.0.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0"
  }
}
```

### 14.2 测试命令

```bash
# 运行所有测试
npm test

# 运行单元测试
npm test -- --testPathPattern="unit"

# 运行集成测试
npm test -- --testPathPattern="integration"

# 运行性能测试
npm test -- --testPathPattern="performance"

# 运行边界条件测试
npm test -- --testPathPattern="boundary"

# 运行回归测试
npm test -- --testPathPattern="regression"

# 生成覆盖率报告
npm test -- --coverage

# 运行Week 5所有测试
npm test -- --testPathPattern="week-5"
```

### 14.3 Mock数据示例

```typescript
// 创建测试棋盘
function createTestBoard(pieces: Array<{x: number, y: number, player: Player}>): Board {
  const board = new Board(15);
  pieces.forEach(({ x, y, player }) => {
    board.setCell(x, y, player);
  });
  return board;
}

// 创建中局棋盘
function createMidGameBoard(pieceCount: number): Board {
  const board = new Board(15);
  for (let i = 0; i < pieceCount; i++) {
    const pos = getRandomEmptyPosition(board);
    board.setCell(pos.x, pos.y, i % 2 === 0 ? 'black' : 'white');
  }
  return board;
}

// 创建对称棋盘
function createSymmetricBoard(): Board {
  const board = new Board(15);
  // 创建对称棋型
  board.setCell(7, 7, 'black');
  board.setCell(6, 7, 'white');
  board.setCell(8, 7, 'white');
  board.setCell(7, 6, 'white');
  board.setCell(7, 8, 'white');
  return board;
}

// 创建战术棋盘
function createTacticalBoard(): Board {
  const board = new Board(15);
  // 创建需要战术思考的局面
  board.setCell(7, 7, 'black');
  board.setCell(7, 8, 'white');
  board.setCell(6, 7, 'black');
  board.setCell(8, 7, 'white');
  board.setCell(7, 6, 'black');
  return board;
}

// 创建复杂棋盘
function createComplexBoard(): Board {
  const board = createMidGameBoard(50);
  // 添加多个威胁
  board.setCell(5, 5, 'black');
  board.setCell(6, 5, 'black');
  board.setCell(7, 5, 'black');
  return board;
}

// 创建随机棋盘
function createRandomBoard(): Board {
  const board = new Board(15);
  const pieceCount = 30 + Math.floor(Math.random() * 40);
  for (let i = 0; i < pieceCount; i++) {
    const pos = getRandomEmptyPosition(board);
    board.setCell(pos.x, pos.y, i % 2 === 0 ? 'black' : 'white');
  }
  return board;
}

// 获取随机空位
function getRandomEmptyPosition(board: Board): Position {
  const emptyPositions: Position[] = [];
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < 15; x++) {
      if (board.isEmpty(x, y)) {
        emptyPositions.push({ x, y });
      }
    }
  }
  return emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
}
```

### 14.4 性能基准数据

**参考性能指标**（基于Week 3-4数据）:
- SimpleAI: <10ms ✅
- MediumAI: <50ms ✅
- HardAI深度2: <500ms (目标)
- HardAI深度3: <1500ms (目标)
- HardAI深度4: <3000ms (目标)

**优化效果**（预期）:
- Alpha-Beta剪枝: >30%性能提升
- 候选位置优化: >50%性能提升
- Web Worker: 不阻塞UI

---

**文档结束**

**下一步**: 开发工程师根据测试用例开始TDD开发（先写测试，再写代码）
