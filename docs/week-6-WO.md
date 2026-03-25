# Week 6 - WO文档（工作对象定义）

## 文档信息
- **文档版本**: v1.0
- **创建日期**: 2026-03-25
- **负责人**: 产品经理
- **阶段**: Phase 2 - 高级AI系统
- **周次**: Week 6
- **关联文档**: week-6-PL.md

---

## 一、工作对象概述

### 1.1 定义
本周的工作对象是**大师AI系统（Master AI）**，基于困难AI（HardAI）扩展，实现深度搜索、置换表优化、迭代加深等高级特性的顶级AI对手。

### 1.2 目标
实现具有大师级水平的AI，提供极具挑战性的游戏体验。AI能够通过6层深度的搜索树，预测未来更多步的棋局变化，并使用置换表、迭代加深等优化技术，在保证性能的同时提升棋力。

### 1.3 范围
- **包含**:
  - 大师AI核心算法（扩展HardAI，深度6层）
  - 置换表（Transposition Table）缓存优化
  - 迭代加深搜索（Iterative Deepening）
  - 禁手规则识别（三三、四四、长连）
  - 评估函数进一步优化
  - Web Worker集成（复用现有架构）
  - AI测试套件（性能、准确性、棋力）
- **不包含**:
  - 蒙特卡洛树搜索（MCTS，未来优化方向）
  - 机器学习模型训练（未来版本）
  - 云端AI计算（未来版本）

---

## 二、工作对象分解

### 2.1 大师AI核心（MasterAI）

**对象**: 基于HardAI扩展的大师级AI对手

**难度**: 大师

**文件路径**: `src/game/ai/master-ai.ts`

**数据结构设计**:
```typescript
// src/game/ai/master-ai.ts
import type { Board, Position, Player } from '../types';
import { HardAI } from './hard-ai';
import { TranspositionTable } from './transposition-table';
import { BoardEvaluator } from './board-evaluator';
import { MoveGenerator } from './move-generator';
import { ForbiddenDetector } from './forbidden-detector';

export interface MasterAIConfig {
  searchDepth: number;           // 搜索深度（默认6）
  timeLimit: number;             // 时间限制（毫秒，默认10000）
  enableTranspositionTable: boolean;  // 启用置换表（默认true）
  enableIterativeDeepening: boolean; // 启用迭代加深（默认true）
  enableForbiddenRules: boolean;      // 启用禁手规则（默认true）
  tableSize: number;             // 置换表大小（默认100000条目）
}

export interface SearchStatistics {
  nodesSearched: number;         // 搜索节点数
  searchTime: number;            // 搜索时间（毫秒）
  pruningEfficiency: number;     // 剪枝效率（0-1）
  tableHitRate: number;          // 置换表命中率（0-1）
  bestMoveFoundAtDepth: number;  // 找到最优着法的深度
  branchingFactor: number;       // 平均分支因子
}

export class MasterAI extends HardAI {
  private config: MasterAIConfig;
  private transpositionTable: TranspositionTable;
  private forbiddenDetector: ForbiddenDetector;
  private searchStats: SearchStatistics;

  constructor(config?: Partial<MasterAIConfig>) {
    // 先初始化HardAI的部分
    super({
      searchDepth: 4,  // MasterAI会覆盖这个值
      timeLimit: 10000,
      enableAlphaBeta: true
    });

    this.config = {
      searchDepth: 6,
      timeLimit: 10000,
      enableTranspositionTable: true,
      enableIterativeDeepening: true,
      enableForbiddenRules: true,
      tableSize: 100000,
      ...config
    };

    this.transpositionTable = new TranspositionTable(this.config.tableSize);
    this.forbiddenDetector = new ForbiddenDetector();
    this.searchStats = this.initializeStats();
  }

  /**
   * 计算AI下一步的落子位置
   * 策略：Minimax + Alpha-Beta剪枝 + 置换表 + 迭代加深
   */
  async calculateMove(
    board: Board,
    aiPlayer: Player
  ): Promise<Position>;

  /**
   * 迭代加深搜索
   * 从深度1逐步增加到目标深度，改善超时情况
   */
  private iterativeDeepening(
    board: Board,
    maxDepth: number,
    aiPlayer: Player
  ): { position: Position; depth: number };

  /**
   * 带置换表的Minimax搜索
   * 重写HardAI的minimax方法，添加置换表查询
   */
  private minimaxWithTranspositionTable(
    board: Board,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    player: Player
  ): number;

  /**
   * 生成棋盘状态的哈希值（用于置换表）
   */
  private generateBoardHash(board: Board): number;

  /**
   * 检查位置是否为禁手（用于黑棋）
   */
  private isForbiddenMove(
    board: Board,
    position: Position,
    player: Player
  ): boolean;

  /**
   * 获取详细搜索统计信息
   */
  getDetailedStats(): SearchStatistics;

  /**
   * 清空置换表（用于新游戏）
   */
  clearTable(): void;
}
```

**核心算法流程**:
```
1. 迭代加深搜索（可选）
   - 从深度1开始搜索
   - 逐步增加到深度2、3、...、6
   - 每次搜索的结果用于指导下一次搜索的着法排序
   - 超时时返回当前深度的最优着法

2. 置换表优化
   - 每次评估棋盘状态前，先查询置换表
   - 如果命中，直接返回缓存的评估值
   - 如果未命中，执行完整评估，并存入置换表
   - 使用Zobrist哈希生成棋盘状态的唯一标识

3. Minimax搜索（扩展HardAI）
   - 深度=6 或 游戏结束：返回局面评估值
   - 遍历所有候选着法（排除禁手）
   - 查询置换表，避免重复计算
   - 模拟落子，递归搜索下一层
   - 回溯，撤销落子
   - 应用Alpha-Beta剪枝
   - 将结果存入置换表

4. 禁手规则识别（仅对黑棋）
   - 三三禁手：同时形成两个活三
   - 四四禁手：同时形成两个冲四
   - 长连禁手：形成六个或以上的连子
   - 禁手位置不作为候选着法
```

**置换表结构设计**:
```typescript
// src/game/ai/transposition-table.ts
export interface TranspositionEntry {
  hash: number;              // 棋盘状态哈希值
  depth: number;             // 搜索深度
  score: number;             // 评估分数
  flag: 'exact' | 'alpha' | 'beta';  // 边界标志
  bestMove: Position | null; // 最优着法
  age: number;               // 年龄（用于替换策略）
}

export class TranspositionTable {
  private table: Map<number, TranspositionEntry>;
  private maxSize: number;
  private hits: number;
  private misses: number;

  constructor(size: number) {
    this.table = new Map();
    this.maxSize = size;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * 查询置换表
   * 返回：缓存的评估值，或null（未命中）
   */
  lookup(hash: number, depth: number): TranspositionEntry | null;

  /**
   * 存储评估结果到置换表
   */
  store(entry: TranspositionEntry): void;

  /**
   * 清空置换表
   */
  clear(): void;

  /**
   * 获取统计信息
   */
  getStats(): {
    size: number;
    hitRate: number;
    hits: number;
    misses: number;
  };

  /**
   * 替换策略：当表满时，优先替换最旧的条目
   */
  private replaceEntry(entry: TranspositionEntry): void;
}
```

**Zobrist哈希生成**:
```typescript
// src/game/ai/zobrist.ts
export class ZobristHash {
  private pieces: number[][][];  // pieces[row][col][player]
  private readonly RANDOM_SEED = 123456789;

  constructor() {
    this.pieces = this.generateRandomTable();
  }

  /**
   * 生成棋盘的Zobrist哈希值
   */
  hash(board: Board): number {
    let hash = 0;
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 15; col++) {
        const piece = board[row][col];
        if (piece) {
          hash ^= this.pieces[row][col][piece === 'black' ? 0 : 1];
        }
      }
    }
    return hash;
  }

  /**
   * 增量更新哈希值（落子）
   */
  updateHash(hash: number, position: Position, player: Player): number {
    const playerIndex = player === 'black' ? 0 : 1;
    return hash ^ this.pieces[position.row][position.col][playerIndex];
  }

  /**
   * 生成随机哈希表
   */
  private generateRandomTable(): number[][][] {
    // 使用线性同余生成器生成伪随机数
    const table: number[][][] = [];
    for (let row = 0; row < 15; row++) {
      table[row] = [];
      for (let col = 0; col < 15; col++) {
        table[row][col] = [
          this.random(),  // black
          this.random()   // white
        ];
      }
    }
    return table;
  }

  private random(): number {
    // 简单的伪随机数生成器
    return Math.floor(Math.random() * 0xFFFFFFFF);
  }
}
```

**性能要求**:
- 响应时间: <10秒（目标<8秒）
- 搜索深度: 6层（迭代加深）
- 内存占用: <50MB（置换表）
- 剪枝效率: >40%
- 置换表命中率: >30%

---

### 2.2 禁手规则检测器（ForbiddenDetector）

**对象**: 检测黑棋的禁手位置（三三、四四、长连）

**文件路径**: `src/game/ai/forbidden-detector.ts`

**数据结构设计**:
```typescript
// src/game/ai/forbidden-detector.ts
import type { Board, Position } from '../types';

export enum ForbiddenType {
  THREE_THREE = 'three_three',    // 三三禁手
  FOUR_FOUR = 'four_four',        // 四四禁手
  OVERLINE = 'overline'           // 长连禁手（6个或以上）
}

export interface ForbiddenMove {
  position: Position;
  type: ForbiddenType;
  patterns: Position[][];  // 形成禁手的棋型列表
}

export class ForbiddenDetector {
  /**
   * 检查位置是否为禁手（仅对黑棋有效）
   * 返回：禁手类型，或null（非禁手）
   */
  checkForbidden(
    board: Board,
    position: Position
  ): ForbiddenType | null;

  /**
   * 检测三三禁手
   * 定义：同时形成两个活三
   */
  private checkThreeThree(
    board: Board,
    position: Position
  ): boolean;

  /**
   * 检测四四禁手
   * 定义：同时形成两个冲四
   */
  private checkFourFour(
    board: Board,
    position: Position
  ): boolean;

  /**
   * 检测长连禁手
   * 定义：形成六个或以上的连子
   */
  private checkOverline(
    board: Board,
    position: Position
  ): boolean;

  /**
   * 获取指定位置形成的所有棋型
   * 返回：四个方向（横、竖、主对角、副对角）的棋型列表
   */
  private getPatternsAt(
    board: Board,
    position: Position
  ): Pattern[];

  /**
   * 判断是否为活三
   * 活三：两端都空的三个连子
   */
  private isLiveThree(
    board: Board,
    position: Position,
    direction: [number, number]
  ): boolean;

  /**
   * 判断是否为冲四
   * 冲四：一端被堵的四个连子，或跳四
   */
  private isDeadFour(
    board: Board,
    position: Position,
    direction: [number, number]
  ): boolean;

  /**
   * 统计某个方向的连子数量
   */
  private countConsecutive(
    board: Board,
    position: Position,
    direction: [number, number]
  ): number;
}
```

**禁手规则详解**:
```typescript
// 1. 三三禁手（双三）
// 定义：一子落下，同时形成两个活三
// 活三：两端都空的三个连子
// 示例：
//   . . . . . . .
//   . . X X . . .  <- 第一个活三
//   . . . X . . .
//   . . . . . . .
//   . . X . X . .  <- 第二个活三
//   . . . . . . .

// 2. 四四禁手（双四）
// 定义：一子落下，同时形成两个冲四
// 冲四：一端被堵的四个连子，或跳四
// 示例：
//   . . . . . . .
//   O X X X . . .  <- 第一个冲四（被O堵住）
//   . . . X . . .
//   . . . . . . .
//   . X X . X . .  <- 第二个冲四（跳四）
//   . . . . . . .

// 3. 长连禁手
// 定义：形成六个或以上的连子
// 示例：
//   . . . . . . .
//   . . X X X X X X .  <- 6个连子，禁手
//   . . . . . . .
```

**检测算法**:
```typescript
// 伪代码
function checkForbidden(board, position):
  // 只检查黑棋
  if board[position] != BLACK:
    return null

  // 1. 检查长连
  if checkOverline(board, position):
    return OVERLINE

  // 2. 检查三三
  liveThreeCount = 0
  for direction in FOUR_DIRECTIONS:
    if isLiveThree(board, position, direction):
      liveThreeCount++
  if liveThreeCount >= 2:
    return THREE_THREE

  // 3. 检查四四
  deadFourCount = 0
  for direction in FOUR_DIRECTIONS:
    if isDeadFour(board, position, direction):
      deadFourCount++
  if deadFourCount >= 2:
    return FOUR_FOUR

  return null
```

**性能要求**:
- 单次检测: <5ms
- 内存占用: <1MB
- 准确率: 100%（禁手判断不能出错）

---

### 2.3 评估函数优化（EnhancedBoardEvaluator）

**对象**: 扩展Week 5的评估函数，更精确的局面评估

**文件路径**: `src/game/ai/enhanced-board-evaluator.ts`

**数据结构设计**:
```typescript
// src/game/ai/enhanced-board-evaluator.ts
import { BoardEvaluator } from './board-evaluator';
import type { Board, Player } from '../types';

// 扩展的棋型评分表
export const ENHANCED_PATTERN_SCORES = {
  FIVE: 1000000,        // 连五（获胜，提高优先级）
  LIVE_FOUR: 100000,    // 活四（两端都空，必胜）
  DEAD_FOUR: 50000,     // 冲四（一端被堵）
  LIVE_THREE: 10000,    // 活三（两端都空）
  SLEEP_THREE: 1000,    // 眠三（一端被堵）
  LIVE_TWO: 100,        // 活二
  SLEEP_TWO: 10,        // 眠二
  ONE: 0,               // 单子
};

export class EnhancedBoardEvaluator extends BoardEvaluator {
  /**
   * 增强的局面评估
   * 考虑更多因素：棋型组合、位置价值、进攻潜力
   */
  evaluate(board: Board, aiPlayer: Player): number;

  /**
   * 评估棋型组合
   * 考虑多个棋型的协同效应
   */
  private evaluatePatternCombinations(
    board: Board,
    player: Player
  ): number;

  /**
   * 评估位置价值
   * 中心位置更有价值
   */
  private evaluatePositionValue(
    board: Board,
    player: Player
  ): number;

  /**
   * 评估进攻潜力
   * 考虑未来可以形成的棋型
   */
  private evaluateAttackPotential(
    board: Board,
    player: Player
  ): number;

  /**
   * 评估防守价值
   * 考虑堵截对手的重要性
   */
  private evaluateDefenseValue(
    board: Board,
    player: Player,
    opponent: Player
  ): number;

  /**
   * 动态调整评分权重
   * 根据游戏阶段调整策略
   */
  private adjustWeights(gamePhase: 'opening' | 'midgame' | 'endgame'): void;
}
```

**评估策略优化**:
```typescript
// 1. 棋型组合评估
evaluatePatternCombinations(board, player) {
  let score = 0;

  // 检测是否有多个棋型共享关键位置
  // 例如：一个位置可以形成活三和冲四
  const patterns = detectAllPatterns(board, player);

  // 计算棋型之间的协同效应
  for (let i = 0; i < patterns.length; i++) {
    for (let j = i + 1; j < patterns.length; j++) {
      if (hasIntersection(patterns[i], patterns[j])) {
        // 有交集的棋型价值更高
        score += patterns[i].score * patterns[j].score * 0.1;
      }
    }
  }

  return score;
}

// 2. 位置价值评估
evaluatePositionValue(board, player) {
  let score = 0;

  for (const piece of getPieces(board, player)) {
    // 中心位置加分
    const centerDistance = distanceToCenter(piece);
    score += (7 - centerDistance) * 10;

    // 边缘位置减分
    if (isOnEdge(piece)) {
      score -= 50;
    }
  }

  return score;
}

// 3. 动态权重调整
adjustWeights(gamePhase) {
  switch (gamePhase) {
    case 'opening':
      // 开局：重视位置价值和灵活性
      this.patternWeights = {
        LIVE_TWO: 20,
        LIVE_THREE: 500,
        DEAD_FOUR: 10000
      };
      break;
    case 'midgame':
      // 中局：平衡进攻和防守
      this.patternWeights = {
        LIVE_TWO: 10,
        LIVE_THREE: 1000,
        DEAD_FOUR: 50000
      };
      break;
    case 'endgame':
      // 残局：重视直接威胁
      this.patternWeights = {
        LIVE_TWO: 5,
        LIVE_THREE: 2000,
        DEAD_FOUR: 100000
      };
      break;
  }
}
```

**性能要求**:
- 单次评估: <2ms（比HardAI稍慢，但更准确）
- 内存占用: <2MB

---

### 2.4 Web Worker集成（AIWorker扩展）

**对象**: 在Worker线程中运行大师AI计算

**文件路径**: `src/game/ai/ai.worker.ts`（扩展现有文件）

**数据结构设计**:
```typescript
// src/game/ai/ai.worker.ts - 扩展
import { expose } from 'comlink';
import { SimpleAI } from './simple-ai';
import { MediumAI } from './medium-ai';
import { HardAI } from './hard-ai';
import { MasterAI } from './master-ai';  // 新增
import type { Board, Position, Difficulty } from '../types';
import type { SearchStatistics } from './master-ai';

export class AIWorker {
  private simpleAI: SimpleAI;
  private mediumAI: MediumAI;
  private hardAI: HardAI;
  private masterAI: MasterAI;  // 新增

  constructor() {
    this.simpleAI = new SimpleAI();
    this.mediumAI = new MediumAI();
    this.hardAI = new HardAI();
    this.masterAI = new MasterAI();  // 新增
  }

  /**
   * 在Worker线程中计算AI移动
   * 扩展：支持'master'难度
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
        return this.masterAI.calculateMove(board, aiPlayer);
    }
  }

  /**
   * 获取AI统计信息（用于调试和性能分析）
   * 扩展：支持MasterAI的详细统计
   */
  getStats(difficulty: Difficulty): SearchStatistics | null {
    switch (difficulty) {
      case 'hard':
        return this.hardAI.getStats();
      case 'master':
        return this.masterAI.getDetailedStats();
      default:
        return null;
    }
  }

  /**
   * 清空置换表（新游戏开始时调用）
   */
  clearMasterTable(): void {
    this.masterAI.clearTable();
  }
}

// 暴露Worker接口
expose(new AIWorker());
```

**超时保护优化**:
```typescript
// src/game/ai/ai-client.ts - 扩展
export class AIClient {
  /**
   * 调用AI计算移动（带超时）
   * MasterAI使用更长的超时时间
   */
  async calculateMove(
    board: Board,
    difficulty: Difficulty,
    aiPlayer: 'black' | 'white'
  ): Promise<Position> {
    // 根据难度动态调整超时时间
    const TIMEOUT_MAP = {
      easy: 100,
      medium: 500,
      hard: 3000,
      master: 10000  // MasterAI最多10秒
    };

    const TIMEOUT = TIMEOUT_MAP[difficulty];

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

**对象**: 验证大师AI的正确性、性能和棋力

**文件路径**: `src/game/ai/__tests__/master-ai.test.ts`

**测试类型**:
```typescript
// src/game/ai/__tests__/master-ai.test.ts
import { MasterAI } from '../master-ai';
import { GameEngine } from '../../core/game-engine';
import { TranspositionTable } from '../transposition-table';
import { ForbiddenDetector } from '../forbidden-detector';
import type { Board, Position } from '../../types';

describe('MasterAI', () => {
  let ai: MasterAI;
  let engine: GameEngine;

  beforeEach(() => {
    ai = new MasterAI({ searchDepth: 6 });
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

    it('应该识别并避开禁手（黑棋）', async () => {
      const board = engine.createEmptyBoard();
      // 构造三三禁手场景
      board[7][5] = 'black';
      board[7][6] = 'black';
      board[6][7] = 'black';
      board[8][7] = 'black';

      const position = await ai.calculateMove(board, 'black');
      // 应该避开（7,7），因为会形成三三禁手
      expect(position.row === 7 && position.col === 7).toBe(false);
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
  });

  // 2. 性能测试
  describe('性能要求', () => {
    it('响应时间应该<10秒', async () => {
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

      expect(duration).toBeLessThan(10000);
    });

    it('置换表命中率应该>30%', async () => {
      const board = engine.createEmptyBoard();
      await ai.calculateMove(board, 'black');

      const stats = ai.getDetailedStats();
      const hitRate = stats.tableHitRate;

      expect(hitRate).toBeGreaterThan(0.3);
    });

    it('剪枝效率应该>40%', async () => {
      const board = engine.createEmptyBoard();
      await ai.calculateMove(board, 'black');

      const stats = ai.getDetailedStats();
      const efficiency = stats.pruningEfficiency;

      expect(efficiency).toBeGreaterThan(0.4);
    });
  });

  // 3. 置换表测试
  describe('置换表', () => {
    it('应该正确缓存和检索评估结果', () => {
      const table = new TranspositionTable(1000);
      const board = engine.createEmptyBoard();

      // 存储一个评估结果
      const entry = {
        hash: ai.generateBoardHash(board),
        depth: 4,
        score: 1000,
        flag: 'exact' as const,
        bestMove: { row: 7, col: 7 },
        age: 0
      };
      table.store(entry);

      // 检索
      const retrieved = table.lookup(entry.hash, 4);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.score).toBe(1000);
    });

    it('应该正确处理表满的情况', () => {
      const table = new TranspositionTable(10);
      const board = engine.createEmptyBoard();

      // 插入超过容量的条目
      for (let i = 0; i < 20; i++) {
        const entry = {
          hash: i,
          depth: 4,
          score: i,
          flag: 'exact' as const,
          bestMove: { row: i, col: i },
          age: 0
        };
        table.store(entry);
      }

      // 表大小应该不超过最大容量
      const stats = table.getStats();
      expect(stats.size).toBeLessThanOrEqual(10);
    });
  });

  // 4. 禁手规则测试
  describe('禁手规则', () => {
    it('应该正确检测三三禁手', () => {
      const detector = new ForbiddenDetector();
      const board = engine.createEmptyBoard();

      // 构造三三禁手场景
      board[7][5] = 'black';
      board[7][6] = 'black';
      board[6][7] = 'black';
      board[8][7] = 'black';

      const isForbidden = detector.checkForbidden(board, { row: 7, col: 7 });
      expect(isForbidden).toBe('three_three');
    });

    it('应该正确检测四四禁手', () => {
      const detector = new ForbiddenDetector();
      const board = engine.createEmptyBoard();

      // 构造四四禁手场景
      board[7][4] = 'white';
      board[7][5] = 'black';
      board[7][6] = 'black';
      board[7][7] = 'black';
      board[6][7] = 'black';

      const isForbidden = detector.checkForbidden(board, { row: 7, col: 8 });
      expect(isForbidden).toBe('four_four');
    });

    it('应该正确检测长连禁手', () => {
      const detector = new ForbiddenDetector();
      const board = engine.createEmptyBoard();

      // 构造长连禁手场景
      for (let i = 3; i < 9; i++) {
        board[7][i] = 'black';
      }

      const isForbidden = detector.checkForbidden(board, { row: 7, col: 9 });
      expect(isForbidden).toBe('overline');
    });

    it('白棋不受禁手限制', () => {
      const detector = new ForbiddenDetector();
      const board = engine.createEmptyBoard();

      // 白棋形成长连（不应该被判为禁手）
      for (let i = 3; i < 9; i++) {
        board[7][i] = 'white';
      }

      const isForbidden = detector.checkForbidden(board, { row: 7, col: 9 });
      expect(isForbidden).toBeNull();
    });
  });

  // 5. 迭代加深测试
  describe('迭代加深', () => {
    it('应该逐步增加搜索深度', async () => {
      const aiWithIterative = new MasterAI({
        searchDepth: 4,
        enableIterativeDeepening: true
      });

      const board = engine.createEmptyBoard();
      await aiWithIterative.calculateMove(board, 'black');

      const stats = aiWithIterative.getDetailedStats();
      // 应该找到了最优着法（在某个深度）
      expect(stats.bestMoveFoundAtDepth).toBeGreaterThan(0);
      expect(stats.bestMoveFoundAtDepth).toBeLessThanOrEqual(4);
    });

    it('超时应该返回当前深度的最优着法', async () => {
      const aiWithShortTimeout = new MasterAI({
        searchDepth: 6,
        timeLimit: 100  // 100ms超时
      });

      const board = engine.createEmptyBoard();
      const position = await aiWithShortTimeout.calculateMove(board, 'black');

      // 应该返回一个有效的位置（虽然深度可能没到6层）
      expect(position.row).toBeGreaterThanOrEqual(0);
      expect(position.row).toBeLessThan(15);
    });
  });

  // 6. 棋力测试
  describe('棋力评估', () => {
    it('应该战胜困难AI', async () => {
      // 自动对局测试：MasterAI vs HardAI
      const engine = new GameEngine();
      const masterAI = new MasterAI();
      const hardAI = new HardAI();

      let board = engine.createEmptyBoard();
      let currentPlayer = 'black';

      for (let i = 0; i < 150; i++) {
        const position =
          currentPlayer === 'black'
            ? await masterAI.calculateMove(board, 'black')
            : await hardAI.calculateMove(board, 'white');

        board[position.row][position.col] = currentPlayer;

        const winner = engine.checkWinner(board, position);
        if (winner) {
          expect(winner).toBe('black');  // MasterAI应该获胜
          return;
        }

        currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
      }

      // 如果150步还没结束，至少不应该输
      const score = new EnhancedBoardEvaluator().evaluate(board, 'black');
      expect(score).toBeGreaterThan(0);
    });
  });
});
```

**性能基准测试**:
```typescript
// src/game/ai/__tests__/master-ai.bench.ts
import { MasterAI } from '../master-ai';
import { benchmark } from '../benchmark';

describe('MasterAI性能基准', () => {
  it('空棋盘性能基准', async () => {
    const ai = new MasterAI();
    const board = createEmptyBoard();

    const result = await benchmark(async () => {
      return ai.calculateMove(board, 'black');
    }, {
      iterations: 5,
      warmup: 1
    });

    console.log('空棋盘性能:', {
      mean: result.mean + 'ms',
      min: result.min + 'ms',
      max: result.max + 'ms',
      ops: result.ops + ' ops/s'
    });

    expect(result.mean).toBeLessThan(5000);  // 平均<5秒
  });

  it('中期棋盘性能基准', async () => {
    const ai = new MasterAI();
    const board = createMidGameBoard();  // 30步

    const result = await benchmark(async () => {
      return ai.calculateMove(board, 'black');
    }, {
      iterations: 3,
      warmup: 0
    });

    console.log('中期棋盘性能:', {
      mean: result.mean + 'ms',
      min: result.min + 'ms',
      max: result.max + 'ms'
    });

    expect(result.mean).toBeLessThan(10000);  // 平均<10秒
  });

  it('置换表效率测试', async () => {
    const ai = new MasterAI({ enableTranspositionTable: true });
    const board = createMidGameBoard();

    await ai.calculateMove(board, 'black');
    const stats = ai.getDetailedStats();

    console.log('置换表统计:', {
      hitRate: (stats.tableHitRate * 100).toFixed(2) + '%',
      hits: stats.tableHitRate * stats.nodesSearched,
      misses: (1 - stats.tableHitRate) * stats.nodesSearched
    });

    expect(stats.tableHitRate).toBeGreaterThan(0.3);  // 命中率>30%
  });
});
```

---

## 三、接口定义

### 3.1 类型定义

```typescript
// src/types/ai.ts - 扩展类型
export type Difficulty = 'easy' | 'medium' | 'hard' | 'master';

export interface MasterAIConfig {
  searchDepth: number;
  timeLimit: number;
  enableTranspositionTable: boolean;
  enableIterativeDeepening: boolean;
  enableForbiddenRules: boolean;
  tableSize: number;
}

export interface SearchStatistics {
  nodesSearched: number;
  searchTime: number;
  pruningEfficiency: number;
  tableHitRate: number;
  bestMoveFoundAtDepth: number;
  branchingFactor: number;
}

export enum ForbiddenType {
  THREE_THREE = 'three_three',
  FOUR_FOUR = 'four_four',
  OVERLINE = 'overline'
}
```

### 3.2 Store接口（扩展）

```typescript
// src/store/game-store.ts - 扩展接口
export interface GameStore {
  // Week 6新增：MasterAI统计信息
  masterAIStats: SearchStatistics | null;

  // Week 6新增：获取MasterAI统计
  getMasterAIStats: () => SearchStatistics | null;

  // Week 6新增：清空MasterAI置换表
  clearMasterAITable: () => void;
}
```

---

## 四、技术规范

### 4.1 置换表规范

**数据结构**:
```typescript
interface TranspositionEntry {
  hash: number;              // Zobrist哈希值（32位）
  depth: number;             // 搜索深度
  score: number;             // 评估分数
  flag: 'exact' | 'alpha' | 'beta';  // 边界标志
  bestMove: Position | null; // 最优着法
  age: number;               // 年龄（用于替换策略）
}
```

**边界标志含义**:
- `exact`: 精确值，该节点的评估值是准确的
- `alpha`: 下界，实际值 >= score（Alpha剪枝）
- `beta`: 上界，实际值 <= score（Beta剪枝）

**替换策略**:
1. 优先替换深度更浅的条目
2. 如果深度相同，替换最旧的条目
3. 使用年龄字段追踪条目的新旧程度

**Zobrist哈希**:
- 为每个棋盘位置×玩家分配一个随机数
- 落子时异或（XOR）对应位置的随机数
- 增量更新哈希值，避免重新计算

### 4.2 迭代加深规范

**算法流程**:
```
function iterativeDeepening(board, maxDepth):
  bestMove = null
  for depth from 1 to maxDepth:
    result = minimax(board, depth, -infinity, +infinity, true)
    bestMove = result.bestMove

    // 使用当前深度的最优着法指导下一次搜索的着法排序
    updateMoveOrdering(bestMove)

    // 检查超时
    if isTimeout():
      break

  return bestMove
```

**优势**:
- 超时时能返回当前深度的最优着法
- 浅层搜索的结果指导深层搜索的着法排序
- 提高Alpha-Beta剪枝效率

### 4.3 禁手规则规范

**适用范围**:
- 仅对黑棋（先行方）生效
- 白棋不受限制

**判定时机**:
- 候选着法生成时，过滤掉禁手位置
- 仅在实际落子时判定，假设性的棋盘状态不判定

**优先级**:
- 长连禁手 > 三三禁手 > 四四禁手
- 同时满足多个禁手时，返回优先级最高的

### 4.4 评估函数优化规范

**棋型组合评估**:
- 检测多个棋型共享关键位置的情况
- 计算棋型之间的协同效应
- 例如：一个位置可以同时形成活三和冲四

**位置价值评估**:
- 中心位置（7,7）更有价值
- 边缘位置（row=0/14 或 col=0/14）价值较低
- 使用距离函数计算位置价值

**动态权重调整**:
- 开局（棋子<20）：重视位置价值和灵活性
- 中局（棋子20-100）：平衡进攻和防守
- 残局（棋子>100）：重视直接威胁

### 4.5 性能优化规范

**置换表优化**:
- 使用Map数据结构，O(1)查询
- 限制表大小，避免内存溢出
- 使用增量哈希更新，避免重新计算

**候选着法优化**:
- 使用置换表中的bestMove优先搜索
- 使用浅层搜索的结果指导着法排序
- 排除禁手位置

**内存优化**:
- 避免频繁创建棋盘副本
- 使用原地修改 + 回溯
- 限制置换表大小

---

## 五、依赖关系

### 5.1 外部依赖
```json
{
  "comlink": "^6.0.0"  // Web Worker通信库（已有）
}
```

### 5.2 内部依赖
- **依赖Week 5**:
  - `HardAI` - 困难AI（父类）
  - `BoardEvaluator` - 局面评估（基类）
  - `MoveGenerator` - 候选着法生成
  - `PatternDetector` - 棋型检测
  - `AIWorker` - Web Worker架构
  - `AIClient` - AI客户端
- **依赖Week 3**:
  - `SimpleAI` - 简单AI（用于对比测试）
  - `MediumAI` - 中等AI（用于对比测试）
- **依赖Week 2**:
  - `Board` - 棋盘数据结构
  - `GameEngine` - 游戏引擎
  - `GameRules` - 胜负判断规则
- **依赖Week 1**:
  - `game-store` - 状态管理
  - `GamePage` - 游戏页面

### 5.3 文件结构
```
src/
├── game/
│   ├── ai/
│   │   ├── master-ai.ts                 # Week 6新增：大师AI
│   │   ├── transposition-table.ts       # Week 6新增：置换表
│   │   ├── zobrist.ts                   # Week 6新增：Zobrist哈希
│   │   ├── forbidden-detector.ts        # Week 6新增：禁手检测
│   │   ├── enhanced-board-evaluator.ts  # Week 6新增：增强评估
│   │   ├── hard-ai.ts                   # Week 5已实现（父类）
│   │   ├── board-evaluator.ts           # Week 5已实现（基类）
│   │   ├── move-generator.ts            # Week 5已实现
│   │   ├── pattern-detector.ts          # Week 5已实现
│   │   ├── simple-ai.ts                 # Week 3已实现
│   │   ├── medium-ai.ts                 # Week 3已实现
│   │   ├── ai.worker.ts                 # Week 3已实现（扩展）
│   │   ├── ai-client.ts                 # Week 3已实现（扩展）
│   │   └── __tests__/                   # Week 6新增测试
│   │       ├── master-ai.test.ts
│   │       ├── transposition-table.test.ts
│   │       ├── forbidden-detector.test.ts
│   │       └── master-ai.bench.ts
│   │
│   └── core/
│       ├── game-engine.ts               # Week 2已实现
│       ├── game-rules.ts                # Week 2已实现
│       └── game-flow.ts                 # Week 3已实现（无需修改）
│
├── store/
│   └── game-store.ts                    # 扩展：MasterAI统计信息
│
├── types/
│   ├── game.ts                          # 扩展：AI类型
│   └── ai.ts                            # Week 6新增：AI类型定义
│
└── pages/
    └── GamePage.tsx                     # 扩展：显示MasterAI统计（可选）
```

---

## 六、验收标准

### 6.1 功能验收
- [ ] 大师AI正常工作，能够完成对局
- [ ] AI能够识别并堵截玩家的活三、冲四
- [ ] AI能够识别并避开禁手位置（黑棋）
- [ ] AI在空棋盘时占据中心位置
- [ ] AI响应时间<10秒（大部分情况<8秒）
- [ ] PVE模式可以选择大师难度
- [ ] AI思考时UI有明确提示
- [ ] 置换表正确缓存和检索评估结果
- [ ] 迭代加深逐步增加搜索深度

### 6.2 性能验收
- [ ] 空棋盘响应时间<5秒
- [ ] 中期棋盘（30-50步）响应时间<10秒
- [ ] AI计算不阻塞UI主线程
- [ ] 剪枝效率>40%
- [ ] 置换表命中率>30%
- [ ] 内存占用<50MB（包括置换表）
- [ ] 迭代加深能找到最优着法

### 6.3 棋力验收
- [ ] 大师AI能够战胜困难AI（胜率>60%）
- [ ] 大师AI对高级玩家胜率5-10%
- [ ] AI能够识别复杂战术（多重威胁、禁手）
- [ ] AI能够正确应用禁手规则
- [ ] 评估函数比HardAI更准确

### 6.4 质量验收
- [ ] 所有新测试通过（目标50+个测试）
- [ ] Week 1-5的测试全部通过（230+个）
- [ ] 测试覆盖率>85%
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
   - 风险：6层搜索可能导致严重的性能问题
   - 缓解：
     - 使用置换表避免重复计算
     - 使用迭代加深，超时返回浅层结果
     - 优化候选着法生成（只考虑周围2格）
     - 必要时降低搜索深度到5层

2. **置换表效率**
   - 风险：置换表命中率低，无法提升性能
   - 缓解：
     - 使用Zobrist哈希，减少冲突
     - 优化替换策略（深度优先）
     - 合理设置表大小（10万条目）
     - 监控命中率，动态调整策略

3. **禁手规则准确性**
   - 风险：禁手判断错误，影响AI决策
   - 缓解：
     - 严格按照标准定义实现
     - 大量测试各种禁手场景
     - 参考专业五子棋规则文档
     - 与已知正确的实现对比验证

4. **内存占用**
   - 风险：置换表占用内存过多
   - 缓解：
     - 限制表大小（10万条目约20MB）
     - 使用高效的替换策略
     - 提供清空表的接口（新游戏时）
     - 监控内存使用，动态调整

### 7.2 开发风险

1. **测试复杂度**
   - 风险：AI算法难以测试，不确定性高
   - 缓解：
     - 使用固定棋盘状态测试
     - 测试特定禁手场景
     - 对战测试（vs HardAI）
     - 性能基准测试
     - 置换表命中率测试

2. **调试困难**
   - 风险：MasterAI递归调用难以调试
   - 缓解：
     - 添加详细日志（搜索节点数、剪枝次数、置换表命中）
     - 提供详细统计信息接口
     - 使用可视化工具（可选）
     - 分模块测试（置换表、禁手检测、评估函数）

3. **时间压力**
   - 风险：Week 6时间有限，可能完不成
   - 缓解：
     - 优先实现核心功能（深度6层 + 基础置换表）
     - 可选功能留到后续（禁手规则可以部分实现）
     - 迭代加深如果复杂度高可以暂时不实现
     - 使用HardAI的代码，避免重复工作

### 7.3 注意事项

- **性能优先**：如果性能和准确性冲突，优先保证性能（响应时间<10秒）
- **渐进实现**：先实现基本深度6层搜索，再添加置换表，最后添加迭代加深和禁手
- **复用现有代码**：继承HardAI，复用评估函数、候选着法生成等
- **测试驱动**：先写测试，再实现功能
- **文档完善**：添加详细注释，说明算法原理
- **性能监控**：添加详细统计信息，便于后续优化
- **禁手规则谨慎**：确保禁手判断100%正确，避免影响AI决策

---

## 八、开发计划

### 8.1 Day 1-2：核心算法实现
- [ ] 实现`MasterAI`类的基本结构（继承HardAI）
- [ ] 实现深度6层的Minimax搜索（不带优化）
- [ ] 编写基本功能测试
- [ ] 性能基准测试（确保在可接受范围内）

### 8.2 Day 3：置换表实现
- [ ] 实现`TranspositionTable`类
- [ ] 实现`ZobristHash`类
- [ ] 集成置换表到MasterAI
- [ ] 测试置换表命中率和性能提升

### 8.3 Day 4：禁手规则实现
- [ ] 实现`ForbiddenDetector`类
- [ ] 实现三三、四四、长连禁手检测
- [ ] 集成禁手检测到候选着法生成
- [ ] 编写禁手规则测试

### 8.4 Day 5：迭代加深和评估函数优化
- [ ] 实现迭代加深搜索
- [ ] 实现`EnhancedBoardEvaluator`类
- [ ] 集成到MasterAI
- [ ] 测试迭代加深效果和评估准确性

### 8.5 Day 6：Web Worker集成和测试
- [ ] 扩展`AIWorker`支持大师AI
- [ ] 集成到游戏流程
- [ ] 编写完整测试套件
- [ ] 性能基准测试
- [ ] 对战测试（vs HardAI）

### 8.6 Day 7：优化和文档
- [ ] 性能优化（根据测试结果）
- [ ] 代码审查和重构
- [ ] 完善文档和注释
- [ ] 验收测试

---

## 九、参考资料

### 9.1 技术文档
- [置换表（Transposition Table）详解](https://www.chessprogramming.org/Transposition_Table)
- [Zobrist哈希](https://www.chessprogramming.org/Zobrist_Hashing)
- [迭代加深搜索](https://www.chessprogramming.org/Iterative_Deepening)
- [五子棋禁手规则](https://www.gomokuworld.com/gomoku/forbidden-moves)
- [游戏AI编程](https://www.amazon.com/Programming-Game-AI-Example-Diabetes/dp/1537100577)

### 9.2 内部文档
- `ARCHITECTURE.md` - AI算法设计章节（大师难度）
- `week-5-WO.md` - Week 5工作对象（困难AI）
- `week-5-PL.md` - Week 5产品逻辑
- `PROJECT_STATUS.md` - 项目当前状态

### 9.3 代码参考
- `src/game/ai/hard-ai.ts` - 困难AI实现（父类）
- `src/game/ai/board-evaluator.ts` - 评估函数（基类）
- `src/game/ai/ai.worker.ts` - Web Worker架构
- `src/game/core/game-engine.ts` - 游戏引擎

---

**文档结束**

**下一步**: 产品经理编写Week 6 PL文档（产品逻辑规范）
