# Week 6 - PL文档（产品逻辑规范）

## 文档信息
- **文档版本**: v1.0
- **创建日期**: 2026-03-25
- **负责人**: 产品经理
- **阶段**: Phase 2 - AI增强版本
- **周次**: Week 6
- **关联文档**: week-5-PL.md, week-6-WO.md
- **前置依赖**: Week 5 HardAI已完成（Minimax + Alpha-Beta剪枝，深度4）

---

## 一、产品逻辑概述

### 1.1 本周目标
实现大师AI（Master AI），在HardAI基础上增加深度6搜索、置换表优化、迭代加深搜索等高级技术，提供大师级的AI对手，能够应对高水平玩家的挑战。

### 1.2 核心原则
- **大师级智力**: 深度6搜索 + 置换表，AI能够预见6步棋局
- **性能优化**: 通过置换表和迭代加深，确保响应时间<8秒
- **继承扩展**: 基于HardAI扩展，复用Minimax和评估函数
- **渐进增强**: 在HardAI基础上增加高级优化技术
- **用户体验**: 大师AI思考时显示进度，超时平滑降级到HardAI

### 1.3 Master AI vs HardAI对比

| 特性 | HardAI (Week 5) | Master AI (Week 6) |
|------|----------------|-------------------|
| 搜索深度 | 4层 | 6层（迭代加深） |
| 算法 | Minimax + Alpha-Beta | Minimax + Alpha-Beta + PVS |
| 剪枝 | Alpha-Beta剪枝 | Alpha-Beta + PVS |
| 缓存 | 简单记忆化 | Zobrist Hash置换表 |
| 候选着法 | 邻居筛选 + 启发式排序 | 邻居筛选 + 启发式排序 + 杀手着法 |
| 评估函数 | 基础棋型评分 | 优化棋型评分 + 位置价值 |
| 超时处理 | 降级到MediumAI | 降级到HardAI |
| 目标响应 | <5秒 | <8秒 |
| 目标用户 | 中级玩家 | 高级玩家 |

### 1.4 本周不包含的逻辑
- 蒙特卡洛树搜索（MCTS）（Week 7-8）
- 机器学习模型（Week 9+）
- 限时模式（Week 6其他部分）
- 多线程并行搜索（Week 7+）

---

## 二、置换表（Transposition Table）设计

### 2.1 为什么需要置换表？

**问题**: Minimax搜索中，相同的棋盘局面会被重复评估多次。

**示例**:
```
搜索路径1: e2 -> e4 -> e5 -> d4
搜索路径2: d4 -> e5 -> e4 -> e2
```
两条路径到达相同的局面，但会重复评估。

**解决方案**: 使用置换表缓存已评估的局面，避免重复计算。

**性能提升**:
- 命中率30-50%时，速度提升2-3倍
- 深度6搜索从~100秒降低到~8秒

### 2.2 Zobrist Hashing

**原理**: 为每个棋盘状态的每个位置分配随机数，通过异或运算生成唯一hash。

**优势**:
- **增量更新**: 落子/悔棋时快速更新hash
- **低冲突**: 64位hash几乎无冲突
- **快速计算**: O(1)时间复杂度

#### 2.2.1 Zobrist表初始化

```typescript
interface ZobristTable {
  // board[x][y][player] = random 64-bit number
  table: bigint[][][];
}

function initZobristTable(size: number = 15): ZobristTable {
  const table: bigint[][][] = [];

  for (let x = 0; x < size; x++) {
    table[x] = [];
    for (let y = 0; y < size; y++) {
      table[x][y] = {
        black: generateRandom64(),
        white: generateRandom64(),
      };
    }
  }

  return { table };
}

function generateRandom64(): bigint {
  // 生成随机64位整数
  const array = new Uint32Array(2);
  window.crypto.getRandomValues(array);
  return (BigInt(array[0]) << 32n) | BigInt(array[1]);
}
```

#### 2.2.2 计算棋盘Hash

```typescript
function computeBoardHash(
  board: Board,
  zobrist: ZobristTable
): bigint {
  let hash = 0n;

  for (let y = 0; y < board.getSize(); y++) {
    for (let x = 0; x < board.getSize(); x++) {
      const cell = board.getCell(x, y);
      if (cell !== null) {
        hash ^= zobrist.table[x][y][cell];
      }
    }
  }

  return hash;
}

// 增量更新：落子时
function makeMoveWithHash(
  board: Board,
  position: Position,
  player: Player,
  hash: bigint,
  zobrist: ZobristTable
): bigint {
  board.makeMove(position, player);
  return hash ^ zobrist.table[position.x][position.y][player];
}

// 增量更新：悔棋时
function undoMoveWithHash(
  board: Board,
  position: Position,
  player: Player,
  hash: bigint,
  zobrist: ZobristTable
): bigint {
  board.undoMove(position);
  return hash ^ zobrist.table[position.x][position.y][player];
}
```

### 2.3 置换表数据结构

```typescript
interface TranspositionEntry {
  hash: bigint;           // 局面hash（用于验证）
  depth: number;          // 搜索深度
  score: number;          // 评估分数
  flag: EntryFlag;        // 条目类型
  bestMove: Position;     // 最佳着法
  age: number;            // 年龄（用于LRU）
}

enum EntryFlag {
  EXACT = 0,  // 精确值（alpha <= score <= beta）
  ALPHA = 1,  // 下界（score <= alpha）
  BETA = 2,   // 上界（score >= beta）
}

class TranspositionTable {
  private table: Map<string, TranspositionEntry>;
  private maxSize: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(size: number = 100000) {
    this.table = new Map();
    this.maxSize = size;
  }

  // 存储条目
  store(entry: TranspositionEntry): void {
    const key = this.hashToKey(entry.hash);

    // 如果表已满，执行LRU清理
    if (this.table.size >= this.maxSize) {
      this.evictLRU();
    }

    // 替换策略：更深深度覆盖更浅深度
    const existing = this.table.get(key);
    if (existing && existing.depth > entry.depth) {
      return; // 保留更深的条目
    }

    entry.age = Date.now();
    this.table.set(key, entry);
  }

  // 查找条目
  retrieve(hash: bigint): TranspositionEntry | null {
    const key = this.hashToKey(hash);
    const entry = this.table.get(key);

    // 验证hash（避免冲突）
    if (entry && entry.hash === hash) {
      this.hits++;
      entry.age = Date.now(); // 更新访问时间
      return entry;
    }

    this.misses++;
    return null;
  }

  // LRU清理：删除最老的条目
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAge = Infinity;

    for (const [key, entry] of this.table.entries()) {
      if (entry.age < oldestAge) {
        oldestAge = entry.age;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.table.delete(oldestKey);
    }
  }

  // hash转key（取模）
  private hashToKey(hash: bigint): string {
    return (hash % BigInt(this.maxSize)).toString();
  }

  // 获取命中率
  getHitRate(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : this.hits / total;
  }

  // 清空表
  clear(): void {
    this.table.clear();
    this.hits = 0;
    this.misses = 0;
  }

  // 获取统计信息
  getStats(): { size: number; hits: number; misses: number; hitRate: number } {
    return {
      size: this.table.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.getHitRate(),
    };
  }
}
```

### 2.4 置换表优化策略

#### 2.4.1 条目替换策略

**策略1: 深度优先**
```typescript
// 更深的搜索更有价值，应该保留
function store(entry: TranspositionEntry): void {
  const key = this.hashToKey(entry.hash);
  const existing = this.table.get(key);

  if (!existing || entry.depth >= existing.depth) {
    this.table.set(key, entry);
  }
}
```

**策略2: 永久着法**
```typescript
// 如果是必胜/必败着法，永久保留
function store(entry: TranspositionEntry): void {
  const key = this.hashToKey(entry.hash);
  const existing = this.table.get(key);

  // 必胜/必败着法（分数极大或极小）
  if (Math.abs(entry.score) > 900000) {
    entry.age = Infinity; // 永久保留
    this.table.set(key, entry);
    return;
  }

  // 正常替换逻辑
  if (!existing || entry.depth >= existing.depth) {
    this.table.set(key, entry);
  }
}
```

#### 2.4.2 大小优化

**动态调整**:
```typescript
class TranspositionTable {
  private maxSize: number;

  constructor(memoryLimitMB: number = 10) {
    // 估算：每个条目约100字节
    // 10MB = 10 * 1024 * 1024 / 100 ≈ 100,000个条目
    this.maxSize = Math.floor((memoryLimitMB * 1024 * 1024) / 100);
  }

  // 根据命中率动态调整
  adjustSize(): void {
    const hitRate = this.getHitRate();

    if (hitRate > 0.5 && this.table.size < this.maxSize * 1.5) {
      // 命中率高，增加容量
      this.maxSize = Math.floor(this.maxSize * 1.2);
    } else if (hitRate < 0.2 && this.table.size > this.maxSize * 0.5) {
      // 命中率低，减少容量
      this.maxSize = Math.floor(this.maxSize * 0.8);
    }
  }
}
```

### 2.5 在Minimax中使用置换表

```typescript
class MasterAI {
  private transpositionTable: TranspositionTable;
  private zobrist: ZobristTable;

  constructor() {
    this.transpositionTable = new TranspositionTable(100000);
    this.zobrist = initZobristTable();
  }

  private minimaxWithAlphaBeta(
    board: Board,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    hash: bigint
  ): number {
    // 1. 检查终局
    if (depth === 0 || board.isGameOver()) {
      return this.evaluateBoard(board, isMaximizing ? 'black' : 'white');
    }

    // 2. 查询置换表
    const entry = this.transpositionTable.retrieve(hash);
    if (entry && entry.depth >= depth) {
      if (entry.flag === EntryFlag.EXACT) {
        return entry.score;
      }
      if (entry.flag === EntryFlag.ALPHA && entry.score <= alpha) {
        return entry.score;
      }
      if (entry.flag === EntryFlag.BETA && entry.score >= beta) {
        return entry.score;
      }
    }

    // 3. 生成候选着法（如果有缓存的bestMove，优先考虑）
    const candidates = this.generateCandidates(board);
    if (entry && entry.bestMove) {
      // 将bestMove移到最前面
      const index = candidates.findIndex(
        m => m.x === entry.bestMove.x && m.y === entry.bestMove.y
      );
      if (index !== -1) {
        candidates.splice(0, 0, candidates.splice(index, 1)[0]);
      }
    }

    // 4. 执行搜索
    let bestScore: number;
    let bestMove: Position | null = null;

    if (isMaximizing) {
      bestScore = -Infinity;

      for (const move of candidates) {
        const newHash = this.makeMoveWithHash(board, move, 'black', hash);
        const score = this.minimaxWithAlphaBeta(
          board,
          depth - 1,
          alpha,
          beta,
          false,
          newHash
        );
        this.undoMoveWithHash(board, move, 'black', hash);

        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }

        alpha = Math.max(alpha, score);
        if (beta <= alpha) break; // Beta剪枝
      }
    } else {
      bestScore = Infinity;

      for (const move of candidates) {
        const newHash = this.makeMoveWithHash(board, move, 'white', hash);
        const score = this.minimaxWithAlphaBeta(
          board,
          depth - 1,
          alpha,
          beta,
          true,
          newHash
        );
        this.undoMoveWithHash(board, move, 'white', hash);

        if (score < bestScore) {
          bestScore = score;
          bestMove = move;
        }

        beta = Math.min(beta, score);
        if (beta <= alpha) break; // Alpha剪枝
      }
    }

    // 5. 存储到置换表
    let flag: EntryFlag;
    if (bestScore <= alpha) {
      flag = EntryFlag.ALPHA;
    } else if (bestScore >= beta) {
      flag = EntryFlag.BETA;
    } else {
      flag = EntryFlag.EXACT;
    }

    this.transpositionTable.store({
      hash,
      depth,
      score: bestScore,
      flag,
      bestMove: bestMove || candidates[0],
      age: Date.now(),
    });

    return bestScore;
  }
}
```

---

## 三、迭代加深搜索（Iterative Deepening）

### 3.1 为什么需要迭代加深？

**问题**: 深度6搜索可能需要很长时间（>10秒），无法预测何时完成。

**解决方案**: 从深度1开始，逐步加深到深度6，每次迭代都有可用结果。

**优势**:
1. **随时可用**: 超时时可以返回当前最优解
2. **更好的剪枝**: 浅层搜索的结果指导深层搜索的alpha/beta值
3. **最佳着法排序**: 上一次迭代的最佳着法用于下一次迭代的排序

### 3.2 迭代加深实现

```typescript
class MasterAI {
  private maxDepth: number = 6;
  private timeout: number = 8000; // 8秒超时

  async calculateMove(
    board: Board,
    player: Player
  ): Promise<Position> {
    const startTime = performance.now();
    const initialHash = this.computeBoardHash(board);

    let bestMove: Position | null = null;
    let bestScore = -Infinity;

    // 从深度1开始，逐步加深
    for (let depth = 1; depth <= this.maxDepth; depth++) {
      // 检查超时（留200ms用于返回）
      if (performance.now() - startTime > this.timeout - 200) {
        console.log(`Master AI: 超时，返回深度${depth - 1}的结果`);
        break;
      }

      // 搜索当前深度
      const result = await this.searchDepth(
        board,
        player,
        depth,
        initialHash,
        startTime
      );

      if (result.move) {
        bestMove = result.move;
        bestScore = result.score;

        // 如果找到必胜着法，立即返回
        if (Math.abs(bestScore) > 900000) {
          console.log(`Master AI: 找到必胜着法，深度${depth}`);
          break;
        }
      }

      console.log(`Master AI: 深度${depth}完成，分数${bestScore}`);
    }

    if (!bestMove) {
      // 降级到HardAI
      console.warn('Master AI: 未找到有效着法，使用中心位置');
      bestMove = this.getCenterPosition();
    }

    return bestMove;
  }

  private async searchDepth(
    board: Board,
    player: Player,
    depth: number,
    hash: bigint,
    startTime: number
  ): Promise<{ move: Position | null; score: number }> {
    let bestMove: Position | null = null;
    let bestScore = player === 'black' ? -Infinity : Infinity;

    const candidates = this.generateCandidates(board);
    const isMaximizing = player === 'black';

    for (const move of candidates) {
      // 检查超时
      if (performance.now() - startTime > this.timeout - 200) {
        break;
      }

      const newHash = this.makeMoveWithHash(board, move, player, hash);
      const score = this.minimaxWithAlphaBeta(
        board,
        depth - 1,
        -Infinity,
        Infinity,
        !isMaximizing,
        newHash,
        startTime
      );
      this.undoMoveWithHash(board, move, player, hash);

      if (isMaximizing) {
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }

    return { move: bestMove, score: bestScore };
  }
}
```

### 3.3 时间管理优化

```typescript
class MasterAI {
  private allocateTimeByPhase(moveCount: number): number {
    // 开局（前10步）：分配较少时间
    if (moveCount < 10) {
      return 3000; // 3秒
    }

    // 中局（10-50步）：分配较多时间
    if (moveCount < 50) {
      return 8000; // 8秒
    }

    // 残局（50+步）：分配最多时间
    return 10000; // 10秒
  }

  private shouldStopSearch(
    startTime: number,
    currentDepth: number,
    targetDepth: number
  ): boolean {
    const elapsed = performance.now() - startTime;
    const allocated = this.timeout;

    // 如果已用时间超过分配时间的90%，停止
    if (elapsed > allocated * 0.9) {
      return true;
    }

    // 如果当前深度已完成，且剩余时间不足以搜索下一深度
    if (currentDepth >= targetDepth) {
      return true;
    }

    // 估算下一深度所需时间（指数增长）
    const estimatedNextTime = elapsed * 3; // 假设每层增加3倍

    // 如果估算时间超过剩余时间，停止
    if (estimatedNextTime > (allocated - elapsed)) {
      return true;
    }

    return false;
  }
}
```

---

## 四、PVS（Principal Variation Search）

### 4.1 PVS原理

**核心思想**: 在搜索过程中，第一个候选着法通常是最佳着法（来自迭代加深或置换表），因此可以用更窄的窗口搜索其他着法。

**优势**: 减少搜索节点数，提高剪枝效率。

### 4.2 PVS实现

```typescript
class MasterAI {
  private minimaxWithAlphaBeta(
    board: Board,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    hash: bigint,
    startTime: number
  ): number {
    // ... 终局检查和置换表查询 ...

    const candidates = this.generateCandidates(board);

    if (isMaximizing) {
      let bestScore = -Infinity;

      for (let i = 0; i < candidates.length; i++) {
        const move = candidates[i];

        // 检查超时
        if (performance.now() - startTime > this.timeout - 200) {
          break;
        }

        const newHash = this.makeMoveWithHash(board, move, 'black', hash);

        let score: number;

        if (i === 0) {
          // 第一个着法：全窗口搜索
          score = this.minimaxWithAlphaBeta(
            board,
            depth - 1,
            alpha,
            beta,
            false,
            newHash,
            startTime
          );
        } else {
          // 其他着法：空窗口搜索（PVS）
          score = this.minimaxWithAlphaBeta(
            board,
            depth - 1,
            alpha,
            alpha + 1, // 窄窗口
            false,
            newHash,
            startTime
          );

          // 如果分数在(alpha, alpha+1]之外，重新全窗口搜索
          if (score > alpha && score < beta) {
            score = this.minimaxWithAlphaBeta(
              board,
              depth - 1,
              alpha,
              beta,
              false,
              newHash,
              startTime
            );
          }
        }

        this.undoMoveWithHash(board, move, 'black', hash);

        if (score > bestScore) {
          bestScore = score;
        }

        alpha = Math.max(alpha, score);
        if (beta <= alpha) break; // Beta剪枝
      }

      return bestScore;
    } else {
      // 最小化玩家逻辑类似
      let bestScore = Infinity;

      for (let i = 0; i < candidates.length; i++) {
        const move = candidates[i];

        if (performance.now() - startTime > this.timeout - 200) {
          break;
        }

        const newHash = this.makeMoveWithHash(board, move, 'white', hash);

        let score: number;

        if (i === 0) {
          score = this.minimaxWithAlphaBeta(
            board,
            depth - 1,
            alpha,
            beta,
            true,
            newHash,
            startTime
          );
        } else {
          score = this.minimaxWithAlphaBeta(
            board,
            depth - 1,
            beta - 1,
            beta,
            true,
            newHash,
            startTime
          );

          if (score < beta && score > alpha) {
            score = this.minimaxWithAlphaBeta(
              board,
              depth - 1,
              alpha,
              beta,
              true,
              newHash,
              startTime
            );
          }
        }

        this.undoMoveWithHash(board, move, 'white', hash);

        if (score < bestScore) {
          bestScore = score;
        }

        beta = Math.min(beta, score);
        if (beta <= alpha) break;
      }

      return bestScore;
    }
  }
}
```

---

## 五、优化的评估函数

### 5.1 位置价值评估

**原理**: 中心位置比边缘位置更有价值。

```typescript
class MasterAI {
  private positionValues: number[][] = this.initPositionValues();

  private initPositionValues(): number[][] {
    const values: number[][] = [];
    const center = 7;

    for (let y = 0; y < 15; y++) {
      values[y] = [];
      for (let x = 0; x < 15; x++) {
        // 距离中心越近，价值越高
        const distance = Math.abs(x - center) + Math.abs(y - center);
        values[y][x] = Math.max(1, 10 - distance);
      }
    }

    return values;
  }

  private evaluateBoard(board: Board, player: Player): number {
    const opponent = player === 'black' ? 'white' : 'black';

    // 1. 检查终局
    if (this.checkWin(board, player)) {
      return 10000000;
    }
    if (this.checkWin(board, opponent)) {
      return -10000000;
    }
    if (board.isFull()) {
      return 0;
    }

    // 2. 棋型评分（继承HardAI）
    const attackScore = this.evaluatePlayer(board, player);
    const defenseScore = this.evaluatePlayer(board, opponent);

    // 3. 位置价值（新增）
    const positionScore = this.evaluatePositions(board, player);

    // 4. 综合评分
    return (attackScore - defenseScore * 0.9) + positionScore * 0.1;
  }

  private evaluatePositions(board: Board, player: Player): number {
    let score = 0;

    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        if (board.getCell(x, y) === player) {
          score += this.positionValues[y][x];
        }
      }
    }

    return score;
  }
}
```

### 5.2 组合棋型识别

**双三、双四等组合棋型更有威胁**:

```typescript
class MasterAI {
  private evaluatePlayer(board: Board, player: Player): number {
    let totalScore = 0;

    // 基础棋型评分（继承HardAI）
    totalScore += super.evaluatePlayer(board, player);

    // 组合棋型加分
    const combos = this.detectComboPatterns(board, player);
    totalScore += combos.bonus;

    return totalScore;
  }

  private detectComboPatterns(
    board: Board,
    player: Player
  ): { bonus: number } {
    let liveThrees: Position[][] = [];
    let rushFours: Position[][] = [];

    // 检测所有活三和冲四
    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        if (board.getCell(x, y) !== player) continue;

        for (const { dx, dy } of DIRECTIONS) {
          const pattern = this.analyzePattern(board, { x, y }, dx, dy, player);

          if (pattern.count === 3 && pattern.openEnds === 2) {
            liveThrees.push(this.getPatternPositions(board, { x, y }, dx, dy, 3));
          }

          if (pattern.count === 4 && pattern.openEnds === 1) {
            rushFours.push(this.getPatternPositions(board, { x, y }, dx, dy, 4));
          }
        }
      }
    }

    let bonus = 0;

    // 双活三（两个活三交叉）
    const doubleThrees = this.countCrossingPatterns(liveThrees);
    if (doubleThrees > 0) {
      bonus += doubleThrees * 15000;
    }

    // 双冲四（两个冲四交叉）
    const doubleFours = this.countCrossingPatterns(rushFours);
    if (doubleFours > 0) {
      bonus += doubleFours * 200000;
    }

    // 冲四+活三
    if (rushFours.length > 0 && liveThrees.length > 0) {
      bonus += 50000;
    }

    return { bonus };
  }

  private countCrossingPatterns(patterns: Position[][]): number {
    let count = 0;

    for (let i = 0; i < patterns.length; i++) {
      for (let j = i + 1; j < patterns.length; j++) {
        // 检查两个棋型是否交叉（共享至少一个位置）
        if (this.hasIntersection(patterns[i], patterns[j])) {
          count++;
        }
      }
    }

    return count;
  }

  private hasIntersection(
    positions1: Position[],
    positions2: Position[]
  ): boolean {
    return positions1.some(p1 =>
      positions2.some(p2 => p1.x === p2.x && p1.y === p2.y)
    );
  }

  private getPatternPositions(
    board: Board,
    start: Position,
    dx: number,
    dy: number,
    count: number
  ): Position[] {
    const positions: Position[] = [{ x: start.x, y: start.y }];

    // 正向
    for (let i = 1; i < count; i++) {
      positions.push({
        x: start.x + dx * i,
        y: start.y + dy * i,
      });
    }

    return positions;
  }
}
```

---

## 六、杀手着法（Killer Moves）

### 6.1 杀手着法原理

**概念**: 在同一深度下，导致剪枝的着法（杀手着法）很可能在其他分支中也是好着法。

**优化**: 在候选着法排序时，优先考虑杀手着法。

### 6.2 杀手着法实现

```typescript
interface KillerMove {
  move: Position;
  depth: number;
  count: number; // 导致剪枝的次数
}

class MasterAI {
  private killerMoves: Map<number, KillerMove[]> = new Map();

  private updateKillerMove(move: Position, depth: number): void {
    if (!this.killerMoves.has(depth)) {
      this.killerMoves.set(depth, []);
    }

    const killers = this.killerMoves.get(depth)!;

    // 检查是否已存在
    const existing = killers.find(k => k.move.x === move.x && k.move.y === move.y);
    if (existing) {
      existing.count++;
    } else {
      // 最多保留2个杀手着法
      if (killers.length >= 2) {
        killers.pop();
      }
      killers.unshift({ move, depth, count: 1 });
    }
  }

  private getKillerMoves(depth: number): Position[] {
    const killers = this.killerMoves.get(depth);
    return killers ? killers.map(k => k.move) : [];
  }

  private generateCandidates(board: Board, depth: number): Position[] {
    // 基础候选着法
    const candidates = super.generateCandidates(board);

    // 获取杀手着法
    const killers = this.getKillerMoves(depth);

    // 排序：杀手着法优先
    candidates.sort((a, b) => {
      const aIsKiller = killers.some(k => k.x === a.x && k.y === a.y);
      const bIsKiller = killers.some(k => k.x === b.x && k.y === b.y);

      if (aIsKiller && !bIsKiller) return -1;
      if (!aIsKiller && bIsKiller) return 1;
      return 0;
    });

    return candidates;
  }

  private minimaxWithAlphaBeta(
    board: Board,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    hash: bigint,
    startTime: number
  ): number {
    // ... 终局检查 ...

    const candidates = this.generateCandidates(board, depth);

    if (isMaximizing) {
      let bestScore = -Infinity;

      for (const move of candidates) {
        const newHash = this.makeMoveWithHash(board, move, 'black', hash);
        const score = this.minimaxWithAlphaBeta(
          board,
          depth - 1,
          alpha,
          beta,
          false,
          newHash,
          startTime
        );
        this.undoMoveWithHash(board, move, 'black', hash);

        bestScore = Math.max(bestScore, score);
        alpha = Math.max(alpha, score);

        // 如果发生剪枝，记录杀手着法
        if (beta <= alpha) {
          this.updateKillerMove(move, depth);
          break;
        }
      }

      return bestScore;
    } else {
      // 最小化玩家逻辑类似
      let bestScore = Infinity;

      for (const move of candidates) {
        const newHash = this.makeMoveWithHash(board, move, 'white', hash);
        const score = this.minimaxWithAlphaBeta(
          board,
          depth - 1,
          alpha,
          beta,
          true,
          newHash,
          startTime
        );
        this.undoMoveWithHash(board, move, 'white', hash);

        bestScore = Math.min(bestScore, score);
        beta = Math.min(beta, score);

        if (beta <= alpha) {
          this.updateKillerMove(move, depth);
          break;
        }
      }

      return bestScore;
    }
  }
}
```

---

## 七、Master AI类结构

### 7.1 完整类定义

```typescript
// master-ai.ts
import { HardAI } from './hard-ai';
import { Board, Position, Player } from '../types/game';

interface ZobristTable {
  table: bigint[][][];
}

interface TranspositionEntry {
  hash: bigint;
  depth: number;
  score: number;
  flag: EntryFlag;
  bestMove: Position;
  age: number;
}

enum EntryFlag {
  EXACT = 0,
  ALPHA = 1,
  BETA = 2,
}

interface KillerMove {
  move: Position;
  depth: number;
  count: number;
}

export class MasterAI extends HardAI {
  private transpositionTable: TranspositionTable;
  private zobrist: ZobristTable;
  private killerMoves: Map<number, KillerMove[]>;
  private positionValues: number[][];
  private maxDepth: number = 6;
  private timeout: number = 8000;

  constructor() {
    super();
    this.transpositionTable = new TranspositionTable(100000);
    this.zobrist = this.initZobristTable();
    this.killerMoves = new Map();
    this.positionValues = this.initPositionValues();
  }

  // 重写calculateMove
  async calculateMove(
    board: Board,
    player: Player
  ): Promise<Position> {
    const startTime = performance.now();

    try {
      // 迭代加深搜索
      const move = await this.iterativeDeepening(board, player, startTime);

      return move;
    } catch (error) {
      // 超时或其他错误，降级到HardAI
      console.warn('Master AI降级到HardAI:', error);
      return super.calculateMove(board, player);
    }
  }

  // 迭代加深
  private async iterativeDeepening(
    board: Board,
    player: Player,
    startTime: number
  ): Promise<Position> {
    const initialHash = this.computeBoardHash(board);
    let bestMove: Position | null = null;

    for (let depth = 1; depth <= this.maxDepth; depth++) {
      if (this.shouldStopSearch(startTime, depth, this.maxDepth)) {
        break;
      }

      const move = await this.searchDepth(board, player, depth, initialHash, startTime);

      if (move) {
        bestMove = move;
      }
    }

    return bestMove || this.getCenterPosition();
  }

  // 搜索特定深度
  private async searchDepth(
    board: Board,
    player: Player,
    depth: number,
    hash: bigint,
    startTime: number
  ): Promise<Position | null> {
    // ... 实现 ...
  }

  // Minimax + Alpha-Beta + 置换表 + PVS
  private minimaxWithAlphaBeta(
    board: Board,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    hash: bigint,
    startTime: number
  ): number {
    // ... 实现 ...
  }

  // 置换表相关
  private initZobristTable(): ZobristTable {
    // ... 实现 ...
  }

  private computeBoardHash(board: Board): bigint {
    // ... 实现 ...
  }

  private makeMoveWithHash(
    board: Board,
    position: Position,
    player: Player,
    hash: bigint
  ): bigint {
    // ... 实现 ...
  }

  private undoMoveWithHash(
    board: Board,
    position: Position,
    player: Player,
    hash: bigint
  ): bigint {
    // ... 实现 ...
  }

  // 杀手着法相关
  private updateKillerMove(move: Position, depth: number): void {
    // ... 实现 ...
  }

  private getKillerMoves(depth: number): Position[] {
    // ... 实现 ...
  }

  // 评估函数优化
  protected evaluateBoard(board: Board, player: Player): number {
    // ... 实现 ...
  }

  private evaluatePositions(board: Board, player: Player): number {
    // ... 实现 ...
  }

  private initPositionValues(): number[][] {
    // ... 实现 ...
  }

  // 时间管理
  private shouldStopSearch(
    startTime: number,
    currentDepth: number,
    targetDepth: number
  ): boolean {
    // ... 实现 ...
  }

  private getCenterPosition(): Position {
    return { x: 7, y: 7 };
  }

  // 清理资源
  dispose(): void {
    this.transpositionTable.clear();
    this.killerMoves.clear();
  }
}

class TranspositionTable {
  // ... 实现 ...
}
```

### 7.2 与HardAI的继承关系

```typescript
// 继承HardAI，复用以下功能：
// - generateCandidates(): 生成候选着法
// - analyzePattern(): 分析棋型
// - scorePattern(): 棋型评分
// - checkWin(): 检查胜负
// - 基础评估函数

// 扩展/重写以下功能：
// - calculateMove(): 增加迭代加深
// - evaluateBoard(): 增加位置价值
// - 新增：置换表、Zobrist哈希、杀手着法、PVS
```

---

## 八、用户交互设计

### 8.1 难度选择扩展

```typescript
// game-store.ts
export type AIDifficulty = 'simple' | 'medium' | 'hard' | 'master';

export interface GameStore {
  aiDifficulty: AIDifficulty;

  startGame: (mode: GameMode, aiDifficulty?: AIDifficulty) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  aiDifficulty: 'medium',

  startGame: (mode: GameMode, aiDifficulty: AIDifficulty = 'medium') => {
    // ... 初始化 ...

    set({
      gameMode: mode,
      aiDifficulty: mode === 'pve' ? aiDifficulty : 'medium',
      // ...
    });
  },

  triggerAiMove: async () => {
    const { engine, aiDifficulty, aiPlayer } = get();

    set({ isAiThinking: true });

    try {
      const aiClient = await createAIClient(aiDifficulty);

      const response = await aiClient.calculateMove({
        boardData: engine.getBoard().getGrid(),
        player: aiPlayer,
        aiType: aiDifficulty,
        timeout: aiDifficulty === 'master' ? 8000 : 5000,
      });

      if (response.success && response.position) {
        await get().makeMove(response.position);
      }
    } catch (error) {
      console.error('AI move failed:', error);

      // Master AI降级到Hard AI
      if (aiDifficulty === 'master') {
        toast.info('大师AI思考超时，切换到困难AI...');
        const fallbackClient = await createAIClient('hard');
        const fallbackResponse = await fallbackClient.calculateMove({
          boardData: engine.getBoard().getGrid(),
          player: aiPlayer,
          aiType: 'hard',
          timeout: 5000,
        });

        if (fallbackResponse.success && fallbackResponse.position) {
          await get().makeMove(fallbackResponse.position);
        }
      }
    } finally {
      set({ isAiThinking: false });
    }
  },
}));
```

### 8.2 UI组件更新

```typescript
// DifficultySelect.tsx
export function DifficultySelect() {
  const { aiDifficulty, startGame } = useGameStore();

  const difficulties = [
    { value: 'simple', label: '简单' },
    { value: 'medium', label: '中等' },
    { value: 'hard', label: '困难' },
    { value: 'master', label: '大师' },
  ];

  return (
    <div className="flex items-center gap-2">
      <label>难度:</label>
      <select
        value={aiDifficulty}
        onChange={(e) => startGame('pve', e.target.value as AIDifficulty)}
        className="px-3 py-2 border rounded"
      >
        {difficulties.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// StatusIndicator.tsx
export function StatusIndicator() {
  const { gameStatus, isAiThinking, aiDifficulty } = useGameStore();

  const getStatusText = () => {
    if (isAiThinking) {
      const difficultyText = {
        simple: '简单',
        medium: '中等',
        hard: '困难',
        master: '大师',
      };
      return `AI思考中（${difficultyText[aiDifficulty]}）...`;
    }

    // ... 其他状态 ...
  };

  return <div>{getStatusText()}</div>;
}
```

---

## 九、性能优化技巧

### 9.1 内存优化

```typescript
class MasterAI {
  // 1. 限制置换表大小
  private readonly MAX_TABLE_SIZE = 100000;

  // 2. 定期清理
  private periodicCleanup(): void {
    setInterval(() => {
      this.transpositionTable.evictLRU();
    }, 30000); // 每30秒清理一次
  }

  // 3. 游戏结束时清理
  dispose(): void {
    this.transpositionTable.clear();
    this.killerMoves.clear();
  }
}
```

### 9.2 搜索优化

```typescript
class MasterAI {
  // 1. 动态调整搜索深度
  private getDynamicDepth(moveCount: number): number {
    if (moveCount < 10) return 4; // 开局：浅搜索
    if (moveCount < 50) return 6; // 中局：深搜索
    return 8; // 残局：更深搜索
  }

  // 2. 早期终止
  private shouldTerminateEarly(score: number): boolean {
    return Math.abs(score) > 900000; // 必胜/必败
  }

  // 3. 候选着法限制
  private limitCandidates(candidates: Position[]): Position[] {
    const maxCandidates = 40; // Master AI：40个候选
    return candidates.slice(0, maxCandidates);
  }
}
```

### 9.3 缓存优化

```typescript
class MasterAI {
  // 1. 预计算Zobrist表
  private static readonly ZOBRIST_TABLE = initZobristTable();

  // 2. 缓存位置价值表
  private static readonly POSITION_VALUES = initPositionValues();

  // 3. 复用评估结果
  private evaluationCache = new Map<string, number>();
}
```

---

## 十、测试策略

### 10.1 单元测试

```typescript
describe('MasterAI', () => {
  describe('置换表', () => {
    it('应该正确存储和检索条目', () => {
      const table = new TranspositionTable(100);
      const entry: TranspositionEntry = {
        hash: 12345n,
        depth: 4,
        score: 1000,
        flag: EntryFlag.EXACT,
        bestMove: { x: 7, y: 7 },
        age: Date.now(),
      };

      table.store(entry);
      const retrieved = table.retrieve(12345n);

      expect(retrieved).toBeDefined();
      expect(retrieved?.score).toBe(1000);
    });

    it('应该正确执行LRU清理', () => {
      const table = new TranspositionTable(2);

      table.store({
        hash: 1n,
        depth: 1,
        score: 1,
        flag: EntryFlag.EXACT,
        bestMove: { x: 0, y: 0 },
        age: 1000,
      });

      table.store({
        hash: 2n,
        depth: 1,
        score: 2,
        flag: EntryFlag.EXACT,
        bestMove: { x: 1, y: 1 },
        age: 2000,
      });

      table.store({
        hash: 3n,
        depth: 1,
        score: 3,
        flag: EntryFlag.EXACT,
        bestMove: { x: 2, y: 2 },
        age: 3000,
      });

      // 应该清理最老的条目（hash=1）
      expect(table.retrieve(1n)).toBeNull();
      expect(table.retrieve(2n)).toBeDefined();
      expect(table.retrieve(3n)).toBeDefined();
    });
  });

  describe('Zobrist Hashing', () => {
    it('应该为不同局面生成不同hash', () => {
      const masterAI = new MasterAI();
      const board1 = createTestBoard([{ x: 7, y: 7, player: 'black' }]);
      const board2 = createTestBoard([{ x: 7, y: 8, player: 'black' }]);

      const hash1 = masterAI['computeBoardHash'](board1);
      const hash2 = masterAI['computeBoardHash'](board2);

      expect(hash1).not.toBe(hash2);
    });

    it('应该增量更新hash', () => {
      const masterAI = new MasterAI();
      const board = createTestBoard([]);
      const hash1 = masterAI['computeBoardHash'](board);

      const hash2 = masterAI['makeMoveWithHash'](board, { x: 7, y: 7 }, 'black', hash1);
      const hash3 = masterAI['undoMoveWithHash'](board, { x: 7, y: 7 }, 'black', hash2);

      expect(hash3).toBe(hash1);
    });
  });

  describe('迭代加深', () => {
    it('应该逐步增加搜索深度', async () => {
      const masterAI = new MasterAI();
      const board = createMidGameBoard();
      const depths: number[] = [];

      // Mock searchDepth以记录深度
      const originalSearchDepth = masterAI['searchDepth'].bind(masterAI);
      masterAI['searchDepth'] = async function(...args: any[]) {
        depths.push(args[2]); // depth参数
        return originalSearchDepth(...args);
      };

      await masterAI.calculateMove(board, 'black');

      expect(depths).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('应该在超时时返回当前最优解', async () => {
      const masterAI = new MasterAI();
      masterAI['timeout'] = 100; // 100ms超时

      const board = createComplexBoard();
      const move = await masterAI.calculateMove(board, 'black');

      expect(move).toBeDefined();
    });
  });

  describe('PVS', () => {
    it('应该使用空窗口搜索非首个着法', () => {
      const masterAI = new MasterAI();
      const board = createTestBoard([...]);
      const hash = masterAI['computeBoardHash'](board);

      let fullWindowCount = 0;
      let nullWindowCount = 0;

      // Mock minimaxWithAlphaBeta以记录窗口类型
      const originalMinimax = masterAI['minimaxWithAlphaBeta'].bind(masterAI);
      masterAI['minimaxWithAlphaBeta'] = function(
        board: Board,
        depth: number,
        alpha: number,
        beta: number,
        ...args: any[]
      ) {
        if (beta - alpha > 1) {
          fullWindowCount++;
        } else {
          nullWindowCount++;
        }
        return originalMinimax(board, depth, alpha, beta, ...args);
      };

      masterAI['minimaxWithAlphaBeta'](board, 2, -Infinity, Infinity, true, hash, performance.now());

      expect(fullWindowCount).toBeGreaterThan(0);
      expect(nullWindowCount).toBeGreaterThan(0);
    });
  });

  describe('杀手着法', () => {
    it('应该记录和复用杀手着法', () => {
      const masterAI = new MasterAI();
      const board = createTestBoard([...]);
      const hash = masterAI['computeBoardHash'](board);

      // 第一次搜索
      masterAI['minimaxWithAlphaBeta'](board, 3, -Infinity, Infinity, true, hash, performance.now());

      const killers1 = masterAI['getKillerMoves'](3);

      // 第二次搜索
      masterAI['minimaxWithAlphaBeta'](board, 3, -Infinity, Infinity, true, hash, performance.now());

      const killers2 = masterAI['getKillerMoves'](3);

      expect(killers1.length).toBeGreaterThan(0);
      expect(killers2).toEqual(killers1);
    });
  });

  describe('性能测试', () => {
    it('深度4搜索应该在2秒内完成', async () => {
      const masterAI = new MasterAI();
      const board = createMidGameBoard();

      const startTime = performance.now();
      const move = await masterAI.calculateMove(board, 'black');
      const duration = performance.now() - startTime;

      expect(move).toBeDefined();
      expect(duration).toBeLessThan(2000);
    });

    it('置换表命中率应该>30%', async () => {
      const masterAI = new MasterAI();
      const board = createMidGameBoard();

      await masterAI.calculateMove(board, 'black');
      const stats = masterAI['transpositionTable'].getStats();

      expect(stats.hitRate).toBeGreaterThan(0.3);
    });

    it('内存占用应该<20MB', async () => {
      const masterAI = new MasterAI();
      const board = createMidGameBoard();

      const memoryBefore = performance.memory.usedJSHeapSize;
      await masterAI.calculateMove(board, 'black');
      const memoryAfter = performance.memory.usedJSHeapSize;

      const memoryUsed = (memoryAfter - memoryBefore) / (1024 * 1024);

      expect(memoryUsed).toBeLessThan(20);
    });
  });
});
```

### 10.2 集成测试

```typescript
describe('Master AI Integration', () => {
  it('应该成功调用Master AI', async () => {
    const board = createMidGameBoard();
    const aiClient = await createAIClient('master');

    const response = await aiClient.calculateMove({
      boardData: board.getGrid(),
      player: 'black',
      aiType: 'master',
      timeout: 8000,
    });

    expect(response.success).toBe(true);
    expect(response.position).toBeDefined();
  });

  it('应该在超时时降级到Hard AI', async () => {
    const board = createComplexBoard();
    const aiClient = await createAIClient('master');

    const response = await aiClient.calculateMove({
      boardData: board.getGrid(),
      player: 'black',
      aiType: 'master',
      timeout: 100, // 100ms超时
    });

    expect(response.success).toBe(true);
    // 应该降级成功
  });
});
```

### 10.3 E2E测试

```typescript
test.describe('大师AI对战', () => {
  test('应该能够与大师AI完成对局', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // 选择大师AI
    await page.click('[data-testid="pve-mode-button"]');
    await page.selectOption('[data-testid="difficulty-select"]', 'master');
    await page.click('[data-testid="start-game-button"]');

    // 验证游戏开始
    await expect(page.locator('[data-testid="status"]')).toContainText('黑棋回合');

    // 玩家落子
    await page.locator('.konvajs-content').click({ position: { x: 300, y: 300 } });

    // 等待AI思考（大师AI可能需要更长时间）
    await expect(page.locator('[data-testid="status"]')).toContainText('AI思考中（大师）');

    // 等待AI落子（最多15秒）
    await page.waitForTimeout(15000);

    // 验证AI已落子
    const pieces = await page.locator('[data-testid="piece"]').count();
    expect(pieces).toBe(2);
  });

  test('大师AI应该在超时时降级到困难AI', async ({ page }) => {
    await page.goto('http://localhost:5173');

    await page.click('[data-testid="pve-mode-button"]');
    await page.selectOption('[data-testid="difficulty-select"]', 'master');
    await page.click('[data-testid="start-game-button"]');

    // 模拟复杂局面
    // ...

    // 验证降级提示
    await expect(page.locator('[data-testid="toast"]')).toContainText('切换到困难AI');
  });
});
```

---

## 十一、验收清单

### 11.1 功能验收
- [ ] MasterAI能够正常落子
- [ ] 使用深度6搜索（迭代加深）
- [ ] 置换表正常工作
- [ ] Zobrist哈希正确生成
- [ ] PVS优化有效
- [ ] 杀手着法机制正常
- [ ] 评估函数优化（位置价值、组合棋型）
- [ ] 超时降级到HardAI
- [ ] 继承HardAI功能

### 11.2 性能验收
- [ ] 深度4搜索<2秒
- [ ] 深度6搜索<8秒
- [ ] 置换表命中率>30%
- [ ] 候选着法<40个
- [ ] AI计算不阻塞UI
- [ ] 内存占用<20MB
- [ ] PVS减少20%+节点评估

### 11.3 智力验收
- [ ] MasterAI胜率显著高于HardAI
- [ ] 能够利用置换表优化
- [ ] 能够识别复杂组合棋型
- [ ] 开局合理
- [ ] 残局准确
- [ ] 能够应对高水平玩家

### 11.4 稳定性验收
- [ ] 超时平滑降级
- [ ] 置换表无内存泄漏
- [ ] Zobrist哈希无冲突
- [ ] 错误处理完善
- [ ] 边界情况处理正确
- [ ] 所有测试通过

### 11.5 用户体验验收
- [ ] 大师AI思考时有明确提示
- [ ] 超时时有友好降级提示
- [ ] 错误时有清晰反馈
- [ ] 整体体验流畅
- [ ] 界面响应及时
- [ ] 难度选择清晰

---

**文档结束**

**下一步**:
1. 开发Agent根据PL文档实现MasterAI
2. 测试Agent编写测试用例
3. 进行性能测试和优化
4. 用户体验测试
