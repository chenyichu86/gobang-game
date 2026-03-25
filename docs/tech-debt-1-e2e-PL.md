# 技术债偿还 #1: E2E测试实现 - PL文档

**优先级**: 🔴 高优先级
**状态**: 🔄 执行中
**创建日期**: 2026-03-25
**类型**: 产品逻辑（Product Logic）

---

## 📋 产品逻辑详细设计

### 1. E2E测试架构

#### 1.1 测试框架选择

**选择**: Playwright
- ✅ 已在Week 4配置
- ✅ 跨浏览器支持
- ✅ 强大的选择器
- ✅ 内置等待机制
- ✅ 视频录制和截图

#### 1.2 测试文件结构

```
tests/
├── e2e/
│   ├── pvp-game.spec.ts          # PvP游戏流程测试
│   ├── pve-game-simple.spec.ts   # PvE SimpleAI测试
│   ├── pve-game-master.spec.ts   # PvE MasterAI测试
│   ├── hint-feature.spec.ts      # 提示功能测试
│   ├── undo-feature.spec.ts      # 悔棋功能测试
│   ├── game-records.spec.ts      # 游戏记录测试
│   └── mode-switch.spec.ts       # 模式切换测试
├── fixtures/
│   └── test-fixtures.ts          # 测试辅助函数
├── setup/
│   └── test-setup.ts             # 测试初始化
└── playwright.config.ts          # Playwright配置
```

---

### 2. 选择器策略

#### 2.1 选择器优先级

**优先级顺序**:
1. **data-testid** (最佳) - 稳定，不依赖样式
2. **aria-label** - 可访问性
3. **role + name** - 语义化
4. **CSS类** - 不推荐（易变）

#### 2.2 需要添加的选择器

**主菜单**:
- `[data-testid="main-menu"]`
- `[data-testid="pvp-mode-button"]`
- `[data-testid="pve-mode-button"]`
- `[data-testid="ai-difficulty-select"]`
- `[data-testid="start-game-button"]`

**游戏界面**:
- `[data-testid="game-board"]` - Konva容器
- `[data-testid="status-indicator"]`
- `[data-testid="game-timer"]`

**控制按钮**:
- `[data-testid="undo-button"]`
- `[data-testid="hint-button"]`
- `[data-testid="return-to-menu-button"]`
- `[data-testid="resign-button"]`

**提示相关**:
- `[data-testid="hint-marker"]`

**游戏记录**:
- `[data-testid="game-records-button"]`
- `[data-testid="game-record-list"]`
- `[data-testid="game-record-item"]`

**回放控制**:
- `[data-testid="replay-play"]`
- `[data-testid="replay-pause"]`
- `[data-testid="replay-step-forward"]`
- `[data-testid="replay-step-backward"]`
- `[data-testid="replay-speed"]`

**游戏结果**:
- `[data-testid="game-result"]`
- `[data-testid="win-line"]`

---

### 3. 测试辅助函数设计

#### 3.1 Fixtures

```typescript
// tests/fixtures/test-fixtures.ts
import { test as base } from '@playwright/test';

type GameFixtures = {
  startPvPGame: () => Promise<void>;
  startPvEGame: (difficulty: 'simple' | 'medium' | 'hard' | 'master') => Promise<void>;
  makeMove: (x: number, y: number) => Promise<void>;
  waitForAI: () => Promise<void>;
  cleanupGame: () => Promise<void>;
};

export const test = base.extend<GameFixtures>({
  // 启动PvP游戏
  startPvPGame: async ({ page }, use) => {
    await use(async () => {
      // 点击PvP模式
      await page.click('[data-testid="pvp-mode-button"]');
      // 点击开始游戏
      await page.click('[data-testid="start-game-button"]');
      // 等待游戏界面加载
      await page.waitForSelector('[data-testid="game-board"]', { timeout: 5000 });
    });
  },

  // 启动PvE游戏
  startPvEGame: async ({ page }, use) => {
    await use(async (difficulty) => {
      // 点击PvE模式
      await page.click('[data-testid="pve-mode-button"]');
      // 选择AI难度
      await page.selectOption('[data-testid="ai-difficulty"]', difficulty);
      // 点击开始游戏
      await page.click('[data-testid="start-game-button"]');
      // 等待游戏界面加载
      await page.waitForSelector('[data-testid="game-board"]', { timeout: 5000 });
    });
  },

  // 落子
  makeMove: async ({ page }, use) => {
    await use(async (x, y) => {
      const board = page.locator('[data-testid="game-board"]');
      const box = await board.boundingBox();
      const cellSize = box!.width / 15;

      // 点击棋盘位置
      await board.click({
        position: {
          x: x * cellSize + cellSize / 2,
          y: y * cellSize + cellSize / 2,
        },
      });
    });
  },

  // 等待AI响应
  waitForAI: async ({ page }, use) => {
    await use(async () => {
      // 等待状态显示"玩家回合"
      await page.waitForSelector('[data-testid="status-indicator"]:has-text("回合")', {
        timeout: 10000,
      });
    });
  },

  // 清理游戏
  cleanupGame: async ({ page }, use) => {
    await use(async () => {
      // 清理LocalStorage
      await page.evaluate(() => localStorage.clear());
      // 刷新页面
      await page.reload();
    });
  },
});
```

---

### 4. 测试用例实现细节

#### 4.1 TC-E2E-01: PvP对局完整流程

**测试逻辑**:
```typescript
test('应支持双人对战完整流程', async ({ startPvPGame, makeMove }) => {
  // 1. 启动PvP游戏
  await startPvPGame();

  // 2. 黑棋落子(7,7)
  await makeMove(7, 7);

  // 3. 验证状态显示"白棋回合"
  await expect(page.locator('[data-testid="status-indicator"]')).toContainText('白棋');

  // 4. 白棋落子(7,8)
  await makeMove(7, 8);

  // 5. 验证状态显示"黑棋回合"
  await expect(page.locator('[data-testid="status-indicator"]')).toContainText('黑棋');

  // 6-10. 继续落子直到黑棋获胜
  await makeMove(8, 8);  // 黑
  await makeMove(8, 9);  // 白
  await makeMove(9, 8);  // 黑
  await makeMove(9, 9);  // 白
  await makeMove(10, 8); // 黑 - 五连获胜

  // 11. 验证胜利提示
  await expect(page.locator('[data-testid="game-result"]')).toBeVisible();
  await expect(page.locator('[data-testid="game-result"]')).toContainText('黑棋获胜');

  // 12. 验证胜利连线
  await expect(page.locator('[data-testid="win-line"]')).toBeVisible();
});
```

**关键验证点**:
- ✅ PvP模式可启动
- ✅ 落子功能正常
- ✅ 回合切换正确
- ✅ 胜利检测准确
- ✅ 胜利连线显示

#### 4.2 TC-E2E-02: PvE SimpleAI测试

**测试逻辑**:
```typescript
test('应支持PvE SimpleAI完整流程', async ({ startPvEGame, makeMove, waitForAI }) => {
  // 1. 启动PvE游戏（简单难度）
  await startPvEGame('simple');

  // 2. 玩家落子(7,7)
  await makeMove(7, 7);

  // 3. 验证AI自动响应（等待状态变为"玩家回合"）
  await waitForAI();

  // 4. 验证AI落子合法（棋盘上有白棋）
  const whitePieces = await page.locator('[data-piece-color="white"]').count();
  expect(whitePieces).toBe(1);

  // 5. 验证游戏状态为"玩家回合"
  await expect(page.locator('[data-testid="status-indicator"]')).toContainText('回合');
});
```

**关键验证点**:
- ✅ PvE模式可启动
- ✅ AI难度选择生效
- ✅ AI自动响应
- ✅ AI响应时间<10ms

#### 4.3 TC-E2E-03: PvE MasterAI测试

**测试逻辑**:
```typescript
test('应支持PvE MasterAI完整流程', async ({ startPvEGame, makeMove, waitForAI }) => {
  // 1. 启动PvE游戏（大师难度）
  await startPvEGame('master');

  // 2. 验证AI先手（AI自动落子）
  await waitForAI();
  const whitePieces = await page.locator('[data-piece-color="white"]').count();
  expect(whitePieces).toBe(1);

  // 3. 玩家落子
  await makeMove(7, 7);

  // 4. 验证AI响应（MasterAI可能较慢）
  await waitForAI();

  // 5. 验证游戏正常进行
  await expect(page.locator('[data-testid="status-indicator"]')).toContainText('回合');
});
```

**关键验证点**:
- ✅ MasterAI正常工作
- ✅ AI响应时间<10秒
- ✅ AI落子合法

#### 4.4 TC-E2E-04: 提示功能

**测试逻辑**:
```typescript
test('应支持提示功能', async ({ startPvEGame, makeMove }) => {
  // 1. 启动PvE游戏
  await startPvEGame('simple');

  // 2. 玩家落子
  await makeMove(7, 7);
  await waitForAI();

  // 3. 点击提示按钮
  await page.click('[data-testid="hint-button"]');

  // 4. 验证提示标记显示
  await expect(page.locator('[data-testid="hint-marker"]')).toBeVisible();

  // 5. 玩家点击提示位置落子
  const hintMarker = page.locator('[data-testid="hint-marker"]');
  const box = await hintMarker.boundingBox();
  await page.click('[data-testid="game-board"]', {
    position: { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 },
  });

  // 6. 验证提示标记消失
  await expect(page.locator('[data-testid="hint-marker"]')).not.toBeVisible();
});
```

**关键验证点**:
- ✅ 提示功能正常
- ✅ 提示位置合理
- ✅ 提示标记显示正确
- ✅ 提示次数减少

#### 4.5 TC-E2E-05: PvE悔棋功能

**测试逻辑**:
```typescript
test('应支持PvE悔棋功能', async ({ startPvEGame, makeMove, waitForAI }) => {
  // 1. 启动PvE游戏
  await startPvEGame('simple');

  // 2. 玩家落子
  await makeMove(7, 7);
  await waitForAI();

  // 3. 玩家再落子
  await makeMove(8, 8);
  await waitForAI();

  // 4. 记录当前棋子数
  const beforeUndo = await page.locator('[data-piece-color]').count();

  // 5. 点击悔棋按钮
  await page.click('[data-testid="undo-button"]');

  // 6. 验证撤销了2步（玩家+AI）
  const afterUndo = await page.locator('[data-piece-color]').count();
  expect(afterUndo).toBe(beforeUndo - 2);

  // 7. 验证回合回到玩家
  await expect(page.locator('[data-testid="status-indicator"]')).toContainText('回合');
});
```

**关键验证点**:
- ✅ PvE悔棋撤销2步
- ✅ 棋盘状态正确恢复
- ✅ 回合正确切换

#### 4.6 TC-E2E-07: 游戏记录查看

**测试逻辑**:
```typescript
test('应支持游戏记录查看', async ({ page, startPvEGame, makeMove, cleanupGame }) => {
  // 1. 完成一局游戏
  await startPvEGame('simple');
  await makeMove(7, 7);
  await waitForAI();
  // ... 继续游戏直到结束

  // 2. 返回主菜单
  await page.click('[data-testid="return-to-menu-button"]');
  await page.click('button:has-text("确定")'); // 确认退出

  // 3. 点击游戏记录按钮
  await page.click('[data-testid="game-records-button"]');

  // 4. 验证游戏记录列表显示
  await expect(page.locator('[data-testid="game-record-list"]')).toBeVisible();
  const records = await page.locator('[data-testid="game-record-item"]').count();
  expect(records).toBeGreaterThan(0);

  // 5. 验证记录信息正确
  const firstRecord = page.locator('[data-testid="game-record-item"]').first();
  await expect(firstRecord).toContainText('PvE');
});
```

**关键验证点**:
- ✅ 游戏记录正确保存
- ✅ 记录列表正确显示
- ✅ 记录信息完整

---

### 5. Playwright配置

#### 5.1 playwright.config.ts

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
  timeout: 60 * 1000,

  // 期望超时
  expect: {
    timeout: 10 * 1000,
  },

  // 报告器
  reporter: [
    ['html'],
    ['list'],
    ['junit', { outputFile: 'test-results/e2e/junit.xml' }],
  ],

  // 全局设置
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  // 测试项目
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
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

### 6. 数据流设计

#### 6.1 游戏启动流程

```
用户点击"PvP模式"
  ↓
更新Zustand store (gameMode: 'pvp')
  ↓
用户点击"开始游戏"
  ↓
创建GameEngine实例
  ↓
初始化棋盘数据
  ↓
设置gameStatus: 'playing'
  ↓
UI更新为游戏界面
```

#### 6.2 落子流程

```
用户点击棋盘位置(x, y)
  ↓
Konva捕获点击事件
  ↓
坐标转换（屏幕→网格）
  ↓
调用gameStore.makeMove({x, y})
  ↓
GameEngine.validateMove()
  ↓
GameEngine.makeMove()
  ↓
检查胜负（GameRules.checkWin()）
  ↓
更新状态（board, currentPlayer, gameStatus）
  ↓
UI重新渲染
```

#### 6.3 AI响应流程（PvE）

```
玩家落子
  ↓
触发triggerAIMove()
  ↓
AI状态设置为true (isAIThinking: true)
  ↓
调用AIClient.calculateMove()
  ↓
AI计算最佳位置
  ↓
AI落子
  ↓
检查胜负
  ↓
AI状态设置为false (isAIThinking: false)
  ↓
回合切换回玩家
```

---

### 7. 边界条件处理

#### 7.1 异步等待

**问题**: AI响应和UI更新是异步的
**解决**: 使用page.waitForSelector()等待元素就绪

```typescript
// 等待AI响应
await page.waitForSelector('[data-testid="status-indicator"]:has-text("玩家回合")', {
  timeout: 10000,
});

// 等待游戏加载
await page.waitForSelector('[data-testid="game-board"]', {
  timeout: 5000,
});
```

#### 7.2 错误处理

**问题**: 游戏可能出错（AI超时、网络错误）
**解决**: 使用try-catch捕获错误

```typescript
try {
  await makeMove(7, 7);
  await waitForAI();
} catch (error) {
  console.error('游戏出错:', error);
  throw error;
}
```

#### 7.3 清理状态

**问题**: 测试间可能有状态残留
**解决**: 每个测试后清理LocalStorage

```typescript
test.afterEach(async ({ page }) => {
  // 清理LocalStorage
  await page.evaluate(() => localStorage.clear());
  // 刷新页面
  await page.reload();
});
```

---

### 8. 性能考虑

#### 8.1 测试执行时间

**目标**: 总执行时间<60秒

**优化**:
- ✅ 并发执行测试
- ✅ 跳过不必要的等待
- ✅ 使用fixtures复用代码

#### 8.2 稳定性

**目标**: 测试稳定性>95%

**措施**:
- ✅ 合理的超时时间
- ✅ 重试机制（CI环境）
- ✅ 等待元素就绪
- ✅ 清理测试状态

---

## ✅ 验收标准

### 功能验收
- [ ] 9个E2E测试全部通过
- [ ] 测试执行时间<60秒
- [ ] 测试稳定性>95%

### 集成验收
- [ ] Week 1-10的436个单元测试继续通过
- [ ] 发现并修复集成问题

### 文档验收
- [ ] 测试代码清晰
- [ ] 测试报告完整

---

**文档版本**: v1.0
**创建日期**: 2026-03-25
**创建者**: PM Agent
**状态**: 🔄 执行中
**下一步**: QA编写E2E测试代码
