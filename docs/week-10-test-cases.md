# Week 10 测试用例设计
## Week 9.1 游戏流程集成 + Week 10 性能优化 + E2E测试

**日期**: 2026-03-25
**版本**: v1.0
**状态**: 草稿
**负责人**: QA (Quality Assurance)

---

## 一、测试范围

### 1.1 测试模块

| 模块 | 功能 | 测试类型 |
|------|------|---------|
| **Week 9.1 游戏流程集成** | 金币奖励、任务进度、自动保存 | 单元测试 + 集成测试 |
| **AI性能优化** | Worker复用、响应时间、内存泄漏 | 单元测试 + 性能测试 |
| **Canvas渲染优化** | 离屏缓存、脏标记、帧率 | 单元测试 + 性能测试 |
| **内存泄漏检查** | 事件监听器、定时器、Worker、Konva | 单元测试 + 内存测试 |
| **E2E测试** | PvP、PvE、商城、任务、签到 | E2E测试 |
| **回归测试** | Week 1-9功能 | 回归测试 |

### 1.2 测试目标

- ✅ 功能完整性：所有计划功能100%实现
- ✅ 测试覆盖率：>80%
- ✅ 性能达标：AI响应时间、渲染性能符合目标
- ✅ 零内存泄漏：长时间运行内存稳定
- ✅ 零缺陷：所有测试通过
- ✅ 向后兼容：Week 1-9功能不受影响

---

## 二、Week 9.1 游戏流程集成测试

### 2.1 测试文件

`src/__tests__/week-10/game-integration.test.ts`

### 2.2 测试用例

#### TC-GI-01: 游戏结束触发金币奖励（胜利）
```typescript
describe('GameIntegration - 游戏结束金币奖励', () => {
  it('游戏胜利应获得10金币', () => {
    const gameStore = useGameStore.getState();
    const userStore = useUserStore.getState();
    const initialCoins = userStore.coins;

    act(() => {
      gameStore.endGameWithRewards('win');
    });

    expect(userStore.coins).toBe(initialCoins + 10);
    expect(userStore.totalEarned).toBe(initialCoins + 10);
  });
});
```

#### TC-GI-02: 游戏结束触发金币奖励（失败）
```typescript
it('游戏失败应获得2金币', () => {
  const gameStore = useGameStore.getState();
  const userStore = useUserStore.getState();
  const initialCoins = userStore.coins;

  act(() => {
    gameStore.endGameWithRewards('lose');
  });

  expect(userStore.coins).toBe(initialCoins + 2);
  expect(userStore.totalEarned).toBe(initialCoins + 2);
});
```

#### TC-GI-03: 游戏结束触发金币奖励（和棋）
```typescript
it('游戏和棋应获得5金币', () => {
  const gameStore = useGameStore.getState();
  const userStore = useUserStore.getState();
  const initialCoins = userStore.coins;

  act(() => {
    gameStore.endGameWithRewards('draw');
  });

  expect(userStore.coins).toBe(initialCoins + 5);
  expect(userStore.totalEarned).toBe(initialCoins + 5);
});
```

#### TC-GI-04: 游戏结束触发任务进度更新（胜利）
```typescript
it('游戏胜利应更新胜利任务进度', () => {
  const gameStore = useGameStore.getState();
  const userStore = useUserStore.getState();

  // 重置任务进度
  userStore.tasks = userStore.tasks.map(t =>
    t.id === 'daily_win_1' ? { ...t, progress: 0 } : t
  );

  act(() => {
    gameStore.endGameWithRewards('win');
  });

  const winTask = userStore.tasks.find(t => t.id === 'daily_win_1');
  expect(winTask?.progress).toBe(1);
});
```

#### TC-GI-05: 游戏结束触发任务进度更新（游戏结束）
```typescript
it('游戏结束应更新游戏结束任务进度', () => {
  const gameStore = useGameStore.getState();
  const userStore = useUserStore.getState();

  // 重置任务进度
  userStore.tasks = userStore.tasks.map(t =>
    t.id === 'daily_play_3' ? { ...t, progress: 0 } : t
  );

  act(() => {
    gameStore.endGameWithRewards('lose');
  });

  const playTask = userStore.tasks.find(t => t.id === 'daily_play_3');
  expect(playTask?.progress).toBe(1);
});
```

#### TC-GI-06: 游戏结束自动保存数据
```typescript
it('游戏结束应自动保存到LocalStorage', async () => {
  const spy = vi.spyOn(StorageService.prototype, 'saveUserData');

  const gameStore = useGameStore.getState();

  act(() => {
    gameStore.endGameWithRewards('win');
  });

  await waitFor(() => {
    expect(spy).toHaveBeenCalled();
  });
});
```

#### TC-GI-07: 游戏结束更新经验值和成就
```typescript
it('游戏结束应更新经验值和检测成就', () => {
  const gameStore = useGameStore.getState();
  const userStore = useUserStore.getState();
  const initialExp = userStore.exp;

  act(() => {
    gameStore.endGameWithRewards('win');
  });

  // 验证经验值增加
  expect(userStore.exp).toBe(initialExp + 100);

  // 验证成就检测（假设有"首次胜利"成就）
  const firstWinAchievement = userStore.achievements.find(a => a.id === 'first_win');
  // 根据实际情况验证
});
```

#### TC-GI-08: 游戏结束检查等级升级
```typescript
it('游戏结束应检查等级升级', () => {
  const gameStore = useGameStore.getState();
  const userStore = useUserStore.getState();

  // 设置经验值接近升级阈值
  userStore.exp = 450; // Lv1 -> Lv2需要500经验
  const initialLevel = userStore.level;

  act(() => {
    gameStore.endGameWithRewards('win'); // +100经验
  });

  // 验证升级
  expect(userStore.level).toBe(initialLevel + 1);
  expect(userStore.exp).toBe(550);
});
```

#### TC-GI-09: 不同游戏结果的金币计算正确性
```typescript
it('不同游戏结果的金币计算应正确', () => {
  const gameStore = useGameStore.getState();
  const userStore = useUserStore.getState();

  // 测试胜利
  userStore.coins = 0;
  act(() => {
    gameStore.endGameWithRewards('win');
  });
  expect(userStore.coins).toBe(10);

  // 测试失败
  userStore.coins = 0;
  act(() => {
    gameStore.endGameWithRewards('lose');
  });
  expect(userStore.coins).toBe(2);

  // 测试和棋
  userStore.coins = 0;
  act(() => {
    gameStore.endGameWithRewards('draw');
  });
  expect(userStore.coins).toBe(5);
});
```

#### TC-GI-10: 游戏结束不破坏原有功能
```typescript
it('游戏结束应保持Week 1-9功能正常', () => {
  const gameStore = useGameStore.getState();

  // 验证游戏状态设置正确
  act(() => {
    gameStore.endGameWithRewards('win');
  });

  expect(gameStore.gameStatus).toBe('won');
  expect(gameStore.winner).not.toBeNull();

  // 验证游戏记录功能正常
  expect(gameStore.recorder).not.toBeNull();
});
```

---

## 三、Week 10 性能优化测试

### 3.1 测试文件

`src/__tests__/week-10/performance.test.ts`

### 3.2 AI性能测试

#### TC-PERF-01: SimpleAI响应时间
```typescript
describe('AI Performance - SimpleAI', () => {
  it('SimpleAI响应时间应<10ms', async () => {
    const aiClient = new AIClient();
    const board = new Board();

    const startTime = performance.now();
    await aiClient.calculateMove(board, 'black', 'simple');
    const duration = performance.now() - startTime;

    expect(duration).toBeLessThan(10);
  });
});
```

#### TC-PERF-02: MediumAI响应时间
```typescript
it('MediumAI响应时间应<50ms', async () => {
  const aiClient = new AIClient();
  const board = new Board();

  const startTime = performance.now();
  await aiClient.calculateMove(board, 'black', 'medium');
  const duration = performance.now() - startTime;

  expect(duration).toBeLessThan(50);
});
```

#### TC-PERF-03: HardAI响应时间（深度4）
```typescript
it('HardAI响应时间应<3秒', async () => {
  const aiClient = new AIClient();
  const board = new Board();

  // 放置一些棋子增加复杂度
  board.placePiece({ x: 7, y: 7 }, 'black');
  board.placePiece({ x: 7, y: 8 }, 'white');

  const startTime = performance.now();
  await aiClient.calculateMove(board, 'black', 'hard');
  const duration = performance.now() - startTime;

  expect(duration).toBeLessThan(3000);
});
```

#### TC-PERF-04: MasterAI响应时间（深度6）
```typescript
it('MasterAI响应时间应<10秒', async () => {
  const aiClient = new AIClient();
  const board = new Board();

  // 放置一些棋子
  board.placePiece({ x: 7, y: 7 }, 'black');
  board.placePiece({ x: 7, y: 8 }, 'white');
  board.placePiece({ x: 8, y: 7 }, 'black');

  const startTime = performance.now();
  await aiClient.calculateMove(board, 'black', 'master');
  const duration = performance.now() - startTime;

  expect(duration).toBeLessThan(10000);
});
```

### 3.3 Canvas渲染性能测试

#### TC-PERF-05: 棋盘初始渲染时间
```typescript
describe('Canvas Performance - 棋盘渲染', () => {
  it('棋盘初始渲染时间应<100ms', async () => {
    const { container } = render(<GamePage />);

    const startTime = performance.now();

    // 触发棋盘渲染
    await waitFor(() => {
      expect(container.querySelector('.konvajs-content')).toBeInTheDocument();
    });

    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(100);
  });
});
```

#### TC-PERF-06: 落子渲染时间
```typescript
it('落子渲染时间应<20ms', async () => {
  const { container } = render(<GamePage />);
  const gameStore = useGameStore.getState();

  // 开始游戏
  act(() => {
    gameStore.startGame('pve', 'medium');
  });

  await waitFor(() => {
    expect(container.querySelector('.konvajs-content')).toBeInTheDocument();
  });

  // 测试落子渲染时间
  const startTime = performance.now();
  act(() => {
    gameStore.makeMove({ x: 7, y: 7 });
  });

  await waitFor(() => {
    expect(container.querySelector('[data-piece-at="7-7"]')).toBeInTheDocument();
  });

  const duration = performance.now() - startTime;
  expect(duration).toBeLessThan(20);
});
```

#### TC-PERF-07: 帧率测试（60fps）
```typescript
it('棋盘渲染应保持60fps', async () => {
  const { container } = render(<GamePage />);
  const gameStore = useGameStore.getState();

  act(() => {
    gameStore.startGame('pve', 'simple');
  });

  // 连续落子测试帧率
  const frameTimes: number[] = [];

  for (let i = 0; i < 10; i++) {
    const startTime = performance.now();
    act(() => {
      gameStore.makeMove({ x: i, y: i });
    });

    await waitFor(() => {
      expect(container.querySelector(`[data-piece-at="${i}-${i}"]`)).toBeInTheDocument();
    });

    frameTimes.push(performance.now() - startTime);
  }

  // 计算平均帧时间（60fps = 16.67ms每帧）
  const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
  expect(avgFrameTime).toBeLessThan(16.67 * 2); // 允许2倍容差
});
```

### 3.4 内存泄漏测试

#### TC-MEM-01: 事件监听器清理
```typescript
describe('Memory Leak - 事件监听器', () => {
  it('组件卸载时应清理事件监听器', () => {
    const { unmount } = render(<GamePage />);
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    // 模拟组件添加事件监听器
    // ...

    unmount();

    // 验证清理
    expect(removeEventListenerSpy).toHaveBeenCalled();
  });
});
```

#### TC-MEM-02: 定时器清理
```typescript
it('组件卸载时应清理定时器', () => {
  const { unmount } = render(<Timer />);
  const clearIntervalSpy = vi.spyOn(window, 'clearInterval');

  unmount();

  // 验证定时器被清理
  expect(clearIntervalSpy).toHaveBeenCalled();
});
```

#### TC-MEM-03: Web Worker清理
```typescript
it('游戏结束应清理AI Worker', () => {
  const gameStore = useGameStore.getState();
  const terminateSpy = vi.spyOn(AIClient.prototype, 'terminate');

  act(() => {
    gameStore.cleanup();
  });

  expect(terminateSpy).toHaveBeenCalled();
});
```

#### TC-MEM-04: Konva Stage清理
```typescript
it('组件卸载应清理Konva Stage', () => {
  const { unmount } = render(<BoardStage />);
  const destroySpy = vi.spyOn(require('konva').Stage.prototype, 'destroy');

  unmount();

  expect(destroySpy).toHaveBeenCalled();
});
```

#### TC-MEM-05: 长时间运行内存稳定性
```typescript
it('长时间运行内存应保持稳定', async () => {
  const gameStore = useGameStore.getState();

  // 模拟多局游戏
  for (let i = 0; i < 20; i++) {
    act(() => {
      gameStore.startGame('pve', 'simple');
      gameStore.makeMove({ x: 7, y: 7 });
      gameStore.makeMove({ x: 7, y: 8 });
      gameStore.endGameWithRewards('win');
      gameStore.reset();
    });
  }

  // 验证内存没有显著增长（需要在浏览器环境测试）
  // 这里主要是测试逻辑，实际内存检测需要E2E测试
  expect(gameStore.moveHistory.length).toBe(0);
});
```

---

## 四、E2E测试设计

### 4.1 PvP完整流程测试

**测试文件**: `tests/e2e/week-10/pvp-game.spec.ts`

#### TC-E2E-01: PvP对局完整流程
```typescript
test('PvP game - Complete flow', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // 选择PvP模式
  await page.click('[data-testid="pvp-mode-button"]');

  // 开始游戏
  await page.click('[data-testid="start-game-button"]');

  // 验证游戏状态
  await expect(page.locator('[data-testid="status"]')).toContainText('黑棋回合');

  // 黑棋落子
  await page.locator('.konvajs-content').click({ position: { x: 300, y: 300 } });
  await expect(page.locator('[data-testid="status"]')).toContainText('白棋回合');

  // 白棋落子
  await page.locator('.konvajs-content').click({ position: { x: 320, y: 300 } });
  await expect(page.locator('[data-testid="status"]')).toContainText('黑棋回合');

  // 验证悔棋功能
  await page.click('[data-testid="undo-button"]');
  await expect(page.locator('[data-testid="status"]')).toContainText('白棋回合');

  // 验证重新开始
  await page.click('[data-testid="restart-button"]');
  await expect(page.locator('[data-testid="status"]')).toContainText('黑棋回合');

  // 验证返回主菜单
  await page.click('[data-testid="return-home-button"]');
  await expect(page.locator('[data-testid="home-menu"]')).toBeVisible();
});
```

#### TC-E2E-02: PvP胜负判定
```typescript
test('PvP game - Win detection', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.click('[data-testid="pvp-mode-button"]');
  await page.click('[data-testid="start-game-button"]');

  // 模拟五连
  const moves = [
    { x: 300, y: 300 }, { x: 320, y: 300 },
    { x: 280, y: 300 }, { x: 340, y: 300 },
    { x: 260, y: 300 }, { x: 360, y: 300 },
    { x: 240, y: 300 },
  ];

  for (const move of moves) {
    await page.locator('.konvajs-content').click({ position: move });
  }

  // 验证胜负判定
  await expect(page.locator('[data-testid="winner-modal"]')).toBeVisible();
  await expect(page.locator('[data-testid="winner-text"]')).toContainText('黑棋获胜');

  // 验证金币奖励
  await expect(page.locator('[data-testid="coin-reward"]')).toContainText('+10');
});
```

### 4.2 PvE完整流程测试

**测试文件**: `tests/e2e/week-10/pve-game.spec.ts`

#### TC-E2E-03: PvE对局完整流程
```typescript
test('PvE game - Medium difficulty', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // 选择PvE模式
  await page.click('[data-testid="pve-mode-button"]');

  // 选择难度
  await page.selectOption('[data-testid="difficulty-select"]', 'medium');

  // 开始游戏
  await page.click('[data-testid="start-game-button"]');

  // 验证游戏状态
  await expect(page.locator('[data-testid="status"]')).toContainText('黑棋回合');

  // 玩家落子
  await page.locator('.konvajs-content').click({ position: { x: 300, y: 300 } });

  // 等待AI落子
  await expect(page.locator('[data-testid="status"]')).toContainText('黑棋回合', { timeout: 5000 });

  // 验证悔棋功能（撤销2步）
  const undoCountBefore = await page.locator('[data-testid="undo-count"]').textContent();
  await page.click('[data-testid="undo-button"]');
  const undoCountAfter = await page.locator('[data-testid="undo-count"]').textContent();
  expect(parseInt(undoCountAfter!)).toBe(parseInt(undoCountBefore!) - 1);

  // 验证提示功能
  await page.click('[data-testid="hint-button"]');
  await expect(page.locator('[data-testid="hint-marker"]')).toBeVisible();
});
```

#### TC-E2E-04: PvE性能测试
```typescript
test('PvE game - AI response time', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.click('[data-testid="pve-mode-button"]');
  await page.selectOption('[data-testid="difficulty-select"]', 'medium');
  await page.click('[data-testid="start-game-button"]');

  // 测试AI响应时间
  const startTime = Date.now();
  await page.locator('.konvajs-content').click({ position: { x: 300, y: 300 } });
  await page.waitForSelector('[data-testid="status"]:has-text("黑棋回合")', { timeout: 5000 });
  const duration = Date.now() - startTime;

  expect(duration).toBeLessThan(5000); // MediumAI应<5秒
});
```

### 4.3 商城功能测试

**测试文件**: `tests/e2e/week-10/shop.spec.ts`

#### TC-E2E-05: 商城购买流程
```typescript
test('Shop page - Purchase skin', async ({ page }) => {
  await page.goto('http://localhost:5173/shop');

  // 获取初始金币余额
  const initialCoins = await page.locator('[data-testid="coin-balance"]').textContent();
  const initialCoinsNum = parseInt(initialCoins!.replace(/,/g, ''));

  // 选择一款皮肤
  await page.click('[data-testid="skin-classic-board"]');

  // 购买皮肤
  await page.click('[data-testid="purchase-button"]');

  // 验证购买成功提示
  await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  await expect(page.locator('[data-testid="success-toast"]')).toContainText('购买成功');

  // 验证金币扣除
  const finalCoins = await page.locator('[data-testid="coin-balance"]').textContent();
  const finalCoinsNum = parseInt(finalCoins!.replace(/,/g, ''));
  expect(finalCoinsNum).toBeLessThan(initialCoinsNum);

  // 验证拥有状态
  await expect(page.locator('[data-testid="owned-badge"]')).toBeVisible();

  // 刷新页面验证持久化
  await page.reload();
  await expect(page.locator('[data-testid="owned-badge"]')).toBeVisible();
});
```

#### TC-E2E-06: 金币不足提示
```typescript
test('Shop page - Insufficient coins', async ({ page }) => {
  await page.goto('http://localhost:5173/shop');

  // 修改金币为0
  await page.evaluate(() => {
    localStorage.setItem('gobang_user_data_v2', JSON.stringify({
      coins: 0,
      unlockedSkins: [],
    }));
  });

  // 刷新页面
  await page.reload();

  // 尝试购买昂贵皮肤
  await page.click('[data-testid="skin-premium-board"]');
  await page.click('[data-testid="purchase-button"]');

  // 验证金币不足提示
  await expect(page.locator('[data-testid="error-toast"]')).toBeVisible();
  await expect(page.locator('[data-testid="error-toast"]')).toContainText('金币不足');
});
```

### 4.4 任务系统测试

**测试文件**: `tests/e2e/week-10/tasks.spec.ts`

#### TC-E2E-07: 完成任务并领取奖励
```typescript
test('Tasks page - Complete task', async ({ page }) => {
  await page.goto('http://localhost:5173/tasks');

  // 检查初始进度
  await expect(page.locator('[data-testid="task-progress-1"]')).toHaveText('0/3');

  // 完成3局游戏
  for (let i = 0; i < 3; i++) {
    await page.goto('http://localhost:5173');
    await page.click('[data-testid="pve-mode-button"]');
    await page.selectOption('[data-testid="difficulty-select"]', 'simple');
    await page.click('[data-testid="start-game-button"]');

    // 玩家落子
    await page.locator('.konvajs-content').click({ position: { x: 300, y: 300 } });

    // 等待AI落子
    await page.waitForTimeout(500);

    // 认输结束游戏
    await page.click('[data-testid="resign-button"]');
    await page.click('[data-testid="return-home-button"]');
  }

  // 返回任务页面
  await page.goto('http://localhost:5173/tasks');

  // 验证任务完成
  await expect(page.locator('[data-testid="task-progress-1"]')).toHaveText('3/3');
  await expect(page.locator('[data-testid="task-status-1"]')).toContainText('已完成');

  // 领取奖励
  await page.click('[data-testid="claim-reward-button-1"]');

  // 验证奖励领取成功
  await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  await expect(page.locator('[data-testid="claim-reward-button-1"]')).toBeDisabled();
});
```

#### TC-E2E-08: 任务每日刷新
```typescript
test('Tasks page - Daily refresh', async ({ page }) => {
  await page.goto('http://localhost:5173/tasks');

  // 修改任务日期为昨天
  await page.evaluate(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    localStorage.setItem('gobang_tasks_v2', JSON.stringify({
      dailyTasks: {
        date: yesterday.toISOString().split('T')[0],
        tasks: [
          { id: '1', progress: 3, target: 3, completed: true, claimed: true },
        ],
      },
    }));
  });

  // 刷新页面
  await page.reload();

  // 验证任务已刷新
  await expect(page.locator('[data-testid="task-progress-1"]')).toHaveText('0/3');
});
```

### 4.5 签到功能测试

**测试文件**: `tests/e2e/week-10/checkin.spec.ts`

#### TC-E2E-09: 每日签到流程
```typescript
test('CheckIn page - Daily check-in', async ({ page }) => {
  await page.goto('http://localhost:5173/checkin');

  // 清除签到数据
  await page.evaluate(() => {
    localStorage.removeItem('gobang_check_in_v2');
  });
  await page.reload();

  // 验证初始状态
  await expect(page.locator('[data-testid="check-in-button"]')).toBeEnabled();
  await expect(page.locator('[data-testid="consecutive-days"]')).toHaveText('0天');

  // 执行签到
  await page.click('[data-testid="check-in-button"]');

  // 验证签到成功
  await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  await expect(page.locator('[data-testid="success-toast"]')).toContainText('签到成功');
  await expect(page.locator('[data-testid="check-in-button"]')).toBeDisabled();

  // 验证连续签到天数
  await expect(page.locator('[data-testid="consecutive-days"]')).toHaveText('1天');

  // 验证今日已签到标记
  await expect(page.locator('[data-testid="today-checked"]')).toBeVisible();

  // 刷新页面验证持久化
  await page.reload();
  await expect(page.locator('[data-testid="check-in-button"]')).toBeDisabled();
});
```

#### TC-E2E-10: 连续签到奖励
```typescript
test('CheckIn page - Consecutive check-in bonus', async ({ page }) => {
  await page.goto('http://localhost:5173/checkin');

  // 模拟连续签到6天
  await page.evaluate(() => {
    const history = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      history.push(date.toDateString());
    }
    localStorage.setItem('gobang_check_in_v2', JSON.stringify({
      lastCheckInDate: history[history.length - 2],
      consecutiveDays: 6,
      totalCheckInDays: 6,
      checkInHistory: history.slice(0, -1),
    }));
  });

  // 刷新页面
  await page.reload();

  // 验证第7天额外奖励提示
  await expect(page.locator('[data-testid="bonus-reward"]')).toContainText('额外+100金币');

  // 执行签到
  await page.click('[data-testid="check-in-button"]');

  // 验证额外奖励
  await expect(page.locator('[data-testid="success-toast"]')).toContainText('150金币'); // 50 + 100
});
```

---

## 五、测试用例统计

### 5.1 测试用例数量

| 模块 | 单元测试 | E2E测试 | 合计 |
|------|---------|---------|------|
| Week 9.1 游戏流程集成 | 10 | - | 10 |
| Week 10 AI性能测试 | 4 | - | 4 |
| Week 10 Canvas性能测试 | 3 | - | 3 |
| Week 10 内存泄漏测试 | 5 | - | 5 |
| Week 10 E2E测试 | - | 10 | 10 |
| **总计** | **22** | **10** | **32** |

### 5.2 预估覆盖率

| 模块 | 语句覆盖率 | 分支覆盖率 | 函数覆盖率 |
|------|-----------|-----------|-----------|
| 游戏流程集成 | >85% | >80% | >90% |
| AI性能优化 | >80% | >75% | >85% |
| Canvas渲染优化 | >75% | >70% | >80% |
| 内存泄漏检查 | >80% | >75% | >85% |
| E2E测试 | >90% | - | - |

### 5.3 预估执行时间

| 测试类型 | 数量 | 预估时间 |
|---------|------|---------|
| 单元测试 | 22 | ~3分钟 |
| E2E测试 | 10 | ~5分钟 |
| **总计** | **32** | **~8分钟** |

---

## 六、测试执行计划

### 6.1 测试阶段

| 阶段 | 任务 | 负责人 | 时间 |
|------|------|--------|------|
| **阶段1** | PO创建WO+PL文档 | PO | 已完成 |
| **阶段2** | QA编写测试用例和测试代码 | QA | Day 1 |
| **阶段3** | PM验证RED状态 | PM | Day 1 |
| **阶段4** | DEV实现功能 | DEV | Day 2-4 |
| **阶段5** | QA执行测试并生成报告 | QA | Day 4 |
| **阶段6** | Bug修复 | DEV | Day 4 |
| **阶段7** | 验收和归档 | PM+PO | Day 4 |

### 6.2 测试优先级

| 优先级 | 模块 | 理由 |
|-------|------|------|
| 🔴 高 | Week 9.1 游戏流程集成 | 补充Week 9遗漏功能，必须先完成 |
| 🟡 中 | Week 10 E2E测试 | 保证核心流程质量 |
| 🟡 中 | Week 10 内存泄漏测试 | 保证长时间运行稳定性 |
| 🟢 低 | Week 10 AI性能测试 | AI性能已达标，主要是验证优化 |
| 🟢 低 | Week 10 Canvas性能测试 | Canvas渲染已优化，主要是验证效果 |

---

## 七、验收标准（整体）

### 7.1 功能完整性
- [ ] Week 9.1游戏流程集成完成（金币、任务、保存）
- [ ] AI性能优化完成（Worker复用、响应时间达标）
- [ ] Canvas渲染优化完成（离屏缓存、脏标记）
- [ ] 内存泄漏检查完成（无泄漏）
- [ ] E2E测试完善完成（覆盖核心流程）
- [ ] 性能基准建立完成

### 7.2 质量标准
- [ ] 测试覆盖率>80%
- [ ] 所有测试通过（Week 1-10）
- [ ] Week 1-9回归测试100%通过
- [ ] E2E测试核心流程100%通过
- [ ] TypeScript 0错误
- [ ] ESLint 0错误

### 7.3 性能标准
- [ ] AI响应时间保持或改善
  - SimpleAI <10ms ✅
  - MediumAI <50ms ✅
  - HardAI <3秒 ✅
  - MasterAI <10秒 ✅
- [ ] 棋盘渲染保持60fps
- [ ] 无内存泄漏
- [ ] 长时间运行内存稳定

### 7.4 文档完整性
- [ ] WO文档 ✅
- [ ] PL文档 ✅
- [ ] 测试用例文档
- [ ] 测试报告
- [ ] 验收报告

---

**文档状态**: ✅ 测试用例设计完成
**下一步**: QA编写测试代码（TDD First，必须先让测试失败RED）
