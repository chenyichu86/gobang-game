# Week 5 - PL文档（产品逻辑规范）

## 文档信息
- **文档版本**: v1.0
- **创建日期**: 2026-03-25
- **负责人**: 产品经理
- **阶段**: Phase 2 - AI增强版本
- **周次**: Week 5
- **关联文档**: week-5-WO.md

---

## 一、产品逻辑概述

### 1.1 本周目标
实现困难AI（Hard AI），使用Minimax算法配合Alpha-Beta剪枝，提供具有挑战性的AI对手，让玩家体验真实的博弈对抗。

### 1.2 核心原则
- **智能对抗**: AI使用Minimax算法，能够预见多步棋局
- **性能优化**: 通过Alpha-Beta剪枝和候选着法优化，确保响应时间<5秒
- **渐进难度**: 困难AI比中等AI显著更强，但不会让玩家感到绝望
- **平滑集成**: 与现有simple-ai.ts和medium-ai.ts无缝集成
- **用户体验**: AI思考时显示进度，超时有降级方案

### 1.3 本周不包含的逻辑
- 大师AI（Week 7-8，更深度搜索+优化）
- 限时模式（Week 6）
- 悔棋功能增强（Week 5其他部分）
- 提示功能增强（Week 6）

---

## 二、困难AI算法逻辑

### 2.1 算法选择：Minimax + Alpha-Beta剪枝

#### 2.1.1 为什么选择Minimax？

**优势**:
- **对抗性思维**: 同时考虑进攻和防守，模拟对手最佳应对
- **前瞻性**: 可以预见未来4步的棋局变化
- **理论保证**: 在给定深度内找到最优解
- **可扩展**: 通过调整深度控制AI强度

**与其他算法对比**:
- **vs 简单AI**: 简单AI只看当前局面，Minimax看未来
- **vs 中等AI**: 中等AI评分当前局面，Minimax评分博弈树
- **vs 蒙特卡洛**: Minimax更确定，蒙特卡洛更随机（适合大师AI）

#### 2.1.2 Minimax算法原理

**核心思想**: AI假设对手总是走出最优应对，因此选择在对手最优应对下对自己最有利的着法。

**算法流程**:
```
函数: minimax(board, depth, isMaximizingPlayer)
输入:
  - board: 当前棋盘状态
  - depth: 剩余搜索深度
  - isMaximizingPlayer: 是否为最大化玩家（AI）

输出: 局面评估分数

伪代码:
IF depth == 0 OR 游戏结束 THEN
    RETURN evaluateBoard(board)  // 评估当前局面

IF isMaximizingPlayer THEN  // AI的回合
    maxEval = -∞
    FOR each candidateMove IN generateCandidates(board) DO
        // 模拟落子
        board.makeMove(candidateMove)

        // 递归调用（对手回合，深度-1）
        eval = minimax(board, depth - 1, FALSE)

        // 撤销落子（回溯）
        board.undoMove(candidateMove)

        // 选择最大值（对手的最坏情况）
        maxEval = MAX(maxEval, eval)

    RETURN maxEval
ELSE  // 对手的回合
    minEval = +∞
    FOR each candidateMove IN generateCandidates(board) DO
        board.makeMove(candidateMove)
        eval = minimax(board, depth - 1, TRUE)  // AI回合
        board.undoMove(candidateMove)

        // 选择最小值（AI的最坏情况）
        minEval = MIN(minEval, eval)

    RETURN minEval
```

**实际调用**:
```typescript
// 在顶层，AI选择得分最高的着法
function findBestMove(board: Board, depth: number): Position {
  let bestScore = -Infinity;
  let bestMove: Position | null = null;

  for (const move of generateCandidates(board)) {
    board.makeMove(move);
    const score = minimax(board, depth - 1, false); // 对手回合
    board.undoMove(move);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove!;
}
```

### 2.2 Alpha-Beta剪枝优化

#### 2.2.1 为什么需要剪枝？

**问题**: Minimax的时间复杂度为O(b^d)，其中b是分支因子（候选着法数），d是搜索深度。

**示例计算**:
- 不优化: 100个候选 × 4层深度 = 100^4 = 100,000,000次评估
- 剪枝后: 平均可减少50-75%的节点评估

**剪枝原理**: 如果已经知道某个分支不可能比当前最优解更好，就停止搜索该分支。

#### 2.2.2 Alpha-Beta剪枝算法

**参数说明**:
- **Alpha**: 最大化玩家（AI）能保证的最小分数（下界）
- **Beta**: 最小化玩家（对手）能保证的最大分数（上界）

**剪枝条件**:
- **Alpha剪枝**: 在最大化节点，如果某个子节点的返回值 >= Beta，则停止搜索
- **Beta剪枝**: 在最小化节点，如果某个子节点的返回值 <= Alpha，则停止搜索

**算法伪代码**:
```
函数: minimaxWithAlphaBeta(board, depth, alpha, beta, isMaximizing)

IF depth == 0 OR 游戏结束 THEN
    RETURN evaluateBoard(board)

IF isMaximizing THEN  // AI回合
    maxEval = -∞
    FOR each move IN generateCandidates(board) DO
        board.makeMove(move)
        eval = minimaxWithAlphaBeta(board, depth - 1, alpha, beta, FALSE)
        board.undoMove(move)

        maxEval = MAX(maxEval, eval)
        alpha = MAX(alpha, eval)

        // Beta剪枝：如果已经比对手能保证的最差情况好，停止搜索
        IF beta <= alpha THEN
            BREAK  // 剪枝
    RETURN maxEval
ELSE  // 对手回合
    minEval = +∞
    FOR each move IN generateCandidates(board) DO
        board.makeMove(move)
        eval = minimaxWithAlphaBeta(board, depth - 1, alpha, beta, TRUE)
        board.undoMove(move)

        minEval = MIN(minEval, eval)
        beta = MIN(beta, eval)

        // Alpha剪枝：如果已经比AI能保证的最好情况差，停止搜索
        IF beta <= alpha THEN
            BREAK  // 剪枝
    RETURN minEval
```

**剪枝示例**:
```
假设AI在搜索某个位置，当前alpha=1000，beta=-1000

AI评估位置A：得分5000
  -> alpha更新为5000

AI评估位置B：得分2000
  -> alpha仍为5000（不需要更新）

AI评估位置C：
  - 如果第一个子节点返回-10000
  - beta更新为-10000
  - 发现beta(-10000) <= alpha(5000)
  - 剪枝！不需要继续评估位置C的其他子节点
  - 因为位置C已经比位置A差，对手不可能选择位置C
```

### 2.3 搜索深度选择

**深度vs性能权衡**:
```
深度1:  ~100个节点    ~10ms   (太浅，AI较弱)
深度2:  ~10,000个节点  ~100ms  (中等AI水平)
深度3:  ~1,000,000个节点  ~1s   (较强AI)
深度4:  ~100,000,000个节点 ~10s  (困难AI，目标深度)
深度5:  ~10,000,000,000个节点 ~100s (太慢，不适合)
```

**Week 5目标**: 深度4（配合剪枝优化，目标<5秒）

**实际优化策略**:
1. **迭代加深**: 先深度1搜索，再深度2，依此类推
   - 可以在超时前返回已搜索的最优解
   - 更好的剪枝效果（alpha/beta值更准确）

2. **动态深度**: 根据候选着法数量调整
   - 候选少（开局/残局）: 深度4-5
   - 候选多（中局）: 深度3-4

---

## 三、局面评估函数

### 3.1 评估函数设计原则

**目标**: 给定一个棋盘局面，返回一个数值表示该局面对AI的有利程度。

**评分标准**:
- **正分**: 对AI有利
- **负分**: 对对手有利
- **0**: 双方均势

**关键因素**:
1. **进攻潜力**: AI形成威胁的可能性
2. **防守强度**: 阻止对手威胁的能力
3. **棋型评分**: 连五、活四、冲四、活三等棋型的权重
4. **位置价值**: 中心位置比边缘位置更有价值

### 3.2 棋型评分表

**扩展评分表**（基于medium-ai.ts）:
```typescript
const PATTERN_SCORES = {
  // 必胜棋型
  FIVE: 1000000,        // 连五（已获胜）

  // 致命威胁（必须防守）
  LIVE_FOUR: 100000,    // 活四（_XXXX_，两端都空）
  RUSH_FOUR: 10000,     // 冲四（OXXXX_，一端被堵）

  // 强力威胁
  LIVE_THREE: 5000,     // 活三（_XXX_，两端都空）
  SLEEP_THREE: 500,     // 眠三（OXXX_，一端被堵）

  // 布局棋型
  LIVE_TWO: 100,        // 活二（_XX_，两端都空）
  SLEEP_TWO: 10,        // 眠二（OXX_，一端被堵）

  // 单子
  ONE: 1,               // 单子（_X_）

  // 特殊棋型（组合威胁）
  DOUBLE_THREE: 15000,  // 双活三（两个活三交叉）
  DOUBLE_FOUR: 200000,  // 双冲四（两个冲四交叉）
  FOUR_THREE: 50000,    // 冲四+活三组合
};
```

**评分原则**:
1. **连五 >> 活四**: 活四虽然强，但还没赢
2. **活四 >> 冲四**: 活四必胜，冲四可以被堵
3. **双活三 > 单活四**: 双活三难以同时防守
4. **组合棋型**: 多个威胁的组合价值远超单个威胁

### 3.3 评估函数实现

**完整评估流程**:
```typescript
function evaluateBoard(
  board: Board,
  aiPlayer: Player
): number {
  const opponent = aiPlayer === 'black' ? 'white' : 'black';

  // 1. 检查终局状态
  if (checkWin(board, aiPlayer)) {
    return 10000000; // AI获胜，最大正分
  }
  if (checkWin(board, opponent)) {
    return -10000000; // 对手获胜，最大负分
  }
  if (board.isFull()) {
    return 0; // 平局
  }

  // 2. 评估AI的进攻分数
  const attackScore = evaluatePlayer(board, aiPlayer);

  // 3. 评估对手的进攻分数（即AI的防守分数）
  const defenseScore = evaluatePlayer(board, opponent);

  // 4. 综合评分（进攻为主，防守为辅）
  return attackScore - defenseScore * 0.9;
}

function evaluatePlayer(board: Board, player: Player): number {
  let totalScore = 0;
  const directions = [
    { dx: 1, dy: 0 },  // 横向
    { dx: 0, dy: 1 },  // 纵向
    { dx: 1, dy: 1 },  // 主对角线
    { dx: 1, dy: -1 }, // 副对角线
  ];

  // 遍历所有位置，评估棋型
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < 15; x++) {
      if (board.getCell(x, y) !== player) continue;

      // 检查4个方向的棋型
      for (const { dx, dy } of directions) {
        const pattern = analyzePattern(board, { x, y }, dx, dy, player);

        // 累加棋型得分
        totalScore += scorePattern(pattern);

        // 检测组合棋型（双活三、双冲四等）
        const combo = detectComboPatterns(board, player);
        totalScore += combo.bonus;
      }
    }
  }

  return totalScore;
}

function analyzePattern(
  board: Board,
  start: Position,
  dx: number,
  dy: number,
  player: Player
): Pattern {
  let count = 1;
  let openEnds = 0;
  let blocked = false;

  // 正向扫描
  for (let i = 1; i <= 4; i++) {
    const pos = { x: start.x + dx * i, y: start.y + dy * i };
    if (!board.isValid(pos.x, pos.y)) {
      blocked = true;
      break;
    }
    const cell = board.getCell(pos.x, pos.y);
    if (cell === player) {
      count++;
    } else if (cell === null) {
      openEnds++;
      break;
    } else {
      blocked = true;
      break;
    }
  }

  // 反向扫描
  for (let i = 1; i <= 4; i++) {
    const pos = { x: start.x - dx * i, y: start.y - dy * i };
    if (!board.isValid(pos.x, pos.y)) {
      blocked = true;
      break;
    }
    const cell = board.getCell(pos.x, pos.y);
    if (cell === player) {
      count++;
    } else if (cell === null) {
      openEnds++;
      break;
    } else {
      blocked = true;
      break;
    }
  }

  return { count, openEnds, blocked };
}

function scorePattern(pattern: Pattern): number {
  const { count, openEnds, blocked } = pattern;

  // 连五
  if (count >= 5) return PATTERN_SCORES.FIVE;

  // 活四（4子，两端都空）
  if (count === 4 && openEnds === 2) {
    return PATTERN_SCORES.LIVE_FOUR;
  }

  // 冲四（4子，一端被堵）
  if (count === 4 && openEnds === 1) {
    return PATTERN_SCORES.RUSH_FOUR;
  }

  // 活三（3子，两端都空）
  if (count === 3 && openEnds === 2) {
    return PATTERN_SCORES.LIVE_THREE;
  }

  // 眠三（3子，一端被堵）
  if (count === 3 && openEnds === 1) {
    return PATTERN_SCORES.SLEEP_THREE;
  }

  // 活二（2子，两端都空）
  if (count === 2 && openEnds === 2) {
    return PATTERN_SCORES.LIVE_TWO;
  }

  // 眠二（2子，一端被堵）
  if (count === 2 && openEnds === 1) {
    return PATTERN_SCORES.SLEEP_TWO;
  }

  // 单子
  return PATTERN_SCORES.ONE;
}

function detectComboPatterns(
  board: Board,
  player: Player
): { bonus: number } {
  let bonus = 0;
  let liveThreeCount = 0;
  let rushFourCount = 0;

  // 统计活三和冲四数量
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < 15; x++) {
      if (board.getCell(x, y) !== player) continue;

      for (const { dx, dy } of DIRECTIONS) {
        const pattern = analyzePattern(board, { x, y }, dx, dy, player);

        if (pattern.count === 3 && pattern.openEnds === 2) {
          liveThreeCount++;
        }
        if (pattern.count === 4 && pattern.openEnds === 1) {
          rushFourCount++;
        }
      }
    }
  }

  // 双活三
  if (liveThreeCount >= 2) {
    bonus += PATTERN_SCORES.DOUBLE_THREE;
  }

  // 双冲四
  if (rushFourCount >= 2) {
    bonus += PATTERN_SCORES.DOUBLE_FOUR;
  }

  // 冲四+活三
  if (rushFourCount >= 1 && liveThreeCount >= 1) {
    bonus += PATTERN_SCORES.FOUR_THREE;
  }

  return { bonus };
}
```

---

## 四、候选着法生成优化

### 4.1 为什么需要优化候选着法？

**问题**: 如果考虑所有空位（225个），Minimax搜索效率极低。

**优化思路**: 只考虑"有意义"的位置，大幅减少分支因子。

### 4.2 候选着法筛选策略

**策略1: 邻居筛选**
```typescript
function getCandidateMoves(board: Board): Position[] {
  const candidates: Position[] = [];
  const size = board.getSize();

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!board.isEmpty(x, y)) continue;

      // 只考虑周围2格内有棋子的空位
      if (hasNeighborWithinDistance(board, { x, y }, 2)) {
        candidates.push({ x, y });
      }
    }
  }

  return candidates;
}

function hasNeighborWithinDistance(
  board: Board,
  pos: Position,
  distance: number
): boolean {
  for (let dy = -distance; dy <= distance; dy++) {
    for (let dx = -distance; dx <= distance; dx++) {
      if (dx === 0 && dy === 0) continue;

      const nx = pos.x + dx;
      const ny = pos.y + dy;

      if (board.isValid(nx, ny) && !board.isEmpty(nx, ny)) {
        return true;
      }
    }
  }

  return false;
}
```

**策略2: 启发式排序**
```typescript
// 对候选着法进行排序，优先评估更有希望的位置
// 这样可以提高Alpha-Beta剪枝的效率

function sortCandidatesByScore(
  board: Board,
  candidates: Position[],
  player: Player
): Position[] {
  // 快速评估每个位置的分数（使用浅层搜索）
  const scored = candidates.map(pos => ({
    position: pos,
    score: quickEvaluate(board, pos, player),
  }));

  // 按分数降序排序
  scored.sort((a, b) => b.score - a.score);

  return scored.map(s => s.position);
}

function quickEvaluate(
  board: Board,
  pos: Position,
  player: Player
): number {
  // 简单评估：只考虑直接形成的棋型
  let score = 0;

  for (const { dx, dy } of DIRECTIONS) {
    const pattern = analyzePattern(board, pos, dx, dy, player);
    score += scorePattern(pattern);
  }

  return score;
}
```

**策略3: 必应着法检测**
```typescript
// 如果存在必胜或必败的着法，优先处理

function detectCriticalMoves(
  board: Board,
  player: Player
): { winMoves: Position[], blockMoves: Position[] } {
  const winMoves: Position[] = [];
  const blockMoves: Position[] = [];

  const candidates = getCandidateMoves(board);

  for (const pos of candidates) {
    // 检测是否为制胜着法
    board.makeMove(pos);
    if (checkWin(board, player)) {
      winMoves.push(pos);
    }
    board.undoMove(pos);

    // 检测是否需要防守（对手在此落子会获胜）
    const opponent = player === 'black' ? 'white' : 'black';
    board.makeMove(pos, opponent);
    if (checkWin(board, opponent)) {
      blockMoves.push(pos);
    }
    board.undoMove(pos);
  }

  return { winMoves, blockMoves };
}
```

### 4.3 候选着法数量控制

**动态限制**:
```typescript
function limitCandidates(
  candidates: Position[],
  maxCount: number = 50
): Position[] {
  if (candidates.length <= maxCount) {
    return candidates;
  }

  // 按距离中心排序，优先考虑中心区域
  const center = { x: 7, y: 7 };
  candidates.sort((a, b) => {
    const distA = distance(a, center);
    const distB = distance(b, center);
    return distA - distB;
  });

  return candidates.slice(0, maxCount);
}

function distance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
```

---

## 五、性能优化策略

### 5.1 Web Worker优化

**目标**: AI计算不阻塞UI线程，保持页面流畅。

**实现**（扩展ai.worker.ts）:
```typescript
// ai.worker.ts 扩展
import { expose } from 'comlink';
import { HardAI } from './hard-ai';

const ai = new HardAI();

expose({
  async calculateMove(request: AIRequest): Promise<AIResponse> {
    const { boardData, player, timeout = 5000 } = request;

    try {
      // 恢复棋盘
      const board = restoreBoard(boardData);

      // 计算AI着法（带超时）
      const result = await ai.calculateMoveWithTimeout(
        board,
        player,
        timeout
      );

      return {
        success: true,
        position: result.position,
        thinkTime: result.duration,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
});
```

### 5.2 超时处理与降级

**超时控制**:
```typescript
async function calculateMoveWithTimeout(
  board: Board,
  player: Player,
  timeout: number
): Promise<{ position: Position; duration: number }> {
  const startTime = performance.now();

  // 创建超时Promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('AI calculation timeout'));
    }, timeout);
  });

  // 创建计算Promise
  const calculatePromise = (async () => {
    return await this.calculateMove(board, player);
  })();

  try {
    // 竞速：计算 vs 超时
    const position = await Promise.race([
      calculatePromise,
      timeoutPromise,
    ]);

    const duration = performance.now() - startTime;
    return { position, duration };
  } catch (error) {
    // 超时降级：使用MediumAI
    console.warn('HardAI timeout, falling back to MediumAI');
    const mediumAI = new MediumAI();
    const position = mediumAI.calculateMove(board, player);

    const duration = performance.now() - startTime;
    return { position, duration };
  }
}
```

### 5.3 迭代加深搜索

**优势**: 可以在任意时间点返回当前最优解。

**实现**:
```typescript
function iterativeDeepening(
  board: Board,
  player: Player,
  maxDepth: number = 4,
  timeout: number = 5000
): Position {
  const startTime = performance.now();
  let bestMove: Position | null = null;

  // 从深度1开始，逐步加深
  for (let depth = 1; depth <= maxDepth; depth++) {
    // 检查超时
    if (performance.now() - startTime > timeout * 0.9) {
      break; // 留10%时间用于返回
    }

    // 搜索当前深度
    const move = searchDepth(board, player, depth);

    if (move) {
      bestMove = move;
    }

    // 如果找到必胜着法，立即返回
    if (isWinningMove(board, move, player)) {
      break;
    }
  }

  return bestMove || getCenterMove();
}
```

### 5.4 记忆化缓存

**缓存评估结果**:
```typescript
class HardAI {
  private evaluationCache = new Map<string, number>();

  private evaluateBoard(board: Board, player: Player): number {
    // 生成棋盘hash
    const hash = this.hashBoard(board);

    // 检查缓存
    if (this.evaluationCache.has(hash)) {
      return this.evaluationCache.get(hash)!;
    }

    // 计算评估
    const score = this.computeScore(board, player);

    // 存入缓存
    this.evaluationCache.set(hash, score);

    return score;
  }

  private hashBoard(board: Board): string {
    // 简单hash：将棋盘转为字符串
    let hash = '';
    const size = board.getSize();

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cell = board.getCell(x, y);
        hash += cell === null ? '_' : (cell === 'black' ? 'B' : 'W');
      }
    }

    return hash;
  }

  clearCache(): void {
    this.evaluationCache.clear();
  }
}
```

---

## 六、与现有AI系统集成

### 6.1 扩展ai-client.ts

**新增difficulty类型**:
```typescript
// ai-client.ts
export type AIType = 'simple' | 'medium' | 'hard';

export interface AIRequest {
  boardData: BoardCell[][];
  player: Player;
  aiType: AIType;
  timeout?: number;
}

export async function createAIClient(aiType: AIType): Promise<AIClient> {
  // 测试环境
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'test') {
    return await createTestAIClient(aiType);
  }

  // 浏览器环境
  return createWorkerAIClient(aiType);
}

async function createTestAIClient(aiType: AIType): Promise<AIClient> {
  const { SimpleAI } = await import('./simple-ai');
  const { MediumAI } = await import('./medium-ai');
  const { HardAI } = await import('./hard-ai'); // 新增

  return {
    async calculateMove(request: AIRequest): Promise<AIResponse> {
      const board = restoreBoard(request.boardData);

      // 根据类型选择AI
      let ai;
      switch (request.aiType) {
        case 'simple':
          ai = new SimpleAI();
          break;
        case 'medium':
          ai = new MediumAI();
          break;
        case 'hard':
          ai = new HardAI();
          break;
        default:
          throw new Error(`Unknown AI type: ${request.aiType}`);
      }

      const position = ai.calculateMove(board, request.player);

      return {
        success: true,
        position,
      };
    },
  };
}
```

### 6.2 扩展ai.worker.ts

**Worker中支持HardAI**:
```typescript
// ai.worker.ts
import { HardAI } from './hard-ai';
// ... 其他import

let hardAIInstance: HardAI | null = null;

async function handleCalculateMove(request: AIRequest & { aiType: AIType }): Promise<AIResponse> {
  const { boardData, player, aiType, timeout = 5000 } = request;

  try {
    const board = restoreBoard(boardData);
    let position: Position;

    switch (aiType) {
      case 'simple':
        position = new SimpleAI().calculateMove(board, player);
        break;
      case 'medium':
        position = new MediumAI().calculateMove(board, player);
        break;
      case 'hard':
        if (!hardAIInstance) {
          hardAIInstance = new HardAI();
        }
        position = await hardAIInstance.calculateMoveWithTimeout(
          board,
          player,
          timeout
        );
        break;
      default:
        throw new Error(`Unknown AI type: ${aiType}`);
    }

    return {
      success: true,
      position,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

expose({
  calculateMove: handleCalculateMove,
});
```

### 6.3 更新game-store.ts

**新增hard难度选项**:
```typescript
// game-store.ts
export type AIDifficulty = 'simple' | 'medium' | 'hard'; // 新增'hard'

export interface GameStore {
  // ... 其他状态

  // AI设置
  aiDifficulty: AIDifficulty;
  aiPlayer: Player;
  isAiThinking: boolean;

  // 操作
  startGame: (mode: GameMode, aiDifficulty?: AIDifficulty) => void;
  makeMove: (position: Position) => Promise<void>;
  // ... 其他操作
}

// 实现
export const useGameStore = create<GameStore>((set, get) => ({
  // 初始状态
  aiDifficulty: 'medium', // 默认中等难度

  // 开始游戏
  startGame: (mode: GameMode, aiDifficulty: AIDifficulty = 'medium') => {
    const engine = new GameEngine();
    const aiPlayer = 'white'; // 默认AI执白

    set({
      gameMode: mode,
      aiDifficulty: mode === 'pve' ? aiDifficulty : 'medium',
      aiPlayer: aiPlayer,
      engine: engine,
      gameStatus: 'playing',
      moveHistory: [],
      // ... 其他初始化
    });

    // 如果AI执黑先手，立即落子
    if (mode === 'pve' && aiPlayer === 'black') {
      get().triggerAiMove();
    }
  },

  // 触发AI落子
  triggerAiMove: async () => {
    const { engine, aiDifficulty, aiPlayer } = get();

    set({ isAiThinking: true });

    try {
      // 使用ai-client
      const aiClient = await createAIClient(aiDifficulty);

      const response = await aiClient.calculateMove({
        boardData: engine.getBoard().getGrid(),
        player: aiPlayer,
        aiType: aiDifficulty,
        timeout: aiDifficulty === 'hard' ? 5000 : 3000, // 困难AI 5秒超时
      });

      if (response.success && response.position) {
        await get().makeMove(response.position);
      } else {
        throw new Error(response.error || 'AI calculation failed');
      }
    } catch (error) {
      console.error('AI move failed:', error);
      // 降级处理：使用MediumAI
      const fallbackClient = await createAIClient('medium');
      const fallbackResponse = await fallbackClient.calculateMove({
        boardData: engine.getBoard().getGrid(),
        player: aiPlayer,
        aiType: 'medium',
      });

      if (fallbackResponse.success && fallbackResponse.position) {
        await get().makeMove(fallbackResponse.position);
      }
    } finally {
      set({ isAiThinking: false });
    }
  },
}));
```

---

## 七、用户交互设计

### 7.1 AI落子流程

**完整流程**:
```
1. 玩家落子
   ├─ 玩家点击棋盘
   ├─ 验证落子合法性
   ├─ 执行落子
   └─ 检查胜负

2. 触发AI回合
   ├─ 设置isAiThinking = true
   ├─ 禁用棋盘交互
   ├─ 显示"AI思考中..."提示
   └─ 发送计算请求到Worker

3. AI计算中
   ├─ Worker执行Minimax搜索
   ├─ 实时更新进度（可选）
   └─ 检查超时

4. AI落子
   ├─ 接收Worker返回的位置
   ├─ 验证位置合法性
   ├─ 执行AI落子
   └─ 检查胜负

5. 回到玩家回合
   ├─ 设置isAiThinking = false
   ├─ 启用棋盘交互
   └─ 显示"玩家回合"提示
```

### 7.2 UI状态提示

**思考中状态**:
```typescript
// StatusIndicator.tsx 扩展
export function StatusIndicator() {
  const { gameStatus, currentPlayer, isAiThinking, aiDifficulty } = useGameStore();

  const getStatusText = () => {
    if (gameStatus === 'won') {
      return `${currentPlayer === 'black' ? '黑棋' : '白棋'}获胜！`;
    }

    if (gameStatus === 'draw') {
      return '平局！';
    }

    if (isAiThinking) {
      const difficultyText = {
        simple: '简单',
        medium: '中等',
        hard: '困难',
      };
      return `AI思考中（${difficultyText[aiDifficulty]}）...`;
    }

    return `${currentPlayer === 'black' ? '黑棋' : '白棋'}回合`;
  };

  return (
    <div className="text-center">
      <div className={`text-lg font-semibold ${isAiThinking ? 'animate-pulse' : ''}`}>
        {getStatusText()}
      </div>
    </div>
  );
}
```

### 7.3 超时处理UI

**超时提示**:
```typescript
// GameControls.tsx 扩展
export function GameControls() {
  const { gameStatus, isAiThinking, undo, restart } = useGameStore();
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  // 监听AI思考时间
  useEffect(() => {
    if (!isAiThinking) {
      setShowTimeoutWarning(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowTimeoutWarning(true);
    }, 3000); // 3秒后显示警告

    return () => clearTimeout(timer);
  }, [isAiThinking]);

  return (
    <div className="flex flex-col gap-4">
      {/* 超时警告 */}
      {showTimeoutWarning && (
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded">
          AI正在深度思考，请稍候...
        </div>
      )}

      {/* 控制按钮 */}
      <div className="flex gap-2">
        <button
          onClick={undo}
          disabled={gameStatus !== 'playing' || isAiThinking}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          悔棋
        </button>

        <button
          onClick={restart}
          disabled={isAiThinking}
          className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50"
        >
          重新开始
        </button>
      </div>
    </div>
  );
}
```

### 7.4 错误处理UI

**Toast提示**:
```typescript
// 使用现有的Toast系统
export function useGameStore() {
  // ... 其他代码

  const triggerAiMove: () => Promise<void> = async () => {
    const { engine, aiDifficulty, aiPlayer } = get();

    set({ isAiThinking: true });

    try {
      const aiClient = await createAIClient(aiDifficulty);
      const response = await aiClient.calculateMove({
        boardData: engine.getBoard().getGrid(),
        player: aiPlayer,
        aiType: aiDifficulty,
        timeout: aiDifficulty === 'hard' ? 5000 : 3000,
      });

      if (response.success && response.position) {
        await get().makeMove(response.position);
      } else {
        throw new Error(response.error || 'AI calculation failed');
      }
    } catch (error) {
      // 显示错误提示
      const errorMessage = error instanceof Error
        ? error.message
        : 'AI计算失败';

      toast.error(errorMessage);

      // 降级处理
      if (aiDifficulty === 'hard') {
        toast.info('切换到中等AI重试...');
        // 使用中等AI重试
      }
    } finally {
      set({ isAiThinking: false });
    }
  };
}
```

---

## 八、测试策略

### 8.1 单元测试

**HardAI核心算法测试**:
```typescript
describe('HardAI', () => {
  describe('Minimax算法', () => {
    it('应该正确评估深度1的minimax', () => {
      const board = createTestBoard([
        { x: 7, y: 7, player: 'black' },
        { x: 7, y: 8, player: 'white' },
      ]);
      const ai = new HardAI();

      const score = ai.minimax(board, 1, true);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThan(-Infinity);
      expect(score).toBeLessThan(Infinity);
    });

    it('应该正确识别必胜局面', () => {
      const board = createBoardWithFourInRow('black');
      const ai = new HardAI();

      const move = ai.calculateMove(board, 'black');

      // 应该选择连五的位置
      expect(isWinningMove(move, board)).toBe(true);
    });

    it('应该正确防守对手威胁', () => {
      const board = createBoardWithOpponentLiveFour('white');
      const ai = new HardAI();

      const move = ai.calculateMove(board, 'black');

      // 应该堵截对手的活四
      expect(isBlockingMove(move, board, 'white')).toBe(true);
    });
  });

  describe('Alpha-Beta剪枝', () => {
    it('应该正确执行alpha剪枝', () => {
      const board = createTestBoard([...]);
      const ai = new HardAI();

      const startTime = performance.now();
      const score = ai.minimaxWithAlphaBeta(board, 3, -Infinity, Infinity, true);
      const duration = performance.now() - startTime;

      // 剪枝后应该比完整搜索快
      expect(duration).toBeLessThan(1000); // 1秒内完成
    });

    it('应该返回与普通minimax相同的结果', () => {
      const board = createTestBoard([...]);
      const ai = new HardAI();

      const score1 = ai.minimax(board, 3, true);
      const score2 = ai.minimaxWithAlphaBeta(board, 3, -Infinity, Infinity, true);

      // 结果应该一致
      expect(Math.abs(score1 - score2)).toBeLessThan(0.01);
    });
  });

  describe('评估函数', () => {
    it('应该正确评估连五', () => {
      const board = createBoardWithFiveInRow('black');
      const ai = new HardAI();

      const score = ai.evaluateBoard(board, 'black');

      expect(score).toBeGreaterThan(100000);
    });

    it('应该正确评估活四', () => {
      const board = createBoardWithLiveFour('black');
      const ai = new HardAI();

      const score = ai.evaluateBoard(board, 'black');

      expect(score).toBeGreaterThan(10000);
      expect(score).toBeLessThan(100000);
    });

    it('应该正确识别双活三', () => {
      const board = createBoardWithDoubleLiveThree('black');
      const ai = new HardAI();

      const score = ai.evaluateBoard(board, 'black');

      // 双活三应该有额外加分
      expect(score).toBeGreaterThan(15000);
    });
  });

  describe('候选着法生成', () => {
    it('应该只返回有邻居的位置', () => {
      const board = createTestBoard([
        { x: 7, y: 7, player: 'black' },
      ]);
      const ai = new HardAI();

      const candidates = ai.getCandidateMoves(board);

      // 所有候选位置都应该在(7,7)周围2格内
      candidates.forEach(pos => {
        const distance = Math.max(
          Math.abs(pos.x - 7),
          Math.abs(pos.y - 7)
        );
        expect(distance).toBeLessThanOrEqual(2);
      });
    });

    it('应该按分数排序候选着法', () => {
      const board = createMidGameBoard();
      const ai = new HardAI();

      const sorted = ai.sortCandidatesByScore(board, 'black');

      // 验证是降序排列
      for (let i = 1; i < sorted.length; i++) {
        const score1 = ai.quickEvaluate(board, sorted[i - 1], 'black');
        const score2 = ai.quickEvaluate(board, sorted[i], 'black');
        expect(score1).toBeGreaterThanOrEqual(score2);
      }
    });
  });

  describe('性能测试', () => {
    it('深度3搜索应该在1秒内完成', () => {
      const board = createMidGameBoard();
      const ai = new HardAI();

      const startTime = performance.now();
      ai.calculateMove(board, 'black', 3);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(1000);
    });

    it('深度4搜索应该在5秒内完成', () => {
      const board = createMidGameBoard();
      const ai = new HardAI();

      const startTime = performance.now();
      ai.calculateMove(board, 'black', 4);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(5000);
    });
  });
});
```

### 8.2 集成测试

**AI Client测试**:
```typescript
describe('AI Client - HardAI Integration', () => {
  it('应该成功调用HardAI', async () => {
    const board = createMidGameBoard();
    const aiClient = await createAIClient('hard');

    const response = await aiClient.calculateMove({
      boardData: board.getGrid(),
      player: 'black',
      aiType: 'hard',
      timeout: 5000,
    });

    expect(response.success).toBe(true);
    expect(response.position).toBeDefined();
    expect(board.isValid(response.position!.x, response.position!.y)).toBe(true);
  });

  it('应该在超时时返回错误', async () => {
    const board = createComplexBoard();
    const aiClient = await createAIClient('hard');

    const response = await aiClient.calculateMove({
      boardData: board.getGrid(),
      player: 'black',
      aiType: 'hard',
      timeout: 100, // 100ms超时
    });

    expect(response.success).toBe(false);
    expect(response.error).toContain('timeout');
  });
});
```

### 8.3 E2E测试

**困难AI对战测试**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('困难AI对战', () => {
  test('应该能够与困难AI完成对局', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // 选择困难AI
    await page.click('[data-testid="pve-mode-button"]');
    await page.selectOption('[data-testid="difficulty-select"]', 'hard');
    await page.click('[data-testid="start-game-button"]');

    // 验证游戏开始
    await expect(page.locator('[data-testid="status"]')).toContainText('黑棋回合');

    // 玩家落子
    await page.locator('.konvajs-content').click({ position: { x: 300, y: 300 } });

    // 等待AI思考（困难AI可能需要更长时间）
    await expect(page.locator('[data-testid="status"]')).toContainText('AI思考中');

    // 等待AI落子（最多10秒）
    await page.waitForTimeout(10000);

    // 验证AI已落子
    const pieces = await page.locator('[data-testid="piece"]').count();
    expect(pieces).toBe(2);

    // 继续游戏（可以添加更多逻辑）
  });

  test('困难AI应该在超时时降级到中等AI', async ({ page }) => {
    // 创建一个复杂局面，让困难AI需要很长时间
    await page.goto('http://localhost:5173');

    // 选择困难AI并设置较短超时
    await page.click('[data-testid="pve-mode-button"]');
    await page.selectOption('[data-testid="difficulty-select"]', 'hard');
    await page.click('[data-testid="start-game-button"]');

    // 模拟复杂局面（通过设置复杂棋盘）
    // ... 创建复杂局面的代码

    // 玩家落子
    await page.locator('.konvajs-content').click({ position: { x: 300, y: 300 } });

    // 验证超时降级
    await expect(page.locator('[data-testid="toast"]')).toContainText('切换到中等AI');
  });
});
```

---

## 九、验收清单

### 9.1 功能验收
- [ ] HardAI能够正常落子
- [ ] HardAI使用Minimax算法（深度4）
- [ ] Alpha-Beta剪枝正常工作
- [ ] 候选着法生成优化有效
- [ ] 评估函数准确评分棋型
- [ ] 超时降级机制正常
- [ ] 与simple-ai.ts和medium-ai.ts无缝集成
- [ ] game-store.ts支持'hard'难度

### 9.2 性能验收
- [ ] 深度3搜索<1秒
- [ ] 深度4搜索<5秒
- [ ] Alpha-Beta剪枝减少50%+节点评估
- [ ] 候选着法<50个
- [ ] AI计算不阻塞UI
- [ ] 内存占用<10MB

### 9.3 智力验收
- [ ] HardAI胜率显著高于MediumAI
- [ ] 能够识别并防守对手威胁
- [ ] 能够利用双活三等组合棋型
- [ ] 开局合理（不盲目落子）
- [ ] 残局准确（不错过制胜着法）

### 9.4 稳定性验收
- [ ] 超时有降级方案
- [ ] 错误处理完善
- [ ] 边界情况处理正确
- [ ] 内存无泄漏
- [ ] 所有测试通过

### 9.5 用户体验验收
- [ ] AI思考时有明确提示
- [ ] 超时时有友好提示
- [ ] 错误时有清晰反馈
- [ ] 整体体验流畅
- [ ] 界面响应及时

---

**文档结束**

**下一步**: 开发Agent根据PL文档实现HardAI，测试Agent编写测试用例
