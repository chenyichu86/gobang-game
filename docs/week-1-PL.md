# Week 1 - PL文档（产品逻辑规范）

## 文档信息
- **文档版本**: v1.0
- **创建日期**: 2026-03-24
- **负责人**: 产品经理
- **阶段**: Phase 1 - MVP基础版本
- **周次**: Week 1
- **关联文档**: week-1-WO.md

---

## 一、产品逻辑概述

### 1.1 本周目标
建立项目基础框架，不涉及具体游戏逻辑，专注于基础设施搭建。

### 1.2 核心原则
- **简单优先**: 只创建必需的结构和配置
- **标准规范**: 遵循React和TypeScript最佳实践
- **可扩展性**: 为后续功能预留扩展空间
- **可测试性**: 确保所有核心配置都可测试

### 1.3 不包含的逻辑
- 游戏规则逻辑（Week 2）
- UI组件交互（Week 2-4）
- AI算法（Week 3）
- 数据持久化（Week 8）

---

## 二、技术栈逻辑规范

### 2.1 Vite配置逻辑

#### 2.1.1 服务器配置
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 5173,           // 开发服务器端口
    host: true,           // 监听所有地址
    open: true,           // 自动打开浏览器
  },
});
```

**逻辑说明**:
- 使用默认端口5173（Vite标准）
- 自动打开浏览器提升开发体验
- 热更新（HMR）默认开启

#### 2.1.2 构建配置
```typescript
build: {
  outDir: 'dist',
  sourcemap: true,        // 开发环境启用sourcemap
  minify: 'terser',       // 生产环境使用terser压缩
}
```

**验收逻辑**:
- 运行`npm run build`生成dist目录
- sourcemap文件正确生成
- 构建产物可正常部署

---

### 2.2 React路由逻辑

#### 2.2.1 路由设计
```typescript
const routes = [
  { path: '/', element: <HomePage />, label: '主页' },
  { path: '/game', element: <GamePage />, label: '游戏' },
  { path: '/settings', element: <SettingsPage />, label: '设置' },
];
```

**逻辑说明**:
- 使用BrowserRouter（支持HTML5 History API）
- 每个路由对应一个页面组件
- 404路由暂不处理（Week 4完善）

#### 2.2.2 页面组件规范
```typescript
// 每个页面组件必须包含：
interface PageProps {
  // 页面Props（本周为空）
}

export default function PageName(props: PageProps) {
  return (
    <div className="page-container">
      {/* 页面内容 */}
    </div>
  );
}
```

**验收逻辑**:
- 所有页面组件可正常渲染
- 页面切换时URL正确更新
- 页面组件之间无状态耦合

---

### 2.3 状态管理逻辑（Zustand）

#### 2.3.1 Store设计原则
```typescript
// Store设计遵循以下原则：
1. 单一职责：每个Store只管理相关状态
2. 不可变性：状态更新返回新对象
3. 原子化：组件只订阅需要的状态片段
```

#### 2.3.2 游戏Store逻辑
```typescript
// src/store/game-store.ts

// 状态定义
interface GameState {
  // 只读状态
  gameStatus: GameStatus;
  currentPlayer: Player;
  gameMode: GameMode;

  // 操作方法
  setGameStatus: (status: GameStatus) => void;
  setCurrentPlayer: (player: Player) => void;
  setGameMode: (mode: GameMode) => void;
  resetGame: () => void;
}

// 初始状态
const initialState = {
  gameStatus: 'idle',
  currentPlayer: 'black',  // 黑棋先手
  gameMode: 'pve',         // 默认人机对战
};

// 操作逻辑
const actions = (set: StateCreator<GameState>) => ({
  setGameStatus: (status) => set({ gameStatus: status }),
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  setGameMode: (mode) => set({ gameMode: mode }),
  resetGame: () => set(initialState),
});
```

**验收逻辑**:
- Store初始状态正确
- 状态更新触发订阅组件重渲染
- resetGame重置所有状态到初始值

#### 2.3.3 UI Store逻辑
```typescript
// src/store/ui-store.ts

interface UIState {
  currentPage: string;
  soundEnabled: boolean;

  setCurrentPage: (page: string) => void;
  toggleSound: () => void;
}

// 切换声音逻辑
const toggleSoundLogic = (set: StateCreator<UIState>) => () =>
  set((state) => ({ soundEnabled: !state.soundEnabled }));
```

**验收逻辑**:
- 声音切换逻辑正确（true ↔ false）
- 页面状态与路由同步（Week 4完善）

---

### 2.4 TypeScript类型系统逻辑

#### 2.4.1 类型定义规范
```typescript
// src/types/game.ts

// 1. 使用type定义联合类型
export type Player = 'black' | 'white';

// 2. 使用interface定义对象类型
export interface Position {
  x: number;  // 0-14
  y: number;  // 0-14
}

// 3. 使用枚举定义常量（可选）
export enum GameStatus {
  IDLE = 'idle',
  PLAYING = 'playing',
  WON = 'won',
  DRAW = 'draw',
}
```

#### 2.4.2 类型使用规范
```typescript
// ✅ 正确：明确类型注解
const player: Player = 'black';
const position: Position = { x: 7, y: 7 };

// ❌ 错误：使用any
const data: any = {};

// ✅ 正确：使用泛型
const moves: Move[] = [];

// ✅ 正确：函数类型注解
function setPlayer(player: Player): void {
  // ...
}
```

**验收逻辑**:
- TypeScript编译无错误（tsc --noEmit）
- 所有导出的函数和组件有类型注解
- 无any类型使用

---

### 2.5 样式系统逻辑（Tailwind CSS）

#### 2.5.1 颜色系统
```javascript
// tailwind.config.js
colors: {
  // 语义化命名
  primary: '#D2B48C',      // 主要操作、按钮
  secondary: '#DEB887',    // 次要元素
  board: '#F5DEB3',        // 棋盘背景
  black: '#2C2C2C',        // 黑棋
  white: '#FFFFFF',        // 白棋
  accent: '#FFD700',       // 强调、胜利

  // 功能性颜色
  success: '#10B981',      // 成功提示
  warning: '#F59E0B',      // 警告提示
  error: '#EF4444',        // 错误提示
}
```

#### 2.5.2 响应式断点
```javascript
// Tailwind默认断点
// sm: 640px  // 平板
// md: 768px  // 平板横屏
// lg: 1024px // 桌面
// xl: 1280px // 大屏
```

**使用示例**:
```tsx
<div className="
  p-4           // 所有屏幕
  md:p-8        // 中等屏幕以上
  lg:p-12       // 大屏幕以上
">
  内容
</div>
```

**验收逻辑**:
- 颜色配置与PRD一致
- 响应式样式在不同屏幕生效

---

### 2.6 测试逻辑规范

#### 2.6.1 测试结构
```typescript
// 测试文件命名：*.test.ts
// 测试文件位置：tests/

describe('模块名称', () => {
  // 测试套件

  beforeEach(() => {
    // 每个测试前执行
  });

  it('应该做什么', () => {
    // Arrange（准备）
    const input = ...;

    // Act（执行）
    const result = ...;

    // Assert（断言）
    expect(result).toBe(...);
  });
});
```

#### 2.6.2 Store测试逻辑
```typescript
// tests/store/game-store.test.ts

describe('GameStore', () => {
  // 测试初始状态
  it('初始化时应该有正确的默认值', () => {
    const state = useGameStore.getState();
    expect(state.gameStatus).toBe('idle');
    expect(state.currentPlayer).toBe('black');
  });

  // 测试状态更新
  it('setGameStatus应该更新游戏状态', () => {
    const { setGameStatus } = useGameStore.getState();
    setGameStatus('playing');
    expect(useGameStore.getState().gameStatus).toBe('playing');
  });

  // 测试状态重置
  it('resetGame应该重置所有状态', () => {
    const store = useGameStore.getState();
    store.setGameStatus('playing');
    store.resetGame();
    expect(useGameStore.getState().gameStatus).toBe('idle');
  });
});
```

**验收逻辑**:
- 所有测试通过
- 测试覆盖率 > 80%（核心模块）
- 测试运行时间 < 5秒

---

## 三、配置逻辑规范

### 3.1 ESLint规则逻辑

```javascript
// .eslintrc.cjs
rules: {
  // TypeScript规则
  '@typescript-eslint/no-unused-vars': 'error',
  '@typescript-eslint/no-explicit-any': 'error',

  // React规则
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',

  // 代码质量
  'no-console': 'warn',           // 开发环境允许console
  'no-debugger': 'error',         // 禁止debugger
}
```

**逻辑说明**:
- 禁止any类型（强制类型安全）
- React Hooks规则检查
- 未使用变量报错

### 3.2 Prettier格式化逻辑

```json
{
  "semi": true,              // 使用分号
  "singleQuote": true,       // 单引号
  "tabWidth": 2,             // 2空格缩进
  "trailingComma": "es5",    // ES5尾随逗号
  "printWidth": 100          // 行宽100字符
}
```

**验收逻辑**:
- 运行`npm run format`格式化所有文件
- 格式化后代码风格一致

---

## 四、错误处理逻辑

### 4.1 开发环境错误
```typescript
// Vite错误处理
export default defineConfig({
  server: {
    hmr: {
      overlay: true,  // 显示错误覆盖层
    },
  },
});
```

### 4.2 类型错误处理
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,              // 严格模式
    "noUnusedLocals": true,      // 未使用局部变量
    "noUnusedParameters": true,  // 未使用参数
    "noImplicitReturns": true,   // 显式返回
  }
}
```

**逻辑说明**:
- 所有类型错误在编译时暴露
- 不允许隐式any
- 严格的null检查

---

## 五、性能逻辑

### 5.1 构建性能
```typescript
// vite.config.ts
build: {
  // 代码分割
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom'],
        'router-vendor': ['react-router-dom'],
      },
    },
  },
}
```

### 5.2 开发性能
- 使用Vite的HMR（热模块替换）
- 按需加载（懒加载）在Week 4实现

---

## 六、安全逻辑

### 6.1 依赖安全
```bash
# 定期更新依赖
npm audit
npm audit fix
```

### 6.2 代码安全
- 不在代码中硬编码敏感信息
- 使用环境变量（Week 12配置）

---

## 七、调试逻辑

### 7.1 开发工具
```typescript
// React DevTools
// 安装浏览器扩展：React Developer Tools

// Zustand DevTools（可选）
import { devtools } from 'zustand/middleware';

export const useGameStore = create(
  devtools(
    (set) => ({
      // store logic
    }),
    { name: 'GameStore' }  // DevTools中的名称
  )
);
```

### 7.2 日志逻辑
```typescript
// 开发环境日志
const isDev = import.meta.env.DEV;

if (isDev) {
  console.log('Debug info:', data);
}
```

---

## 八、集成逻辑

### 8.1 与Week 2的集成
本周创建的框架将在Week 2使用：
- `src/game/`目录将存放游戏逻辑
- `src/components/`将存放UI组件
- Store将扩展更多状态和方法

### 8.2 与整体架构的集成
- 符合ARCHITECTURE.md的技术选型
- 遵循PRD的设计风格
- 为后续功能预留接口

---

## 九、验收标准汇总

### 9.1 功能验收
- [ ] 项目启动无错误
- [ ] 所有路由可访问
- [ ] Store状态管理正常
- [ ] 样式系统生效
- [ ] 测试框架可用

### 9.2 质量验收
- [ ] TypeScript无类型错误
- [ ] ESLint检查通过
- [ ] 代码格式符合规范
- [ ] 测试覆盖率 > 80%

### 9.3 文档验收
- [ ] README.md更新
- [ ] package.json脚本正确
- [ ] 目录结构清晰

---

## 十、常见问题与解决方案

### 10.1 端口冲突
**问题**: 5173端口被占用
**解决**: 修改vite.config.ts中的port配置

### 10.2 依赖安装失败
**问题**: npm install失败
**解决**:
```bash
# 清除缓存
npm cache clean --force
# 使用国内镜像
npm config set registry https://registry.npmmirror.com
```

### 10.3 TypeScript类型错误
**问题**: 类型不匹配
**解决**: 检查tsconfig.json配置，确保strict模式正确配置

---

## 十一、下一步

完成本周后，Week 2将：
1. 实现棋盘数据结构
2. 集成Konva.js进行渲染
3. 实现落子交互
4. 实现胜负判断逻辑

---

**文档结束**

**审核人**: 待指定
**审核日期**: 待定
**签字**: ____________
