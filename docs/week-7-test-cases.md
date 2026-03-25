# Week 7 测试用例设计
## 经验值 + 等级 + 成就系统

**日期**: 2026-03-25
**版本**: v1.0
**状态**: 草稿
**负责人**: QA (Quality Assurance)

---

## 一、测试范围

### 1.1 测试模块

| 模块 | 功能 | 测试类型 |
|------|------|---------|
| **用户数据存储** | LocalStorage读写、数据迁移 | 单元测试 |
| **经验值系统** | 经验值计算、连胜奖励 | 单元测试 |
| **等级系统** | 等级计算、升级检测 | 单元测试 |
| **成就系统** | 成就定义、检测、解锁 | 单元测试 |
| **UI组件** | 等级徽章、成就弹窗、列表页面 | 集成测试 |
| **性能** | 存储性能、检测性能 | 性能测试 |
| **回归测试** | Week 1-6功能 | 回归测试 |

### 1.2 测试目标

- ✅ 功能完整性：所有计划功能100%实现
- ✅ 测试覆盖率：>70%
- ✅ 性能达标：存储<50ms，检测<100ms
- ✅ 零缺陷：所有测试通过
- ✅ 向后兼容：Week 1-6功能不受影响

---

## 二、单元测试设计

### 2.1 用户数据存储测试

**测试文件**: `src/services/__tests__/user-storage-service.test.ts`

#### TC-US-01: 初始化用户数据
```typescript
describe('UserStorageService - 初始化', () => {
  it('应创建默认用户数据', () => {
    const service = new UserStorageService();
    const data = service.getUserData();

    expect(data.exp).toBe(0);
    expect(data.level).toBe(1);
    expect(data.stats.totalGames).toBe(0);
    expect(data.achievements).toEqual({});
  });
});
```

#### TC-US-02: 保存用户数据
```typescript
describe('UserStorageService - 保存数据', () => {
  it('应正确保存用户数据到LocalStorage', () => {
    const service = new UserStorageService();
    const mockData: UserData = {
      exp: 100,
      level: 2,
      stats: { totalGames: 5, totalWins: 3, totalLosses: 2, totalDraws: 0, currentStreak: 2, maxWinStreak: 2, hintsUsed: 0 },
      achievements: { 'first_win': { unlocked: true, unlockedAt: new Date() } },
      dailyLogin: { lastLoginDate: '2026-03-25', consecutiveDays: 1 },
      settings: { soundEnabled: true, theme: 'light' }
    };

    service.saveUserData(mockData);
    const loaded = service.getUserData();

    expect(loaded.exp).toBe(100);
    expect(loaded.level).toBe(2);
  });
});
```

#### TC-US-03: 数据迁移
```typescript
describe('UserStorageService - 数据迁移', () => {
  it('应从v0版本迁移到v1版本', () => {
    // 模拟旧数据
    localStorage.setItem('gobang_user_data', JSON.stringify({
      exp: 500,
      // 缺少version字段
    }));

    const service = new UserStorageService();
    const data = service.getUserData();

    expect(data.version).toBe(1);
    expect(data.exp).toBe(500);
  });
});
```

#### TC-US-04: 数据版本控制
```typescript
describe('UserStorageService - 版本控制', () => {
  it('应拒绝加载未来版本数据', () => {
    localStorage.setItem('gobang_user_data', JSON.stringify({
      version: 999,
      exp: 0,
    }));

    const service = new UserStorageService();
    const data = service.getUserData();

    // 应返回默认数据
    expect(data.version).toBe(1);
    expect(data.exp).toBe(0);
  });
});
```

---

### 2.2 经验值系统测试

**测试文件**: `src/services/__tests__/exp-service.test.ts`

#### TC-EXP-01: 胜利经验值
```typescript
describe('ExpService - 胜利经验', () => {
  it('胜利应获得100基础经验', () => {
    const service = new ExpService();
    const exp = service.calculateExpGain('win', 1);

    expect(exp).toBe(100);
  });
});
```

#### TC-EXP-02: 失败经验值
```typescript
describe('ExpService - 失败经验', () => {
  it('失败应获得20基础经验', () => {
    const service = new ExpService();
    const exp = service.calculateExpGain('lose', 0);

    expect(exp).toBe(20);
  });
});
```

#### TC-EXP-03: 和棋经验值
```typescript
describe('ExpService - 和棋经验', () => {
  it('和棋应获得50基础经验', () => {
    const service = new ExpService();
    const exp = service.calculateExpGain('draw', 0);

    expect(exp).toBe(50);
  });
});
```

#### TC-EXP-04: 连胜奖励（2连胜）
```typescript
describe('ExpService - 连胜奖励', () => {
  it('连胜2局应额外获得50经验', () => {
    const service = new ExpService();
    const exp = service.calculateExpGain('win', 2);

    expect(exp).toBe(150); // 100 + 50
  });
});
```

#### TC-EXP-05: 连胜奖励（5连胜）
```typescript
describe('ExpService - 连胜奖励', () => {
  it('连胜5局每局应额外获得50经验', () => {
    const service = new ExpService();
    const exp = service.calculateExpGain('win', 5);

    expect(exp).toBe(150); // 100 + 50
  });
});
```

#### TC-EXP-06: 连胜中断
```typescript
describe('ExpService - 连胜中断', () => {
  it('连胜中断后应不获得连胜奖励', () => {
    const service = new ExpService();
    const exp = service.calculateExpGain('win', 1);

    expect(exp).toBe(100); // 仅基础经验
  });
});
```

#### TC-EXP-07: 经验值上限
```typescript
describe('ExpService - 经验值上限', () => {
  it('经验值超过10000后不应再增加', () => {
    const service = new ExpService();
    service.addExp(15000); // 超过上限

    expect(service.getTotalExp()).toBe(10000);
  });
});
```

---

### 2.3 等级系统测试

**测试文件**: `src/utils/__tests__/level-utils.test.ts`

#### TC-LVL-01: Lv1初学者
```typescript
describe('LevelUtils - Lv1初学者', () => {
  it('0经验应返回Lv1初学者', () => {
    const level = calculateLevel(0);

    expect(level.level).toBe(1);
    expect(level.name).toBe('初学者');
    expect(level.icon).toBe('🌱');
  });
});
```

#### TC-LVL-02: Lv2新手
```typescript
describe('LevelUtils - Lv2新手', () => {
  it('500经验应返回Lv2新手', () => {
    const level = calculateLevel(500);

    expect(level.level).toBe(2);
    expect(level.name).toBe('新手');
    expect(level.icon).toBe('🌿');
  });
});
```

#### TC-LVL-03: Lv3熟练者
```typescript
describe('LevelUtils - Lv3熟练者', () => {
  it('1500经验应返回Lv3熟练者', () => {
    const level = calculateLevel(1500);

    expect(level.level).toBe(3);
    expect(level.name).toBe('熟练者');
    expect(level.icon).toBe('⚔️');
  });
});
```

#### TC-LVL-04: Lv4高手
```typescript
describe('LevelUtils - Lv4高手', () => {
  it('3000经验应返回Lv4高手', () => {
    const level = calculateLevel(3000);

    expect(level.level).toBe(4);
    expect(level.name).toBe('高手');
    expect(level.icon).toBe('🏅');
  });
});
```

#### TC-LVL-05: Lv5大师
```typescript
describe('LevelUtils - Lv5大师', () => {
  it('6000经验应返回Lv5大师', () => {
    const level = calculateLevel(6000);

    expect(level.level).toBe(5);
    expect(level.name).toBe('大师');
    expect(level.icon).toBe('🏆');
  });
});
```

#### TC-LVL-06: Lv6宗师
```typescript
describe('LevelUtils - Lv6宗师', () => {
  it('10000经验应返回Lv6宗师', () => {
    const level = calculateLevel(10000);

    expect(level.level).toBe(6);
    expect(level.name).toBe('宗师');
    expect(level.icon).toBe('👑');
  });
});
```

#### TC-LVL-07: 等级上限
```typescript
describe('LevelUtils - 等级上限', () => {
  it('超过10000经验应仍返回Lv6宗师', () => {
    const level = calculateLevel(15000);

    expect(level.level).toBe(6);
    expect(level.name).toBe('宗师');
  });
});
```

#### TC-LVL-08: 升级检测
```typescript
describe('LevelUtils - 升级检测', () => {
  it('从400经验升到600经验应触发升级', () => {
    const result = checkLevelUp(400, 200);

    expect(result.leveledUp).toBe(true);
    expect(result.from.level).toBe(1);
    expect(result.to.level).toBe(2);
  });
});
```

#### TC-LVL-09: 未升级
```typescript
describe('LevelUtils - 未升级', () => {
  it('从400经验升到450经验不应触发升级', () => {
    const result = checkLevelUp(400, 50);

    expect(result.leveledUp).toBe(false);
    expect(result.from.level).toBe(1);
    expect(result.to.level).toBe(1);
  });
});
```

#### TC-LVL-10: 跨级升级
```typescript
describe('LevelUtils - 跨级升级', () => {
  it('从0经验升到2000经验应触发多级升级', () => {
    const result = checkLevelUp(0, 2000);

    expect(result.leveledUp).toBe(true);
    expect(result.from.level).toBe(1);
    expect(result.to.level).toBe(3); // Lv1 → Lv3
  });
});
```

---

### 2.4 成就系统测试

**测试文件**: `src/services/__tests__/achievement-service.test.ts`

#### TC-ACH-01: 初出茅庐成就
```typescript
describe('AchievementService - 初出茅庐', () => {
  it('完成第1局游戏应解锁初出茅庐成就', () => {
    const service = new AchievementService();
    const context: GameContext = {
      result: 'win',
      userStats: { totalGames: 1, totalWins: 1 },
    };

    const unlocked = service.checkGameEndAchievements(context);

    expect(unlocked).toContainEqual(
      expect.objectContaining({ id: 'first_game' })
    );
  });
});
```

#### TC-ACH-02: 首胜成就
```typescript
describe('AchievementService - 首胜', () => {
  it('首次胜利应解锁首胜成就', () => {
    const service = new AchievementService();
    const context: GameContext = {
      result: 'win',
      userStats: { totalGames: 1, totalWins: 1 },
    };

    const unlocked = service.checkGameEndAchievements(context);

    expect(unlocked).toContainEqual(
      expect.objectContaining({ id: 'first_win' })
    );
  });
});
```

#### TC-ACH-03: 连胜大师成就
```typescript
describe('AchievementService - 连胜大师', () => {
  it('达成5连胜应解锁连胜大师成就', () => {
    const service = new AchievementService();
    const context: GameContext = {
      result: 'win',
      currentStreak: 5,
    };

    const unlocked = service.checkGameEndAchievements(context);

    expect(unlocked).toContainEqual(
      expect.objectContaining({ id: 'win_streak_5' })
    );
  });
});
```

#### TC-ACH-04: 不败金身成就
```typescript
describe('AchievementService - 不败金身', () => {
  it('达成10连胜应解锁不败金身成就', () => {
    const service = new AchievementService();
    const context: GameContext = {
      result: 'win',
      currentStreak: 10,
    };

    const unlocked = service.checkGameEndAchievements(context);

    expect(unlocked).toContainEqual(
      expect.objectContaining({ id: 'win_streak_10' })
    );
  });
});
```

#### TC-ACH-05: 闪电战成就
```typescript
describe('AchievementService - 闪电战', () => {
  it('10步内获胜应解锁闪电战成就', () => {
    const service = new AchievementService();
    const context: GameContext = {
      result: 'win',
      totalMoves: 10,
    };

    const unlocked = service.checkGameEndAchievements(context);

    expect(unlocked).toContainEqual(
      expect.objectContaining({ id: 'quick_win_10' })
    );
  });
});
```

#### TC-ACH-06: 完美防守成就
```typescript
describe('AchievementService - 完美防守', () => {
  it('未失一子获胜应解锁完美防守成就', () => {
    const service = new AchievementService();
    const context: GameContext = {
      result: 'win',
      opponentPieces: 0,
    };

    const unlocked = service.checkGameEndAchievements(context);

    expect(unlocked).toContainEqual(
      expect.objectContaining({ id: 'perfect_defense' })
    );
  });
});
```

#### TC-ACH-07: 百战将成就
```typescript
describe('AchievementService - 百战将', () => {
  it('完成100局游戏应解锁百战将成就', () => {
    const service = new AchievementService();
    const context: GameContext = {
      userStats: { totalGames: 100 },
    };

    const unlocked = service.checkMilestoneAchievements(context);

    expect(unlocked).toContainEqual(
      expect.objectContaining({ id: 'games_100' })
    );
  });
});
```

#### TC-ACH-08: 千胜王者成就
```typescript
describe('AchievementService - 千胜王者', () => {
  it('累计获胜1000局应解锁千胜王者成就', () => {
    const service = new AchievementService();
    const context: GameContext = {
      userStats: { totalWins: 1000 },
    };

    const unlocked = service.checkMilestoneAchievements(context);

    expect(unlocked).toContainEqual(
      expect.objectContaining({ id: 'wins_1000' })
    );
  });
});
```

#### TC-ACH-09: 博学者成就
```typescript
describe('AchievementService - 博学者', () => {
  it('使用提示50次应解锁博学者成就', () => {
    const service = new AchievementService();
    const context: GameContext = {
      userStats: { hintsUsed: 50 },
    };

    const unlocked = service.checkMilestoneAchievements(context);

    expect(unlocked).toContainEqual(
      expect.objectContaining({ id: 'hints_50' })
    );
  });
});
```

#### TC-ACH-10: 成就不重复解锁
```typescript
describe('AchievementService - 成就不重复解锁', () => {
  it('已解锁的成就不应再次解锁', () => {
    const service = new AchievementService();
    service.unlockAchievement('first_win');

    const context: GameContext = {
      result: 'win',
      userStats: { totalWins: 1 },
    };

    const unlocked = service.checkGameEndAchievements(context);

    expect(unlocked).not.toContainEqual(
      expect.objectContaining({ id: 'first_win' })
    );
  });
});
```

---

### 2.5 用户状态管理测试

**测试文件**: `src/store/__tests__/user-store.test.ts`

#### TC-US-01: 添加经验值
```typescript
describe('UserStore - 添加经验值', () => {
  it('应正确添加经验值', () => {
    const store = useUserStore.getState();

    act(() => {
      store.addExp(100);
    });

    expect(store.exp).toBe(100);
  });
});
```

#### TC-US-02: 经验值触发升级
```typescript
describe('UserStore - 经验值触发升级', () => {
  it('经验值达到500应升级到Lv2新手', () => {
    const store = useUserStore.getState();

    act(() => {
      store.addExp(500);
    });

    expect(store.level).toBe(2);
  });
});
```

#### TC-US-03: 成就解锁奖励
```typescript
describe('UserStore - 成就解锁奖励', () => {
  it('解锁成就应获得奖励经验值', () => {
    const store = useUserStore.getState();
    const achievement = {
      id: 'first_win',
      reward: { exp: 100 }
    };

    act(() => {
      store.unlockAchievement(achievement);
    });

    expect(store.exp).toBeGreaterThanOrEqual(100);
    expect(store.achievements['first_win'].unlocked).toBe(true);
  });
});
```

---

## 三、集成测试设计

### 3.1 游戏流程集成测试

**测试文件**: `src/store/__tests__/integration.test.ts`

#### TC-INT-01: 游戏结束获得经验值
```typescript
describe('Integration - 游戏结束流程', () => {
  it('游戏胜利应正确获得经验值', () => {
    const gameStore = useGameStore.getState();
    const userStore = useUserStore.getState();

    // 初始状态
    expect(userStore.exp).toBe(0);

    // 完成一局游戏
    act(() => {
      gameStore.endGame('win');
    });

    // 验证经验值增加
    expect(userStore.exp).toBe(100);
  });
});
```

#### TC-INT-02: 连胜奖励集成
```typescript
describe('Integration - 连胜奖励', () => {
  it('连胜2局应正确获得额外经验值', () => {
    const gameStore = useGameStore.getState();
    const userStore = useUserStore.getState();

    // 第1局胜利
    act(() => {
      gameStore.endGame('win');
    });
    expect(userStore.exp).toBe(100);

    // 第2局胜利
    act(() => {
      gameStore.endGame('win');
    });
    expect(userStore.exp).toBe(250); // 100 + 150
  });
});
```

#### TC-INT-03: 成就解锁集成
```typescript
describe('Integration - 成就解锁', () => {
  it('首局胜利应解锁首胜成就', () => {
    const gameStore = useGameStore.getState();
    const userStore = useUserStore.getState();

    act(() => {
      gameStore.endGame('win');
    });

    expect(userStore.achievements['first_win'].unlocked).toBe(true);
  });
});
```

---

## 四、UI组件测试

### 4.1 等级徽章组件测试

**测试文件**: `src/components/User/__tests__/LevelBadge.test.tsx`

#### TC-UI-01: 等级徽章显示
```typescript
describe('LevelBadge - 显示', () => {
  it('应正确显示Lv1初学者徽章', () => {
    render(<LevelBadge level={1} name="初学者" icon="🌱" />);

    expect(screen.getByText('🌱')).toBeInTheDocument();
    expect(screen.getByText('Lv1 初学者')).toBeInTheDocument();
  });
});
```

#### TC-UI-02: 经验进度条
```typescript
describe('LevelBadge - 进度条', () => {
  it('应正确显示经验进度条', () => {
    render(<LevelBadge level={1} exp={250} nextLevelExp={500} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveStyle({ width: '50%' });
  });
});
```

---

### 4.2 成就弹窗组件测试

**测试文件**: `src/components/Achievement/__tests__/AchievementModal.test.tsx`

#### TC-UI-03: 成就弹窗显示
```typescript
describe('AchievementModal - 显示', () => {
  it('应正确显示成就解锁弹窗', () => {
    const achievement = {
      id: 'first_win',
      name: '首胜',
      description: '获得首次胜利',
      icon: '🎯',
      reward: { exp: 100, coins: 50 }
    };

    render(<AchievementModal achievement={achievement} />);

    expect(screen.getByText('🎯 首胜')).toBeInTheDocument();
    expect(screen.getByText('经验值 +100')).toBeInTheDocument();
    expect(screen.getByText('金币 +50')).toBeInTheDocument();
  });
});
```

#### TC-UI-04: 成就弹窗关闭
```typescript
describe('AchievementModal - 关闭', () => {
  it('点击确定按钮应关闭弹窗', () => {
    const onClose = jest.fn();
    const achievement = {
      id: 'first_win',
      name: '首胜',
      description: '获得首次胜利',
      icon: '🎯',
      reward: { exp: 100 }
    };

    render(<AchievementModal achievement={achievement} onClose={onClose} />);

    fireEvent.click(screen.getByText('确定'));
    expect(onClose).toHaveBeenCalled();
  });
});
```

---

### 4.3 成就列表页面测试

**测试文件**: `src/components/Achievement/__tests__/AchievementList.test.tsx`

#### TC-UI-05: 成就列表显示
```typescript
describe('AchievementList - 显示', () => {
  it('应正确显示成就列表', () => {
    const achievements = [
      { id: 'first_win', name: '首胜', unlocked: true },
      { id: 'win_streak_5', name: '连胜大师', unlocked: false },
    ];

    render(<AchievementList achievements={achievements} />);

    expect(screen.getByText('首胜')).toBeInTheDocument();
    expect(screen.getByText('连胜大师')).toBeInTheDocument();
  });
});
```

#### TC-UI-06: 成就分类筛选
```typescript
describe('AchievementList - 筛选', () => {
  it('应正确按分类筛选成就', () => {
    const achievements = [
      { id: 'first_win', category: 'game', unlocked: true },
      { id: 'quick_win_10', category: 'skill', unlocked: false },
    ];

    render(<AchievementList achievements={achievements} filter="game" />);

    expect(screen.getByText('首胜')).toBeInTheDocument();
    expect(screen.queryByText('闪电战')).not.toBeInTheDocument();
  });
});
```

---

## 五、性能测试

### 5.1 存储性能测试

#### TC-PERF-01: LocalStorage写入性能
```typescript
describe('Performance - LocalStorage写入', () => {
  it('写入用户数据应在50ms内完成', () => {
    const service = new UserStorageService();
    const data: UserData = {
      // ... 完整数据
    };

    const start = performance.now();
    service.saveUserData(data);
    const end = performance.now();

    expect(end - start).toBeLessThan(50);
  });
});
```

#### TC-PERF-02: LocalStorage读取性能
```typescript
describe('Performance - LocalStorage读取', () => {
  it('读取用户数据应在50ms内完成', () => {
    const service = new UserStorageService();

    const start = performance.now();
    service.getUserData();
    const end = performance.now();

    expect(end - start).toBeLessThan(50);
  });
});
```

---

### 5.2 成就检测性能测试

#### TC-PERF-03: 成就检测性能
```typescript
describe('Performance - 成就检测', () => {
  it('检测成就在100ms内完成', () => {
    const service = new AchievementService();
    const context: GameContext = {
      // ... 完整上下文
    };

    const start = performance.now();
    service.checkGameEndAchievements(context);
    const end = performance.now();

    expect(end - start).toBeLessThan(100);
  });
});
```

#### TC-PERF-04: 批量成就检测性能
```typescript
describe('Performance - 批量成就检测', () => {
  it('检测10个成就在100ms内完成', () => {
    const service = new AchievementService();

    const start = performance.now();
    for (let i = 0; i < 10; i++) {
      service.checkGameEndAchievements(mockContext);
    }
    const end = performance.now();

    expect(end - start).toBeLessThan(100);
  });
});
```

---

## 六、回归测试

### 6.1 Week 1-6功能回归测试

#### TC-REG-01: 游戏核心功能
```typescript
describe('Regression - 游戏核心功能', () => {
  it('应能正常进行游戏', () => {
    const gameStore = useGameStore.getState();

    act(() => {
      gameStore.makeMove({ x: 7, y: 7 });
    });

    expect(gameStore.board[7][7]).not.toBeNull();
  });
});
```

#### TC-REG-02: AI功能
```typescript
describe('Regression - AI功能', () => {
  it('AI应能正常落子', async () => {
    const aiClient = new AIClient();
    const board = createEmptyBoard();

    const move = await aiClient.calculateMove(board, 'medium');

    expect(move).toBeDefined();
    expect(board.isValid(move)).toBe(true);
  });
});
```

#### TC-REG-03: 悔棋功能
```typescript
describe('Regression - 悔棋功能', () => {
  it('应能正常悔棋', () => {
    const gameStore = useGameStore.getState();

    act(() => {
      gameStore.makeMove({ x: 7, y: 7 });
      gameStore.undoMove();
    });

    expect(gameStore.board[7][7]).toBeNull();
  });
});
```

---

## 七、测试用例统计

### 7.1 测试用例数量

| 模块 | 单元测试 | 集成测试 | UI测试 | 性能测试 | 合计 |
|------|---------|---------|--------|---------|------|
| 用户数据存储 | 4 | - | - | 2 | 6 |
| 经验值系统 | 7 | - | - | - | 7 |
| 等级系统 | 10 | - | - | - | 10 |
| 成就系统 | 10 | - | - | 2 | 12 |
| 用户状态管理 | 3 | - | - | - | 3 |
| 游戏流程集成 | - | 3 | - | - | 3 |
| UI组件 | - | - | 6 | - | 6 |
| 回归测试 | - | - | - | 3 | 3 |
| **总计** | **34** | **3** | **6** | **7** | **50** |

### 7.2 预估覆盖率

| 模块 | 语句覆盖率 | 分支覆盖率 | 函数覆盖率 |
|------|-----------|-----------|-----------|
| 用户数据存储 | >80% | >75% | 100% |
| 经验值系统 | >90% | >85% | 100% |
| 等级系统 | >90% | >85% | 100% |
| 成就系统 | >80% | >75% | 100% |
| UI组件 | >70% | >65% | 100% |
| **整体** | **>80%** | **>75%** | **100%** |

---

## 八、测试执行计划

### 8.1 测试阶段

| 阶段 | 任务 | 负责人 | 时间 |
|------|------|--------|------|
| **阶段1** | DEV实现功能 | DEV | Day 1-2 |
| **阶段2** | QA编写测试 | QA | Day 2 |
| **阶段3** | QA执行测试 | QA | Day 3 |
| **阶段4** | Bug修复 | DEV | Day 3 |
| **阶段5** | 回归测试 | QA | Day 3 |
| **阶段6** | 生成报告 | QA | Day 3 |

### 8.2 测试环境

- **操作系统**: Windows 11 / macOS / Linux
- **浏览器**: Chrome / Firefox / Safari / Edge
- **Node版本**: v18+
- **测试框架**: Vitest + React Testing Library

---

## 九、验收标准

### 9.1 功能验收

- [ ] 所有50个测试用例100%通过
- [ ] 测试覆盖率>70%
- [ ] 零缺陷
- [ ] 所有Week 1-6功能正常

### 9.2 性能验收

- [ ] LocalStorage读写<50ms
- [ ] 成就检测<100ms
- [ ] 等级计算<50ms
- [ ] 不影响AI性能

### 9.3 兼容性验收

- [ ] Chrome浏览器正常
- [ ] Firefox浏览器正常
- [ ] Safari浏览器正常
- [ ] Edge浏览器正常
- [ ] 移动端浏览器正常

---

**文档状态**: ✅ 测试用例设计完成
**下一步**: DEV开始实现功能
