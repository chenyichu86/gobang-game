# 技术债偿还 #2: 禁手规则实现

**优先级**: 🔴 高优先级
**状态**: ⏸️ 待启动
**创建日期**: 2026-03-25
**来源**: Week 6遗漏（大师AI原计划包含禁手规则）

---

## 📋 工作对象（Work Object）定义

### 背景说明

**问题描述**:
Week 6实现MasterAI时，原计划包含禁手规则（三三、四四、长连），但实际开发中遗漏了该功能。禁手规则是五子棋竞技性的核心规则，用于平衡黑棋先手优势。

**业务价值**:
- ✅ 提升游戏竞技性
- ✅ 符合标准五子棋规则
- ✅ 平衡黑棋先手优势
- ✅ 增加AI挑战性

**禁手规则说明**:
1. **三三禁手**: 黑棋一子落下同时形成两个或多个活三
2. **四四禁手**: 黑棋一子落下同时形成两个或多个冲四
3. **长连禁手**: 黑棋一子落下形成六子或以上连珠

**规则适用**:
- ✅ 仅黑棋（先手）受禁手限制
- ✅ 白棋无禁手限制
- ✅ 禁手判定在落子前进行（禁止落子）
- ✅ 禁手判定用于AI和人类玩家

### 工作目标

**主要目标**:
1. 实现禁手规则检测逻辑
2. 集成到游戏规则引擎
3. AI避开禁手位置
4. UI提示禁手位置（可选）

**次要目标**:
- 禁手规则可配置（可选开关）
- 禁手位置可视化提示
- 禁手历史记录

### 成功标准

**门禁标准**:
- [ ] 禁手检测逻辑正确（三三、四四、长连）
- [ ] 禁手规则集成到游戏流程
- [ ] AI避开禁手位置
- [ ] 单元测试覆盖率100%
- [ ] Week 1-10的436个测试继续通过
- [ ] 无回归问题

**验收标准**:
- ✅ 三三禁手检测准确
- ✅ 四四禁手检测准确
- ✅ 长连禁手检测准确
- ✅ 仅黑棋受禁手限制
- ✅ 白棋无禁手限制
- ✅ AI不选择禁手位置
- ✅ 人类玩家无法落子禁手位置
- ✅ 禁手位置正确提示

---

## 🧪 测试用例设计

### TC-FM-01: 三三禁手检测（基本）

**测试场景**: 检测黑棋三三禁手

**测试步骤**:
1. 创建棋盘，设置当前玩家为黑棋
2. 放置白棋形成阻挡：
   - 白棋(6,7), (6,8)
3. 放置黑棋形成两个活三雏形：
   - 黑棋(7,6), (7,9)
   - 黑棋(8,7), (8,8)
4. 检测位置(7,7)是否为禁手
5. 验证(7,7)被判定为三三禁手
6. 验证无法在(7,7)落子

**预期结果**:
- (7,7)被判定为三三禁手
- 游戏禁止在(7,7)落子
- 错误提示:"该位置为禁手"

**棋盘状态**:
```
   6 7 8 9
6  . . . .
7  . X . X  (X=黑棋)
8  . O O .  (O=白棋)
9  . . . .
```
位置(7,7)会同时形成两个活三：(6,7)-(8,7)和(7,6)-(7,9)

**优先级**: P0

---

### TC-FM-02: 四四禁手检测（基本）

**测试场景**: 检测黑棋四四禁手

**测试步骤**:
1. 创建棋盘，设置当前玩家为黑棋
2. 放置棋子形成两个冲四雏形：
   - 黑棋(7,5), (7,6), (7,8), (7,9) - 缺(7,7)
   - 黑棋(5,7), (6,7), (8,7), (9,7) - 缺(7,7)
3. 检测位置(7,7)是否为禁手
4. 验证(7,7)被判定为四四禁手
5. 验证无法在(7,7)落子

**预期结果**:
- (7,7)被判定为四四禁手
- 游戏禁止在(7,7)落子

**棋盘状态**:
```
   5 6 7 8 9
5  . . X . .
6  . . X . .
7  X X . X X  (X=黑棋)
8  . . X . .
9  . . X . .
```
位置(7,7)会同时形成两个冲四

**优先级**: P0

---

### TC-FM-03: 长连禁手检测（基本）

**测试场景**: 检测黑棋长连禁手

**测试步骤**:
1. 创建棋盘，设置当前玩家为黑棋
2. 放置黑棋形成五连雏形：
   - 黑棋(7,3), (7,4), (7,5), (7,6), (7,8)
3. 检测位置(7,7)是否为禁手
4. 验证(7,7)被判定为长连禁手
5. 验证无法在(7,7)落子

**预期结果**:
- (7,7)被判定为长连禁手
- 游戏禁止在(7,7)落子

**棋盘状态**:
```
   3 4 5 6 7 8
7  X X X X . X  (X=黑棋)
```
位置(7,7)会形成六连：(7,3)-(7,8)

**优先级**: P0

---

### TC-FM-04: 白棋无禁手限制

**测试场景**: 验证白棋不受禁手限制

**测试步骤**:
1. 创建棋盘，设置当前玩家为白棋
2. 放置黑棋形成阻挡
3. 放置白棋形成三三/四四/长连雏形
4. 验证白棋可以正常落子
5. 验证白棋形成五连获胜

**预期结果**:
- 白棋不受禁手限制
- 白棋可以形成双三、双四、长连
- 白棋正常获胜

**优先级**: P0

---

### TC-FM-05: 混合禁手检测

**测试场景**: 检测黑棋同时形成多种禁手

**测试步骤**:
1. 创建棋盘，设置当前玩家为黑棋
2. 放置棋子形成三三+四四混合禁手
3. 检测目标位置是否为禁手
4. 验证禁手类型正确识别

**预期结果**:
- 目标位置被判定为禁手
- 禁手类型正确（三三、四四或混合）

**优先级**: P1

---

### TC-FM-06: AI避开禁手位置

**测试场景**: AI自动避开禁手位置

**测试步骤**:
1. 创建有禁手位置的棋盘
2. 触发AI计算（黑棋）
3. 验证AI不选择禁手位置
4. 验证AI选择合法位置

**预期结果**:
- AI识别禁手位置
- AI不选择禁手位置
- AI选择次优位置

**优先级**: P0

---

### TC-FM-07: 禁手规则可配置

**测试场景**: 禁手规则可以开关

**测试步骤**:
1. 配置禁手规则为"开启"
2. 验证黑棋受禁手限制
3. 配置禁手规则为"关闭"
4. 验证黑棋不受禁手限制
5. 配置禁手规则为"仅AI"
6. 验证AI避开禁手，人类玩家不受限制

**预期结果**:
- 禁手规则可以配置
- 配置正确生效

**优先级**: P2

---

### TC-FM-08: 禁手位置可视化

**测试场景**: UI显示禁手位置提示

**测试步骤**:
1. 创建有禁手位置的棋盘
2. 鼠标悬停在禁手位置
3. 验证显示禁手提示（红色标记）
4. 验证显示禁手类型（三三/四四/长连）
5. 鼠标移开，验证提示消失

**预期结果**:
- 禁手位置可视化
- 禁手类型正确显示
- 提示交互流畅

**优先级**: P2

---

### TC-FM-09: 边界条件测试

**测试场景**: 禁手检测边界条件

**测试步骤**:
1. 棋盘边缘位置禁手检测
2. 禁手位置被占用时的处理
3. 禁手位置在胜利线上的处理
4. 多个禁手位置的处理

**预期结果**:
- 边界条件正确处理
- 无逻辑错误

**优先级**: P1

---

### TC-FM-10: 性能测试

**测试场景**: 禁手检测性能

**测试步骤**:
1. 测量单次禁手检测时间
2. 测量全盘禁手扫描时间
3. 测量AI计算时禁手检测开销

**预期结果**:
- 单次检测<1ms
- 全盘扫描<10ms
- AI计算开销<10%

**优先级**: P1

---

## 🏗️ 实现设计

### 架构设计

```typescript
// src/game/rules/forbidden-moves.ts
export class ForbiddenMovesDetector {
  /**
   * 检测位置是否为禁手
   */
  detect(
    board: Board,
    position: Position,
    player: Player
  ): ForbiddenMoveResult {
    // 白棋无禁手
    if (player === 'white') {
      return { isForbidden: false };
    }

    // 黑棋检测三三、四四、长连
    const threeThree = this.detectThreeThree(board, position);
    const fourFour = this.detectFourFour(board, position);
    const overline = this.detectOverline(board, position);

    if (threeThree || fourFour || overline) {
      return {
        isForbidden: true,
        type: threeThree ? 'three-three' : fourFour ? 'four-four' : 'overline',
      };
    }

    return { isForbidden: false };
  }

  /**
   * 检测三三禁手
   */
  private detectThreeThree(board: Board, position: Position): boolean {
    // 检测四个方向
    // 如果同时形成2个或多个活三，则为禁手
    const openThrees = this.countOpenThrees(board, position);
    return openThrees >= 2;
  }

  /**
   * 检测四四禁手
   */
  private detectFourFour(board: Board, position: position: Position): boolean {
    // 检测四个方向
    // 如果同时形成2个或多个冲四，则为禁手
    const fours = this.countFours(board, position);
    return fours >= 2;
  }

  /**
   * 检测长连禁手
   */
  private detectOverline(board: Board, position: Position): boolean {
    // 检测四个方向
    // 如果任意方向形成6子或以上连珠，则为禁手
    const directions = [
      [1, 0], [0, 1], [1, 1], [1, -1]
    ];

    for (const [dx, dy] of directions) {
      const count = this.countConsecutive(board, position, dx, dy);
      if (count >= 6) {
        return true;
      }
    }

    return false;
  }

  /**
   * 计算某个方向的连续棋子数
   */
  private countConsecutive(
    board: Board,
    position: Position,
    dx: number,
    dy: number
  ): number {
    let count = 1; // 当前位置
    const player = board.getPiece(position);

    // 正向查找
    for (let i = 1; i < 15; i++) {
      const pos = { x: position.x + dx * i, y: position.y + dy * i };
      if (board.getPiece(pos) === player) {
        count++;
      } else {
        break;
      }
    }

    // 反向查找
    for (let i = 1; i < 15; i++) {
      const pos = { x: position.x - dx * i, y: position.y - dy * i };
      if (board.getPiece(pos) === player) {
        count++;
      } else {
        break;
      }
    }

    return count;
  }

  /**
   * 计算活三数量
   */
  private countOpenThrees(board: Board, position: Position): number {
    // 活三定义：两端都空，且可以形成活四
    // 实现细节...
    let count = 0;
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

    for (const [dx, dy] of directions) {
      if (this.isOpenThree(board, position, dx, dy)) {
        count++;
      }
    }

    return count;
  }

  /**
   * 判断是否为活三
   */
  private isOpenThree(
    board: Board,
    position: Position,
    dx: number,
    dy: number
  ): boolean {
    // 实现细节...
    // 检查两端是否为空
    // 检查是否能形成活四
    return false; // 待实现
  }

  /**
   * 计算冲四数量
   */
  private countFours(board: Board, position: Position): number {
    // 冲四定义：一端被堵，可以形成五连
    // 实现细节...
    let count = 0;
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

    for (const [dx, dy] of directions) {
      if (this.isFour(board, position, dx, dy)) {
        count++;
      }
    }

    return count;
  }

  /**
   * 判断是否为冲四
   */
  private isFour(
    board: Board,
    position: Position,
    dx: number,
    dy: number
  ): boolean {
    // 实现细节...
    return false; // 待实现
  }
}

export interface ForbiddenMoveResult {
  isForbidden: boolean;
  type?: 'three-three' | 'four-four' | 'overline';
}
```

### 集成到游戏规则引擎

```typescript
// src/game/core/rules.ts
import { ForbiddenMovesDetector } from '../rules/forbidden-moves';

export class GameRules {
  private forbiddenDetector: ForbiddenMovesDetector;

  constructor() {
    this.forbiddenDetector = new ForbiddenMovesDetector();
  }

  /**
   * 验证落子是否合法
   */
  validateMove(
    board: Board,
    position: Position,
    player: Player
  ): MoveValidationResult {
    // 原有验证逻辑
    if (!this.isValidPosition(position)) {
      return { valid: false, error: '位置超出棋盘' };
    }

    if (!board.isEmpty(position)) {
      return { valid: false, error: '位置已被占用' };
    }

    // 新增：禁手检测
    const forbiddenResult = this.forbiddenDetector.detect(board, position, player);
    if (forbiddenResult.isForbidden) {
      const typeMap = {
        'three-three': '三三禁手',
        'four-four': '四四禁手',
        'overline': '长连禁手',
      };
      return {
        valid: false,
        error: `该位置为${typeMap[forbiddenResult.type!]}`,
        forbiddenType: forbiddenResult.type,
      };
    }

    return { valid: true };
  }
}
```

### AI集成

```typescript
// src/game/ai/base-ai.ts
export class BaseAI {
  /**
   * 获取所有合法落子位置
   */
  protected getLegalMoves(board: Board, player: Player): Position[] {
    const moves: Position[] = [];
    const rules = new GameRules();

    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        const position = { x, y };

        // 检查位置是否为空
        if (!board.isEmpty(position)) {
          continue;
        }

        // 检查是否为禁手
        const validation = rules.validateMove(board, position, player);
        if (validation.valid) {
          moves.push(position);
        }
      }
    }

    return moves;
  }
}
```

### UI集成（可选）

```typescript
// src/components/Board/PiecesLayer.tsx
export const PiecesLayer: React.FC<Props> = ({ board, currentPlayer }) => {
  const [forbiddenPositions, setForbiddenPositions] = useState<Set<string>>(new Set());

  // 计算禁手位置
  useEffect(() => {
    if (currentPlayer === 'black') {
      const forbidden = new ForbiddenMovesDetector();
      const positions = new Set<string>();

      for (let y = 0; y < 15; y++) {
        for (let x = 0; x < 15; x++) {
          const pos = { x, y };
          if (board.isEmpty(pos)) {
            const result = forbidden.detect(board, pos, 'black');
            if (result.isForbidden) {
              positions.add(`${x},${y}`);
            }
          }
        }
      }

      setForbiddenPositions(positions);
    } else {
      setForbiddenPositions(new Set());
    }
  }, [board, currentPlayer]);

  return (
    <Layer>
      {/* 渲染棋子 */}
      {/* 渲染禁手标记 */}
      {Array.from(forbiddenPositions).map(key => {
        const [x, y] = key.split(',').map(Number);
        return (
          <ForbiddenMarker
            key={key}
            x={x}
            y={y}
            cellSize={cellSize}
          />
        );
      })}
    </Layer>
  );
};
```

---

## 📝 配置选项

```typescript
// src/types/game.ts
export interface GameConfig {
  // 禁手规则配置
  forbiddenMoves: {
    enabled: boolean;         // 是否启用禁手规则
    mode: 'all' | 'ai-only';  // all: AI和人类都受限, ai-only: 仅AI受限
    visualHint: boolean;      // 是否显示禁手提示
  };
}
```

---

## ✅ 验收清单

### 功能验收
- [ ] 三三禁手检测准确
- [ ] 四四禁手检测准确
- [ ] 长连禁手检测准确
- [ ] 白棋无禁手限制
- [ ] AI避开禁手位置
- [ ] 人类玩家无法落子禁手位置
- [ ] 禁手位置可视化提示（可选）

### 测试验收
- [ ] 单元测试覆盖率100%
- [ ] 10个测试用例全部通过
- [ ] Week 1-10的436个测试继续通过
- [ ] 无回归问题

### 性能验收
- [ ] 单次禁手检测<1ms
- [ ] 全盘扫描<10ms
- [ ] AI计算开销<10%

### 文档验收
- [ ] 禁手规则文档
- [ ] 实现设计文档
- [ ] 测试报告

---

## 📊 工作量估算

| 任务 | 工作量 | 优先级 |
|------|--------|--------|
| 禁手检测算法设计 | 4小时 | P0 |
| ForbiddenMovesDetector实现 | 6小时 | P0 |
| 集成到GameRules | 2小时 | P0 |
| AI集成（避开禁手） | 2小时 | P0 |
| 单元测试编写（10个） | 4小时 | P0 |
| UI集成（禁手提示） | 2小时 | P2 |
| 配置选项实现 | 1小时 | P2 |
| 集成测试和修复 | 4小时 | P0 |
| 文档编写 | 2小时 | P1 |
| **总计** | **27小时** (~3.5天) | - |

---

## 🚧 风险和依赖

### 风险
1. **算法复杂度** - 禁手检测算法可能较复杂
   - 缓解: 参考开源五子棋实现，使用成熟算法

2. **性能影响** - 禁手检测可能影响AI性能
   - 缓解: 优化算法，使用缓存

3. **规则理解** - 禁手规则可能有歧义
   - 缓解: 参考国际五子棋规则标准

### 依赖
- ✅ 游戏规则引擎（GameRules）已存在
- ✅ AI系统已存在
- ✅ 无外部依赖

---

## 📅 执行计划

### Day 1: 算法设计和核心实现
- [ ] 研究禁手规则标准
- [ ] 设计ForbiddenMovesDetector类
- [ ] 实现三三禁手检测
- [ ] 实现四四禁手检测
- [ ] 实现长连禁手检测

### Day 2: 集成和测试
- [ ] 集成到GameRules
- [ ] AI集成（避开禁手）
- [ ] 编写单元测试（10个）
- [ ] 运行测试并修复问题

### Day 3: UI和文档
- [ ] UI集成（禁手提示）
- [ ] 配置选项实现
- [ ] 集成测试
- [ ] 文档编写
- [ ] 回归测试（436个单元测试）

---

## 📚 参考资料

### 五子棋禁手规则
- [Renju Rules](https://www.renju.net/rules/)
- [Gomoku Forbidden Moves](https://en.wikipedia.org/wiki/Gomoku)

### 开源实现
- [五子棋AI开源项目](https://github.com/lihongxun945/gobang)
- [Renju Solver](https://github.com/zhulf/renju-solver)

---

**文档版本**: v1.0
**创建日期**: 2026-03-25
**创建者**: PM Agent
**状态**: ⏸️ 待启动
**下一步**: 完成E2E测试后启动
