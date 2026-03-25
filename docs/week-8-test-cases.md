# Week 8 测试用例设计
## 金币 + 任务 + 商城系统

**日期**: 2026-03-25
**版本**: v1.0
**状态**: 草稿
**负责人**: QA (Quality Assurance)

---

## 一、测试范围

### 1.1 测试模块

| 模块 | 功能 | 测试类型 |
|------|------|---------|
| **金币系统** | 金币获取、计算、存储 | 单元测试 |
| **任务系统** | 任务生成、刷新、进度追踪 | 单元测试 |
| **商城系统** | 皮肤购买、应用 | 单元测试 |
| **签到功能** | 每日签到、连续签到 | 单元测试 |
| **UI组件** | 商城页面、任务列表、签到日历 | 集成测试 |
| **性能** | 金币计算、任务刷新 | 性能测试 |
| **回归测试** | Week 1-7功能 | 回归测试 |

### 1.2 测试目标

- ✅ 功能完整性：所有计划功能100%实现
- ✅ 测试覆盖率：>70%
- ✅ 性能达标：金币<50ms，任务<100ms
- ✅ 零缺陷：所有测试通过
- ✅ 向后兼容：Week 1-7功能不受影响

---

## 二、单元测试设计

### 2.1 金币系统测试

**测试文件**: `src/services/__tests__/coin-service.test.ts`

#### TC-COIN-01: 胜利金币奖励
```typescript
describe('CoinService - 胜利奖励', () => {
  it('胜利应获得10金币', () => {
    const service = new CoinService();
    const coins = service.calculateCoinGain('win');
    expect(coins).toBe(10);
  });
});
```

#### TC-COIN-02: 失败金币奖励
```typescript
describe('CoinService - 失败奖励', () => {
  it('失败应获得2金币', () => {
    const service = new CoinService();
    const coins = service.calculateCoinGain('lose');
    expect(coins).toBe(2);
  });
});
```

#### TC-COIN-03: 和棋金币奖励
```typescript
describe('CoinService - 和棋奖励', () => {
  it('和棋应获得5金币', () => {
    const service = new CoinService();
    const coins = service.calculateCoinGain('draw');
    expect(coins).toBe(5);
  });
});
```

#### TC-COIN-04: 添加金币
```typescript
describe('CoinService - 添加金币', () => {
  it('应正确添加金币', () => {
    const service = new CoinService();
    service.addCoins(10);
    expect(service.getCoinBalance()).toBe(10);

    service.addCoins(50);
    expect(service.getCoinBalance()).toBe(60);
  });
});
```

#### TC-COIN-05: 扣除金币
```typescript
describe('CoinService - 扣除金币', () => {
  it('应正确扣除金币', () => {
    const service = new CoinService();
    service.addCoins(100);
    const success = service.spendCoins(30);

    expect(success).toBe(true);
    expect(service.getCoinBalance()).toBe(70);
  });
});
```

#### TC-COIN-06: 金币不足检测
```typescript
describe('CoinService - 金币不足', () => {
  it('余额不足时应返回false', () => {
    const service = new CoinService();
    service.addCoins(10);
    const success = service.spendCoins(50);

    expect(success).toBe(false);
    expect(service.getCoinBalance()).toBe(10);
  });
});
```

---

### 2.2 任务系统测试

**测试文件**: `src/services/__tests__/task-service.test.ts`

#### TC-TASK-01: 生成每日任务
```typescript
describe('TaskService - 生成每日任务', () => {
  it('应生成3个每日任务', () => {
    const service = new TaskService();
    const tasks = service.generateDailyTasks();

    expect(tasks).toHaveLength(3);
    expect(tasks.every(t => t.type === 'daily')).toBe(true);
  });
});
```

#### TC-TASK-02: 任务配置正确性
```typescript
describe('TaskService - 任务配置', () => {
  it('每日任务应包含游戏达人、胜利者、博学先锋', () => {
    const service = new TaskService();
    const tasks = service.generateDailyTasks();

    const taskIds = tasks.map(t => t.id);
    expect(taskIds).toContain('daily_games_3');
    expect(taskIds).toContain('daily_win_1');
    expect(taskIds).toContain('daily_hint_1');
  });
});
```

#### TC-TASK-03: 任务奖励配置
```typescript
describe('TaskService - 任务奖励', () => {
  it('任务奖励应配置正确', () => {
    const service = new TaskService();
    const tasks = service.generateDailyTasks();

    const gamesTask = tasks.find(t => t.id === 'daily_games_3');
    expect(gamesTask?.reward.coins).toBe(30);

    const winTask = tasks.find(t => t.id === 'daily_win_1');
    expect(winTask?.reward.coins).toBe(50);

    const hintTask = tasks.find(t => t.id === 'daily_hint_1');
    expect(hintTask?.reward.coins).toBe(20);
  });
});
```

#### TC-TASK-04: 任务进度更新
```typescript
describe('TaskService - 进度更新', () => {
  it('游戏结束后应更新任务进度', () => {
    const service = new TaskService();
    const tasks = service.generateDailyTasks();

    const gameTask = tasks.find(t => t.id === 'daily_games_3');
    expect(gameTask?.progress).toBe(0);

    service.updateTaskProgress('game_end');

    expect(gameTask?.progress).toBe(1);
  });
});
```

#### TC-TASK-05: 任务完成检测
```typescript
describe('TaskService - 完成检测', () => {
  it('进度达到目标时应标记为完成', () => {
    const service = new TaskService();
    const tasks = service.generateDailyTasks();

    const winTask = tasks.find(t => t.id === 'daily_win_1');

    // 更新进度
    service.updateTaskProgress('win');

    expect(winTask?.completed).toBe(true);
    expect(winTask?.claimed).toBe(false);
  });
});
```

#### TC-TASK-06: 领取任务奖励
```typescript
describe('TaskService - 领取奖励', () => {
  it('应正确发放任务奖励', () => {
    const service = new TaskService();
    const tasks = service.generateDailyTasks();
    const winTask = tasks.find(t => t.id === 'daily_win_1');

    // 完成任务
    service.updateTaskProgress('win');

    // 领取奖励
    const reward = service.claimTaskReward('daily_win_1');

    expect(reward.coins).toBe(50);
    expect(winTask?.claimed).toBe(true);
  });
});
```

#### TC-TASK-07: 任务刷新逻辑
```typescript
describe('TaskService - 刷新逻辑', () => {
  it('每日0点应刷新任务', () => {
    const service = new TaskService();

    const today = new Date().toDateString();
    service.setLastRefreshDate(today);

    const shouldRefresh = service.shouldRefreshDailyTasks();

    expect(shouldRefresh).toBe(false); // 今天已刷新
  });
});
```

#### TC-TASK-08: 周常任务生成
```typescript
describe('TaskService - 周常任务', () => {
  it('应生成周常任务', () => {
    const service = new TaskService();
    const tasks = service.generateWeeklyTasks();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('weekly_wins_10');
    expect(tasks[0].reward.coins).toBe(200);
  });
});
```

---

### 2.3 商城系统测试

**测试文件**: `src/services/__tests__/shop-service.test.ts`

#### TC-SHOP-01: 皮肤列表加载
```typescript
describe('ShopService - 皮肤列表', () => {
  it('应加载10款皮肤（5棋盘+5棋子）', () => {
    const service = new ShopService();
    const items = service.getShopItems();

    const boardSkins = items.filter(i => i.type === 'board_skin');
    const pieceSkins = items.filter(i => i.type === 'piece_skin');

    expect(boardSkins).toHaveLength(5);
    expect(pieceSkins).toHaveLength(5);
  });
});
```

#### TC-SHOP-02: 皮肤价格配置
```typescript
describe('ShopService - 皮肤价格', () => {
  it('皮肤价格应配置正确', () => {
    const service = new ShopService();
    const items = service.getShopItems();

    const classicBoard = items.find(i => i.id === 'classic_board');
    expect(classicBoard?.price).toBe(0); // 默认免费

    const oceanBoard = items.find(i => i.id === 'ocean_board');
    expect(oceanBoard?.price).toBe(200);

    const magmaBoard = items.find(i => i.id === 'magma_board');
    expect(magmaBoard?.price).toBe(1000);
  });
});
```

#### TC-SHOP-03: 购买皮肤
```typescript
describe('ShopService - 购买皮肤', () => {
  it('应成功购买皮肤', () => {
    const service = new ShopService();
    service.addCoins(1000);

    const result = service.purchaseSkin('ocean_board');

    expect(result.success).toBe(true);
    expect(service.getCoinBalance()).toBe(800); // 1000 - 200
  });
});
```

#### TC-SHOP-04: 金币不足检测
```typescript
describe('ShopService - 金币不足', () => {
  it('金币不足时应购买失败', () => {
    const service = new ShopService();
    service.addCoins(100);

    const result = service.purchaseSkin('magma_board');

    expect(result.success).toBe(false);
    expect(result.error).toBe('insufficient_coins');
  });
});
```

#### TC-SHOP-05: 重复购买检测
```typescript
describe('ShopService - 重复购买', () => {
  it('已拥有的皮肤不能再次购买', () => {
    const service = new ShopService();
    service.addCoins(1000);

    // 首次购买
    service.purchaseSkin('ocean_board');

    // 再次购买
    const result = service.purchaseSkin('ocean_board');

    expect(result.success).toBe(false);
    expect(result.error).toBe('already_owned');
  });
});
```

#### TC-SHOP-06: 皮肤应用
```typescript
describe('ShopService - 应用皮肤', () => {
  it('应正确应用棋盘皮肤', () => {
    const service = new ShopService();
    service.applySkin('ocean_board', 'board');

    expect(service.getCurrentBoardSkin()).toBe('ocean_board');
  });
});
```

---

### 2.4 签到功能测试

**测试文件**: `src/services/__tests__/checkin-service.test.ts`

#### TC-CHECKIN-01: 每日签到
```typescript
describe('CheckInService - 每日签到', () => {
  it('签到应获得50金币', () => {
    const service = new CheckInService();
    const result = service.checkIn();

    expect(result.success).toBe(true);
    expect(result.reward).toBe(50);
  });
});
```

#### TC-CHECKIN-02: 重复签到检测
```typescript
describe('CheckInService - 重复签到', () => {
  it('每天只能签到1次', () => {
    const service = new CheckInService();

    // 首次签到
    service.checkIn();

    // 再次签到
    const result = service.checkIn();

    expect(result.success).toBe(false);
    expect(result.error).toBe('already_checked_in');
  });
});
```

#### TC-CHECKIN-03: 连续签到计算
```typescript
describe('CheckInService - 连续签到', () => {
  it('连续签到应正确计算天数', () => {
    const service = new CheckInService();

    // 第1天
    service.checkIn();
    expect(service.getConsecutiveDays()).toBe(1);

    // 模拟第2天
    service.simulateNextDay();
    service.checkIn();
    expect(service.getConsecutiveDays()).toBe(2);

    // 模拟第7天
    for (let i = 3; i <= 7; i++) {
      service.simulateNextDay();
      service.checkIn();
    }
    expect(service.getConsecutiveDays()).toBe(7);
  });
});
```

#### TC-CHECKIN-04: 连续签到中断
```typescript
describe('CheckInService - 签到中断', () => {
  it('签到中断应重新开始计算', () => {
    const service = new CheckInService();

    // 连续签到3天
    for (let i = 0; i < 3; i++) {
      service.checkIn();
      service.simulateNextDay();
    }
    expect(service.getConsecutiveDays()).toBe(3);

    // 跳过1天
    service.simulateNextDay();
    service.simulateNextDay();
    service.checkIn();

    expect(service.getConsecutiveDays()).toBe(1); // 重新开始
  });
});
```

#### TC-CHECKIN-05: 连续7天奖励
```typescript
describe('CheckInService - 连续7天奖励', () => {
  it('连续7天应额外获得100金币', () => {
    const service = new CheckInService();

    // 连续签到7天
    for (let i = 0; i < 7; i++) {
      service.checkIn();
      if (i < 6) service.simulateNextDay();
    }

    const result = service.getCheckInResult();
    expect(result.bonus).toBe(100);
  });
});
```

---

### 2.5 用户状态管理测试

**测试文件**: `src/store/__tests__/user-store-coin.test.ts`

#### TC-STORE-01: 添加金币
```typescript
describe('UserStore - 添加金币', () => {
  it('应正确添加金币', () => {
    const store = useUserStore.getState();

    act(() => {
      store.addCoins(100);
    });

    expect(store.coins).toBe(100);
  });
});
```

#### TC-STORE-02: 任务进度更新
```typescript
describe('UserStore - 任务进度', () => {
  it('游戏结束应更新任务进度', () => {
    const store = useUserStore.getState();

    act(() => {
      store.checkTaskProgress('game_end');
    });

    const task = store.tasks.find(t => t.id === 'daily_games_3');
    expect(task?.progress).toBeGreaterThan(0);
  });
});
```

---

## 三、集成测试设计

### 3.1 游戏流程集成测试

**测试文件**: `src/store/__tests__/integration-week8.test.ts`

#### TC-INT-01: 游戏结束获得金币
```typescript
describe('Integration - 游戏结束金币奖励', () => {
  it('游戏胜利应获得金币', () => {
    const gameStore = useGameStore.getState();
    const userStore = useUserStore.getState();

    // 初始状态
    expect(userStore.coins).toBe(0);

    // 完成一局游戏
    act(() => {
      gameStore.endGame('win');
    });

    // 验证金币增加
    expect(userStore.coins).toBe(10);
  });
});
```

#### TC-INT-02: 游戏结束更新任务
```typescript
describe('Integration - 游戏结束任务进度', () => {
  it('游戏结束应更新任务进度', () => {
    const gameStore = useGameStore.getState();
    const userStore = useUserStore.getState();

    // 完成3局游戏
    for (let i = 0; i < 3; i++) {
      act(() => {
        gameStore.endGame('win');
      });
    }

    const task = userStore.tasks.find(t => t.id === 'daily_games_3');
    expect(task?.completed).toBe(true);
  });
});
```

---

## 四、UI组件测试

### 4.1 商城页面测试

**测试文件**: `src/components/Shop/__tests__/ShopPage.test.tsx`

#### TC-UI-SHOP-01: 商城页面显示
```typescript
describe('ShopPage - 显示', () => {
  it('应正确显示商城页面', () => {
    render(<ShopPage />);

    expect(screen.getByText('商城')).toBeInTheDocument();
    expect(screen.getByText('棋盘皮肤')).toBeInTheDocument();
    expect(screen.getByText('棋子皮肤')).toBeInTheDocument();
  });
});
```

#### TC-UI-SHOP-02: 皮肤卡片显示
```typescript
describe('ShopPage - 皮肤卡片', () => {
  it('应正确显示皮肤卡片', () => {
    render(<ShopPage />);

    expect(screen.getByText('经典木纹')).toBeInTheDocument();
    expect(screen.getByText('碧海青天')).toBeInTheDocument();
  });
});
```

### 4.2 任务列表测试

**测试文件**: `src/components/Tasks/__tests__/TaskList.test.tsx`

#### TC-UI-TASK-01: 任务列表显示
```typescript
describe('TaskList - 显示', () => {
  it('应正确显示每日任务', () => {
    render(<TaskList />);

    expect(screen.getByText('每日任务')).toBeInTheDocument();
    expect(screen.getByText('游戏达人')).toBeInTheDocument();
  });
});
```

---

## 五、测试用例统计

### 5.1 测试用例数量

| 模块 | 单元测试 | 集成测试 | UI测试 | 合计 |
|------|---------|---------|--------|------|
| 金币系统 | 6 | - | - | 6 |
| 任务系统 | 8 | - | - | 8 |
| 商城系统 | 6 | - | 2 | 8 |
| 签到功能 | 5 | - | - | 5 |
| 用户状态 | 2 | - | - | 2 |
| 游戏集成 | - | 2 | - | 2 |
| **总计** | **27** | **2** | **2** | **31** |

### 5.2 预估覆盖率

| 模块 | 语句覆盖率 | 分支覆盖率 | 函数覆盖率 |
|------|-----------|-----------|-----------|
| 金币系统 | >90% | >85% | 100% |
| 任务系统 | >90% | >85% | 100% |
| 商城系统 | >80% | >75% | 100% |
| 签到功能 | >90% | >85% | 100% |
| **整体** | **>85%** | **>80%** | **100%** |

---

## 六、测试执行计划

### 6.1 测试阶段

| 阶段 | 任务 | 负责人 | 时间 |
|------|------|--------|------|
| **阶段1** | DEV实现功能 | DEV | Day 1-2 |
| **阶段2** | QA编写测试 | QA | Day 2 |
| **阶段3** | QA执行测试 | QA | Day 3 |
| **阶段4** | Bug修复 | DEV | Day 3 |
| **阶段5** | 回归测试 | QA | Day 3 |
| **阶段6** | 文档和验收 | PM+PO | Day 3 |

### 6.2 测试环境

- **操作系统**: Windows 11 / macOS / Linux
- **浏览器**: Chrome / Firefox / Safari / Edge
- **Node版本**: v18+
- **测试框架**: Vitest + React Testing Library

---

## 七、验收标准（整体）

### 7.1 功能完整性
- [ ] 所有计划功能100%实现
- [ ] 金币系统完整可用
- [ ] 任务系统完整可用（4个任务）
- [ ] 商城系统完整可用（10款皮肤）
- [ ] 签到功能完整可用

### 7.2 质量标准
- [ ] 测试覆盖率>70%
- [ ] 所有测试通过
- [ ] Week 1-7回归测试100%通过
- [ ] TypeScript 0错误
- [ ] ESLint 0错误

### 7.3 性能标准
- [ ] 金币计算<50ms
- [ ] 任务刷新<100ms
- [ ] 商城购买<100ms
- [ ] 不影响AI性能
- [ ] 不影响游戏流畅度

### 7.4 文档完整性
- [ ] WO文档 ✅
- [ ] PL文档 ✅
- [ ] 测试用例 ✅
- [ ] 测试报告
- [ ] 验收报告

---

**文档状态**: ✅ 测试用例设计完成
**下一步**: DEV开始实现功能
