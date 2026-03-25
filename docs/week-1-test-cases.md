# Week 1 - 测试用例文档

## 文档信息
- **文档版本**: v1.0
- **创建日期**: 2026-03-24
- **负责人**: 测试Agent (QA)
- **阶段**: Phase 1 - MVP基础版本
- **周次**: Week 1
- **参考文档**: week-1-WO.md, week-1-PL.md

---

## 一、测试策略

### 1.1 测试范围
本周测试覆盖项目基础框架的所有核心功能：
- 项目构建和启动
- 路由系统
- 状态管理
- 类型系统
- 样式系统
- 代码规范

### 1.2 测试类型
1. **单元测试**: 测试独立的函数和组件
2. **集成测试**: 测试模块间的交互
3. **端到端测试**: 测试完整的用户流程
4. **代码质量测试**: ESLint、TypeScript检查

### 1.3 测试工具
- **Vitest**: 单元测试和集成测试
- **React Testing Library**: 组件测试
- **ESLint**: 代码质量检查
- **TypeScript**: 类型检查

---

## 二、测试用例设计

### 2.1 项目构建测试

#### TC-001: 项目初始化
**优先级**: P0（必须通过）

**测试步骤**:
```bash
1. npm create vite@latest gobang-game -- --template react-ts
2. cd gobang-game
3. npm install
```

**预期结果**:
- 项目创建成功
- node_modules目录存在
- package.json包含所有必需依赖

**实际结果**: 待测试

---

#### TC-002: 项目启动
**优先级**: P0（必须通过）

**测试步骤**:
```bash
npm run dev
```

**预期结果**:
- 开发服务器启动
- 控制台输出: "Local: http://localhost:5173/"
- 浏览器自动打开
- 页面显示Vite默认内容

**实际结果**: 待测试

---

#### TC-003: 项目构建
**优先级**: P1（重要）

**测试步骤**:
```bash
npm run build
```

**预期结果**:
- dist目录生成
- 包含index.html
- 包含打包后的JS和CSS文件
- sourcemap文件生成

**实际结果**: 待测试

---

### 2.2 目录结构测试

#### TC-004: 目录结构完整性
**优先级**: P0（必须通过）

**测试步骤**:
```bash
tree -L 2 -I 'node_modules|dist'
```

**预期结果**:
```
gobang-game/
├── public/
│   └── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── pages/
│   ├── components/
│   ├── game/
│   ├── store/
│   ├── services/
│   ├── hooks/
│   ├── utils/
│   ├── types/
│   ├── constants/
│   └── assets/
├── tests/
├── docs/
├── .eslintrc.cjs
├── .prettierrc
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

**实际结果**: 待测试

---

### 2.3 路由系统测试

#### TC-005: 主页路由
**优先级**: P0（必须通过）

**测试步骤**:
```typescript
// tests/pages/home-page.test.tsx
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../../src/pages/HomePage';

test('主页应该显示标题', () => {
  render(
    <BrowserRouter>
      <HomePage />
    </BrowserRouter>
  );
  expect(screen.getByText('五子棋游戏 - 主页')).toBeInTheDocument();
});
```

**预期结果**:
- 测试通过
- 页面显示"五子棋游戏 - 主页"

**实际结果**: 待测试

---

#### TC-006: 游戏页路由
**优先级**: P0（必须通过）

**测试步骤**:
```bash
1. 启动项目: npm run dev
2. 访问: http://localhost:5173/game
```

**预期结果**:
- 页面显示"游戏页面"
- URL为/game
- 无页面刷新

**实际结果**: 待测试

---

#### TC-007: 设置页路由
**优先级**: P0（必须通过）

**测试步骤**:
```typescript
// 测试代码
test('访问/settings路由应该显示设置页', () => {
  render(
    <MemoryRouter initialEntries={['/settings']}>
      <Routes>
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </MemoryRouter>
  );
  expect(screen.getByText('设置页面')).toBeInTheDocument();
});
```

**预期结果**:
- 测试通过
- 设置页正确渲染

**实际结果**: 待测试

---

### 2.4 状态管理测试（Zustand）

#### TC-008: 游戏Store初始状态
**优先级**: P0（必须通过）

**测试步骤**:
```typescript
// tests/store/game-store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/store/game-store';

describe('GameStore - 初始状态', () => {
  it('应该有正确的初始值', () => {
    const state = useGameStore.getState();
    expect(state.gameStatus).toBe('idle');
    expect(state.currentPlayer).toBe('black');
    expect(state.gameMode).toBe('pve');
  });
});
```

**预期结果**:
- 所有断言通过
- 初始状态符合PL文档规范

**实际结果**: 待测试

---

#### TC-009: 游戏状态更新
**优先级**: P0（必须通过）

**测试步骤**:
```typescript
describe('GameStore - 状态更新', () => {
  it('setGameStatus应该更新游戏状态', () => {
    const { setGameStatus } = useGameStore.getState();
    setGameStatus('playing');
    expect(useGameStore.getState().gameStatus).toBe('playing');
  });

  it('setCurrentPlayer应该切换玩家', () => {
    const { setCurrentPlayer } = useGameStore.getState();
    setCurrentPlayer('white');
    expect(useGameStore.getState().currentPlayer).toBe('white');
  });

  it('setGameMode应该设置游戏模式', () => {
    const { setGameMode } = useGameStore.getState();
    setGameMode('pvp');
    expect(useGameStore.getState().gameMode).toBe('pvp');
  });
});
```

**预期结果**:
- 所有状态更新测试通过
- 状态变化正确反映

**实际结果**: 待测试

---

#### TC-010: 游戏状态重置
**优先级**: P0（必须通过）

**测试步骤**:
```typescript
describe('GameStore - 状态重置', () => {
  it('resetGame应该重置所有状态', () => {
    const store = useGameStore.getState();

    // 修改状态
    store.setGameStatus('playing');
    store.setCurrentPlayer('white');
    store.setGameMode('pvp');

    // 重置
    store.resetGame();

    // 验证重置
    expect(useGameStore.getState().gameStatus).toBe('idle');
    expect(useGameStore.getState().currentPlayer).toBe('black');
    expect(useGameStore.getState().gameMode).toBe('pve');
  });
});
```

**预期结果**:
- 重置后所有状态恢复初始值
- 测试通过

**实际结果**: 待测试

---

#### TC-011: UI Store状态管理
**优先级**: P0（必须通过）

**测试步骤**:
```typescript
// tests/store/ui-store.test.ts
import { describe, it, expect } from 'vitest';
import { useUIStore } from '../../src/store/ui-store';

describe('UIStore', () => {
  it('应该有正确的初始状态', () => {
    const state = useUIStore.getState();
    expect(state.currentPage).toBe('/');
    expect(state.soundEnabled).toBe(true);
  });

  it('toggleSound应该切换声音状态', () => {
    const { toggleSound } = useUIStore.getState();

    toggleSound();
    expect(useUIStore.getState().soundEnabled).toBe(false);

    toggleSound();
    expect(useUIStore.getState().soundEnabled).toBe(true);
  });

  it('setCurrentPage应该更新当前页面', () => {
    const { setCurrentPage } = useUIStore.getState();
    setCurrentPage('/game');
    expect(useUIStore.getState().currentPage).toBe('/game');
  });
});
```

**预期结果**:
- 所有UI Store测试通过
- 声音切换逻辑正确

**实际结果**: 待测试

---

### 2.5 TypeScript类型系统测试

#### TC-012: 类型定义正确性
**优先级**: P0（必须通过）

**测试步骤**:
```bash
npx tsc --noEmit
```

**预期结果**:
- 无类型错误
- 输出: "No errors"

**实际结果**: 待测试

---

#### TC-013: 类型使用测试
**优先级**: P1（重要）

**测试步骤**:
```typescript
// tests/types/game-types.test.ts
import { describe, it, expect } from 'vitest';
import type { Player, Position, GameStatus } from '../../src/types/game';

describe('游戏类型定义', () => {
  it('Player类型应该只接受black或white', () => {
    const player1: Player = 'black';  // ✅
    const player2: Player = 'white';  // ✅
    // const player3: Player = 'red';  // ❌ 应该报错

    expect(player1).toBe('black');
    expect(player2).toBe('white');
  });

  it('Position类型应该有x和y坐标', () => {
    const pos: Position = { x: 7, y: 7 };
    expect(pos.x).toBeGreaterThanOrEqual(0);
    expect(pos.y).toBeLessThanOrEqual(14);
  });

  it('GameStatus类型应该包含所有状态', () => {
    const statuses: GameStatus[] = ['idle', 'playing', 'won', 'draw'];
    expect(statuses).toHaveLength(4);
  });
});
```

**预期结果**:
- 所有类型测试通过
- 类型系统正确约束值

**实际结果**: 待测试

---

### 2.6 样式系统测试

#### TC-014: Tailwind CSS配置
**优先级**: P0（必须通过）

**测试步骤**:
```bash
# 检查配置文件
cat tailwind.config.js
```

**预期结果**:
- tailwind.config.js存在
- 包含正确的主题颜色配置
- content路径正确

**实际结果**: 待测试

---

#### TC-015: Tailwind样式生效
**优先级**: P0（必须通过）

**测试步骤**:
```tsx
// 在App.tsx添加测试元素
<div className="bg-primary text-white p-4 rounded">
  测试Tailwind样式
</div>
```

**预期结果**:
- 背景色为 #D2B48C（木色）
- 文字为白色
- 有内边距和圆角

**实际结果**: 待测试

---

### 2.7 代码规范测试

#### TC-016: ESLint检查
**优先级**: P0（必须通过）

**测试步骤**:
```bash
npm run lint
```

**预期结果**:
- 无ESLint错误
- 可能有警告（warnings）
- 输出: "No problems"

**实际结果**: 待测试

---

#### TC-017: Prettier格式化
**优先级**: P1（重要）

**测试步骤**:
```bash
npm run format
```

**预期结果**:
- 所有文件格式化
- 格式符合prettierrc配置

**实际结果**: 待测试

---

### 2.8 集成测试

#### TC-018: 路由和状态集成
**优先级**: P1（重要）

**测试步骤**:
```typescript
// tests/integration/route-state-integration.test.tsx
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useGameStore } from '../../src/store/game-store';
import App from '../../src/App';

test('访问游戏页应该更新UI状态', () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );

  // 模拟导航到游戏页
  window.history.pushState({}, '', '/game');

  // 验证UI状态更新
  expect(useUIStore.getState().currentPage).toBe('/game');
});
```

**预期结果**:
- 路由变化触发状态更新
- 测试通过

**实际结果**: 待测试

---

### 2.9 性能测试

#### TC-019: 首屏加载时间
**优先级**: P2（次要）

**测试步骤**:
```bash
1. 清除缓存: npm run build
2. 启动生产构建
3. 测量首次内容绘制(FCP)时间
```

**预期结果**:
- FCP < 1.5秒
- LCP (Largest Contentful Paint) < 2.5秒

**实际结果**: 待测试

---

#### TC-020: HMR响应时间
**优先级**: P2（次要）

**测试步骤**:
```bash
1. 启动开发服务器
2. 修改一个组件
3. 测量HMR更新时间
```

**预期结果**:
- HMR更新 < 200ms
- 无页面刷新

**实际结果**: 待测试

---

## 三、测试执行计划

### 3.1 测试执行顺序

按照依赖关系，测试执行顺序如下：

```
阶段1: 基础设施测试
├─ TC-001: 项目初始化
├─ TC-002: 项目启动
├─ TC-003: 项目构建
└─ TC-004: 目录结构

阶段2: 路由系统测试
├─ TC-005: 主页路由
├─ TC-006: 游戏页路由
└─ TC-007: 设置页路由

阶段3: 状态管理测试
├─ TC-008: 游戏Store初始状态
├─ TC-009: 游戏状态更新
├─ TC-010: 游戏状态重置
└─ TC-011: UI Store状态管理

阶段4: 类型系统测试
├─ TC-012: 类型定义正确性
└─ TC-013: 类型使用测试

阶段5: 样式系统测试
├─ TC-014: Tailwind CSS配置
└─ TC-015: Tailwind样式生效

阶段6: 代码规范测试
├─ TC-016: ESLint检查
└─ TC-017: Prettier格式化

阶段7: 集成测试
├─ TC-018: 路由和状态集成

阶段8: 性能测试
├─ TC-019: 首屏加载时间
└─ TC-020: HMR响应时间
```

### 3.2 测试优先级说明
- **P0（必须通过）**: 阻塞性测试，必须全部通过才能进入下一阶段
- **P1（重要）**: 重要功能，建议全部通过
- **P2（次要）**: 优化项，可以后续改进

### 3.3 测试覆盖率目标
- 语句覆盖率: > 80%
- 分支覆盖率: > 75%
- 函数覆盖率: > 80%
- 行覆盖率: > 80%

---

## 四、测试数据准备

### 4.1 测试路由数据
```typescript
const testRoutes = [
  { path: '/', label: '主页' },
  { path: '/game', label: '游戏页' },
  { path: '/settings', label: '设置页' },
];
```

### 4.2 测试状态数据
```typescript
const testStates = {
  gameStatus: ['idle', 'playing', 'won', 'draw'],
  player: ['black', 'white'],
  gameMode: ['pve', 'pvp'],
};
```

---

## 五、测试环境配置

### 5.1 Vitest配置
```typescript
// vite.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### 5.2 测试设置文件
```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

---

## 六、Bug报告模板

### Bug报告格式
```markdown
## Bug描述
[简要描述Bug]

### 复现步骤
1. 步骤1
2. 步骤2
3. 步骤3

### 预期结果
[应该发生什么]

### 实际结果
[实际发生了什么]

### 环境信息
- Node版本:
- 操作系统:
- 浏览器:

### 优先级
- P0 / P1 / P2

### 附件
- 截图
- 错误日志
```

---

## 七、测试通过标准

### 7.1 必须满足的条件
- [ ] 所有P0测试通过（20个测试用例）
- [ ] 至少90%的P1测试通过
- [ ] 测试覆盖率 >= 80%
- [ ] 无P0级别的Bug

### 7.2 质量标准
- [ ] ESLint检查无错误
- [ ] TypeScript编译无错误
- [ ] 所有测试运行时间 < 30秒

---

## 八、测试报告模板

### 测试执行报告
```markdown
# Week 1 测试报告

## 测试执行概要
- 执行日期: 2026-03-24
- 执行人: 测试Agent
- 总测试用例: 20
- 通过: X
- 失败: Y
- 跳过: Z

## 测试结果详情
| 测试ID | 测试名称 | 优先级 | 状态 | 备注 |
|--------|----------|--------|------|------|
| TC-001 | 项目初始化 | P0 | ✅/❌ |     |

## Bug列表
[发现的Bug列表]

## 测试覆盖率
- 语句覆盖率: X%
- 分支覆盖率: X%
- 函数覆盖率: X%
- 行覆盖率: X%

## 测试结论
[通过/不通过]

## 建议
[改进建议]
```

---

**文档结束**

**审核人**: 待指定
**审核日期**: 待定
**签字**: ____________
