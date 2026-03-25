# Week 2 - 测试用例文档

## 文档信息
- **文档版本**: v1.0
- **创建日期**: 2026-03-24
- **负责人**: QA工程师
- **阶段**: Phase 1 - MVP基础版本
- **周次**: Week 2
- **开发模式**: TDD（测试驱动开发）
- **关联文档**: week-2-WO.md, week-2-PL.md

---

## 一、测试概述

### 1.1 测试范围
本周测试覆盖五子棋游戏的核心功能，包括：
- 棋盘数据结构（Board类）
- 游戏规则引擎（胜负判断）
- 坐标转换逻辑
- 落子交互功能
- 游戏状态管理
- Konva.js渲染组件

### 1.2 测试策略
- **单元测试**: 测试核心函数和数据结构（覆盖率目标 > 70%）
- **集成测试**: 测试组件交互和游戏流程
- **E2E测试**: 测试完整的用户使用场景

### 1.3 测试优先级定义
- **P0**: 核心功能，必须通过才能发布
- **P1**: 重要功能，影响用户体验
- **P2**: 边界情况和错误处理

### 1.4 测试环境
- **浏览器**: Chrome, Firefox, Safari, Edge
- **Node.js版本**: v18+
- **React版本**: 19.x
- **测试框架**: Jest + React Testing Library + Playwright

---

## 二、单元测试用例

### 2.1 Board类测试

#### TC-001: Board类初始化测试

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/board.test.ts`

**前置条件**:
- Board类已定义

**测试步骤**:
1. 创建Board实例，不传入参数
2. 检查棋盘大小是否为15
3. 检查所有位置是否为null
4. 检查初始状态是否为空棋盘

**期望结果**:
```typescript
const board = new Board();
expect(board.getSize()).toBe(15);
expect(board.isEmpty(7, 7)).toBe(true);
expect(board.isEmpty(0, 0)).toBe(true);
expect(board.isEmpty(14, 14)).toBe(true);
expect(board.getOccupiedPositions()).toHaveLength(0);
```

**测试数据**:
- 默认棋盘大小: 15
- 位置: (7, 7), (0, 0), (14, 14)

---

#### TC-002: Board类自定义大小初始化测试

**优先级**: P2
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/board.test.ts`

**前置条件**:
- Board类已定义

**测试步骤**:
1. 创建Board实例，传入size=10
2. 检查棋盘大小是否为10
3. 验证边界位置(0,0)和(9,9)有效
4. 验证越界位置(10,10)无效

**期望结果**:
```typescript
const board = new Board(10);
expect(board.getSize()).toBe(10);
expect(board.isValid(0, 0)).toBe(true);
expect(board.isValid(9, 9)).toBe(true);
expect(board.isValid(10, 10)).toBe(false);
```

**测试数据**:
- 自定义棋盘大小: 10
- 有效位置: (0, 0), (9, 9)
- 无效位置: (10, 10), (-1, 0)

---

#### TC-003: 落子功能测试

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/board.test.ts`

**前置条件**:
- Board实例已创建

**测试步骤**:
1. 在位置(7, 7)设置黑棋
2. 检查该位置是否返回'black'
3. 检查该位置isEmpty返回false
4. 在位置(7, 8)设置白棋
5. 验证两个位置棋子颜色不同

**期望结果**:
```typescript
const board = new Board();
board.setCell(7, 7, 'black');
expect(board.getCell(7, 7)).toBe('black');
expect(board.isEmpty(7, 7)).toBe(false);

board.setCell(7, 8, 'white');
expect(board.getCell(7, 8)).toBe('white');
expect(board.getCell(7, 7)).toBe('black');
```

**测试数据**:
- 黑棋位置: (7, 7)
- 白棋位置: (7, 8)

---

#### TC-004: 覆盖落子测试

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/board.test.ts`

**前置条件**:
- Board实例已创建，已有棋子

**测试步骤**:
1. 在位置(7, 7)设置黑棋
2. 在同一位置设置白棋
3. 检查位置是否更新为白棋
4. 验证只有最新值

**期望结果**:
```typescript
const board = new Board();
board.setCell(7, 7, 'black');
board.setCell(7, 7, 'white');
expect(board.getCell(7, 7)).toBe('white');
expect(board.getOccupiedPositions()).toHaveLength(1);
```

**测试数据**:
- 位置: (7, 7)
- 先黑棋后白棋

---

#### TC-005: 位置验证测试

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/board.test.ts`

**前置条件**:
- Board实例已创建（15×15）

**测试步骤**:
1. 测试四个角: (0,0), (14,0), (0,14), (14,14)
2. 测试边界中点: (7,0), (7,14), (0,7), (14,7)
3. 测试中心点: (7,7)
4. 测试越界位置: (-1,0), (15,0), (0,-1), (0,15)
5. 测试无效类型: 字符串、null、undefined

**期望结果**:
```typescript
const board = new Board();

// 有效位置
expect(board.isValid(0, 0)).toBe(true);
expect(board.isValid(14, 14)).toBe(true);
expect(board.isValid(7, 7)).toBe(true);

// 无效位置
expect(board.isValid(-1, 0)).toBe(false);
expect(board.isValid(15, 0)).toBe(false);
expect(board.isValid(0, -1)).toBe(false);
expect(board.isValid(0, 15)).toBe(false);
```

**测试数据**:
- 有效位置: (0,0), (14,14), (7,7)
- 无效位置: (-1,0), (15,0), (0,-1), (0,15)

---

#### TC-006: 获取已占位置测试

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/board.test.ts`

**前置条件**:
- Board实例已创建

**测试步骤**:
1. 在多个位置设置棋子
2. 调用getOccupiedPositions()
3. 验证返回数组的长度
4. 验证返回数组包含所有已落子位置
5. 验证位置顺序（按遍历顺序）

**期望结果**:
```typescript
const board = new Board();
board.setCell(7, 7, 'black');
board.setCell(7, 8, 'white');
board.setCell(8, 7, 'black');

const positions = board.getOccupiedPositions();
expect(positions).toHaveLength(3);
expect(positions).toContainEqual({ x: 7, y: 7 });
expect(positions).toContainEqual({ x: 7, y: 8 });
expect(positions).toContainEqual({ x: 8, y: 7 });
```

**测试数据**:
- 棋子位置: (7, 7), (7, 8), (8, 7)

---

#### TC-007: 清空棋盘测试

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/board.test.ts`

**前置条件**:
- Board实例已创建且有多个棋子

**测试步骤**:
1. 设置多个棋子
2. 调用clear()方法
3. 验证所有位置为null
4. 验证getOccupiedPositions()返回空数组
5. 验证棋盘大小不变

**期望结果**:
```typescript
const board = new Board();
board.setCell(7, 7, 'black');
board.setCell(7, 8, 'white');

board.clear();

expect(board.isEmpty(7, 7)).toBe(true);
expect(board.isEmpty(7, 8)).toBe(true);
expect(board.getOccupiedPositions()).toHaveLength(0);
expect(board.getSize()).toBe(15);
```

**测试数据**:
- 初始棋子: (7, 7), (7, 8)

---

#### TC-008: 棋盘克隆测试

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/board.test.ts`

**前置条件**:
- Board实例已创建且有棋子

**测试步骤**:
1. 在原棋盘设置多个棋子
2. 调用clone()方法创建副本
3. 修改原棋盘的一个位置
4. 验证副本棋盘未被修改
5. 验证副本棋盘初始状态正确

**期望结果**:
```typescript
const board = new Board();
board.setCell(7, 7, 'black');
board.setCell(7, 8, 'white');

const cloned = board.clone();

// 验证初始状态一致
expect(cloned.getCell(7, 7)).toBe('black');
expect(cloned.getCell(7, 8)).toBe('white');

// 修改原棋盘
board.setCell(7, 7, 'white');

// 验证副本未受影响
expect(cloned.getCell(7, 7)).toBe('black');
expect(board.getCell(7, 7)).toBe('white');
```

**测试数据**:
- 初始棋子: (7, 7), (7, 8)
- 修改位置: (7, 7)

---

#### TC-009: 越界访问抛出异常测试

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/board.test.ts`

**前置条件**:
- Board实例已创建

**测试步骤**:
1. 尝试getCell访问越界位置
2. 验证抛出Error异常
3. 验证异常消息包含位置信息
4. 尝试setCell访问越界位置
5. 验证同样抛出异常

**期望结果**:
```typescript
const board = new Board();

// getCell越界
expect(() => board.getCell(-1, 0)).toThrow('Invalid position');
expect(() => board.getCell(15, 0)).toThrow('Invalid position');

// setCell越界
expect(() => board.setCell(-1, 0, 'black')).toThrow('Invalid position');
expect(() => board.setCell(0, 15, 'white')).toThrow('Invalid position');
```

**测试数据**:
- 越界位置: (-1, 0), (15, 0), (0, -1), (0, 15)

---

### 2.2 游戏规则引擎测试

#### TC-010: 横向5连判断测试

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/rules.test.ts`

**前置条件**:
- Board实例已创建
- GameRules类已定义

**测试步骤**:
1. 在横向位置(5,7)到(9,7)放置5个黑棋
2. 调用checkWin方法，传入最后落子位置
3. 验证返回获胜连线数组
4. 验证连线长度为5
5. 验证连线包含所有5个位置

**期望结果**:
```typescript
const board = new Board();
for (let i = 5; i < 10; i++) {
  board.setCell(i, 7, 'black');
}

const winLine = GameRules.checkWin(board, { x: 7, y: 7 });
expect(winLine).not.toBeNull();
expect(winLine).toHaveLength(5);
expect(winLine).toContainEqual({ x: 5, y: 7 });
expect(winLine).toContainEqual({ x: 6, y: 7 });
expect(winLine).toContainEqual({ x: 7, y: 7 });
expect(winLine).toContainEqual({ x: 8, y: 7 });
expect(winLine).toContainEqual({ x: 9, y: 7 });
```

**测试数据**:
- 黑棋位置: (5,7), (6,7), (7,7), (8,7), (9,7)

---

#### TC-011: 纵向5连判断测试

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/rules.test.ts`

**前置条件**:
- Board实例已创建
- GameRules类已定义

**测试步骤**:
1. 在纵向位置(7,5)到(7,9)放置5个黑棋
2. 调用checkWin方法
3. 验证返回获胜连线
4. 验证连线方向为纵向

**期望结果**:
```typescript
const board = new Board();
for (let i = 5; i < 10; i++) {
  board.setCell(7, i, 'black');
}

const winLine = GameRules.checkWin(board, { x: 7, y: 7 });
expect(winLine).not.toBeNull();
expect(winLine).toHaveLength(5);
expect(winLine).toContainEqual({ x: 7, y: 5 });
expect(winLine).toContainEqual({ x: 7, y: 6 });
expect(winLine).toContainEqual({ x: 7, y: 7 });
expect(winLine).toContainEqual({ x: 7, y: 8 });
expect(winLine).toContainEqual({ x: 7, y: 9 });
```

**测试数据**:
- 黑棋位置: (7,5), (7,6), (7,7), (7,8), (7,9)

---

#### TC-012: 主对角线5连判断测试

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/rules.test.ts`

**前置条件**:
- Board实例已创建
- GameRules类已定义

**测试步骤**:
1. 在主对角线位置(5,5)到(9,9)放置5个黑棋
2. 调用checkWin方法
3. 验证返回获胜连线
4. 验证连线方向为主对角线

**期望结果**:
```typescript
const board = new Board();
for (let i = 5; i < 10; i++) {
  board.setCell(i, i, 'black');
}

const winLine = GameRules.checkWin(board, { x: 7, y: 7 });
expect(winLine).not.toBeNull();
expect(winLine).toHaveLength(5);
expect(winLine).toContainEqual({ x: 5, y: 5 });
expect(winLine).toContainEqual({ x: 6, y: 6 });
expect(winLine).toContainEqual({ x: 7, y: 7 });
expect(winLine).toContainEqual({ x: 8, y: 8 });
expect(winLine).toContainEqual({ x: 9, y: 9 });
```

**测试数据**:
- 黑棋位置: (5,5), (6,6), (7,7), (8,8), (9,9)

---

#### TC-013: 副对角线5连判断测试

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/rules.test.ts`

**前置条件**:
- Board实例已创建
- GameRules类已定义

**测试步骤**:
1. 在副对角线位置(5,9)到(9,5)放置5个黑棋
2. 调用checkWin方法
3. 验证返回获胜连线
4. 验证连线方向为副对角线

**期望结果**:
```typescript
const board = new Board();
for (let i = 0; i < 5; i++) {
  board.setCell(5 + i, 9 - i, 'black');
}

const winLine = GameRules.checkWin(board, { x: 7, y: 7 });
expect(winLine).not.toBeNull();
expect(winLine).toHaveLength(5);
expect(winLine).toContainEqual({ x: 5, y: 9 });
expect(winLine).toContainEqual({ x: 6, y: 8 });
expect(winLine).toContainEqual({ x: 7, y: 7 });
expect(winLine).toContainEqual({ x: 8, y: 6 });
expect(winLine).toContainEqual({ x: 9, y: 5 });
```

**测试数据**:
- 黑棋位置: (5,9), (6,8), (7,7), (8,6), (9,5)

---

#### TC-014: 未达到5子判断测试

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/rules.test.ts`

**前置条件**:
- Board实例已创建
- GameRules类已定义

**测试步骤**:
1. 放置4个连续黑棋
2. 调用checkWin方法
3. 验证返回null

**期望结果**:
```typescript
const board = new Board();
for (let i = 5; i < 9; i++) {
  board.setCell(i, 7, 'black');
}

const winLine = GameRules.checkWin(board, { x: 7, y: 7 });
expect(winLine).toBeNull();
```

**测试数据**:
- 黑棋位置: (5,7), (6,7), (7,7), (8,7)

---

#### TC-015: 超过5子判断测试

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/rules.test.ts`

**前置条件**:
- Board实例已创建
- GameRules类已定义

**测试步骤**:
1. 放置6个连续黑棋
2. 调用checkWin方法
3. 验证返回获胜连线
4. 验证连线长度为6

**期望结果**:
```typescript
const board = new Board();
for (let i = 5; i < 11; i++) {
  board.setCell(i, 7, 'black');
}

const winLine = GameRules.checkWin(board, { x: 7, y: 7 });
expect(winLine).not.toBeNull();
expect(winLine).toHaveLength(6);
```

**测试数据**:
- 黑棋位置: (5,7), (6,7), (7,7), (8,7), (9,7), (10,7)

---

#### TC-016: 边界5连判断测试

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/rules.test.ts`

**前置条件**:
- Board实例已创建
- GameRules类已定义

**测试步骤**:
1. 在左上角边界放置5个横向黑棋: (0,0)到(4,0)
2. 调用checkWin方法
3. 验证正确识别获胜
4. 验证不出现越界错误

**期望结果**:
```typescript
const board = new Board();
for (let i = 0; i < 5; i++) {
  board.setCell(i, 0, 'black');
}

const winLine = GameRules.checkWin(board, { x: 2, y: 0 });
expect(winLine).not.toBeNull();
expect(winLine).toHaveLength(5);
```

**测试数据**:
- 黑棋位置: (0,0), (1,0), (2,0), (3,0), (4,0)

---

#### TC-017: 被阻挡的连线判断测试

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/rules.test.ts`

**前置条件**:
- Board实例已创建
- GameRules类已定义

**测试步骤**:
1. 放置5个黑棋，但被白棋隔开
2. 调用checkWin方法
3. 验证返回null（未连成一线）

**期望结果**:
```typescript
const board = new Board();
// 黑 白 黑 黑 黑
board.setCell(5, 7, 'black');
board.setCell(6, 7, 'white');
board.setCell(7, 7, 'black');
board.setCell(8, 7, 'black');
board.setCell(9, 7, 'black');

const winLine = GameRules.checkWin(board, { x: 7, y: 7 });
expect(winLine).toBeNull();
```

**测试数据**:
- 黑棋: (5,7), (7,7), (8,7), (9,7)
- 白棋: (6,7)

---

#### TC-018: 有效落子验证测试

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/rules.test.ts`

**前置条件**:
- Board实例已创建
- GameRules类已定义

**测试步骤**:
1. 测试空位置验证
2. 测试已占位置验证
3. 测试越界位置验证
4. 验证isValidMove返回正确结果

**期望结果**:
```typescript
const board = new Board();
board.setCell(7, 7, 'black');

// 空位置 - 有效
expect(GameRules.isValidMove(board, { x: 7, y: 8 })).toBe(true);

// 已占位置 - 无效
expect(GameRules.isValidMove(board, { x: 7, y: 7 })).toBe(false);

// 越界位置 - 无效
expect(GameRules.isValidMove(board, { x: -1, y: 0 })).toBe(false);
expect(GameRules.isValidMove(board, { x: 15, y: 0 })).toBe(false);
```

**测试数据**:
- 空位置: (7, 8)
- 已占位置: (7, 7)
- 越界位置: (-1, 0), (15, 0)

---

### 2.3 GameEngine类测试

#### TC-019: 游戏初始化测试

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/game-engine.test.ts`

**前置条件**:
- GameEngine类已定义

**测试步骤**:
1. 创建GameEngine实例
2. 验证初始状态为'idle'
3. 验证当前玩家为'black'
4. 验证历史记录为空
5. 调用startGame()
6. 验证状态变为'playing'

**期望结果**:
```typescript
const engine = new GameEngine();
expect(engine.getGameStatus()).toBe('idle');
expect(engine.getCurrentPlayer()).toBe('black');
expect(engine.getMoveHistory()).toHaveLength(0);

engine.startGame();
expect(engine.getGameStatus()).toBe('playing');
expect(engine.getCurrentPlayer()).toBe('black');
```

---

#### TC-020: 正常落子测试

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/game-engine.test.ts`

**前置条件**:
- GameEngine实例已创建并启动游戏

**测试步骤**:
1. 启动游戏
2. 在位置(7,7)落子
3. 验证返回success: true
4. 验证当前玩家切换为'white'
5. 验证历史记录包含该位置
6. 验证棋盘正确更新

**期望结果**:
```typescript
const engine = new GameEngine();
engine.startGame();

const result = engine.makeMove({ x: 7, y: 7 });
expect(result.success).toBe(true);
expect(result.position).toEqual({ x: 7, y: 7 });
expect(result.gameStatus).toBe('playing');

expect(engine.getCurrentPlayer()).toBe('white');
expect(engine.getMoveHistory()).toHaveLength(1);
expect(engine.getBoard().getCell(7, 7)).toBe('black');
```

---

#### TC-021: 重复落子测试

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/game-engine.test.ts`

**前置条件**:
- GameEngine实例已创建且已有棋子

**测试步骤**:
1. 在位置(7,7)落子
2. 再次尝试在同一位置落子
3. 验证返回success: false
4. 验证返回错误信息
5. 验证游戏状态未改变

**期望结果**:
```typescript
const engine = new GameEngine();
engine.startGame();
engine.makeMove({ x: 7, y: 7 });

const result = engine.makeMove({ x: 7, y: 7 });
expect(result.success).toBe(false);
expect(result.error).toContain('already occupied');

expect(engine.getMoveHistory()).toHaveLength(1);
expect(engine.getCurrentPlayer()).toBe('white');
```

---

#### TC-022: 游戏结束后落子测试

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/game-engine.test.ts`

**前置条件**:
- GameEngine实例已创建且游戏已结束

**测试步骤**:
1. 创建5连获胜局面
2. 验证游戏状态为'won'
3. 尝试继续落子
4. 验证返回success: false
5. 验证游戏状态仍为'won'

**期望结果**:
```typescript
const engine = new GameEngine();
engine.startGame();

// 创建5连
for (let i = 5; i < 10; i++) {
  engine.makeMove({ x: i, y: 7 });
  if (i < 9) {
    engine.makeMove({ x: i, y: 8 }); // 白棋干扰
  }
}

expect(engine.getGameStatus()).toBe('won');

const result = engine.makeMove({ x: 10, y: 10 });
expect(result.success).toBe(false);
expect(result.error).toContain('not in playing state');
```

---

#### TC-023: 玩家交替测试

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/game-engine.test.ts`

**前置条件**:
- GameEngine实例已创建并启动游戏

**测试步骤**:
1. 验证初始玩家为'black'
2. 落子第1步，验证切换为'white'
3. 落子第2步，验证切换为'black'
4. 落子第3步，验证切换为'white'
5. 验证历史记录中棋子颜色正确

**期望结果**:
```typescript
const engine = new GameEngine();
engine.startGame();

expect(engine.getCurrentPlayer()).toBe('black');

engine.makeMove({ x: 7, y: 7 });
expect(engine.getCurrentPlayer()).toBe('white');

engine.makeMove({ x: 7, y: 8 });
expect(engine.getCurrentPlayer()).toBe('black');

engine.makeMove({ x: 7, y: 9 });
expect(engine.getCurrentPlayer()).toBe('white');

// 验证历史记录
const history = engine.getMoveHistory();
const board = engine.getBoard();
expect(board.getCell(history[0].x, history[0].y)).toBe('black');
expect(board.getCell(history[1].x, history[1].y)).toBe('white');
expect(board.getCell(history[2].x, history[2].y)).toBe('black');
```

---

#### TC-024: 获胜判定测试

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/game-engine.test.ts`

**前置条件**:
- GameEngine实例已创建并启动游戏

**测试步骤**:
1. 创建横向5连局面
2. 落子形成5连
3. 验证返回success: true
4. 验证gameStatus为'won'
5. 验证winLine包含5个位置
6. 验证获胜方正确

**期望结果**:
```typescript
const engine = new GameEngine();
engine.startGame();

// 黑棋: (5,7), 白棋: (5,8), 黑棋: (6,7), 白棋: (6,8)
// 黑棋: (7,7), 白棋: (7,8), 黑棋: (8,7), 白棋: (8,8), 黑棋: (9,7)
const moves = [
  { x: 5, y: 7 }, { x: 5, y: 8 },
  { x: 6, y: 7 }, { x: 6, y: 8 },
  { x: 7, y: 7 }, { x: 7, y: 8 },
  { x: 8, y: 7 }, { x: 8, y: 8 },
  { x: 9, y: 7 }
];

for (const move of moves) {
  const result = engine.makeMove(move);
  if (move.x === 9 && move.y === 7) {
    expect(result.gameStatus).toBe('won');
    expect(result.winLine).toHaveLength(5);
    expect(result.player).toBe('black');
  }
}

expect(engine.getGameStatus()).toBe('won');
```

---

#### TC-025: 和棋判定测试

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/game-engine.test.ts`

**前置条件**:
- GameEngine实例已创建并启动游戏

**测试步骤**:
1. 模拟填满整个棋盘（225个位置）
2. 确保没有5连
3. 验证gameStatus为'draw'
4. 验证winner为null

**期望结果**:
```typescript
const engine = new GameEngine();
engine.startGame();

// 填满棋盘（这里简化测试，使用小棋盘或直接操作）
// 实际测试中可以构造特定的和棋局面
for (let y = 0; y < 15; y++) {
  for (let x = 0; x < 15; x++) {
    const result = engine.makeMove({ x, y });
    if (result.gameStatus === 'draw') {
      expect(result.gameStatus).toBe('draw');
      expect(result.player).toBeUndefined();
      break;
    }
  }
}

// 或者直接测试和棋逻辑
// 验证当棋盘满且无5连时判定为和棋
```

---

### 2.4 坐标转换测试

#### TC-026: 屏幕坐标转网格坐标测试

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/utils/__tests__/coordinate.test.ts`

**前置条件**:
- screenToGrid函数已定义

**测试步骤**:
1. 设置canvas大小为600，padding为30
2. 计算cellSize = (600 - 2*30) / 14 = 40
3. 测试中心点点击: (300, 300) → (7, 7)
4. 测试左上角点击: (30, 30) → (0, 0)
5. 测试右下角点击: (570, 570) → (14, 14)
6. 测试边界外点击返回null

**期望结果**:
```typescript
const canvasSize = 600;
const padding = 30;

// 中心点
expect(screenToGrid(300, 300, canvasSize, padding)).toEqual({ x: 7, y: 7 });

// 左上角
expect(screenToGrid(30, 30, canvasSize, padding)).toEqual({ x: 0, y: 0 });

// 右下角
expect(screenToGrid(570, 570, canvasSize, padding)).toEqual({ x: 14, y: 14 });

// 边界外
expect(screenToGrid(20, 300, canvasSize, padding)).toBeNull();
expect(screenToGrid(300, 20, canvasSize, padding)).toBeNull();
```

**测试数据**:
- Canvas大小: 600×600
- Padding: 30
- CellSize: 40

---

#### TC-027: 网格坐标转屏幕坐标测试

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/utils/__tests__/coordinate.test.ts`

**前置条件**:
- gridToScreen函数已定义

**测试步骤**:
1. 设置canvas大小为600，padding为30
2. 测试中心点转换: (7, 7) → (300, 300)
3. 测试左上角转换: (0, 0) → (30, 30)
4. 测试右下角转换: (14, 14) → (570, 570)
5. 验证精度（小数点处理）

**期望结果**:
```typescript
const canvasSize = 600;
const padding = 30;

// 中心点
expect(gridToScreen(7, 7, canvasSize, padding)).toEqual({ x: 300, y: 300 });

// 左上角
expect(gridToScreen(0, 0, canvasSize, padding)).toEqual({ x: padding, y: padding });

// 右下角
expect(gridToScreen(14, 14, canvasSize, padding)).toEqual({ x: 570, y: 570 });
```

**测试数据**:
- Canvas大小: 600×600
- Padding: 30

---

#### TC-028: 坐标转换往返精度测试

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/utils/__tests__/coordinate.test.ts`

**前置条件**:
- screenToGrid和gridToScreen函数已定义

**测试步骤**:
1. 从网格坐标转换为屏幕坐标
2. 再从屏幕坐标转回网格坐标
3. 验证往返后结果一致
4. 测试多个位置

**期望结果**:
```typescript
const canvasSize = 600;
const padding = 30;

const testPositions = [
  { x: 0, y: 0 },
  { x: 7, y: 7 },
  { x: 14, y: 14 },
  { x: 3, y: 5 },
  { x: 10, y: 12 }
];

for (const pos of testPositions) {
  const screen = gridToScreen(pos.x, pos.y, canvasSize, padding);
  const grid = screenToGrid(screen.x, screen.y, canvasSize, padding);
  expect(grid).toEqual(pos);
}
```

**测试数据**:
- 测试位置: (0,0), (7,7), (14,14), (3,5), (10,12)

---

#### TC-029: 坐标转换边界值测试

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/utils/__tests__/coordinate.test.ts`

**前置条件**:
- screenToGrid函数已定义

**测试步骤**:
1. 测试四个角点
2. 测试四边中点
3. 测试刚好在边界上的点击
4. 测试超出边界1像素的点击
5. 验证四舍五入逻辑正确

**期望结果**:
```typescript
const canvasSize = 600;
const padding = 30;
const cellSize = 40;

// 四个角
expect(screenToGrid(30, 30, canvasSize, padding)).toEqual({ x: 0, y: 0 });
expect(screenToGrid(570, 30, canvasSize, padding)).toEqual({ x: 14, y: 0 });
expect(screenToGrid(30, 570, canvasSize, padding)).toEqual({ x: 0, y: 14 });
expect(screenToGrid(570, 570, canvasSize, padding)).toEqual({ x: 14, y: 14 });

// 四边中点
expect(screenToGrid(300, 30, canvasSize, padding)).toEqual({ x: 7, y: 0 });
expect(screenToGrid(300, 570, canvasSize, padding)).toEqual({ x: 7, y: 14 });
expect(screenToGrid(30, 300, canvasSize, padding)).toEqual({ x: 0, y: 7 });
expect(screenToGrid(570, 300, canvasSize, padding)).toEqual({ x: 14, y: 7 });

// 边界外1像素
expect(screenToGrid(29, 300, canvasSize, padding)).toBeNull();
expect(screenToGrid(571, 300, canvasSize, padding)).toBeNull();
```

---

## 三、集成测试用例

### 3.1 组件渲染测试

#### TC-030: 棋盘Stage组件渲染测试

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/components/__tests__/BoardStage.test.tsx`

**前置条件**:
- BoardStage组件已定义

**测试步骤**:
1. 渲染BoardStage组件
2. 验证Stage元素存在
3. 验证初始大小正确
4. 验证点击回调函数正确

**期望结果**:
```typescript
render(<BoardStage size={600} onCellClick={jest.fn()} />);

const stage = screen.getByRole('figure'); // 或其他合适的selector
expect(stage).toBeInTheDocument();
expect(stage).toHaveAttribute('width', '600');
expect(stage).toHaveAttribute('height', '600');
```

---

#### TC-031: 棋盘Layer组件渲染测试

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/components/__tests__/BoardLayer.test.tsx`

**前置条件**:
- BoardLayer组件已定义

**测试步骤**:
1. 渲染BoardLayer组件
2. 验证15条横线渲染
3. 验证15条竖线渲染
4. 验证5个星位点渲染
5. 验证背景颜色正确

**期望结果**:
```typescript
const { container } = render(
  <BoardLayer size={600} cellSize={40} padding={30} />
);

// 验证横线数量（使用Konva的测试工具）
const lines = container.querySelectorAll('line');
const horizontalLines = Array.from(lines).filter(line => {
  const points = line.getAttribute('points');
  return points && points.startsWith(`${padding},`);
});

expect(horizontalLines).toHaveLength(15);

// 验证星位点
const circles = container.querySelectorAll('circle');
// 前5个是星位点
expect(circles.length).toBeGreaterThanOrEqual(5);
```

---

#### TC-032: 棋子Layer组件渲染测试

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/components/__tests__/PiecesLayer.test.tsx`

**前置条件**:
- PiecesLayer组件已定义

**测试步骤**:
1. 准备测试棋子数据
2. 渲染PiecesLayer组件
3. 验证所有棋子渲染
4. 验证黑棋颜色正确
5. 验证白棋颜色正确
6. 验证最新落子标记

**期望结果**:
```typescript
const pieces = [
  { x: 7, y: 7, player: 'black' as const },
  { x: 7, y: 8, player: 'white' as const },
  { x: 8, y: 7, player: 'black' as const }
];

const { container } = render(
  <PiecesLayer
    pieces={pieces}
    cellSize={40}
    padding={30}
    lastMove={{ x: 7, y: 8 }}
  />
);

const circles = container.querySelectorAll('circle');
// 每个棋子: 阴影 + 本体 + (可能的高光) + (可能的红圈)
expect(circles.length).toBeGreaterThan(0);
```

---

#### TC-033: 棋子最新落子标记测试

**优先级**: P1
**类型**: 集成测试
**测试文件**: `src/components/__tests__/PiecesLayer.test.tsx`

**前置条件**:
- PiecesLayer组件已定义

**测试步骤**:
1. 渲染3个棋子
2. 设置lastMove为中间的棋子
3. 验证只有该棋子有红色标记
4. 验证红色标记的样式

**期望结果**:
```typescript
const pieces = [
  { x: 7, y: 7, player: 'black' as const },
  { x: 7, y: 8, player: 'white' as const },
  { x: 8, y: 7, player: 'black' as const }
];

const { container } = render(
  <PiecesLayer
    pieces={pieces}
    cellSize={40}
    padding={30}
    lastMove={{ x: 7, y: 8 }}
  />
);

// 查找红色标记的圆圈
const redMarkers = Array.from(container.querySelectorAll('circle')).filter(
  circle => circle.getAttribute('stroke') === '#FF0000'
);

expect(redMarkers).toHaveLength(1);
```

---

### 3.2 交互功能测试

#### TC-034: 点击落子交互测试

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/components/__tests__/BoardStage.test.tsx`

**前置条件**:
- BoardStage组件已定义
- onCellClick回调已设置

**测试步骤**:
1. 渲染BoardStage组件
2. 模拟点击中心位置
3. 验证回调函数被调用
4. 验证传递的坐标正确

**期望结果**:
```typescript
const handleClick = jest.fn();

render(<BoardStage size={600} onCellClick={handleClick} />);

const stage = screen.getByRole('figure');
fireEvent.click(stage, {
  clientX: 300,
  clientY: 300
});

expect(handleClick).toHaveBeenCalledTimes(1);
expect(handleClick).toHaveBeenCalledWith(7, 7);
```

---

#### TC-035: 点击已有棋子位置测试

**优先级**: P1
**类型**: 集成测试
**测试文件**: `src/pages/__tests__/GamePage.test.tsx`

**前置条件**:
- GamePage组件已定义
- 游戏已启动

**测试步骤**:
1. 启动游戏
2. 在位置(7,7)落子
3. 再次点击位置(7,7)
4. 验证棋盘只有一个棋子
5. 验证历史记录长度为1

**期望结果**:
```typescript
render(<GamePage />);

// 第一次点击
fireEvent.click(screen.getByRole('figure'), {
  clientX: 300,
  clientY: 300
});

// 第二次点击同一位置
fireEvent.click(screen.getByRole('figure'), {
  clientX: 300,
  clientY: 300
});

// 验证历史记录
expect(screen.getByText(/总落子数: 1/)).toBeInTheDocument();
```

---

#### TC-036: 玩家自动切换测试

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/pages/__tests__/GamePage.test.tsx`

**前置条件**:
- GamePage组件已定义

**测试步骤**:
1. 启动游戏，验证显示"黑棋回合"
2. 黑棋落子
3. 验证显示变为"白棋回合"
4. 白棋落子
5. 验证显示变为"黑棋回合"

**期望结果**:
```typescript
render(<GamePage />);

// 初始状态
expect(screen.getByText(/黑棋/)).toBeInTheDocument();

// 黑棋落子后
fireEvent.click(screen.getByRole('figure'), { clientX: 300, clientY: 300 });
await waitFor(() => {
  expect(screen.getByText(/白棋/)).toBeInTheDocument();
});

// 白棋落子后
fireEvent.click(screen.getByRole('figure'), { clientX: 300, clientY: 340 });
await waitFor(() => {
  expect(screen.getByText(/黑棋/)).toBeInTheDocument();
});
```

---

#### TC-037: 获胜后状态显示测试

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/pages/__tests__/GamePage.test.tsx`

**前置条件**:
- GamePage组件已定义

**测试步骤**:
1. 创建横向5连局面
2. 落子形成获胜
3. 验证显示"黑棋获胜"
4. 验证无法继续落子
5. 验证重新开始按钮可见

**期望结果**:
```typescript
render(<GamePage />);

// 创建5连（简化版，实际需要多个点击）
const board = screen.getByRole('figure');
// ... 模拟多次点击形成5连

await waitFor(() => {
  expect(screen.getByText(/黑棋.*获胜/)).toBeInTheDocument();
});

// 尝试继续落子
fireEvent.click(board, { clientX: 100, clientY: 100 });
// 验证历史记录未增加
```

---

#### TC-038: 游戏状态管理测试

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/store/__tests__/game-store.test.ts`

**前置条件**:
- useGameStore已定义

**测试步骤**:
1. 获取初始状态
2. 调用startGame()
3. 验证状态变化
4. 调用makeMove()
5. 验证状态更新
6. 调用resetGame()
7. 验证状态重置

**期望结果**:
```typescript
const { result } = renderHook(() => useGameStore());

// 初始状态
expect(result.current.gameStatus).toBe('idle');

// 开始游戏
act(() => {
  result.current.startGame();
});

expect(result.current.gameStatus).toBe('playing');
expect(result.current.currentPlayer).toBe('black');

// 落子
act(() => {
  result.current.makeMove({ x: 7, y: 7 });
});

expect(result.current.moveHistory).toHaveLength(1);
expect(result.current.currentPlayer).toBe('white');

// 重置游戏
act(() => {
  result.current.resetGame();
});

expect(result.current.gameStatus).toBe('idle');
expect(result.current.moveHistory).toHaveLength(0);
```

---

### 3.3 完整游戏流程测试

#### TC-039: 完整对局流程测试

**优先级**: P0
**类型**: 集成测试
**测试文件**: `src/pages/__tests__/GamePage.integration.test.tsx`

**前置条件**:
- GamePage组件已定义

**测试步骤**:
1. 访问游戏页面
2. 验证游戏自动启动
3. 黑棋落子(7,7)
4. 验证切换到白棋
5. 白棋落子(7,8)
6. 验证切换到黑棋
7. 继续落子直到一方获胜
8. 验证获胜信息显示
9. 点击重新开始
10. 验证游戏重置

**期望结果**:
```typescript
render(<GamePage />);

// 1. 验证自动启动
await waitFor(() => {
  expect(screen.getByText(/黑棋.*回合/)).toBeInTheDocument();
});

// 2-6. 落子并验证切换
const board = screen.getByRole('figure');

fireEvent.click(board, { clientX: 300, clientY: 300 }); // (7,7)
await waitFor(() => {
  expect(screen.getByText(/白棋.*回合/)).toBeInTheDocument();
});

fireEvent.click(board, { clientX: 300, clientY: 340 }); // (7,8)
await waitFor(() => {
  expect(screen.getByText(/黑棋.*回合/)).toBeInTheDocument();
});

// 7-8. 继续落子直到获胜
// ...

// 9-10. 重新开始
fireEvent.click(screen.getByText(/重新开始/));
await waitFor(() => {
  expect(screen.getByText(/黑棋.*回合/)).toBeInTheDocument();
  expect(screen.getByText(/总落子数: 0/)).toBeInTheDocument();
});
```

---

#### TC-040: 和棋流程测试

**优先级**: P1
**类型**: 集成测试
**测试文件**: `src/pages/__tests__/GamePage.integration.test.tsx`

**前置条件**:
- GamePage组件已定义

**测试步骤**:
1. 模拟填满整个棋盘（使用store直接操作）
2. 确保没有5连
3. 验证显示"和棋"
4. 验证游戏结束状态

**期望结果**:
```typescript
const { result } = renderHook(() => useGameStore());

// 开始游戏
act(() => {
  result.current.startGame();
});

// 填满棋盘（简化测试，实际应构造无5连的局面）
// 这里只是示例逻辑
act(() => {
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < 15; x++) {
      const moveResult = result.current.makeMove({ x, y });
      if (moveResult.gameStatus === 'draw') {
        break;
      }
    }
  }
});

// 验证和棋
expect(result.current.gameStatus).toBe('draw');
expect(result.current.winner).toBeNull();
```

---

## 四、E2E测试用例

### 4.1 用户场景测试

#### TC-041: 新用户完整对局E2E测试

**优先级**: P0
**类型**: E2E测试
**测试文件**: `e2e/game-flow.spec.ts`

**前置条件**:
- 应用已启动（localhost:5173）
- 使用Playwright框架

**测试步骤**:
1. 打开浏览器访问游戏页面
2. 等待棋盘加载完成
3. 等待游戏自动启动
4. 验证显示"当前回合: 黑棋"
5. 点击棋盘中心位置
6. 验证黑棋出现在点击位置
7. 验证显示切换为"当前回合: 白棋"
8. 点击另一个位置
9. 验证白棋出现
10. 继续落子直到黑棋获胜
11. 验证显示"黑棋获胜"
12. 验证无法继续落子
13. 点击"重新开始"按钮
14. 验证棋盘清空
15. 验证显示"当前回合: 黑棋"

**期望结果**:
```typescript
import { test, expect } from '@playwright/test';

test('完整对局流程', async ({ page }) => {
  // 1. 访问页面
  await page.goto('http://localhost:5173/game');
  await page.waitForLoadState('networkidle');

  // 2-4. 验证初始状态
  await expect(page.locator('text=/黑棋.*回合/')).toBeVisible();

  // 5-7. 黑棋落子
  const board = page.locator('canvas').first();
  await board.click({ position: { x: 300, y: 300 } });
  await expect(page.locator('text=/白棋.*回合/')).toBeVisible();

  // 8-9. 白棋落子
  await board.click({ position: { x: 300, y: 340 } });
  await expect(page.locator('text=/黑棋.*回合/')).toBeVisible();

  // 10-11. 继续落子直到获胜
  // ... 模拟多次点击

  // 12. 验证无法继续落子
  const moveCount = await page.locator('text=/总落子数:/').textContent();
  const count = parseInt(moveCount?.match(/\d+/)?.[0] || '0');

  await board.click({ position: { x: 100, y: 100 } });
  const newMoveCount = await page.locator('text=/总落子数:/').textContent();
  const newCount = parseInt(newMoveCount?.match(/\d+/)?.[0] || '0');

  expect(newCount).toBe(count);

  // 13-15. 重新开始
  await page.click('text=重新开始');
  await expect(page.locator('text=/黑棋.*回合/')).toBeVisible();
  await expect(page.locator('text=/总落子数: 0/')).toBeVisible();
});
```

---

#### TC-042: 响应式布局E2E测试

**优先级**: P1
**类型**: E2E测试
**测试文件**: `e2e/responsive.spec.ts`

**前置条件**:
- 应用已启动

**测试步骤**:
1. 在桌面尺寸（1920×1080）打开游戏
2. 验证棋盘正常显示
3. 点击棋盘中心验证落子
4. 调整窗口大小到平板尺寸（768×1024）
5. 验证棋盘自适应缩小
6. 点击棋盘中心验证落子
7. 调整窗口大小到手机尺寸（375×667）
8. 验证棋盘继续适应
9. 点击棋盘中心验证落子

**期望结果**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('响应式布局', () => {
  test('桌面尺寸', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5173/game');

    const board = page.locator('canvas').first();
    await expect(board).toBeVisible();

    const box = await board.boundingBox();
    expect(box?.width).toBeGreaterThan(500);
  });

  test('平板尺寸', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:5173/game');

    const board = page.locator('canvas').first();
    await expect(board).toBeVisible();

    const box = await board.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(768);
  });

  test('手机尺寸', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/game');

    const board = page.locator('canvas').first();
    await expect(board).toBeVisible();

    const box = await board.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(375);
  });
});
```

---

#### TC-043: 多浏览器兼容性E2E测试

**优先级**: P1
**类型**: E2E测试
**测试文件**: `e2e/cross-browser.spec.ts`

**前置条件**:
- 应用已启动

**测试步骤**:
1. 在Chrome浏览器运行完整对局
2. 在Firefox浏览器运行完整对局
3. 在Safari浏览器运行完整对局
4. 在Edge浏览器运行完整对局
5. 验证所有浏览器功能一致

**期望结果**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('多浏览器兼容性', () => {
  test('Chrome完整对局', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium');

    await page.goto('http://localhost:5173/game');

    // 执行完整对局
    const board = page.locator('canvas').first();
    await board.click({ position: { x: 300, y: 300 } });
    await expect(page.locator('text=/白棋.*回合/')).toBeVisible();

    // ... 更多落子
  });

  test('Firefox完整对局', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox');

    await page.goto('http://localhost:5173/game');
    // 相同的测试步骤
  });

  // Safari和Edge测试类似
});
```

---

#### TC-044: 性能测试E2E

**优先级**: P2
**类型**: E2E测试
**测试文件**: `e2e/performance.spec.ts`

**前置条件**:
- 应用已启动

**测试步骤**:
1. 测量棋盘初始渲染时间
2. 测量落子响应时间
3. 测量胜负判断时间
4. 测量50个棋子的渲染性能
5. 验证所有性能指标符合要求

**期望结果**:
```typescript
import { test, expect } from '@playwright/test';

test('性能测试', async ({ page }) => {
  await page.goto('http://localhost:5173/game');

  // 1. 初始渲染时间
  const renderStart = Date.now();
  await page.waitForSelector('canvas');
  const renderTime = Date.now() - renderStart;
  expect(renderTime).toBeLessThan(100);

  // 2. 落子响应时间
  const board = page.locator('canvas').first();
  const moveStart = Date.now();
  await board.click({ position: { x: 300, y: 300 } });
  await page.waitForSelector('text=/白棋.*回合/');
  const moveTime = Date.now() - moveStart;
  expect(moveTime).toBeLessThan(50);

  // 3-5. 更多性能测试
});
```

---

## 五、边界条件测试

### 5.1 数据边界测试

#### TC-045: 极端落子位置测试

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/board.test.ts`

**前置条件**:
- Board实例已创建

**测试步骤**:
1. 测试四个角点落子
2. 测试四边中点落子
3. 测试相邻角落的位置
4. 验证所有位置都能正确落子
5. 验证坐标计算正确

**期望结果**:
```typescript
const board = new Board();

const corners = [
  { x: 0, y: 0 },
  { x: 14, y: 0 },
  { x: 0, y: 14 },
  { x: 14, y: 14 }
];

for (const corner of corners) {
  expect(() => board.setCell(corner.x, corner.y, 'black')).not.toThrow();
  expect(board.getCell(corner.x, corner.y)).toBe('black');
}

const edges = [
  { x: 7, y: 0 },
  { x: 7, y: 14 },
  { x: 0, y: 7 },
  { x: 14, y: 7 }
];

for (const edge of edges) {
  expect(board.isValid(edge.x, edge.y)).toBe(true);
}
```

**测试数据**:
- 角点: (0,0), (14,0), (0,14), (14,14)
- 边点: (7,0), (7,14), (0,7), (14,7)

---

#### TC-046: 边界5连测试

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/rules.test.ts`

**前置条件**:
- Board实例已创建
- GameRules类已定义

**测试步骤**:
1. 测试左上角横向5连: (0,0)-(4,0)
2. 测试右下角纵向5连: (14,10)-(14,14)
3. 测试左上角对角线5连: (0,0)-(4,4)
4. 测试右上角副对角线5连: (10,0)-(14,4)
5. 验证所有边界5连正确识别

**期望结果**:
```typescript
const board = new Board();

// 左上角横向5连
for (let i = 0; i < 5; i++) {
  board.setCell(i, 0, 'black');
}
let winLine = GameRules.checkWin(board, { x: 2, y: 0 });
expect(winLine).not.toBeNull();
expect(winLine).toHaveLength(5);

board.clear();

// 右下角纵向5连
for (let i = 10; i < 15; i++) {
  board.setCell(14, i, 'black');
}
winLine = GameRules.checkWin(board, { x: 14, y: 12 });
expect(winLine).not.toBeNull();

// ... 其他边界测试
```

---

#### TC-047: 越界保护测试

**优先级**: P0
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/rules.test.ts`

**前置条件**:
- GameRules类已定义

**测试步骤**:
1. 在边界位置放置棋子
2. 调用checkWin
3. 验证不会访问越界索引
4. 验证不会抛出数组越界异常
5. 测试四个方向在边界的情况

**期望结果**:
```typescript
const board = new Board();

// 在左上角放置棋子
for (let i = 0; i < 5; i++) {
  board.setCell(i, 0, 'black');
}

// 验证不会抛出异常
expect(() => {
  GameRules.checkWin(board, { x: 0, y: 0 });
}).not.toThrow();

const winLine = GameRules.checkWin(board, { x: 2, y: 0 });
expect(winLine).not.toBeNull();
```

---

#### TC-048: 空棋盘测试

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/rules.test.ts`

**前置条件**:
- Board实例已创建
- GameRules类已定义

**测试步骤**:
1. 创建空棋盘
2. 尝试在空位置调用checkWin
3. 验证返回null
4. 验证不抛出异常

**期望结果**:
```typescript
const board = new Board();
const winLine = GameRules.checkWin(board, { x: 7, y: 7 });
expect(winLine).toBeNull();
```

---

#### TC-049: 最长对局测试（225步）

**优先级**: P2
**类型**: 集成测试
**测试文件**: `src/game/core/__tests__/game-engine.test.ts`

**前置条件**:
- GameEngine实例已创建

**测试步骤**:
1. 启动游戏
2. 依次填满所有225个位置
3. 确保没有5连
4. 验证在最后一子时判断为和棋
5. 验证历史记录长度为225

**期望结果**:
```typescript
const engine = new GameEngine();
engine.startGame();

// 填满棋盘（这里简化，实际需要构造无5连的局面）
let moveCount = 0;
for (let y = 0; y < 15; y++) {
  for (let x = 0; x < 15; x++) {
    const result = engine.makeMove({ x, y });
    moveCount++;

    if (result.gameStatus === 'draw') {
      expect(moveCount).toBe(225);
      expect(engine.getMoveHistory()).toHaveLength(225);
      break;
    }
  }
}
```

---

### 5.2 异常情况测试

#### TC-050: 无效坐标类型测试

**优先级**: P1
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/board.test.ts`

**前置条件**:
- Board实例已创建

**测试步骤**:
1. 尝试传入字符串坐标
2. 尝试传入null坐标
3. 尝试传入undefined坐标
4. 尝试传入负数坐标
5. 验证所有情况都抛出异常

**期望结果**:
```typescript
const board = new Board();

// 负数坐标
expect(board.isValid(-1, 0)).toBe(false);
expect(() => board.getCell(-1, 0)).toThrow();

// 超大坐标
expect(board.isValid(15, 0)).toBe(false);
expect(() => board.getCell(15, 0)).toThrow();

// TypeScript编译时会检查类型，但运行时可能通过any绕过
// @ts-ignore
expect(() => board.getCell('7', '7')).toThrow();
```

---

#### TC-051: 游戏状态不一致检测测试

**优先级**: P2
**类型**: 单元测试
**测试文件**: `src/game/core/__tests__/game-engine.test.ts`

**前置条件**:
- GameEngine实例已创建

**测试步骤**:
1. 启动游戏
2. 落子多步
3. 手动修改内部状态制造不一致
4. 调用状态检测函数
5. 验证能检测到不一致
6. 调用恢复函数
7. 验证状态恢复一致

**期望结果**:
```typescript
const engine = new GameEngine();
engine.startGame();

// 落子几步
engine.makeMove({ x: 7, y: 7 });
engine.makeMove({ x: 7, y: 8 });

// 获取棋盘并手动修改（假设有这个方法）
const board = engine.getBoard();
board.setCell(0, 0, 'black'); // 手动添加棋子

// 检测不一致（如果实现了这个功能）
// const isConsistent = engine.checkStateConsistency();
// expect(isConsistent).toBe(false);

// 恢复一致性
// engine.restoreStateConsistency();
// expect(engine.checkStateConsistency()).toBe(true);
```

---

#### TC-052: 并发落子测试

**优先级**: P2
**类型**: 集成测试
**测试文件**: `src/pages/__tests__/GamePage.test.tsx`

**前置条件**:
- GamePage组件已定义

**测试步骤**:
1. 启动游戏
2. 快速连续点击多个位置
3. 验证每次点击都按顺序处理
4. 验证没有落子冲突
5. 验证历史记录正确

**期望结果**:
```typescript
render(<GamePage />);

const board = screen.getByRole('figure');

// 快速连续点击
fireEvent.click(board, { clientX: 300, clientY: 300 });
fireEvent.click(board, { clientX: 340, clientY: 300 });
fireEvent.click(board, { clientX: 380, clientY: 300 });

await waitFor(() => {
  expect(screen.getByText(/总落子数: 3/)).toBeInTheDocument();
});

// 验证历史记录
// ...
```

---

## 六、测试数据准备

### 6.1 标准测试棋局

#### 测试棋局1: 横向5连
```
回合  棋子    坐标
1     黑      (7, 7)
2     白      (7, 8)
3     黑      (6, 7)
4     白      (6, 8)
5     黑      (5, 7)
6     白      (5, 8)
7     黑      (8, 7)
8     白      (8, 8)
9     黑      (9, 7)  <- 黑棋获胜
```

#### 测试棋局2: 纵向5连
```
回合  棋子    坐标
1     黑      (7, 7)
2     白      (8, 7)
3     黑      (7, 6)
4     白      (8, 6)
5     黑      (7, 5)
6     白      (8, 5)
7     黑      (7, 8)
8     白      (8, 8)
9     黑      (7, 9)  <- 黑棋获胜
```

#### 测试棋局3: 对角线5连
```
回合  棋子    坐标
1     黑      (7, 7)
2     白      (7, 8)
3     黑      (6, 6)
4     白      (6, 7)
5     黑      (5, 5)
6     白      (5, 6)
7     黑      (8, 8)
8     白      (8, 9)
9     黑      (9, 9)  <- 黑棋获胜
```

### 6.2 边界测试数据

#### 边界位置列表
```typescript
const boundaryPositions = [
  { name: '左上角', x: 0, y: 0 },
  { name: '右上角', x: 14, y: 0 },
  { name: '左下角', x: 0, y: 14 },
  { name: '右下角', x: 14, y: 14 },
  { name: '上边中点', x: 7, y: 0 },
  { name: '下边中点', x: 7, y: 14 },
  { name: '左边中点', x: 0, y: 7 },
  { name: '右边中点', x: 14, y: 7 }
];
```

---

## 七、测试覆盖率目标

### 7.1 代码覆盖率要求

| 模块 | 语句覆盖率 | 分支覆盖率 | 函数覆盖率 | 行覆盖率 |
|------|-----------|-----------|-----------|---------|
| Board类 | 100% | 100% | 100% | 100% |
| GameRules | 100% | 90%+ | 100% | 100% |
| GameEngine | 90%+ | 85%+ | 100% | 90%+ |
| 坐标转换 | 100% | 100% | 100% | 100% |
| 组件 | 80%+ | 75%+ | 90%+ | 80%+ |
| **总体** | **>70%** | **>65%** | **>80%** | **>70%** |

### 7.2 功能覆盖率要求

| 功能类别 | 覆盖率 | 说明 |
|---------|-------|------|
| 棋盘数据结构 | 100% | 所有public方法 |
| 胜负判断 | 100% | 四个方向 + 边界 |
| 落子交互 | 100% | 正常 + 异常流程 |
| 状态管理 | 90%+ | 主要状态转换 |
| UI渲染 | 80%+ | 主要组件 |
| **总体** | **>90%** | 核心功能必须覆盖 |

---

## 八、测试执行计划

### 8.1 测试阶段划分

#### 阶段1: 单元测试（Week 2前3天）
- Day 1: Board类测试
- Day 2: GameRules类测试
- Day 3: GameEngine和坐标转换测试

#### 阶段2: 集成测试（Week 2第4天）
- Day 4: 组件渲染测试 + 交互测试

#### 阶段3: E2E测试（Week 2第5天）
- Day 5: E2E场景测试 + 性能测试

### 8.2 测试通过标准

#### 单元测试通过标准
- [ ] 所有单元测试用例通过（100%）
- [ ] 代码覆盖率达标（>70%）
- [ ] 无关键bug

#### 集成测试通过标准
- [ ] 所有集成测试用例通过
- [ ] 组件交互正常
- [ ] 状态管理正确

#### E2E测试通过标准
- [ ] 所有核心场景通过
- [ ] 跨浏览器兼容性验证
- [ ] 性能指标达标

### 8.3 回归测试计划

每次代码变更后执行：
1. 快速回归：P0测试用例（<5分钟）
2. 完整回归：所有测试用例（<15分钟）
3. 发布前回归：完整测试 + 手动验证（<30分钟）

---

## 九、测试工具和框架

### 9.1 单元测试框架
```json
{
  "jest": "^29.x",
  "ts-jest": "^29.x",
  "@testing-library/react": "^14.x",
  "@testing-library/jest-dom": "^6.x",
  "@testing-library/user-event": "^14.x"
}
```

### 9.2 E2E测试框架
```json
{
  "@playwright/test": "^1.40.x"
}
```

### 9.3 覆盖率工具
```json
{
  "jest": {
    "collectCoverageFrom": [
      "src/**/*.{ts,tsx}",
      "!src/**/*.d.ts",
      "!src/**/*.stories.tsx"
    ],
    "coverageThresholds": {
      "global": {
        "branches": 65,
        "functions": 80,
        "lines": 70,
        "statements": 70
      }
    }
  }
}
```

---

## 十、验收测试清单

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

### 10.4 兼容性验收
- [ ] Chrome浏览器测试通过
- [ ] Firefox浏览器测试通过
- [ ] Safari浏览器测试通过
- [ ] Edge浏览器测试通过
- [ ] 响应式布局测试通过

---

## 十一、缺陷报告模板

### 缺陷信息
- **缺陷ID**: BUG-XXX
- **发现日期**: YYYY-MM-DD
- **严重级别**: Critical/Major/Minor/Trivial
- **优先级**: P0/P1/P2
- **状态**: Open/In Progress/Fixed/Closed

### 缺陷描述
- **标题**: 简洁描述缺陷
- **重现步骤**: 详细步骤
- **实际结果**: 描述实际行为
- **期望结果**: 描述期望行为
- **测试环境**: 浏览器、版本等
- **附件**: 截图、日志等

---

## 十二、测试总结报告模板

### 测试执行情况
- **测试用例总数**: XX
- **执行用例数**: XX
- **通过用例数**: XX
- **失败用例数**: XX
- **阻塞用例数**: XX
- **通过率**: XX%

### 缺陷统计
- **缺陷总数**: XX
- **Critical**: XX
- **Major**: XX
- **Minor**: XX
- **Trivial**: XX

### 覆盖率统计
- **代码覆盖率**: XX%
- **功能覆盖率**: XX%

### 风险评估
- **高风险项**: ...
- **中风险项**: ...
- **低风险项**: ...

### 建议
- **改进建议**: ...
- **后续测试建议**: ...

---

## 附录A: 测试用例编号规则

### 编号格式
TC-[XXX]: 测试用例名称

- TC: Test Case缩写
- XXX: 三位数字编号
  - 001-099: 单元测试
  - 100-199: 集成测试
  - 200-299: E2E测试
  - 300-399: 性能测试
  - 400-499: 安全测试
  - 500-599: 兼容性测试

### 附录B: 测试数据管理

### 测试数据存储
- 单元测试数据: 内嵌在测试文件中
- 集成测试数据: JSON文件存储
- E2E测试数据: fixtures目录

### 测试数据版本控制
- 所有测试数据纳入Git管理
- 敏感数据使用环境变量

---

**文档结束**

**审核人**: 待指定
**审核日期**: 待定
**签字**: ____________
