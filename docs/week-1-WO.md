# Week 1 - WO文档（工作对象定义）

## 文档信息
- **文档版本**: v1.0
- **创建日期**: 2026-03-24
- **负责人**: 产品经理
- **阶段**: Phase 1 - MVP基础版本
- **周次**: Week 1

---

## 一、工作对象概述

### 1.1 定义
本周的工作对象是**项目基础框架**，包括开发环境搭建、项目结构创建、核心配置文件和基础状态管理。

### 1.2 目标
建立一个可运行的前端项目框架，为后续游戏功能开发提供稳定的基础设施。

### 1.3 范围
- **包含**: 项目脚手架、目录结构、配置文件、基础路由、状态管理
- **不包含**: 游戏逻辑、UI组件、AI算法（这些在后续Week）

---

## 二、工作对象分解

### 2.1 项目脚手架

**对象**: Vite + React + TypeScript项目

**技术选型依据**:
- Vite: 极速开发体验，现代化构建工具
- React 18: 最新版本，支持并发特性
- TypeScript: 类型安全，减少运行时错误

**验收标准**:
- [ ] 项目可通过`npm create vite@latest`创建
- [ ] 选择React + TypeScript模板
- [ ] 项目可通过`npm run dev`启动
- [ ] 访问http://localhost:5173显示默认页面

**技术规格**:
```json
{
  "name": "gobang-game",
  "version": "0.1.0",
  "type": "module"
}
```

---

### 2.2 目录结构

**对象**: 完整的项目目录架构

**结构树**:
```
gobang-game/
├── public/
│   ├── index.html
│   └── assets/
├── src/
│   ├── main.tsx              # 应用入口
│   ├── App.tsx               # 根组件
│   ├── vite-env.d.ts
│   ├── pages/                # 页面组件（待Week 2-4实现）
│   ├── components/           # 通用组件（待Week 2-4实现）
│   ├── game/                 # 游戏核心逻辑（待Week 2-3实现）
│   ├── store/                # 状态管理（本周创建基础）
│   ├── services/             # 服务层（待Week 5-9实现）
│   ├── hooks/                # 自定义Hooks（待Week 2-3实现）
│   ├── utils/                # 工具函数（待Week 2实现）
│   ├── types/                # TypeScript类型（本周创建基础）
│   ├── constants/            # 常量定义（本周创建基础）
│   └── assets/               # 资源文件（待Week 4实现）
├── tests/                    # 测试文件（本周创建基础结构）
├── docs/                     # 文档
├── .eslintrc.cjs            # ESLint配置
├── .prettierrc              # Prettier配置
├── tsconfig.json            # TypeScript配置
├── vite.config.ts           # Vite配置
├── tailwind.config.js       # Tailwind配置
└── package.json
```

**验收标准**:
- [ ] 所有目录已创建
- [ ] 每个目录包含相应的index.ts或README.md（占位文件）
- [ ] 目录结构与ARCHITECTURE.md中的设计一致

---

### 2.3 Tailwind CSS配置

**对象**: Tailwind CSS样式系统

**配置文件**: `tailwind.config.js`

**主题配置**:
```javascript
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#D2B48C',    // 主木色
          light: '#DEB887',
          dark: '#BC9F7A',
        },
        board: '#F5DEB3',        // 棋盘色
        black: '#2C2C2C',        // 黑棋
        white: '#FFFFFF',        // 白棋
        accent: '#FFD700',       // 金色强调
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
```

**验收标准**:
- [ ] Tailwind CSS已安装（`npm install -D tailwindcss postcss autoprefixer`）
- [ ] `tailwind.config.js`已创建
- [ ] `postcss.config.js`已创建
- [ ] `src/assets/styles/global.css`已导入Tailwind指令
- [ ] 测试样式生效（如添加一个带颜色className的div）

---

### 2.4 基础路由配置

**对象**: React Router路由系统

**路由配置**:
```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

**占位页面**:
```typescript
// src/pages/HomePage/index.tsx
export default function HomePage() {
  return <div className="p-8 text-center text-2xl">五子棋游戏 - 主页</div>;
}

// src/pages/GamePage/index.tsx
export default function GamePage() {
  return <div className="p-8 text-center text-2xl">游戏页面</div>;
}

// src/pages/SettingsPage/index.tsx
export default function SettingsPage() {
  return <div className="p-8 text-center text-2xl">设置页面</div>;
}
```

**验收标准**:
- [ ] React Router已安装（`npm install react-router-dom`）
- [ ] 基础路由已配置
- [ ] 访问"/"显示主页
- [ ] 访问"/game"显示游戏页
- [ ] 访问"/settings"显示设置页
- [ ] 页面切换无刷新（SPA体验）

---

### 2.5 状态管理（Zustand）

**对象**: Zustand状态管理Store

**Store结构**:
```typescript
// src/store/game-store.ts
import { create } from 'zustand';

interface GameState {
  // 游戏状态
  gameStatus: 'idle' | 'playing' | 'won' | 'draw';
  currentPlayer: 'black' | 'white';
  gameMode: 'pve' | 'pvp';

  // Actions
  setGameStatus: (status: GameState['gameStatus']) => void;
  setCurrentPlayer: (player: GameState['currentPlayer']) => void;
  setGameMode: (mode: GameState['gameMode']) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  // Initial state
  gameStatus: 'idle',
  currentPlayer: 'black',
  gameMode: 'pve',

  // Actions
  setGameStatus: (status) => set({ gameStatus: status }),
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  setGameMode: (mode) => set({ gameMode: mode }),
  resetGame: () => set({
    gameStatus: 'idle',
    currentPlayer: 'black',
    gameMode: 'pve',
  }),
}));
```

**UI状态Store**:
```typescript
// src/store/ui-store.ts
import { create } from 'zustand';

interface UIState {
  currentPage: string;
  soundEnabled: boolean;

  // Actions
  setCurrentPage: (page: string) => void;
  toggleSound: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentPage: '/',
  soundEnabled: true,

  setCurrentPage: (page) => set({ currentPage: page }),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
}));
```

**验收标准**:
- [ ] Zustand已安装（`npm install zustand`）
- [ ] 游戏Store已创建
- [ ] UI Store已创建
- [ ] Store可在组件中使用（创建测试组件验证）
- [ ] Store状态变化触发组件重渲染

---

### 2.6 TypeScript配置

**对象**: TypeScript类型系统

**核心类型定义**:
```typescript
// src/types/game.ts
export type Player = 'black' | 'white';
export type GameStatus = 'idle' | 'playing' | 'won' | 'draw';
export type GameMode = 'pve' | 'pvp';

export interface Position {
  x: number;
  y: number;
}

export interface Move {
  position: Position;
  player: Player;
  timestamp: number;
}
```

**验收标准**:
- [ ] 基础游戏类型已定义
- [ ] TypeScript类型检查无错误
- [ ] 使用类型的地方都有正确的类型注解

---

### 2.7 ESLint和Prettier配置

**对象**: 代码规范工具

**ESLint配置** (.eslintrc.cjs):
```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
};
```

**Prettier配置** (.prettierrc):
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**验收标准**:
- [ ] ESLint已配置并正常工作
- [ ] Prettier已配置并正常工作
- [ ] 运行`npm run lint`无错误
- [ ] 代码格式化正常工作

---

### 2.8 测试基础框架

**对象**: Vitest测试框架

**测试配置** (vite.config.ts):
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
});
```

**示例测试**:
```typescript
// tests/store/game-store.test.ts
import { describe, it, expect } from 'vitest';
import { useGameStore } from '../../src/store/game-store';

describe('GameStore', () => {
  it('should have initial state', () => {
    const state = useGameStore.getState();
    expect(state.gameStatus).toBe('idle');
    expect(state.currentPlayer).toBe('black');
  });

  it('should update game status', () => {
    const { setGameStatus } = useGameStore.getState();
    setGameStatus('playing');
    expect(useGameStore.getState().gameStatus).toBe('playing');
  });
});
```

**验收标准**:
- [ ] Vitest已安装（`npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`）
- [ ] 测试配置已完成
- [ ] 可运行`npm run test`
- [ ] 示例测试通过

---

## 三、门禁标准（Gate Criteria）

### 3.1 必须满足的标准
- [✅] 项目可正常启动（`npm run dev`）
- [✅] 目录结构符合ARCHITECTURE.md设计
- [✅] TypeScript配置正确，无类型错误
- [✅] Tailwind CSS配置正确，样式生效
- [✅] 基础路由可访问（"/", "/game", "/settings"）
- [✅] Zustand Store可正常工作
- [✅] ESLint检查通过（`npm run lint`）
- [✅] 所有测试用例通过（`npm run test`）

### 3.2 质量标准
- [✅] 代码遵循TypeScript严格模式
- [✅] 所有组件和函数都有类型注解
- [✅] 代码格式符合Prettier规范
- [✅] 无ESLint警告或错误

### 3.3 文档标准
- [✅] README.md包含项目说明和启动命令
- [✅] 目录结构清晰，每个主要目录有README

---

## 四、验收测试场景

### 场景1: 项目启动测试
```bash
# 步骤
1. npm install
2. npm run dev
3. 访问 http://localhost:5173

# 预期结果
- 项目成功启动
- 浏览器显示主页（"五子棋游戏 - 主页"）
- 控制台无错误
```

### 场景2: 路由测试
```bash
# 步骤
1. 访问 http://localhost:5173/
2. 点击导航到 /game
3. 点击导航到 /settings

# 预期结果
- 页面切换无刷新
- URL正确变化
- 每个页面显示正确内容
```

### 场景3: 状态管理测试
```typescript
// 在浏览器控制台执行
import { useGameStore } from './store/game-store';

const state = useGameStore.getState();
console.log(state.gameStatus); // 应输出 'idle'

useGameStore.getState().setGameStatus('playing');
console.log(useGameStore.getState().gameStatus); // 应输出 'playing'
```

### 场景4: 样式测试
```tsx
// 在任意组件添加
<div className="bg-primary text-white p-4 rounded">
  测试样式
</div>

// 预期结果
- 背景色为木色 (#D2B48C)
- 文字为白色
- 有内边距和圆角
```

### 场景5: 测试运行
```bash
# 步骤
npm run test

# 预期结果
- 所有测试通过
- 测试覆盖率报告生成
```

---

## 五、依赖关系

### 5.1 外部依赖
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.32",
    "prettier": "^3.1.1",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.2.2",
    "vite": "^5.0.8",
    "vitest": "^1.0.4",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "jsdom": "^23.0.1"
  }
}
```

### 5.2 内部依赖
本周工作是基础，所有后续Week都依赖于此框架。

---

## 六、风险与假设

### 6.1 风险
1. **Node.js版本兼容性**
   - 风险: 开发环境Node版本过低
   - 缓解: 要求Node.js >= 18.0.0

2. **网络问题**
   - 风险: npm install依赖下载失败
   - 缓解: 使用国内镜像源

### 6.2 假设
- 开发者已安装Node.js 18+
- 开发者已安装VS Code或类似IDE
- 开发者熟悉React和TypeScript基础

---

## 七、成功指标

### 7.1 定量指标
- 项目启动时间 < 3秒
- 首屏加载时间 < 1秒
- ESLint错误数 = 0
- 测试通过率 = 100%

### 7.2 定性指标
- 代码结构清晰，易于理解
- 配置文件规范，符合最佳实践
- 为后续开发提供良好基础

---

## 八、下一步

完成本周工作后，可以进入**Week 2: 棋盘渲染 + 基础游戏逻辑**。

Week 2将基于本周搭建的框架，开始实现游戏核心功能。

---

**文档结束**

**审核人**: 待指定
**审核日期**: 待定
**签字**: ____________
