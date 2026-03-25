# Week 5 - WO文档（工作对象定义）

## 文档信息
- **文档版本**: v1.0
- **创建日期**: 2026-03-25
- **负责人**: 产品经理
- **阶段**: Phase 2 - 高级AI系统
- **周次**: Week 5
- **关联文档**: week-5-PL.md

---

## 一、工作对象概述

### 1.1 定义
本周的工作对象是**困难AI系统（Hard AI）**，基于Minimax算法和Alpha-Beta剪枝技术实现高级AI对手。

### 1.2 目标
实现具有挑战性的困难AI，提供高级玩家体验。AI能够通过4层深度的搜索树，预测未来多步的棋局变化，并做出最优决策。

### 1.3 范围
- **包含**:
  - 困难AI核心算法（Minimax + Alpha-Beta剪枝）
  - 局面评估函数（基于棋型评分）
  - 候选着法生成器（优化搜索空间）
  - Web Worker集成（复用现有架构）
  - AI测试套件（性能、准确性）
- **不包含**:
  - 大师AI（Week 6，深度6层）
  - 禁手规则（Week 6）
  - 置换表优化（可选，Week 6）

---

## 二、工作对象分解

### 2.1 困难AI核心（HardAI）

**对象**: 基于Minimax算法的AI对手

**难度**: 困难

**文件路径**: `src/game/ai/hard-ai.ts`

**数据结构设计**:
```typescript
// src/game/ai/hard-ai.ts
import type { Board, Position, Player } from '../types';
import { BoardEvaluator } from './board-evaluator';
import { MoveGenerator } from './move-generator';

export interface HardAIConfig {
  searchDepth: number;        // 搜索深度（默认4）
  timeLimit: number;          // 时间限制（毫秒，默认3000）
  enableAlphaBeta: boolean;   // 启用Alpha-Beta剪枝（默认true）
}

export class HardAI {
  private config: HardAIConfig;
  private evaluator: BoardEvaluator;
  private moveGenerator: MoveGenerator;
  private nodesSearched: number;  // 搜索节点数（性能统计）

  constructor(config?: Partial<HardAIConfig>) {
    this.config = {
      searchDepth: 4,
      timeLimit: 3000,
      enableAlphaBeta: true,
      ...config
    };
    this.evaluator = new BoardEvaluator();
    this.moveGenerator = new MoveGenerator();
    this.nodesSearched = 0;
  }

  /**
   * 计算AI下一步的落子位置
   * 策略：Minimax + Alpha-Beta剪枝
   */
  async calculateMove(
    board: Board,
    aiPlayer: Player
  ): Promise<Position>;

  /**
   * Minimax算法主入口
   * 返回最优位置及其得分
   */
  private minimax(
    board: Board,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    player: Player
  ): number;

  /**
   * 带Alpha-Beta剪枝的Minimax
   */
  private minimaxWithAlphaBeta(
    board: Board,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    player: Player
  ): number;

  /**
   * 获取搜索统计信息
   */
  getStats(): {
    nodesSearched: number;
    searchTime: number;
    pruningEfficiency: number;  // 剪枝效率（0-1）
  };
}
```

**核心算法流程**:
```
1. 生成候选着法
   - 获取已有棋子周围2格内的所有空位
   - 如果棋盘为空，返回中心位置（7,7）
   - 对候选着法进行初步排序（优化剪枝效果）

2. Minimax搜索（递归）
   - 深度=0 或 游戏结束：返回局面评估值
   - 遍历所有候选着法
   - 模拟落子，递归搜索下一层
   - 回溯，撤销落子
   - 应用Alpha-Beta剪枝

3. 选择最优着法
   - 最大层：选择得分最高的着法（AI进攻）
   - 最小层：选择得分最低的着法（玩家进攻）
```

**Alpha-Beta剪枝原理**:
```typescript
// Alpha: 当前玩家的最佳得分（下界）
// Beta: 对手的最佳得分（上界）
// 如果 Beta <= Alpha，说明此分支不会被选择，直接剪枝

// 示例：
// 第1层: alpha=-∞, beta=+∞
//   尝试着法A -> 得分100 -> alpha=100
//   尝试着法B -> 递归搜索
//     第2层: alpha=100, beta=+∞
//       玩家选择最优（最小），假设得分50
//       beta=50
//     第2层返回50
//     因为 beta(50) <= alpha(100)，停止搜索着法B的其他子节点
```

**性能要求**:
- 响应时间: <3秒（目标<2秒）
- 搜索深度: 4层
- 内存占用: <10MB
- 剪枝效率: >30%（即至少剪掉30%的节点）

---

### 2.2 局面评估函数（BoardEvaluator）

**对象**: 评估棋盘当前状态的价值

**文件路径**: `src/game/ai/board-evaluator.ts`

**数据结构设计**:
```typescript
// src/game/ai/board-evaluator.ts
import type { Board, Player } from '../types';
import { PatternDetector } from './pattern-detector';

// 棋型评分表（与Week 3一致）
export const PATTERN_SCORES = {
  FIVE: 100000,        // 连五（获胜）
  LIVE_FOUR: 10000,    // 活四（两端都空，必胜）
  DEAD_FOUR: 5000,     // 冲四（一端被堵）
  LIVE_THREE: 1000,    // 活三（两端都空）
  SLEEP_THREE: 100,    // 眠三（一端被堵）
  LIVE_TWO: 10,        // 活二
  SLEEP_TWO: 1,        // 眠二
  ONE: 0,              // 单子
};

export class BoardEvaluator {
  private patternDetector: PatternDetector;

  constructor() {
    this.patternDetector = new PatternDetector();
  }

  /**
   * 评估棋盘状态
   * 返回：AI的得分 - 玩家的得分（差值）
   * 正数：AI优势
   * 负数：玩家优势
   */
  evaluate(
    board: Board,
    aiPlayer: Player
  ): number;

  /**
   * 评估某个玩家的局势
   * 统计所有棋型，计算总分
   */
  private evaluatePlayer(
    board: Board,
    player: Player
  ): number;

  /**
   * 评估某个位置的价值
   * 考虑进攻和防守两个方面
   */
  evaluatePosition(
    board: Board,
    position: Position,
    player: Player
  ): number;

  /**
   * 快速评估（用于排序）
   * 只考虑直接威胁（活三、冲四、活四）
   */
  quickEvaluate(
    board: Board,
    position: Position,
    player: Player
  ): number;
}
```

**评估策略**:
```typescript
// 1. 全局评估（用于Minimax叶子节点）
evaluate(board, aiPlayer) {
  const aiScore = evaluatePlayer(board, aiPlayer);
  const playerScore = evaluatePlayer(board, opponent);
  return aiScore - playerScore;  // 相对优势
}

// 2. 位置评估（用于候选着法排序）
evaluatePosition(board, position, player) {
  // 假设在此落子，形成哪些棋型
  const attackScore = evaluateIfPlayHere(board, position, player);
  const defenseScore = evaluateIfPlayHere(board, position, opponent);
  return attackScore + defenseScore * 0.8;  // 进攻优先
}
```

**性能要求**:
- 单次评估: <1ms
- 内存占用: <1MB

---

### 2.3 候选着法生成器（MoveGenerator）

**对象**: 生成值得考虑的候选着法（优化搜索空间）

**文件路径**: `src/game/ai/move-generator.ts`

**数据结构设计**:
```typescript
// src/game/ai/move-generator.ts
import type { Board, Position } from '../types';
import { BoardEvaluator } from './board-evaluator';

export interface MoveWithScore {
  position: Position;
  score: number;
}

export class MoveGenerator {
  private evaluator: BoardEvaluator;
  private readonly SEARCH_RADIUS = 2;  // 搜索半径（格）

  constructor() {
    this.evaluator = new BoardEvaluator();
  }

  /**
   * 生成候选着法
   * 优化：只考虑已有棋子周围的位置
   */
  generateCandidates(board: Board): MoveWithScore[];

  /**
   * 获取所有已有棋子的邻居位置
   * 返回：去重后的空位列表
   */
  private getNeighborPositions(board: Board): Position[];

  /**
   * 对候选着法排序
   * 优化：先搜索高分着法，提高剪枝效率
   */
  private sortMoves(
    moves: Position[],
    board: Board
  ): MoveWithScore[];

  /**
   * 检查位置是否在已有棋子周围
   */
  private isNearExistingPiece(
    board: Board,
    position: Position
  ): boolean;

  /**
   * 特殊情况：空棋盘返回中心位置
   */
  private getOpeningMove(): Position {
    return { row: 7, col: 7 };  // 15x15棋盘的中心
  }
}
```

**优化策略**:
1. **空间优化**:
   - 不搜索全部225个位置
   - 只考虑已有棋子周围2格内的位置
   - 空棋盘直接返回中心位置

2. **排序优化**:
   - 使用快速评估对候选着法排序
   - 先搜索高分着法（更有可能是最优解）
   - 提高Alpha-Beta剪枝效率

3. **动态调整**:
   - 早期阶段（棋子<10）：扩大搜索半径到3格
   - 中期阶段（棋子10-50）：保持2格
   - 后期阶段（棋子>50）：缩小到1格

**性能要求**:
- 候选着法数量: <50个（大部分情况）
- 生成时间: <10ms
- 内存占用: <1MB

---

### 2.4 Web Worker集成（AIWorker扩展）

**对象**: 在Worker线程中运行困难AI计算

**文件路径**: `src/game/ai/ai.worker.ts`（扩展现有文件）

**数据结构设计**:
```typescript
// src/game/ai/ai.worker.ts - 扩展
import { expose } from 'comlink';
import { SimpleAI } from './simple-ai';
import { MediumAI } from './medium-ai';
import { HardAI } from './hard-ai';  // 新增
import type { Board, Position, Difficulty } from '../types';

export class AIWorker {
  private simpleAI: SimpleAI;
  private mediumAI: MediumAI;
  private hardAI: HardAI;  // 新增

  constructor() {
    this.simpleAI = new SimpleAI();
    this.mediumAI = new MediumAI();
    this.hardAI = new HardAI();  // 新增
  }

  /**
   * 在Worker线程中计算AI移动
   * 扩展：支持'hard'难度
   */
  async calculateMove(
    board: Board,
    difficulty: Difficulty,
    aiPlayer: 'black' | 'white'
  ): Promise<Position> {
    switch (difficulty) {
      case 'easy':
        return this.simpleAI.calculateMove(board, aiPlayer);
      case 'medium':
        return this.mediumAI.calculateMove(board, aiPlayer);
      case 'hard':
        return this.hardAI.calculateMove(board, aiPlayer);
      case 'master':
        // Week 6实现
        throw new Error('Master AI not implemented yet');
    }
  }

  /**
   * 获取AI统计信息（用于调试和性能分析）
   */
  getStats(difficulty: Difficulty) {
    switch (difficulty) {
      case 'hard':
        return this.hardAI.getStats();
      default:
        return null;
    }
  }
}

// 暴露Worker接口
expose(new AIWorker());
```

**超时保护**:
```typescript
// src/game/ai/ai-client.ts - 扩展
export class AIClient {
  /**
   * 调用AI计算移动（带超时）
   */
  async calculateMove(
    board: Board,
    difficulty: Difficulty,
    aiPlayer: 'black' | 'white'
  ): Promise<Position> {
    const TIMEOUT = 3000;  // 3秒超时

    const result = await Promise.race([
      this.worker.calculateMove(board, difficulty, aiPlayer),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI timeout')), TIMEOUT)
      )
    ]);

    return result;
  }
}
```

---

### 2.5 AI测试套件

**对象**: 验证困难AI的正确性和性能

**文件路径**: `src/game/ai/__tests__/hard-ai.test.ts`

**测试类型**:
```typescript
// src/game/ai/__tests__/hard-ai.test.ts
import { HardAI } from '../hard-ai';
import { GameEngine } from '../../core/game-engine';
import type { Board, Position } from '../../types';

describe('HardAI', () => {
  let ai: HardAI;
  let engine: GameEngine;

  beforeEach(() => {
    ai = new HardAI({ searchDepth: 4 });
    engine = new GameEngine();
  });

  // 1. 功能测试
  describe('功能正确性', () => {
    it('应该返回有效的落子位置', async () => {
      const board = engine.createEmptyBoard();
      const position = await ai.calculateMove(board, 'black');

      expect(position.row).toBeGreaterThanOrEqual(0);
      expect(position.row).toBeLessThan(15);
      expect(position.col).toBeGreaterThanOrEqual(0);
      expect(position.col).toBeLessThan(15);
    });

    it('空棋盘应该占据中心位置', async () => {
      const board = engine.createEmptyBoard();
      const position = await ai.calculateMove(board, 'black');

      // 中心位置（7,7）或其附近
      expect(Math.abs(position.row - 7)).toBeLessThanOrEqual(2);
      expect(Math.abs(position.col - 7)).toBeLessThanOrEqual(2);
    });

    it('应该识别直接威胁（活四）', async () => {
      const board = engine.createEmptyBoard();
      // 模拟：玩家有活四
      board[7][5] = 'white';
      board[7][6] = 'white';
      board[7][7] = 'white';
      board[7][8] = 'white';

      const position = await ai.calculateMove(board, 'black');
      // 应该堵截（7,4）或（7,9）
      expect(
        (position.row === 7 && position.col === 4) ||
        (position.row === 7 && position.col === 9)
      ).toBe(true);
    });

    it('应该识别获胜机会（连五）', async () => {
      const board = engine.createEmptyBoard();
      // 模拟：AI有冲四，可以连五
      board[7][5] = 'black';
      board[7][6] = 'black';
      board[7][7] = 'black';
      board[7][8] = 'black';

      const position = await ai.calculateMove(board, 'black');
      // 应该选择（7,4）或（7,9）获胜
      expect(
        (position.row === 7 && position.col === 4) ||
        (position.row === 7 && position.col === 9)
      ).toBe(true);
    });
  });

  // 2. 性能测试
  describe('性能要求', () => {
    it('响应时间应该<3秒', async () => {
      const board = engine.createEmptyBoard();
      // 模拟50步后的棋盘
      for (let i = 0; i < 50; i++) {
        const row = Math.floor(Math.random() * 15);
        const col = Math.floor(Math.random() * 15);
        board[row][col] = i % 2 === 0 ? 'black' : 'white';
      }

      const startTime = Date.now();
      await ai.calculateMove(board, 'black');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(3000);
    });

    it('剪枝效率应该>30%', async () => {
      const board = engine.createEmptyBoard();
      await ai.calculateMove(board, 'black');

      const stats = ai.getStats();
      const efficiency = stats.pruningEfficiency;

      expect(efficiency).toBeGreaterThan(0.3);
    });

    it('候选着法数量应该<50个', async () => {
      const board = engine.createEmptyBoard();
      // 模拟30步后的棋盘
      for (let i = 0; i < 30; i++) {
        const row = Math.floor(Math.random() * 15);
        const col = Math.floor(Math.random() * 15);
        board[row][col] = i % 2 === 0 ? 'black' : 'white';
      }

      // 测试MoveGenerator
      const generator = new MoveGenerator();
      const candidates = generator.generateCandidates(board);

      expect(candidates.length).toBeLessThan(50);
    });
  });

  // 3. 算法正确性测试
  describe('Minimax算法', () => {
    it('应该选择最优着法', async () => {
      const board = engine.createEmptyBoard();
      // 构造一个明确的测试场景
      board[7][6] = 'black';
      board[7][7] = 'black';
      board[7][8] = 'black';

      const position = await ai.calculateMove(board, 'black');
      // 应该形成活四
      expect(
        (position.row === 7 && position.col === 5) ||
        (position.row === 7 && position.col === 9)
      ).toBe(true);
    });

    it('Alpha-Beta剪枝应该正确工作', async () => {
      // 测试剪枝是否提高了效率
      const board = engine.createEmptyBoard();

      // 不使用剪枝
      const aiWithoutPruning = new HardAI({
        searchDepth: 4,
        enableAlphaBeta: false
      });
      const start1 = Date.now();
      await aiWithoutPruning.calculateMove(board, 'black');
      const time1 = Date.now() - start1;

      // 使用剪枝
      const aiWithPruning = new HardAI({
        searchDepth: 4,
        enableAlphaBeta: true
      });
      const start2 = Date.now();
      await aiWithPruning.calculateMove(board, 'black');
      const time2 = Date.now() - start2;

      // 剪枝应该更快
      expect(time2).toBeLessThan(time1);
    });
  });

  // 4. 棋力测试
  describe('棋力评估', () => {
    it('应该战胜简单AI', async () => {
      // 自动对局测试：HardAI vs SimpleAI
      const engine = new GameEngine();
      const hardAI = new HardAI();
      const simpleAI = new SimpleAI();

      let board = engine.createEmptyBoard();
      let currentPlayer = 'black';

      for (let i = 0; i < 100; i++) {
        const position =
          currentPlayer === 'black'
            ? await hardAI.calculateMove(board, 'black')
            : await simpleAI.calculateMove(board, 'white');

        board[position.row][position.col] = currentPlayer;

        const winner = engine.checkWinner(board, position);
        if (winner) {
          expect(winner).toBe('black');  // HardAI应该获胜
          return;
        }

        currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
      }

      // 如果100步还没结束，至少不应该输
      const score = new BoardEvaluator().evaluate(board, 'black');
      expect(score).toBeGreaterThan(0);
    });

    it('应该战胜中等AI', async () => {
      // 类似的测试
      // ...
    });
  });
});
```

**性能基准测试**:
```typescript
// src/game/ai/__tests__/hard-ai.bench.ts
import { HardAI } from '../hard-ai';
import { benchmark } from '../benchmark';

describe('HardAI性能基准', () => {
  it('空棋盘性能基准', async () => {
    const ai = new HardAI();
    const board = createEmptyBoard();

    const result = await benchmark(async () => {
      return ai.calculateMove(board, 'black');
    }, {
      iterations: 10,
      warmup: 2
    });

    console.log('空棋盘性能:', {
      mean: result.mean + 'ms',
      min: result.min + 'ms',
      max: result.max + 'ms',
      ops: result.ops + ' ops/s'
    });

    expect(result.mean).toBeLessThan(1000);  // 平均<1秒
  });

  it('中期棋盘性能基准', async () => {
    const ai = new HardAI();
    const board = createMidGameBoard();  // 30步

    const result = await benchmark(async () => {
      return ai.calculateMove(board, 'black');
    }, {
      iterations: 5,
      warmup: 1
    });

    console.log('中期棋盘性能:', {
      mean: result.mean + 'ms',
      min: result.min + 'ms',
      max: result.max + 'ms'
    });

    expect(result.mean).toBeLessThan(3000);  // 平均<3秒
  });
});
```

---

## 三、接口定义

### 3.1 类型定义

```typescript
// src/types/ai.ts - 扩展类型
export type Difficulty = 'easy' | 'medium' | 'hard' | 'master';

export interface HardAIConfig {
  searchDepth: number;
  timeLimit: number;
  enableAlphaBeta: boolean;
}

export interface AIStats {
  nodesSearched: number;      // 搜索节点数
  searchTime: number;          // 搜索时间（毫秒）
  pruningEfficiency: number;   // 剪枝效率（0-1）
  branchingFactor: number;     // 平均分支因子
}

export interface MoveWithScore {
  position: Position;
  score: number;
}
```

### 3.2 Store接口（扩展）

```typescript
// src/store/game-store.ts - 扩展接口
export interface GameStore {
  // Week 5新增：AI统计信息
  aiStats: AIStats | null;

  // Week 5新增：获取AI统计
  getAIStats: () => AIStats | null;
}
```

---

## 四、技术规范

### 4.1 Minimax算法规范

**基本原理**:
- 构建搜索树，每个节点代表一个棋盘状态
- 奇数层（AI回合）：选择最大得分（Max层）
- 偶数层（玩家回合）：选择最小得分（Min层）
- 叶子节点：使用评估函数计算局面得分

**伪代码**:
```
function minimax(board, depth, alpha, beta, isMaximizing):
  if depth == 0 or game_over(board):
    return evaluate(board)

  moves = generate_candidates(board)

  if isMaximizing:
    max_eval = -infinity
    for move in moves:
      eval = minimax(make_move(board, move), depth-1, alpha, beta, false)
      max_eval = max(max_eval, eval)
      alpha = max(alpha, eval)
      if beta <= alpha:
        break  // Beta剪枝
    return max_eval
  else:
    min_eval = +infinity
    for move in moves:
      eval = minimax(make_move(board, move), depth-1, alpha, beta, true)
      min_eval = min(min_eval, eval)
      beta = min(beta, eval)
      if beta <= alpha:
        break  // Alpha剪枝
    return min_eval
```

**搜索深度**:
- 困难AI：4层（约50^4 = 625万节点，优化后约10万节点）
- 大师AI：6层（Week 6）

### 4.2 Alpha-Beta剪枝规范

**剪枝条件**:
- **Alpha剪枝**：在Max层，如果当前节点的beta值 <= alpha值，停止搜索
- **Beta剪枝**：在Min层，如果当前节点的alpha值 >= beta值，停止搜索

**优化技巧**:
1. **着法排序**：先搜索高分着法，提高剪枝效率
2. **迭代加深**：从深度1开始，逐步增加到目标深度
3. **空窗口搜索**：先用窄窗口搜索，确认是否需要重新搜索

### 4.3 评估函数规范

**评分规则**:
```typescript
const PATTERN_SCORES = {
  FIVE: 100000,        // 连五（游戏结束）
  LIVE_FOUR: 10000,    // 活四（必胜）
  DEAD_FOUR: 5000,     // 冲四
  LIVE_THREE: 1000,    // 活三
  SLEEP_THREE: 100,    // 眠三
  LIVE_TWO: 10,        // 活二
  SLEEP_TWO: 1,        // 眠二
  ONE: 0,              // 单子
};
```

**评估策略**:
1. 全局评估 = AI得分 - 玩家得分
2. 位置评估 = 进攻得分 + 防守得分 * 0.8
3. 快速评估只考虑高威胁棋型（活三、冲四、活四）

### 4.4 性能优化规范

**候选着法生成**:
- 只考虑已有棋子周围2格内的位置
- 空棋盘直接返回中心位置
- 使用快速评估对候选着法排序

**内存优化**:
- 避免频繁创建棋盘副本
- 使用原地修改 + 回溯
- 重用评估函数实例

**计算优化**:
- 使用位运算优化（可选）
- 缓存棋型检测结果（可选，Week 6）
- 使用Web Worker避免阻塞UI

---

## 五、依赖关系

### 5.1 外部依赖
```json
{
  "comlink": "^6.0.0"  // Web Worker通信库（已有）
}
```

### 5.2 内部依赖
- **依赖Week 2**:
  - `Board` - 棋盘数据结构
  - `GameEngine` - 游戏引擎
  - `GameRules` - 胜负判断规则
- **依赖Week 3**:
  - `SimpleAI` - 简单AI（用于对比测试）
  - `MediumAI` - 中等AI（用于对比测试）
  - `AIWorker` - Web Worker架构
  - `AIClient` - AI客户端
  - `GameFlowController` - 游戏流程控制
- **依赖Week 1**:
  - `game-store` - 状态管理
  - `GamePage` - 游戏页面

### 5.3 文件结构
```
src/
├── game/
│   ├── ai/
│   │   ├── hard-ai.ts              # Week 5新增：困难AI
│   │   ├── board-evaluator.ts      # Week 5新增：局面评估
│   │   ├── move-generator.ts       # Week 5新增：候选着法生成
│   │   ├── pattern-detector.ts     # Week 5新增：棋型检测（从MediumAI提取）
│   │   ├── simple-ai.ts            # Week 3已实现
│   │   ├── medium-ai.ts            # Week 3已实现
│   │   ├── ai.worker.ts            # Week 3已实现（扩展）
│   │   ├── ai-client.ts            # Week 3已实现（扩展）
│   │   └── __tests__/              # Week 5新增测试
│   │       ├── hard-ai.test.ts
│   │       ├── board-evaluator.test.ts
│   │       ├── move-generator.test.ts
│   │       └── hard-ai.bench.ts
│   │
│   └── core/
│       ├── game-engine.ts          # Week 2已实现
│       ├── game-rules.ts           # Week 2已实现
│       └── game-flow.ts            # Week 3已实现（无需修改）
│
├── store/
│   └── game-store.ts               # 扩展：AI统计信息
│
├── types/
│   ├── game.ts                     # 扩展：AI类型
│   └── ai.ts                       # Week 5新增：AI类型定义
│
└── pages/
    └── GamePage.tsx                # 扩展：显示AI统计（可选）
```

---

## 六、验收标准

### 6.1 功能验收
- [ ] 困难AI正常工作，能够完成对局
- [ ] AI能够识别并堵截玩家的活三、冲四
- [ ] AI能够识别并利用自己的进攻机会
- [ ] AI在空棋盘时占据中心位置
- [ ] AI响应时间<3秒（大部分情况<2秒）
- [ ] PVE模式可以选择困难难度
- [ ] AI思考时UI有明确提示

### 6.2 性能验收
- [ ] 空棋盘响应时间<1秒
- [ ] 中期棋盘（30-50步）响应时间<3秒
- [ ] AI计算不阻塞UI主线程
- [ ] 剪枝效率>30%
- [ ] 内存占用<10MB
- [ ] 候选着法数量<50个

### 6.3 棋力验收
- [ ] 困难AI能够战胜简单AI（胜率>90%）
- [ ] 困难AI能够战胜中等AI（胜率>70%）
- [ ] 困难AI对中级玩家胜率30-40%
- [ ] AI能够识别基本战术（堵截、进攻）

### 6.4 质量验收
- [ ] 所有新测试通过（目标40+个测试）
- [ ] Week 1-4的测试全部通过（150+个）
- [ ] 测试覆盖率>80%
- [ ] 代码通过ESLint检查
- [ ] TypeScript无类型错误
- [ ] 性能基准测试通过

### 6.5 兼容性验收
- [ ] Chrome浏览器正常运行
- [ ] Firefox浏览器正常运行
- [ ] Safari浏览器正常运行
- [ ] 移动端浏览器正常运行

---

## 七、风险与注意事项

### 7.1 技术风险

1. **算法复杂度**
   - 风险：4层搜索可能导致性能问题
   - 缓解：
     - 优化候选着法生成（只考虑周围2格）
     - 使用Alpha-Beta剪枝
     - 对候选着法排序（提高剪枝效率）
     - 必要时降低搜索深度到3层

2. **评估函数准确性**
   - 风险：评估函数不准确导致AI做出错误决策
   - 缓解：
     - 复用Week 3已验证的棋型评分
     - 通过大量测试调整评分权重
     - 与中等AI对比验证

3. **Web Worker通信**
   - 风险：大量数据传输导致性能开销
   - 缓解：
     - 只传输必要数据（棋盘、配置）
     - 使用Transferable Objects（可选）
     - 复用现有Worker架构

### 7.2 开发风险

1. **测试复杂度**
   - 风险：AI算法难以测试，不确定性高
   - 缓解：
     - 使用固定棋盘状态测试
     - 测试特定棋型识别
     - 对战测试（vs SimpleAI/MediumAI）
     - 性能基准测试

2. **调试困难**
   - 风险：Minimax递归调用难以调试
   - 缓解：
     - 添加详细日志（搜索节点数、剪枝次数）
     - 提供统计信息接口
     - 使用可视化工具（可选）

3. **时间压力**
   - 风险：Week 5时间有限，可能完不成
   - 缓解：
     - 优先实现核心功能（Minimax + 基础剪枝）
     - 可选功能留到Week 6（置换表、迭代加深）
     - 必要时降低搜索深度

### 7.3 注意事项

- **性能优先**：如果性能和准确性冲突，优先保证性能（响应时间<3秒）
- **渐进优化**：先实现基本Minimax，再添加Alpha-Beta剪枝，最后优化细节
- **复用现有代码**：评估函数、棋型检测复用Week 3代码
- **测试驱动**：先写测试，再实现功能
- **文档完善**：添加详细注释，说明算法原理
- **性能监控**：添加统计信息，便于后续优化

---

## 八、开发计划

### 8.1 Day 1-2：核心算法实现
- [ ] 实现`HardAI`类的基本结构
- [ ] 实现Minimax算法（不带剪枝）
- [ ] 实现基础评估函数
- [ ] 编写基本功能测试

### 8.2 Day 3：Alpha-Beta剪枝
- [ ] 实现Alpha-Beta剪枝
- [ ] 实现候选着法排序
- [ ] 测试剪枝效率
- [ ] 性能测试和优化

### 8.3 Day 4：评估函数和候选着法生成
- [ ] 完善`BoardEvaluator`类
- [ ] 实现`MoveGenerator`类
- [ ] 优化评估函数性能
- [ ] 测试评估函数准确性

### 8.4 Day 5：Web Worker集成和测试
- [ ] 扩展`AIWorker`支持困难AI
- [ ] 集成到游戏流程
- [ ] 编写完整测试套件
- [ ] 性能基准测试
- [ ] 对战测试（vs SimpleAI/MediumAI）

### 8.5 Day 6-7：优化和文档
- [ ] 性能优化（根据测试结果）
- [ ] 代码审查和重构
- [ ] 完善文档和注释
- [ ] 验收测试

---

## 九、参考资料

### 9.1 技术文档
- [Minimax算法详解](https://en.wikipedia.org/wiki/Minimax)
- [Alpha-Beta剪枝](https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning)
- [五子棋AI实现](https://www.gomokuworld.com/gomoku/strategy)
- [游戏AI编程](https://www.amazon.com/Programming-Game-AI-Example-Diabetes/dp/1537100577)

### 9.2 内部文档
- `ARCHITECTURE.md` - AI算法设计章节（困难/大师难度）
- `week-3-WO.md` - Week 3工作对象（简单AI、中等AI）
- `week-3-PL.md` - Week 3产品逻辑
- `PROJECT_STATUS.md` - 项目当前状态

### 9.3 代码参考
- `src/game/ai/medium-ai.ts` - 中等AI实现（评估函数参考）
- `src/game/ai/ai.worker.ts` - Web Worker架构
- `src/game/core/game-engine.ts` - 游戏引擎

---

**文档结束**

**下一步**: 产品经理编写Week 5 PL文档（产品逻辑规范）
