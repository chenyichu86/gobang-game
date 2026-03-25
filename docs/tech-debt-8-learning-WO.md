# 技术债偿还 #8: AI学习功能

**优先级**: 🟢 低优先级（可选）
**状态**: ⏸️ 待启动
**创建日期**: 2026-03-25
**来源**: Week 6遗漏（标注"可选"）

---

## 📋 工作对象（Work Object）定义

### 背景说明

**问题描述**:
Week 6原计划包含AI学习功能（记录玩家常用招式），但未实现。这是标注为"可选"的功能。

**业务价值**:
- ✅ AI个性化
- ✅ 增加挑战性
- ✅ 提升重玩价值

### 工作目标

**主要目标**:
1. 记录玩家落子习惯
2. AI针对性防守

**次要目标**:
3. 学习数据持久化
4. 学习效果可视化

### 成功标准

**门禁标准**:
- [ ] 学习系统正常工作
- [ ] AI能针对玩家习惯
- [ ] 无性能影响
- [ ] Week 1-10测试继续通过

**验收标准**:
- ✅ 记录玩家常用开局
- ✅ 记录玩家攻击模式
- ✅ AI针对性防守有效

---

## 🧠 学习系统设计

### 学习数据结构

```typescript
// src/types/learning.ts
export interface PlayerPattern {
  // 常用开局
  commonOpenings: {
    position: Position;
    count: number;
    winRate: number;
  }[];

  // 攻击模式
  attackPatterns: {
    positions: Position[];
    count: number;
    winRate: number;
  }[];

  // 防守弱点
  defensiveWeaknesses: {
    position: Position;
    lossCount: number;
  }[];
}

export interface LearningData {
  playerId: string;
  patterns: PlayerPattern;
  lastUpdated: number;
}
```

### 学习系统实现

```typescript
// src/services/learning-service.ts
export class LearningService {
  private learningData: Map<string, LearningData>;

  constructor() {
    this.learningData = new Map();
  }

  /**
   * 记录玩家落子
   */
  recordMove(playerId: string, position: Position, moveNumber: number) {
    let data = this.learningData.get(playerId);

    if (!data) {
      data = {
        playerId,
        patterns: {
          commonOpenings: [],
          attackPatterns: [],
          defensiveWeaknesses: [],
        },
        lastUpdated: Date.now(),
      };
      this.learningData.set(playerId, data);
    }

    // 记录开局（前5手）
    if (moveNumber <= 5) {
      this.recordOpening(data, position);
    }

    // 记录攻击模式
    this.recordAttackPattern(data, position);

    data.lastUpdated = Date.now();
  }

  /**
   * 记录开局
   */
  private recordOpening(data: LearningData, position: Position) {
    const existing = data.patterns.commonOpenings.find(
      (o) => o.position.x === position.x && o.position.y === position.y
    );

    if (existing) {
      existing.count++;
    } else {
      data.patterns.commonOpenings.push({
        position,
        count: 1,
        winRate: 0,
      });
    }
  }

  /**
   * 记录攻击模式
   */
  private recordAttackPattern(data: LearningData, position: Position) {
    // 实现细节...
  }

  /**
   * 记录游戏结果
   */
  recordGameResult(
    playerId: string,
    winner: Player,
    moves: Position[]
  ) {
    const data = this.learningData.get(playerId);
    if (!data) return;

    // 更新开局的胜率
    data.patterns.commonOpenings.forEach((opening) => {
      if (moves[0].x === opening.position.x && moves[0].y === opening.position.y) {
        if (winner === 'black') {
          opening.winRate = (opening.winRate * opening.count + 1) / (opening.count + 1);
        } else {
          opening.winRate = (opening.winRate * opening.count) / (opening.count + 1);
        }
      }
    });

    data.lastUpdated = Date.now();
  }

  /**
   * 获取玩家弱点
   */
  getWeaknesses(playerId: string): Position[] {
    const data = this.learningData.get(playerId);
    if (!data) return [];

    // 返回防守弱点位置
    return data.patterns.defensiveWeaknesses.map((w) => w.position);
  }

  /**
   * 获取玩家常用开局
   */
  getCommonOpenings(playerId: string): Position[] {
    const data = this.learningData.get(playerId);
    if (!data) return [];

    // 返回最常用的3个开局
    return data.patterns.commonOpenings
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((o) => o.position);
  }
}
```

### AI集成

```typescript
// src/game/ai/learning-ai.ts
export class LearningAI extends BaseAI {
  private learningService: LearningService;

  constructor(
    learningService: LearningService,
    evaluator: BoardEvaluator,
    generator: MoveGenerator
  ) {
    super(evaluator, generator);
    this.learningService = learningService;
  }

  async calculateMove(
    board: Board,
    player: Player,
    customSeed?: number
  ): Promise<Position> {
    const playerId = 'current-player'; // 实际应从上下文获取

    // 获取玩家常用开局
    const commonOpenings = this.learningService.getCommonOpenings(playerId);

    // 获取玩家弱点
    const weaknesses = this.learningService.getWeaknesses(playerId);

    // 生成候选着法
    const candidates = this.generator.generateCandidates(board);

    // 针对性调整候选着法评分
    const adjustedCandidates = candidates.map((candidate) => {
      let score = candidate.score;

      // 如果玩家常用这个位置，降低评分（避免给玩家机会）
      if (commonOpenings.some((o) => o.x === candidate.position.x && o.y === candidate.position.y)) {
        score *= 0.9;
      }

      // 如果这是玩家弱点，提高评分（攻击玩家弱点）
      if (weaknesses.some((w) => w.x === candidate.position.x && w.y === candidate.position.y)) {
        score *= 1.1;
      }

      return { ...candidate, score };
    });

    // 选择最佳着法
    adjustedCandidates.sort((a, b) => b.score - a.score);
    return adjustedCandidates[0].position;
  }
}
```

---

## 🧪 测试用例设计

### TC-LEARN-01: 记录玩家落子

**测试步骤**:
1. 玩家落子(7,7)
2. 验证学习数据记录

**预期结果**:
- 学习数据包含(7,7)

**优先级**: P0

---

### TC-LEARN-02: 学习数据持久化

**测试步骤**:
1. 玩家完成一局
2. 刷新页面
3. 验证学习数据保留

**预期结果**:
- 学习数据持久化

**优先级**: P1

---

### TC-LEARN-03: AI针对性防守

**测试步骤**:
1. 玩家常用(7,7)开局
2. 启用学习AI
3. 验证AI避开(7,7)

**预期结果**:
- AI选择其他位置

**优先级**: P0

---

## ✅ 验收清单

### 功能验收
- [ ] 学习系统正常记录
- [ ] AI针对性防守有效
- [ ] 学习数据持久化

### 性能验收
- [ ] 学习计算<10ms
- [ ] 无内存泄漏
- [ ] 不影响AI性能

### 用户体验验收
- [ ] AI更智能
- [ ] 挑战性增加
- [ ] 无明显Bug

---

## 📊 工作量估算

| 任务 | 工作量 | 优先级 |
|------|--------|--------|
| 学习数据结构设计 | 1小时 | P0 |
| LearningService实现 | 4小时 | P0 |
| AI集成 | 2小时 | P0 |
| 数据持久化 | 2小时 | P1 |
| 测试编写 | 2小时 | P0 |
| 优化和修复 | 2小时 | P1 |
| **总计** | **13小时** (~1.5-2天) | - |

---

**文档版本**: v1.0
**创建日期**: 2026-03-25
**创建者**: PM Agent
**状态**: ⏸️ 待启动
**下一步**: 完成AI胜率测试后启动
