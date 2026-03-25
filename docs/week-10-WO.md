# Week 10 工作对象定义 (WO)
## Week 9.1 游戏流程集成 + Week 10 性能优化 + E2E测试

**日期**: 2026-03-25
**版本**: v1.0
**状态**: 草稿
**负责人**: 产品经理 (PO)

---

## 1. 工作对象概述

### 1.1 工作对象名称
**Week 9.1 游戏流程集成 + Week 10 性能优化和E2E测试**

### 1.2 工作对象背景
- Week 9已完成：数据持久化（PersistenceService）+ UI组件（CoinDisplay, TaskList, ShopPage, CheckInCalendar）
- Week 9验收状态：条件通过（核心功能100%，但游戏流程集成待补充）
- 项目进度：75% (9/12 weeks)
- 当前阶段：Phase 4 - 优化和测试

**Week 9.1 待补充功能**（根据 week-9-acceptance-report.md）:
- game-store.ts 中集成金币奖励
- game-store.ts 中集成任务进度更新
- 游戏结束自动保存数据

**Week 10 主要任务**（根据 ARCHITECTURE.md Phase 4规划）:
- AI性能优化（Web Worker完善）
- Canvas渲染优化
- 内存泄漏检查
- 代码分割（懒加载）
- 图片资源优化
- Playwright E2E测试完善
- 性能测试和基准

### 1.3 工作对象目标
- Week 9.1: 补充游戏流程集成（1-2小时）
- Week 10: 性能优化，提升用户体验
- Week 10: E2E测试完善，保证质量
- Week 10: 为Week 11-12的集成测试和发布做准备

---

## 2. 工作对象分解

### 2.1 子工作对象1：Week 9.1 - 游戏流程集成

**优先级**: 🔴 高（必须先完成）
**估算时间**: 1-2小时

**目标**: 集成金币奖励、任务进度、数据保存到游戏结束流程

**交付物**:
- `src/store/game-store.ts` (扩展) - 添加金币和任务触发
- `src/store/user-store.ts` (扩展) - 添加持久化监听

**技术规格**:

**游戏结束流程扩展**:
```typescript
// Week 7流程
游戏结束 → 判断胜负 → 计算经验值 → 检查等级升级 → 检查成就 → 显示结果 → 保存数据

// Week 9.1流程
游戏结束 → 判断胜负 → 计算金币 → 更新任务进度 → 检查成就 → 计算经验值 → 检查等级升级 → 显示结果 → 保存数据
```

**金币奖励触发**:
```typescript
// game-store.ts
endGame(result: GameResult): void {
  // 1. 计算金币
  const coins = coinService.calculateCoinGain(result);
  userStore.addCoins(coins);

  // 2. 更新任务进度
  userStore.checkTaskProgress(result); // 'win' | 'lose' | 'draw'

  // 3. 原有的经验值和成就逻辑
  const exp = expService.calculateExpGain(result);
  userStore.addExp(exp);

  // ...
}
```

**数据自动保存**:
```typescript
// user-store.ts
addCoins(amount: number): void {
  this.coins += amount;
  this.totalEarned += amount;

  // 自动保存到LocalStorage
  persistenceService.save('gobang_user_data_v2', this.getUserData());
}
```

**验收标准**:
- [ ] 游戏结束触发金币奖励
- [ ] 游戏结束触发任务进度更新
- [ ] 数据自动保存到LocalStorage
- [ ] 不破坏Week 1-9的功能
- [ ] Week 1-9的414个测试继续通过

---

### 2.2 子工作对象2：AI性能优化

**优先级**: 🟡 中
**估算时间**: 4-6小时

**目标**: 优化AI计算性能，减少响应时间

**交付物**:
- `src/game/ai/ai.worker.ts` (优化)
- `src/game/ai/ai-client.ts` (优化)
- 性能测试报告

**技术规格**:

**Web Worker优化**:
- Worker复用（避免重复创建）
- 消息传递优化（使用Transferable Objects）
- 内存管理优化

**AI算法优化**:
- 候选着法生成优化
- 评估函数优化
- 剪枝策略优化

**性能目标**:
- SimpleAI: <10ms ✅ (已达标)
- MediumAI: <50ms ✅ (已达标)
- HardAI (depth 4): <3秒 ✅ (已达标)
- MasterAI (depth 6): <10秒 ✅ (已达标)

**验收标准**:
- [ ] Worker复用正常工作
- [ ] 内存无泄漏
- [ ] AI响应时间保持或改善
- [ ] 所有AI测试通过

---

### 2.3 子工作对象3：Canvas渲染优化

**优先级**: 🟡 中
**估算时间**: 3-4小时

**目标**: 优化棋盘渲染性能，提升帧率

**交付物**:
- `src/components/Board/BoardStage.tsx` (优化)
- `src/components/Board/BoardLayer.tsx` (优化)
- `src/components/Board/PiecesLayer.tsx` (优化)

**技术规格**:

**渲染优化策略**:
- 离屏Canvas缓存静态内容（棋盘背景、网格线、星位点）
- 脏标记重绘（只重绘变化的部分）
- requestAnimationFrame优化
- 图层分层（背景、棋盘、棋子、高亮、特效）

**性能目标**:
- 棋盘初始渲染: <100ms ✅ (已达标)
- 落子渲染: <20ms ✅ (已达标)
- 60fps流畅度

**验收标准**:
- [ ] 离屏Canvas缓存正常工作
- [ ] 脏标记重绘正常工作
- [ ] 帧率保持60fps
- [ ] 内存占用合理

---

### 2.4 子工作对象4：内存泄漏检查

**优先级**: 🟡 中
**估算时间**: 2-3小时

**目标**: 检查并修复内存泄漏

**交付物**:
- 内存泄漏测试用例
- 修复报告

**技术规格**:

**检查项**:
- 事件监听器清理（组件卸载时）
- 定时器清理（setTimeout, setInterval）
- Web Worker清理
- Konva Stage清理
- Store订阅清理

**测试方法**:
- 使用Chrome DevTools Memory Profiler
- 使用Playwright内置的内存监控
- 编写自动化内存泄漏测试

**验收标准**:
- [ ] 无事件监听器泄漏
- [ ] 无定时器泄漏
- [ ] 无Worker泄漏
- [ ] 无Konva Stage泄漏
- [ ] 长时间运行内存稳定

---

### 2.5 子工作对象5：代码分割（懒加载）

**优先级**: 🟢 低
**估算时间**: 2-3小时

**目标**: 实现代码分割，减少首屏加载时间

**交付物**:
- `src/App.tsx` (路由懒加载)
- `vite.config.ts` (构建配置)
- 性能对比报告

**技术规格**:

**路由懒加载**:
```typescript
// App.tsx
import { lazy, Suspense } from 'react';

const HomePage = lazy(() => import('./pages/HomePage'));
const GamePage = lazy(() => import('./pages/GamePage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));

<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/game" element={<GamePage />} />
    <Route path="/shop" element={<ShopPage />} />
  </Routes>
</Suspense>
```

**Vite构建配置**:
```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom'],
        'canvas-vendor': ['konva', 'react-konva'],
        'state-vendor': ['zustand'],
      }
    }
  }
}
```

**性能目标**:
- 首屏加载时间: <2秒
- 路由切换时间: <500ms

**验收标准**:
- [ ] 路由懒加载正常工作
- [ ] 首屏加载时间减少
- [ ] 所有功能正常
- [ ] 测试全部通过

---

### 2.6 子工作对象6：图片资源优化

**优先级**: 🟢 低
**估算时间**: 1-2小时

**目标**: 优化图片资源，减少加载时间

**交付物**:
- 优化后的图片资源
- 图片压缩报告

**技术规格**:

**优化策略**:
- 使用WebP格式（如果浏览器支持）
- 图片压缩（无损压缩）
- 响应式图片（不同尺寸）
- 图片懒加载
- CDN加速

**验收标准**:
- [ ] 图片大小减少>30%
- [ ] 图片质量无明显损失
- [ ] 图片加载正常

---

### 2.7 子工作对象7：Playwright E2E测试完善

**优先级**: 🟡 中
**估算时间**: 6-8小时

**目标**: 完善E2E测试，覆盖核心流程

**交付物**:
- `tests/e2e/pvp-game.spec.ts` (完善)
- `tests/e2e/pve-game.spec.ts` (完善)
- `tests/e2e/shop.spec.ts` (新增)
- `tests/e2e/tasks.spec.ts` (新增)
- `tests/e2e/checkin.spec.ts` (新增)

**技术规格**:

**PvP对局完整流程**:
```typescript
test('PvP game flow', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.click('[data-testid="pvp-mode-button"]');
  await page.click('[data-testid="start-game-button"]');

  // Black moves
  await page.locator('.konvajs-content').click({ position: { x: 300, y: 300 } });
  await expect(page.locator('[data-testid="status"]')).toContainText('白棋回合');

  // White moves
  await page.locator('.konvajs-content').click({ position: { x: 320, y: 300 } });
  await expect(page.locator('[data-testid="status"]')).toContainText('黑棋回合');

  // Continue until game ends
  // ...

  // Verify winner display
  await expect(page.locator('[data-testid="winner-modal"]')).toBeVisible();
});
```

**PvE对局完整流程**:
```typescript
test('PvE game flow - Medium difficulty', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.click('[data-testid="pve-mode-button"]');
  await page.selectOption('[data-testid="difficulty-select"]', 'medium');
  await page.click('[data-testid="start-game-button"]');

  // Player moves
  await page.locator('.konvajs-content').click({ position: { x: 300, y: 300 } });

  // Wait for AI to move
  await expect(page.locator('[data-testid="status"]')).toContainText('黑棋回合');

  // Continue until game ends
  // ...
});
```

**商城功能测试**:
```typescript
test('Shop page - Purchase skin', async ({ page }) => {
  await page.goto('http://localhost:5173/shop');

  // Check coin balance
  const initialCoins = await page.locator('[data-testid="coin-balance"]').textContent();

  // Purchase a skin
  await page.click('[data-testid="skin-classic-board"]');
  await page.click('[data-testid="purchase-button"]');

  // Verify purchase
  await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  await expect(page.locator('[data-testid="owned-badge"]')).toBeVisible();
});
```

**任务系统测试**:
```typescript
test('Tasks page - Complete task', async ({ page }) => {
  await page.goto('http://localhost:5173/tasks');

  // Check initial progress
  await expect(page.locator('[data-testid="task-progress"]')).toHaveText('0/3');

  // Complete 3 games
  for (let i = 0; i < 3; i++) {
    await completeGame(page);
  }

  // Go back to tasks
  await page.goto('http://localhost:5173/tasks');
  await expect(page.locator('[data-testid="task-progress"]')).toHaveText('3/3');

  // Claim reward
  await page.click('[data-testid="claim-reward-button"]');
  await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
});
```

**签到功能测试**:
```typescript
test('CheckIn page - Daily check-in', async ({ page }) => {
  await page.goto('http://localhost:5173/checkin');

  // Check initial state
  await expect(page.locator('[data-testid="check-in-button"]')).toBeEnabled();

  // Perform check-in
  await page.click('[data-testid="check-in-button"]');

  // Verify success
  await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  await expect(page.locator('[data-testid="check-in-button"]')).toBeDisabled();
  await expect(page.locator('[data-testid="consecutive-days"]')).toHaveText('1天');
});
```

**验收标准**:
- [ ] PvP对局完整流程测试通过
- [ ] PvE对局完整流程测试通过
- [ ] 提示功能测试通过
- [ ] 悔棋功能测试通过
- [ ] 游戏记录查看测试通过
- [ ] 游戏回放播放测试通过
- [ ] 商城功能测试通过
- [ ] 任务系统测试通过
- [ ] 签到功能测试通过
- [ ] 响应式测试通过

---

### 2.8 子工作对象8：性能测试和基准

**优先级**: 🟡 中
**估算时间**: 3-4小时

**目标**: 建立性能基准，监控性能指标

**交付物**:
- 性能测试脚本
- 性能基准报告

**技术规格**:

**性能指标**:
- 首屏加载时间（LCP, FID, CLS）
- AI响应时间（各难度）
- 棋盘渲染时间
- 内存占用
- 内存泄漏检测

**测试工具**:
- Lighthouse（CI集成）
- Chrome DevTools Performance
- Playwright性能监控

**验收标准**:
- [ ] Lighthouse分数>90
- [ ] AI响应时间达标
- [ ] 无内存泄漏
- [ ] 长时间运行稳定

---

## 3. 技术约束

### 3.1 性能约束
- AI响应时间不能变慢（SimpleAI <10ms, MediumAI <50ms, HardAI <5s, MasterAI <10s）
- 首屏加载时间 <2秒
- 棋盘渲染保持60fps

### 3.2 兼容性约束
- 不能破坏Week 1-9的任何功能
- Week 1-9的414个测试必须继续通过
- E2E测试必须覆盖所有核心流程

### 3.3 时间约束
- Week 9.1: 1-2小时（高优先级）
- Week 10: 2-3天

---

## 4. 依赖关系

### 4.1 前置依赖
- ✅ Week 1-9全部完成
- ✅ Week 9.1待补充功能必须先完成

### 4.2 后续依赖
- Week 11: 集成测试 + Bug修复
- Week 12: 部署 + 文档 + 正式上线

---

## 5. 风险评估

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| Week 9.1功能破坏Week 1-9 | 低 | 高 | 严格遵循TDD，先写测试 |
| 性能优化效果不明显 | 中 | 低 | 建立基准，逐步优化 |
| E2E测试工作量超时 | 中 | 中 | 优先覆盖核心流程 |
| 内存泄漏难以发现 | 中 | 中 | 使用自动化工具检测 |
| 代码分割导致功能异常 | 低 | 中 | 充分测试路由切换 |

---

## 6. 验收标准（整体）

### 6.1 功能完整性
- [ ] Week 9.1游戏流程集成完成
- [ ] AI性能优化完成
- [ ] Canvas渲染优化完成
- [ ] 内存泄漏检查完成
- [ ] 代码分割完成（可选）
- [ ] E2E测试完善完成
- [ ] 性能基准建立完成

### 6.2 质量标准
- [ ] 测试覆盖率>80%
- [ ] 所有测试通过（Week 1-10）
- [ ] Week 1-9回归测试100%通过
- [ ] E2E测试核心流程100%通过
- [ ] TypeScript 0错误
- [ ] ESLint 0错误

### 6.3 性能标准
- [ ] AI响应时间保持或改善
- [ ] 首屏加载时间<2秒
- [ ] 棋盘渲染保持60fps
- [ ] 无内存泄漏
- [ ] Lighthouse分数>90

### 6.4 文档完整性
- [ ] WO文档 ✅
- [ ] PL文档
- [ ] 测试用例文档
- [ ] 测试报告
- [ ] 验收报告

---

## 7. 时间估算

| 任务 | 预估时间 | 负责人 |
|------|---------|--------|
| Week 9.1 游戏流程集成 | 1-2小时 | DEV |
| AI性能优化 | 4-6小时 | DEV |
| Canvas渲染优化 | 3-4小时 | DEV |
| 内存泄漏检查 | 2-3小时 | DEV+QA |
| 代码分割 | 2-3小时 | DEV |
| 图片资源优化 | 1-2小时 | DEV |
| E2E测试完善 | 6-8小时 | QA |
| 性能测试和基准 | 3-4小时 | QA |
| 集成和测试 | 2小时 | QA+DEV |
| 文档和验收 | 1小时 | PM+PO |

**总计**: 约2-3个工作日（Week 9.1: 1-2小时，Week 10: 2-3天）

---

## 8. TDD流程状态

### 8.1 检查点1: PO需求定义 ✅
- [x] WO文档已创建
- [x] PL文档已创建
- [x] 验收标准明确定义

**状态**: ✅ 完成 (2026-03-25)

### 8.2 检查点2: QA编写测试代码（RED）✅
- [x] 测试用例文档已创建（week-10-test-cases.md）
- [x] 单元测试代码已编写（22个测试）
- [x] E2E测试代码已编写（10个测试）
- [x] 测试运行结果显示失败（RED状态）

**测试文件**:
- `src/__tests__/week-10/game-integration.test.ts` (10个测试)
- `src/__tests__/week-10/performance.test.ts` (12个测试)
- `tests/e2e/week-10/*.spec.ts` (10个测试)

**RED状态验证**:
```
Test Files:  2 failed (2)
Tests:       10 failed (10)  // game-integration测试
Duration:    6ms
失败原因: endGameWithRewards() 方法未实现（符合预期）
```

**状态**: ✅ 完成 (2026-03-25)

### 8.3 检查点3: PM核准进入实现 ✅

**PM验证**:
- [x] 测试文件存在: 7个文件（2个单元测试 + 5个E2E测试）
- [x] 测试用例数量: 32个（22个单元测试 + 10个E2E测试）
- [x] Week 9.1测试失败状态: 10个全部 RED（功能未实现）
- [x] 失败原因: `endGameWithRewards()` 方法未实现（预期）

**PM签认**: ✅ **批准DEV开始实现Week 9.1功能**

**签认日期**: 2026-03-25
**PM**: Agent

**DEV注意事项**:
- ✅ 只能修改业务逻辑代码
- ❌ 禁止修改测试代码
- 🎯 目标：让10个Week 9.1测试从FAIL变为PASS
- ⚠️ 性能测试部分后续实现（Week 10主要任务）

---

**文档状态**: ✅ WO文档创建完成，已批准进入实现阶段
**下一步**: DEV开始实现Week 9.1游戏流程集成
