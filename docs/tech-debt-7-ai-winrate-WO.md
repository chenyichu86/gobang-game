# 技术债偿还 #7: AI胜率测试

**优先级**: 🟢 低优先级
**状态**: ⏸️ 待启动
**创建日期**: 2026-03-25
**来源**: Week 6遗漏

---

## 📋 工作对象（Work Object）定义

### 背景说明

**问题描述**:
Week 6实现HardAI和MasterAI时，原计划测试AI胜率，但未实际测试。不知道AI实际强度是否符合预期。

**业务价值**:
- ✅ 验证AI强度
- ✅ 平衡AI难度
- ✅ 发现AI问题

### 工作目标

**主要目标**:
1. SimpleAI vs MediumAI（胜率预期: MediumAI 70%+）
2. MediumAI vs HardAI（胜率预期: HardAI 60%+）
3. HardAI vs MasterAI（胜率预期: MasterAI 55%+）

### 成功标准

**门禁标准**:
- [ ] AI对战测试完成
- [ ] 胜率数据记录
- [ ] AI强度符合预期
- [ ] 无严重Bug

**验收标准**:
- ✅ MediumAI胜SimpleAI >70%
- ✅ HardAI胜MediumAI >60%
- ✅ MasterAI胜HardAI >55%
- ✅ AI性能达标（响应时间）

---

## 🤖 AI对战测试设计

### 测试1: SimpleAI vs MediumAI

**测试配置**:
- SimpleAI: 黑棋（先手）
- MediumAI: 白棋（后手）
- 对局数: 100局

**预期胜率**:
- MediumAI胜率: >70%
- SimpleAI胜率: <30%

**测试代码**:
```typescript
// src/__tests__/week-10/ai-winrate.test.ts
import { test } from 'vitest';
import { createAIClient } from '../../game/ai/ai-client';
import { Board } from '../../game/core/board';

test.describe('AI胜率测试: SimpleAI vs MediumAI', () => {
  test('MediumAI应胜SimpleAI 70%+', async () => {
    const simpleAI = await createAIClient('simple');
    const mediumAI = await createAIClient('medium');

    let simpleWins = 0;
    let mediumWins = 0;
    let draws = 0;

    for (let i = 0; i < 100; i++) {
      const board = new Board();
      const result = await playAIGame(board, simpleAI, mediumAI);

      if (result.winner === 'black') simpleWins++;
      else if (result.winner === 'white') mediumWins++;
      else draws++;
    }

    const mediumWinRate = (mediumWins / 100) * 100;
    console.log(`SimpleAI vs MediumAI: ${simpleWins}-${mediumWins}-${draws}`);
    console.log(`MediumAI胜率: ${mediumWinRate}%`);

    expect(mediumWinRate).toBeGreaterThan(70);
  });
});
```

---

### 测试2: MediumAI vs HardAI

**测试配置**:
- MediumAI: 黑棋（先手）
- HardAI: 白棋（后手）
- 对局数: 100局

**预期胜率**:
- HardAI胜率: >60%
- MediumAI胜率: <40%

---

### 测试3: HardAI vs MasterAI

**测试配置**:
- HardAI: 黑棋（先手）
- MasterAI: 白棋（后手）
- 对局数: 50局（MasterAI较慢）

**预期胜率**:
- MasterAI胜率: >55%
- HardAI胜率: <45%

---

## 🧪 辅助函数

```typescript
// src/__tests__/utils/ai-game-utils.ts
import { createAIClient, type AIType } from '../../game/ai/ai-client';
import { Board } from '../../game/core/board';
import { GameEngine } from '../../game/core/game-engine';

interface AIGameResult {
  winner: 'black' | 'white' | null;
  moves: number;
  duration: number;
}

export async function playAIGame(
  board: Board,
  blackAI: AIType,
  whiteAI: AIType,
  maxMoves: number = 225
): Promise<AIGameResult> {
  const engine = new GameEngine();
  engine.startGame();

  const blackAIClient = await createAIClient(blackAI);
  const whiteAIClient = await createAIClient(whiteAI);

  const startTime = performance.now();
  let moves = 0;

  while (engine.getGameStatus() === 'playing' && moves < maxMoves) {
    const currentPlayer = engine.getCurrentPlayer();
    const aiClient = currentPlayer === 'black' ? blackAIClient : whiteAIClient;

    const response = await aiClient.calculateMove({
      boardData: (engine.getBoard() as any).cells,
      player: currentPlayer,
    });

    if (response.success && response.position) {
      engine.makeMove(response.position);
      moves++;
    } else {
      break;
    }
  }

  const duration = performance.now() - startTime;
  const winner = engine.getWinner();

  return { winner, moves, duration };
}

export function playAITournament(
  ai1: AIType,
  ai2: AIType,
  games: number
): Promise<{
  ai1Wins: number;
  ai2Wins: number;
  draws: number;
  ai1WinRate: number;
  ai2WinRate: number;
}> {
  let ai1Wins = 0;
  let ai2Wins = 0;
  let draws = 0;

  for (let i = 0; i < games; i++) {
    const board = new Board();
    const result = await playAIGame(board, ai1, ai2);

    if (result.winner === 'black') ai1Wins++;
    else if (result.winner === 'white') ai2Wins++;
    else draws++;
  }

  return {
    ai1Wins,
    ai2Wins,
    draws,
    ai1WinRate: (ai1Wins / games) * 100,
    ai2WinRate: (ai2Wins / games) * 100,
  };
}
```

---

## 📊 测试报告模板

```markdown
# AI胜率测试报告

## 测试配置
- 测试日期: 2026-03-25
- 测试环境: CPU, RAM
- 对局数: 100局（每组）

## 测试结果

### SimpleAI vs MediumAI
- SimpleAI胜: 23局
- MediumAI胜: 72局
- 和棋: 5局
- **MediumAI胜率: 72%** ✅ 符合预期（>70%）

### MediumAI vs HardAI
- MediumAI胜: 35局
- HardAI胜: 60局
- 和棋: 5局
- **HardAI胜率: 60%** ✅ 符合预期（>60%）

### HardAI vs MasterAI
- HardAI胜: 20局
- MasterAI胜: 28局
- 和棋: 2局
- **MasterAI胜率: 56%** ✅ 符合预期（>55%）

## 性能统计

| AI | 平均响应时间 | 最大响应时间 |
|----|-------------|-------------|
| SimpleAI | 5ms | 8ms |
| MediumAI | 18ms | 25ms |
| HardAI | 1.8s | 2.5s |
| MasterAI | 8.5s | 9.8s |

## 结论
✅ 所有AI强度符合预期
✅ AI性能达标
✅ 无严重Bug
```

---

## ✅ 验收清单

### 功能验收
- [ ] AI对战测试完成
- [ ] 胜率数据记录
- [ ] 性能数据记录

### 质量验收
- [ ] AI强度符合预期
- [ ] AI性能达标
- [ ] 无逻辑错误

### 文档验收
- [ ] 测试报告完整
- [ ] 数据分析准确

---

## 📊 工作量估算

| 任务 | 工作量 | 优先级 |
|------|--------|--------|
| AI对战辅助函数 | 2小时 | P0 |
| Simple vs Medium测试 | 1小时 | P0 |
| Medium vs Hard测试 | 1小时 | P0 |
| Hard vs Master测试 | 2小时 | P0 |
| 数据分析和报告 | 2小时 | P1 |
| **总计** | **8小时** (~1天) | - |

---

**文档版本**: v1.0
**创建日期**: 2026-03-25
**创建者**: PM Agent
**状态**: ⏸️ 待启动
**下一步**: 完成中优先级任务后启动
