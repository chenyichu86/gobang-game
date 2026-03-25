# Week 9 测试用例设计
## 数据持久化 + UI集成

**日期**: 2026-03-25
**版本**: v1.0
**状态**: 草稿
**负责人**: QA (Quality Assurance)

---

## 一、测试范围

### 1.1 测试模块

| 模块 | 功能 | 测试类型 |
|------|------|---------|
| **数据持久化** | LocalStorage保存、加载、迁移 | 单元测试 |
| **UI组件** | 金币显示、任务列表、商城页面、签到日历 | 单元测试 |
| **游戏流程集成** | 游戏结束触发奖励 | 集成测试 |
| **回归测试** | Week 1-8功能 | 回归测试 |

### 1.2 测试目标

- ✅ 功能完整性：所有计划功能100%实现
- ✅ 测试覆盖率：>70%
- ✅ 数据持久化：刷新页面不丢失数据
- ✅ 零缺陷：所有测试通过
- ✅ 向后兼容：Week 1-8功能不受影响

---

## 二、单元测试设计

### 2.1 数据持久化测试

**测试文件**: `src/services/__tests__/storage-service.test.ts`

#### TC-STORAGE-01: 保存用户数据
```typescript
describe('StorageService - 保存用户数据', () => {
  it('应正确保存用户数据到LocalStorage', () => {
    const service = new StorageService();
    const userData: UserDataV2 = {
      version: 2,
      coins: 1000,
      exp: 500,
      level: 2,
      // ... 其他字段
    };

    const success = service.saveUserData(userData);

    expect(success).toBe(true);
    const saved = localStorage.getItem('gobang_user_data_v2');
    expect(saved).toBeTruthy();
  });
});
```

#### TC-STORAGE-02: 加载用户数据
```typescript
describe('StorageService - 加载用户数据', () => {
  it('应正确加载用户数据', () => {
    const service = new StorageService();
    const userData = service.loadUserData();

    expect(userData).not.toBeNull();
    expect(userData?.version).toBe(2);
    expect(userData?.coins).toBeDefined();
  });
});
```

#### TC-STORAGE-03: 数据迁移
```typescript
describe('StorageService - 数据迁移', () => {
  it('应正确从v1迁移到v2', () => {
    const service = new StorageService();
    const v1Data = { version: 1, exp: 100, level: 1 };

    service.saveUserData(v1Data as any);
    const migrated = service.loadUserData();

    expect(migrated?.version).toBe(2);
    expect(migrated?.coins).toBe(0); // v1没有coins字段，默认为0
  });
});
```

#### TC-STORAGE-04: 自动保存
```typescript
describe('UserStore - 自动保存', () => {
  it('金币变化时应自动保存', async () => {
    const store = useUserStore.getState();

    // 监听localStorage
    const spy = vi.spyOn(Storage.prototype, 'saveUserData');

    act(() => {
      store.addCoins(100);
    });

    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
    });
  });
});
```

#### TC-STORAGE-05: 存储空间不足处理
```typescript
describe('StorageService - 存储空间不足', () => {
  it('应处理QuotaExceededError', () => {
    const service = new StorageService();

    // Mock localStorage抛出QuotaExceededError
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      const error = new Error();
      (error as any).name = 'QuotaExceededError';
      throw error;
    });

    const success = service.saveUserData({ version: 2, coins: 0 } as any);

    expect(success).toBe(false);
  });
});
```

---

### 2.2 UI组件测试

#### 2.2.1 金币显示组件测试

**测试文件**: `src/components/CoinDisplay/__tests__/CoinDisplay.test.tsx`

**测试用例**: 5个

```typescript
describe('CoinDisplay', () => {
  it('应正确显示金币数量', () => {
    render(<CoinDisplay />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('应格式化金币数字（1,250）', () => {
    // Mock store返回1250金币
    render(<CoinDisplay />);
    expect(screen.getByText('1,250')).toBeInTheDocument();
  });

  it('应显示金币标签', () => {
    render(<CoinDisplay showLabel={true} />);
    expect(screen.getByText('金币')).toBeInTheDocument();
  });

  it('点击应触发回调', () => {
    const handleClick = vi.fn();
    render(<CoinDisplay onClick={handleClick} />);

    fireEvent.click(screen.getByText('🪙'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('应响应store变化', async () => {
    const { rerender } = render(<CoinDisplay />);

    act(() => {
      useUserStore.getState().addCoins(100);
    });

    rerender(<CoinDisplay />);
    // 验证金币数量更新
  });
});
```

#### 2.2.2 任务列表组件测试

**测试文件**: `src/components/Tasks/__tests__/TaskList.test.tsx`

**测试用例**: 6个

```typescript
describe('TaskList', () => {
  it('应显示每日任务列表', () => {
    render(<TaskList />);
    expect(screen.getByText('每日任务')).toBeInTheDocument();
  });

  it('应显示任务进度', () => {
    render(<TaskList />);
    expect(screen.getByText(/2\/3/)).toBeInTheDocument();
  });

  it('应显示进度条', () => {
    render(<TaskList />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('已完成任务应显示"已完成"', () => {
    render(<TaskList />);
    expect(screen.getAllByText('✓ 已完成').length).toBeGreaterThan(0);
  });

  it('可领取任务应显示"领取"按钮', () => {
    render(<TaskList />);
    const claimButton = screen.getByText('领取');
    expect(claimButton).toBeInTheDocument();
  });

  it('未完成任务应显示禁用的"领取"按钮', () => {
    render(<TaskList />);
    const disabledButton = screen.getByText('领取');
    expect(disabledButton).toBeDisabled();
  });
});
```

#### 2.2.3 商城页面组件测试

**测试文件**: `src/components/Shop/__tests__/ShopPage.test.tsx`

**测试用例**: 7个

```typescript
describe('ShopPage', () => {
  it('应显示商城标题和金币', () => {
    render(<ShopPage />);
    expect(screen.getByText('商城')).toBeInTheDocument();
    expect(screen.getByText('金币')).toBeInTheDocument();
  });

  it('应显示分类标签', () => {
    render(<ShopPage />);
    expect(screen.getByText('棋盘皮肤')).toBeInTheDocument();
    expect(screen.getByText('棋子皮肤')).toBeInTheDocument();
  });

  it('应显示皮肤卡片', () => {
    render(<ShopPage />);
    expect(screen.getByText('经典木纹')).toBeInTheDocument();
    expect(screen.getByText('碧海青天')).toBeInTheDocument();
  });

  it('已拥有皮肤应显示"应用中"', () => {
    render(<ShopPage defaultTab="board" />);
    expect(screen.getByText('应用中')).toBeInTheDocument();
  });

  it('未拥有皮肤应显示价格和"购买"按钮', () => {
    render(<ShopPage />);
    expect(screen.getByText('200💰')).toBeInTheDocument();
    expect(screen.getAllByText('购买').length).toBeGreaterThan(0);
  });

  it('点击分类标签应切换显示', () => {
    render(<ShopPage />);
    fireEvent.click(screen.getByText('棋子皮肤'));
    // 验证显示棋子皮肤
  });

  it('点击购买应调用购买方法', () => {
    const purchaseSkin = vi.fn();
    render(<ShopPage />);

    const purchaseButton = screen.getByText('购买');
    fireEvent.click(purchaseButton);

    expect(purchaseSkin).toHaveBeenCalled();
  });
});
```

#### 2.2.4 签到日历组件测试

**测试文件**: `src/components/CheckIn/__tests__/CheckInCalendar.test.tsx`

**测试用例**: 7个

```typescript
describe('CheckInCalendar', () => {
  it('应显示日历标题', () => {
    render(<CheckInCalendar />);
    expect(screen.getByText('📅 每日签到')).toBeInTheDocument();
  });

  it('应显示连续签到天数', () => {
    render(<CheckInCalendar />);
    expect(screen.getByText(/连续签到:/)).toBeInTheDocument();
  });

  it('应显示当月日历', () => {
    render(<CheckInCalendar />);
    // 验证显示1-31日
  });

  it('已签到日期应显示✓标记', () => {
    // Mock签到数据
    render(<CheckInCalendar />);
    const checkMarks = screen.getAllByText('✓');
    expect(checkMarks.length).toBeGreaterThan(0);
  });

  it('今日已签到应显示"今日已签到"', () => {
    // Mock今天已签到
    render(<CheckInCalendar />);
    expect(screen.getByText('今日已签到')).toBeInTheDocument();
  });

  it('今日未签到应显示"立即签到"按钮', () => {
    // Mock今天未签到
    render(<CheckInCalendar />);
    expect(screen.getByText('立即签到')).toBeInTheDocument();
  });

  it('点击签到按钮应触发签到', () => {
    const checkIn = vi.fn();
    render(<CheckInCalendar onCheckIn={checkIn} />);

    const button = screen.getByText('立即签到');
    fireEvent.click(button);

    expect(checkIn).toHaveBeenCalled();
  });
});
```

---

### 2.3 游戏流程集成测试

**测试文件**: `src/store/__tests__/integration-week9.test.ts`

#### TC-INT-01: 游戏结束触发金币奖励
```typescript
describe('Integration - 游戏结束金币奖励', () => {
  it('游戏胜利应获得金币', () => {
    const gameStore = useGameStore.getState();
    const userStore = useUserStore.getState();

    const initialCoins = userStore.coins;

    act(() => {
      gameStore.endGameWithRewards('win');
    });

    expect(userStore.coins).toBe(initialCoins + 10);
  });
});
```

#### TC-INT-02: 游戏结束触发任务进度
```typescript
describe('Integration - 游戏结束任务进度', () => {
  it('游戏胜利应更新胜利任务', () => {
    const gameStore = useGameStore.getState();
    const userStore = useUserStore.getState();

    act(() => {
      gameStore.endGameWithRewards('win');
    });

    const winTask = userStore.tasks.find(t => t.id === 'daily_win_1');
    expect(winTask?.progress).toBe(1);
  });
});
```

#### TC-INT-03: 游戏结束自动保存数据
```typescript
describe('Integration - 自动保存', () => {
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
});
```

---

## 三、测试用例统计

### 3.1 测试用例数量

| 模块 | 单元测试 | 集成测试 | 合计 |
|------|---------|---------|------|
| 数据持久化 | 5 | - | 5 |
| UI组件 | 25 | - | 25 |
| 游戏集成 | - | 3 | 3 |
| **总计** | **30** | **3** | **33** |

### 3.2 预估覆盖率

| 模块 | 语句覆盖率 | 分支覆盖率 |
|------|-----------|-----------|
| 数据持久化 | >85% | >80% |
| UI组件 | >75% | >70% |
| 集成测试 | >80% | >75% |

---

## 四、测试执行计划

### 4.1 测试阶段

| 阶段 | 任务 | 负责人 | 时间 |
|------|------|--------|------|
| **阶段1** | PO创建WO+PL文档 | PO | Day 1 |
| **阶段2** | QA编写测试 | QA | Day 1-2 |
| **阶段3** | DEV实现功能 | DEV | Day 2-3 |
| **阶段4** | QA执行测试 | QA | Day 3 |
| **阶段5** | Bug修复 | DEV | Day 3 |
| **阶段6** | 验收和归档 | PM+PO | Day 3 |

---

## 五、验收标准（整体）

### 5.1 功能完整性
- [ ] 所有计划功能100%实现
- [ ] 数据持久化完整可用
- [ ] 4个UI组件完整可用
- [ ] 游戏流程集成完成

### 5.2 质量标准
- [ ] 测试覆盖率>70%
- [ ] 所有测试通过
- [ ] Week 1-8回归测试100%通过
- [ ] TypeScript 0错误
- [ ] ESLint 0错误

### 5.3 性能标准
- [ ] 数据保存<100ms
- [ ] 数据加载<100ms
- [ ] UI渲染<50ms
- [ ] 不影响游戏性能

---

**文档状态**: ✅ 测试用例设计完成
**下一步**: QA编写测试代码（TDD First）
