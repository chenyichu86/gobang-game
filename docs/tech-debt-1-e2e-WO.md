# 技术债偿还 #1: E2E测试实现

**优先级**: 🔴 高优先级
**状态**: ⏸️ 待启动
**创建日期**: 2026-03-25
**来源**: Week 4遗留（延后到Week 5-6，一直未实现）

---

## 📋 工作对象（Work Object）定义

### 背景说明

**问题描述**:
Week 4配置了Playwright E2E测试框架，但实际测试用例一直未编写。原计划Week 5-6补充，但Week 5-6专注于HardAI和MasterAI开发，E2E测试一直延后至今。

**影响评估**:
- 🟡 单元测试覆盖充分（436个测试），核心功能风险可控
- 🔴 缺少端到端流程验证，用户实际使用场景未充分测试
- 🔴 跨浏览器兼容性未验证
- 🔴 移动端体验未验证

**业务价值**:
- ✅ 验证完整用户流程（登录→游戏→结束）
- ✅ 确保多页面交互正常
- ✅ 发现单元测试无法捕获的集成问题
- ✅ 保证发布质量

### 工作目标

**主要目标**:
1. 编写9个E2E测试用例（Week 4原计划）
2. 验证所有测试通过
3. 确保测试执行时间<60秒

**次要目标**:
- E2E测试覆盖率>80%（用户流程）
- 测试可维护性高（代码清晰、易于修改）

### 成功标准

**门禁标准**:
- [ ] 9个E2E测试全部通过
- [ ] 测试执行时间<60秒
- [ ] Week 1-10的436个单元测试继续通过
- [ ] 测试代码质量高（可读性、可维护性）
- [ ] 发现并修复所有集成问题

**验收标准**:
- ✅ PvP对局完整流程测试通过
- ✅ PvE对局完整流程测试通过
- ✅ 提示功能使用测试通过
- ✅ 悔棋功能使用测试通过
- ✅ 游戏记录查看测试通过
- ✅ 游戏回放播放测试通过
- ✅ 响应式测试通过
- ✅ 多模式切换测试通过
- ✅ 边界条件测试通过

---

## 🧪 测试用例设计

### TC-E2E-01: PvP对局完整流程

**测试场景**: 两名本地玩家完成一局完整游戏

**测试步骤**:
1. 启动应用，进入主菜单
2. 选择"双人对战"模式
3. 点击"开始游戏"
4. 黑棋玩家落子 (7, 7)
5. 验证状态显示"白棋回合"
6. 白棋玩家落子 (7, 8)
7. 验证状态显示"黑棋回合"
8. 重复落子直到一方获胜
9. 验证胜利提示显示正确
10. 验证棋盘上有胜利连线标记

**预期结果**:
- 游戏正常进行
- 回合切换正确
- 胜利检测准确
- UI显示正确

**测试数据**:
- 黑棋落子路径: (7,7) → (7,8) → (8,7) → (8,8) → (9,7)
- 白棋落子路径: (7,8) → (8,7) → (8,8) → (9,7)
- 黑棋五连获胜

**优先级**: P0

---

### TC-E2E-02: PvE对局完整流程（SimpleAI）

**测试场景**: 玩家与SimpleAI完成一局游戏

**测试步骤**:
1. 启动应用，进入主菜单
2. 选择"人机对战"模式
3. 选择难度"简单"
4. 选择"玩家先手"
5. 点击"开始游戏"
6. 玩家落子 (7, 7)
7. 验证AI自动落子（响应时间<10ms）
8. 验证状态显示"玩家回合"
9. 继续游戏直到结束
10. 验证游戏结果正确显示

**预期结果**:
- AI正常响应
- AI落子合法
- 游戏流程正常
- 结果显示正确

**测试数据**:
- 玩家先手
- AI难度: simple
- 验证AI响应时间<10ms

**优先级**: P0

---

### TC-E2E-03: PvE对局完整流程（MasterAI）

**测试场景**: 玩家与MasterAI完成一局游戏

**测试步骤**:
1. 启动应用，进入主菜单
2. 选择"人机对战"模式
3. 选择难度"大师"
4. 选择"AI先手"
5. 点击"开始游戏"
6. 验证AI自动落子（响应时间<10秒）
7. 玩家落子 (7, 7)
8. 验证AI自动落子（响应时间<10秒）
9. 继续游戏直到结束
10. 验证游戏结果正确显示

**预期结果**:
- MasterAI正常响应
- AI落子合法且有策略
- 游戏流程正常
- 结果显示正确

**测试数据**:
- AI先手
- AI难度: master
- 验证AI响应时间<10秒

**优先级**: P0

---

### TC-E2E-04: 提示功能使用

**测试场景**: 玩家使用AI提示功能

**测试步骤**:
1. 启动PvE游戏（中等难度）
2. 玩家落子 (7, 7)
3. AI响应 (7, 8)
4. 点击"提示"按钮
5. 验证提示标记显示在棋盘上（推荐位置）
6. 玩家点击提示位置落子
7. 验证提示标记消失
8. 验证剩余提示次数减少1

**预期结果**:
- 提示功能正常
- 提示位置合理
- 提示标记显示正确
- 提示次数正确扣除

**测试数据**:
- 初始提示次数: 3
- 使用后剩余: 2

**优先级**: P1

---

### TC-E2E-05: 悔棋功能使用

**测试场景**: 玩家使用悔棋功能

**测试步骤**:
1. 启动PvE游戏（简单难度）
2. 玩家落子 (7, 7)
3. AI响应 (7, 8)
4. 玩家落子 (8, 8)
5. AI响应 (8, 9)
6. 点击"悔棋"按钮
7. 验证棋盘状态回到步骤2（撤销玩家和AI各一步）
8. 验证回合回到玩家
9. 验证悔棋次数显示更新

**预期结果**:
- 悔棋功能正常
- 撤销2步（玩家+AI）
- 棋盘状态正确恢复
- 回合正确切换
- 悔棋次数正确

**测试数据**:
- PvE悔棋: 撤销2步
- 初始悔棋次数: 无限制

**优先级**: P1

---

### TC-E2E-06: PvP悔棋功能

**测试场景**: 双人对战中玩家使用悔棋

**测试步骤**:
1. 启动PvP游戏
2. 黑棋落子 (7, 7)
3. 白棋落子 (7, 8)
4. 黑棋落子 (8, 8)
5. 点击"悔棋"按钮
6. 验证棋盘状态回到步骤3（撤销黑棋一步）
7. 验证回合回到黑棋
8. 验证黑棋悔棋次数减少1

**预期结果**:
- PvP悔棋功能正常
- 撤销1步
- 棋盘状态正确恢复
- 回合正确切换
- 每方悔棋次数独立计算

**测试数据**:
- PvP悔棋: 撤销1步
- 黑棋悔棋次数: 1
- 白棋悔棋次数: 0

**优先级**: P1

---

### TC-E2E-07: 游戏记录查看

**测试场景**: 玩家查看历史游戏记录

**测试步骤**:
1. 完成2局完整游戏（PvP和PvE各1局）
2. 返回主菜单
3. 点击"游戏记录"按钮
4. 验证游戏记录列表显示2条记录
5. 验证记录信息正确（日期、模式、结果）
6. 点击第一条记录
7. 验证游戏详情页显示正确
8. 点击"返回"按钮

**预期结果**:
- 游戏记录正确保存
- 记录列表正确显示
- 记录详情正确显示
- 导航功能正常

**测试数据**:
- 记录1: PvP, 黑棋胜, 2026-03-25
- 记录2: PvE (simple), 玩家胜, 2026-03-25

**优先级**: P1

---

### TC-E2E-08: 游戏回放播放

**测试场景**: 玩家回放历史游戏

**测试步骤**:
1. 进入"游戏记录"页面
2. 选择一条记录
3. 点击"回放"按钮
4. 验证进入回放模式
5. 点击"播放"按钮
6. 验证棋子按顺序落下（自动播放）
7. 点击"暂停"按钮
8. 验证回放暂停
9. 点击"上一步"按钮
10. 验证回退一步
11. 点击"下一步"按钮
12. 验证前进一步
13. 调整播放速度为2x
14. 验证播放速度加快
15. 点击"返回"按钮

**预期结果**:
- 回放功能正常
- 播放控制正常（播放、暂停、上一步、下一步）
- 速度调节正常
- 导航功能正常

**测试数据**:
- 回放速度: 0.25x, 0.5x, 1x, 2x, 5x

**优先级**: P2

---

### TC-E2E-09: 多模式切换

**测试场景**: 玩家在不同游戏模式间切换

**测试步骤**:
1. 启动PvE游戏（简单难度）
2. 落子2步后
3. 点击"返回主菜单"按钮
4. 验证确认对话框显示
5. 点击"确定"
6. 验证返回主菜单
7. 切换到PvP模式
8. 启动PvP游戏
9. 验证PvP游戏正常
10. 返回主菜单
11. 切换到PvE模式（大师难度）
12. 启动PvE游戏
13. 验证PvE游戏正常

**预期结果**:
- 模式切换功能正常
- 游戏状态正确清理
- 无内存泄漏
- 无状态残留

**测试数据**:
- 模式切换顺序: PvE(simple) → PvP → PvE(master)

**优先级**: P1

---

## 📝 实现细节

### 技术栈

- **测试框架**: Playwright (已配置)
- **断言库**: Playwright内置Expect
- **测试运行器**: Playwright Test Runner
- **并发执行**: 支持（默认parallel: true）

### 文件结构

```
tests/
├── e2e/
│   ├── pvp-game.spec.ts          # TC-E2E-01, TC-E2E-06
│   ├── pve-game-simple.spec.ts   # TC-E2E-02
│   ├── pve-game-master.spec.ts   # TC-E2E-03
│   ├── hint-feature.spec.ts      # TC-E2E-04
│   ├── undo-feature.spec.ts      # TC-E2E-05
│   ├── game-records.spec.ts      # TC-E2E-07, TC-E2E-08
│   └── mode-switch.spec.ts       # TC-E2E-09
├── fixtures/
│   └── test-fixtures.ts          # 测试辅助函数
└── playwright.config.ts          # Playwright配置（已存在）
```

### 关键选择器（需要验证）

```typescript
// 页面元素选择器
const SELECTORS = {
  // 主菜单
  mainMenu: '[data-testid="main-menu"]',
  pvpModeButton: '[data-testid="pvp-mode-button"]',
  pveModeButton: '[data-testid="pve-mode-button"]',
  startGameButton: '[data-testid="start-game-button"]',

  // 游戏界面
  gameBoard: '.konvajs-content', // Konva Canvas
  statusIndicator: '[data-testid="status-indicator"]',
  timer: '[data-testid="game-timer"]',

  // 控制按钮
  undoButton: '[data-testid="undo-button"]',
  hintButton: '[data-testid="hint-button"]',
  returnToMenuButton: '[data-testid="return-to-menu-button"]',

  // 提示相关
  hintMarker: '[data-testid="hint-marker"]',

  // 游戏记录
  gameRecordsButton: '[data-testid="game-records-button"]',
  gameRecordList: '[data-testid="game-record-list"]',
  gameRecordDetail: '[data-testid="game-record-detail"]',
  replayButton: '[data-testid="replay-button"]',

  // 回放控制
  playButton: '[data-testid="replay-play"]',
  pauseButton: '[data-testid="replay-pause"]',
  stepForwardButton: '[data-testid="replay-step-forward"]',
  stepBackwardButton: '[data-testid="replay-step-backward"]',
  speedSelect: '[data-testid="replay-speed"]',
};
```

### 测试辅助函数

```typescript
// tests/fixtures/test-fixtures.ts
import { test as base } from '@playwright/test';

export const test = base.extend<{
  startPvPGame: () => Promise<void>;
  startPvEGame: (difficulty: string) => Promise<void>;
  makeMove: (x: number, y: number) => Promise<void>;
  waitForAI: () => Promise<void>;
  cleanupGame: () => Promise<void>;
}>({
  startPvPGame: async ({ page }, use) => {
    await use(async () => {
      await page.click('[data-testid="pvp-mode-button"]');
      await page.click('[data-testid="start-game-button"]');
      await page.waitForSelector('[data-testid="status-indicator"]');
    });
  },

  startPvEGame: async ({ page }, use) => {
    await use(async (difficulty: 'simple' | 'medium' | 'hard' | 'master') => {
      await page.click('[data-testid="pve-mode-button"]');
      await page.selectOption('[data-testid="ai-difficulty"]', difficulty);
      await page.click('[data-testid="start-game-button"]');
      await page.waitForSelector('[data-testid="status-indicator"]');
    });
  },

  makeMove: async ({ page }, use) => {
    await use(async (x: number, y: number) => {
      const board = page.locator('.konvajs-content');
      const box = await board.boundingBox();
      const cellSize = box!.width / 15;

      await board.click({
        position: {
          x: x * cellSize + cellSize / 2,
          y: y * cellSize + cellSize / 2,
        },
      });
    });
  },

  waitForAI: async ({ page }, use) => {
    await use(async () => {
      await page.waitForSelector('[data-testid="status-indicator"]:has-text("玩家回合")', { timeout: 10000 });
    });
  },

  cleanupGame: async ({ page }, use) => {
    await use(async () => {
      // 返回主菜单并清理LocalStorage
      await page.evaluate(() => localStorage.clear());
    });
  },
});
```

### 示例测试用例

```typescript
// tests/e2e/pvp-game.spec.ts
import { test, expect } from '../fixtures/test-fixtures';

test.describe('TC-E2E-01: PvP对局完整流程', () => {
  test('应支持双人对战完整流程', async ({ startPvPGame, makeMove }) => {
    // 1. 启动PvP游戏
    await startPvPGame();

    // 2. 黑棋落子
    await makeMove(7, 7);

    // 3. 验证状态显示"白棋回合"
    const status = page.locator('[data-testid="status-indicator"]');
    await expect(status).toContainText('白棋回合');

    // 4. 白棋落子
    await makeMove(7, 8);

    // 5. 验证状态显示"黑棋回合"
    await expect(status).toContainText('黑棋回合');

    // 6. 黑棋落子
    await makeMove(8, 7);

    // 7. 白棋落子
    await makeMove(8, 8);

    // 8. 黑棋落子
    await makeMove(9, 7);

    // 9. 验证胜利提示
    await expect(page.locator('[data-testid="game-result"]')).toBeVisible();
    await expect(page.locator('[data-testid="game-result"]')).toContainText('黑棋获胜');

    // 10. 验证胜利连线
    const winLine = page.locator('[data-testid="win-line"]');
    await expect(winLine).toBeVisible();
  });
});
```

---

## ⚙️ 配置要求

### Playwright配置（playwright.config.ts）

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',

  // 并发执行
  fullyParallel: true,

  // 失败时重试
  retries: process.env.CI ? 2 : 0,

  // 并发worker数
  workers: process.env.CI ? 1 : undefined,

  // 测试超时
  timeout: 60 * 1000, // 60秒

  // 期望超时
  expect: {
    timeout: 10 * 1000, // 10秒
  },

  // 报告器
  reporter: [
    ['html'],
    ['list'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  // 全局设置
  use: {
    // 基础URL
    baseURL: 'http://localhost:5173',

    // 截图
    screenshot: 'only-on-failure',

    // 视频录制
    video: 'retain-on-failure',

    // 追踪
    trace: 'retain-on-failure',
  },

  // 测试项目
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // 开发服务器
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

---

## ✅ 验收清单

### 功能验收
- [ ] 9个E2E测试用例全部实现
- [ ] 所有测试通过（100%）
- [ ] 测试执行时间<60秒
- [ ] 测试代码清晰、可维护

### 集成验收
- [ ] Week 1-10的436个单元测试继续通过
- [ ] 无回归问题
- [ ] 发现并修复所有集成问题

### 文档验收
- [ ] E2E测试文档完整
- [ ] 测试用例文档
- [ ] 测试报告文档

### 质量验收
- [ ] 代码覆盖率>80%（用户流程）
- [ ] 测试稳定性>95%（CI环境）
- [ ] 测试可维护性高

---

## 📊 工作量估算

| 任务 | 工作量 | 优先级 |
|------|--------|--------|
| 选择器验证和添加 | 2小时 | P0 |
| 测试辅助函数开发 | 2小时 | P0 |
| TC-E2E-01: PvP对局 | 2小时 | P0 |
| TC-E2E-02: PvE SimpleAI | 2小时 | P0 |
| TC-E2E-03: PvE MasterAI | 2小时 | P0 |
| TC-E2E-04: 提示功能 | 1小时 | P1 |
| TC-E2E-05: PvE悔棋 | 1小时 | P1 |
| TC-E2E-06: PvP悔棋 | 1小时 | P1 |
| TC-E2E-07: 游戏记录 | 2小时 | P1 |
| TC-E2E-08: 游戏回放 | 2小时 | P2 |
| TC-E2E-09: 模式切换 | 2小时 | P1 |
| 集成测试和修复 | 4小时 | P0 |
| 文档编写 | 2小时 | P1 |
| **总计** | **25小时** (~3天) | - |

---

## 🚧 风险和依赖

### 风险
1. **选择器缺失** - 组件可能缺少data-testid属性
   - 缓解: 需要先添加选择器（2-4小时工作量）

2. **异步时序问题** - AI响应和UI更新可能不稳定
   - 缓解: 使用page.waitForSelector()确保元素就绪

3. **CI环境不稳定** - Playwright在CI环境可能超时
   - 缓解: 增加超时时间，配置重试机制

### 依赖
- ✅ 开发服务器正常运行（npm run dev）
- ✅ 组件有data-testid属性（可能需要补充）
- ✅ Playwright已配置（Week 4已完成）

---

## 📅 执行计划

### Day 1: 准备和P0测试
- [ ] 验证和添加组件选择器（data-testid）
- [ ] 开发测试辅助函数
- [ ] 实现TC-E2E-01（PvP对局）
- [ ] 实现TC-E2E-02（PvE SimpleAI）
- [ ] 实现TC-E2E-03（PvE MasterAI）

### Day 2: P1测试
- [ ] 实现TC-E2E-04（提示功能）
- [ ] 实现TC-E2E-05（PvE悔棋）
- [ ] 实现TC-E2E-06（PvP悔棋）
- [ ] 实现TC-E2E-07（游戏记录）
- [ ] 实现TC-E2E-09（模式切换）

### Day 3: P2测试和修复
- [ ] 实现TC-E2E-08（游戏回放）
- [ ] 运行所有9个测试
- [ ] 修复发现的问题
- [ ] 回归测试（436个单元测试）
- [ ] 编写测试报告

---

**文档版本**: v1.0
**创建日期**: 2026-03-25
**创建者**: PM Agent
**状态**: ⏸️ 待启动
**下一步**: 等待启动确认
