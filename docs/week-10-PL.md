# Week 10 产品逻辑详细设计 (PL)
## Week 9.1 游戏流程集成 + Week 10 性能优化 + E2E测试

**日期**: 2026-03-25
**版本**: v1.0
**状态**: 草稿
**负责人**: 产品经理 (PO)

---

## 1. Week 9.1 游戏流程集成设计

### 1.1 游戏结束流程扩展

**当前流程（Week 7）**:
```typescript
游戏结束 → 判断胜负 → 计算经验值 → 更新成就 → 检查等级 → 保存数据
```

**Week 9.1流程**:
```typescript
游戏结束 → 判断胜负 → 计算金币 → 更新任务进度 → 计算经验值 → 更新成就 → 检查等级 → 保存数据
```

### 1.2 GameStore扩展

```typescript
// game-store.ts
interface GameStore {
  // ... 现有字段

  // Week 9.1新增方法
  endGameWithRewards: (result: GameResult) => GameResult;
}

const endGameWithRewards = (result: GameResult) => {
  const set = get();
  const userStore = useUserStore.getState();

  // 1. 计算金币奖励
  const coinGain = coinService.calculateCoinGain(result);
  userStore.addCoins(coinGain);

  // 2. 更新任务进度
  if (result === 'win') {
    userStore.checkTaskProgress('win');
  } else if (result === 'lose') {
    userStore.checkTaskProgress('lose');
  } else if (result === 'draw') {
    userStore.checkTaskProgress('draw');
  }
  userStore.checkTaskProgress('game_end');

  // 3. 计算经验值（原有逻辑）
  const exp = expService.calculateExpGain(result);
  userStore.addExp(exp);

  // 4. 更新成就（原有逻辑）
  achievementService.checkAchievements(result, userStore);

  // 5. 检查等级（原有逻辑）
  userStore.checkLevelUp();

  // 6. 原有的游戏结束逻辑
  set((state) => ({
    ...state,
    gameStatus: 'won',
    winner: result === 'win' ? currentPlayer : null,
  }));

  return result;
};
```

### 1.3 UserStore扩展（自动保存）

```typescript
// user-store.ts
interface UserStore {
  // ... 现有字段

  // Week 9.1新增：自动保存
  _persist: PersistStorage<UserStore>; // Zustand持久化中间件
}

// 使用Zustand的persist中间件
import { persist } from 'zustand/middleware';

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      // ... 现有state

      // 修改方法，添加自动保存
      addCoins: (amount: number) => {
        set((state) => ({
          coins: state.coins + amount,
          totalEarned: state.totalEarned + amount,
        }));
      },
    }),
    {
      name: 'gobang-user-storage', // LocalStorage键名
      partialize: (state) => ({
        // 只持久化部分字段
        coins: state.coins,
        totalEarned: state.totalEarned,
        totalSpent: state.totalSpent,
        checkInData: state.checkInData,
        unlockedSkins: state.unlockedSkins,
        currentBoardSkin: state.currentBoardSkin,
        currentPieceSkin: state.currentPieceSkin,
      }),
    }
  )
);
```

---

## 2. AI性能优化设计

### 2.1 Web Worker优化

**Worker复用**:
```typescript
// ai-client.ts
class AIClient {
  private worker: Worker | null = null;
  private ai: Remote<AIWorker> | null = null;

  async getWorker(): Promise<Remote<AIWorker>> {
    if (!this.worker || !this.ai) {
      this.worker = new Worker(new URL('./ai.worker.ts', import.meta.url), {
        type: 'module',
      });
      this.ai = wrap<AIWorker>(this.worker);
    }
    return this.ai;
  }

  async calculateMove(
    board: Board,
    player: Player,
    difficulty: AIDifficulty
  ): Promise<Position> {
    const ai = await this.getWorker();
    return ai.calculateMove(board, player, difficulty);
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.ai = null;
    }
  }
}
```

**消息传递优化**:
```typescript
// ai.worker.ts
import { expose } from 'comlink';

class AIWorker {
  async calculateMove(
    boardData: BoardData,
    player: Player,
    difficulty: AIDifficulty
  ): Promise<PositionData> {
    // 使用Transferable Objects优化大对象传递
    const board = Board.fromData(boardData);
    const position = this.getAI(difficulty).getBestMove(board, player);
    return position.toData();
  }
}

expose(new AIWorker());
```

### 2.2 AI算法优化

**候选着法生成优化**:
```typescript
// move-generator.ts
class MoveGenerator {
  generateCandidates(board: Board): Position[] {
    // 只考虑周围2格内的位置
    const neighbors = 2;
    const candidates = new Set<string>();

    for (const piece of board.getPieces()) {
      for (let dx = -neighbors; dx <= neighbors; dx++) {
        for (let dy = -neighbors; dy <= neighbors; dy++) {
          const pos = { x: piece.x + dx, y: piece.y + dy };
          const key = `${pos.x},${pos.y}`;
          if (board.isEmpty(pos) && board.isValid(pos)) {
            candidates.add(key);
          }
        }
      }
    }

    // 转换为数组并排序
    const positions = Array.from(candidates).map(key => {
      const [x, y] = key.split(',').map(Number);
      return { x, y };
    });

    // 按分数排序（提高剪枝效率）
    return positions
      .map(pos => ({
        position: pos,
        score: this.evaluator.fastEvaluate(board, pos),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 50) // 限制候选数量
      .map(item => item.position);
  }
}
```

**评估函数优化**:
```typescript
// board-evaluator.ts
class BoardEvaluator {
  // 快速评估（用于候选着法排序）
  fastEvaluate(board: Board, position: Position): number {
    let score = 0;
    const player = board.getCurrentPlayer();

    // 只检查当前位置周围
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (const [dx, dy] of directions) {
      score += this.countConsecutive(board, position, dx, dy, player);
    }

    return score;
  }

  // 完整评估（用于Minimax）
  evaluate(board: Board, player: Player): number {
    let score = 0;
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

    for (const [dx, dy] of directions) {
      score += this.evaluateDirection(board, dx, dy, player);
    }

    return score;
  }
}
```

### 2.3 性能监控

```typescript
// ai-client.ts
class AIClient {
  private performanceMetrics: Map<string, number[]> = new Map();

  async calculateMove(
    board: Board,
    player: Player,
    difficulty: AIDifficulty
  ): Promise<Position> {
    const startTime = performance.now();

    try {
      const position = await this.calculateMoveInternal(board, player, difficulty);
      const duration = performance.now() - startTime;

      // 记录性能指标
      this.recordPerformance(difficulty, duration);

      return position;
    } catch (error) {
      // 错误处理
      throw error;
    }
  }

  private recordPerformance(difficulty: AIDifficulty, duration: number): void {
    if (!this.performanceMetrics.has(difficulty)) {
      this.performanceMetrics.set(difficulty, []);
    }
    this.performanceMetrics.get(difficulty)!.push(duration);

    // 保持最近100次记录
    const metrics = this.performanceMetrics.get(difficulty)!;
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  getAveragePerformance(difficulty: AIDifficulty): number {
    const metrics = this.performanceMetrics.get(difficulty);
    if (!metrics || metrics.length === 0) return 0;

    const sum = metrics.reduce((a, b) => a + b, 0);
    return sum / metrics.length;
  }
}
```

---

## 3. Canvas渲染优化设计

### 3.1 离屏Canvas缓存

```typescript
// board-renderer.ts
class BoardRenderer {
  private backgroundCache: HTMLCanvasElement | null = null;

  constructor(private ctx: CanvasRenderingContext2D) {
    // 预渲染棋盘背景
    this.backgroundCache = this.renderBackgroundToCache();
  }

  private renderBackgroundToCache(): HTMLCanvasElement {
    const cacheCanvas = document.createElement('canvas');
    cacheCanvas.width = this.ctx.canvas.width;
    cacheCanvas.height = this.ctx.canvas.height;
    const cacheCtx = cacheCanvas.getContext('2d')!;

    // 绘制棋盘背景
    this.drawWoodBackground(cacheCtx);
    this.drawGridLines(cacheCtx);
    this.drawStarPoints(cacheCtx);

    return cacheCanvas;
  }

  render() {
    // 清空画布
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    // 绘制缓存的背景
    if (this.backgroundCache) {
      this.ctx.drawImage(this.backgroundCache, 0, 0);
    }

    // 只绘制棋子层（动态内容）
    this.renderPieces();

    // 绘制高亮层（如果有变化）
    if (this.hasHighlight) {
      this.renderHighlight();
    }
  }

  invalidateCache() {
    // 棋盘尺寸改变时重新生成缓存
    this.backgroundCache = this.renderBackgroundToCache();
  }
}
```

### 3.2 脏标记重绘

```typescript
// pieces-layer.tsx
interface PiecesLayerState {
  dirty: boolean;
  lastMove: Position | null;
  highlightedPieces: Position[];
}

export const PiecesLayer: React.FC<PiecesLayerProps> = ({ pieces, lastMove }) => {
  const layerRef = useRef<Konva.Layer>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    // 只有当pieces或lastMove变化时才重绘
    setDirty(true);

    // 绘制完成后清除脏标记
    requestAnimationFrame(() => {
      setDirty(false);
    });
  }, [pieces, lastMove]);

  return (
    <Layer ref={layerRef}>
      {pieces.map((piece) => (
        <Piece
          key={`${piece.x}-${piece.y}`}
          x={piece.x}
          y={piece.y}
          color={piece.color}
          isLastMove={lastMove && lastMove.x === piece.x && lastMove.y === piece.y}
        />
      ))}
    </Layer>
  );
};
```

### 3.3 requestAnimationFrame优化

```typescript
// game-board.tsx
export const GameBoard: React.FC = () => {
  const rafRef = useRef<number>();
  const lastRenderTime = useRef<number>(0);

  const render = (currentTime: number) => {
    const deltaTime = currentTime - lastRenderTime.current;

    // 限制帧率到60fps
    if (deltaTime >= 1000 / 60) {
      // 执行渲染
      drawBoard();
      lastRenderTime.current = currentTime;
    }

    rafRef.current = requestAnimationFrame(render);
  };

  useEffect(() => {
    rafRef.current = requestAnimationFrame(render);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return <Stage>...</Stage>;
};
```

---

## 4. 内存泄漏检查设计

### 4.1 事件监听器清理

```typescript
// board-stage.tsx
export const BoardStage: React.FC<BoardStageProps> = ({ onMove }) => {
  const stageRef = useRef<Konva.Stage>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const handleClick = (e: KonvaEventObject<MouseEvent>) => {
      const position = getGridPosition(e);
      onMove(position);
    };

    stage.on('click', handleClick);

    // 清理函数
    return () => {
      stage.off('click', handleClick);
    };
  }, [onMove]);

  return <Stage ref={stageRef}>...</Stage>;
};
```

### 4.2 定时器清理

```typescript
// timer.tsx
export const Timer: React.FC = () => {
  const [time, setTime] = useState(0);
  const timerRef = useRef<number>();

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);

    // 清理函数
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return <div>{formatTime(time)}</div>;
};
```

### 4.3 Web Worker清理

```typescript
// ai-client.ts
class AIClient {
  private worker: Worker | null = null;

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// game-store.ts
export const useGameStore = create<GameStore>((set, get) => ({
  // ...

  cleanup: () => {
    const aiClient = get().aiClient;
    if (aiClient) {
      aiClient.terminate();
    }
  },
}));

// app.tsx
export const App: React.FC = () => {
  useEffect(() => {
    return () => {
      // 组件卸载时清理
      useGameStore.getState().cleanup();
    };
  }, []);

  return <Router>...</Router>;
};
```

### 4.4 Konva Stage清理

```typescript
// board-stage.tsx
export const BoardStage: React.FC = () => {
  const stageRef = useRef<Konva.Stage>(null);

  useEffect(() => {
    const stage = stageRef.current;
    return () => {
      // 清理Konva Stage
      if (stage) {
        stage.destroy();
      }
    };
  }, []);

  return <Stage ref={stageRef}>...</Stage>;
};
```

### 4.5 内存泄漏测试

```typescript
// memory-leak.test.ts
import { test, expect } from '@playwright/test';

test('Memory leak check - Game board', async ({ page }) => {
  // 获取初始内存
  const initialMetrics = await page.metrics();
  const initialMemory = initialMetrics.JSHeapUsedSize;

  // 多次创建和销毁棋盘
  for (let i = 0; i < 10; i++) {
    await page.goto('http://localhost:5173');
    await page.click('[data-testid="start-game-button"]');

    // 进行几步
    await page.locator('.konvajs-content').click({ position: { x: 300, y: 300 } });
    await page.locator('.konvajs-content').click({ position: { x: 320, y: 300 } });

    // 返回主页
    await page.click('[data-testid="return-home-button"]');
  }

  // 获取最终内存
  const finalMetrics = await page.metrics();
  const finalMemory = finalMetrics.JSHeapUsedSize;

  // 内存增长应该小于10MB
  const memoryGrowth = (finalMemory - initialMemory) / 1024 / 1024;
  expect(memoryGrowth).toBeLessThan(10);
});
```

---

## 5. 代码分割（懒加载）设计

### 5.1 路由懒加载

```typescript
// app.tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 懒加载页面组件
const HomePage = lazy(() => import('./pages/HomePage'));
const GamePage = lazy(() => import('./pages/GamePage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const CheckInPage = lazy(() => import('./pages/CheckInPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// 加载指示器
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-xl">加载中...</div>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/checkin" element={<CheckInPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
```

### 5.2 Vite构建配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2015',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // React相关
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Canvas相关
          'canvas-vendor': ['konva', 'react-konva'],
          // 状态管理
          'state-vendor': ['zustand'],
          // AI相关（懒加载）
          'ai-worker': ['./src/game/ai/ai.worker.ts'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
  },
});
```

### 5.3 组件懒加载

```typescript
// shop-page.tsx
import { lazy, Suspense } from 'react';

// 懒加载商城组件
const SkinGrid = lazy(() => import('./components/SkinGrid'));
const PurchaseModal = lazy(() => import('./components/PurchaseModal'));

export const ShopPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <h1>商城</h1>

      <Suspense fallback={<div>加载中...</div>}>
        <SkinGrid onItemClick={() => setShowModal(true)} />
      </Suspense>

      {showModal && (
        <Suspense fallback={<div>加载中...</div>}>
          <PurchaseModal onClose={() => setShowModal(false)} />
        </Suspense>
      )}
    </div>
  );
};
```

---

## 6. 图片资源优化设计

### 6.1 WebP格式支持

```typescript
// utils/image.ts
export function getOptimizedImageUrl(baseUrl: string): string {
  // 检测浏览器是否支持WebP
  const supportsWebP = document.createElement('canvas')
    .toDataURL('image/webp')
    .indexOf('data:image/webp') === 0;

  if (supportsWebP) {
    return baseUrl.replace(/\.(jpg|png)$/i, '.webp');
  }

  return baseUrl;
}
```

### 6.2 图片压缩

```bash
# 使用sharp库进行图片压缩
# package.json scripts
{
  "scripts": {
    "optimize-images": "node scripts/optimize-images.js"
  }
}
```

```javascript
// scripts/optimize-images.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = 'public/assets/images';
const outputDir = 'public/assets/images-optimized';

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 优化所有图片
fs.readdirSync(inputDir).forEach(file => {
  const inputPath = path.join(inputDir, file);
  const outputPath = path.join(outputDir, file.replace(/\.[^.]+$/, '.webp'));

  sharp(inputPath)
    .webp({ quality: 80 })
    .toFile(outputPath)
    .then(() => console.log(`Optimized: ${file}`))
    .catch(err => console.error(`Error optimizing ${file}:`, err));
});
```

### 6.3 响应式图片

```typescript
// components/responsive-image.tsx
export const ResponsiveImage: React.FC<{
  src: string;
  alt: string;
  sizes?: string;
}> = ({ src, alt, sizes }) => {
  return (
    <picture>
      <source
        srcSet={`${src}@2x.webp 2x, ${src}.webp 1x`}
        type="image/webp"
      />
      <source
        srcSet={`${src}@2x.jpg 2x, ${src}.jpg 1x`}
        type="image/jpeg"
      />
      <img
        src={`${src}.jpg`}
        alt={alt}
        sizes={sizes}
        loading="lazy"
      />
    </picture>
  );
};
```

### 6.4 图片懒加载

```typescript
// components/lazy-image.tsx
import { useState, useRef, useEffect } from 'react';

export const LazyImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setLoaded(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <img
      ref={imgRef}
      src={loaded ? src : undefined}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
};
```

---

## 7. E2E测试设计

### 7.1 PvP对局完整流程

```typescript
// tests/e2e/pvp-game.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173');
});

test('PvP game - Complete flow', async ({ page }) => {
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

  // 继续对局直到分出胜负
  // ...（简化版，实际需要更多步）

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

test('PvP game - Win detection', async ({ page }) => {
  await page.click('[data-testid="pvp-mode-button"]');
  await page.click('[data-testid="start-game-button"]');

  // 模拟五连
  const moves = [
    { x: 300, y: 300 },
    { x: 320, y: 300 },
    { x: 280, y: 300 },
    { x: 340, y: 300 },
    { x: 260, y: 300 },
    { x: 360, y: 300 },
    { x: 240, y: 300 },
  ];

  for (const move of moves) {
    await page.locator('.konvajs-content').click({ position: move });
  }

  // 验证胜负判定
  await expect(page.locator('[data-testid="winner-modal"]')).toBeVisible();
  await expect(page.locator('[data-testid="winner-text"]')).toContainText('黑棋获胜');
});
```

### 7.2 PvE对局完整流程

```typescript
// tests/e2e/pve-game.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173');
});

test('PvE game - Medium difficulty', async ({ page }) => {
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

test('PvE game - Master difficulty timeout', async ({ page }) => {
  await page.click('[data-testid="pve-mode-button"]');
  await page.selectOption('[data-testid="difficulty-select"]', 'master');
  await page.click('[data-testid="start-game-button"]');

  // 玩家落子后，AI应该在10秒内响应
  await page.locator('.konvajs-content').click({ position: { x: 300, y: 300 } });
  await expect(page.locator('[data-testid="status"]')).toContainText('黑棋回合', { timeout: 12000 });
});
```

### 7.3 商城功能测试

```typescript
// tests/e2e/shop.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173/shop');
});

test('Shop page - Purchase skin', async ({ page }) => {
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

test('Shop page - Apply skin', async ({ page }) => {
  // 点击已拥有的皮肤
  await page.click('[data-testid="skin-classic-board"]');

  // 应用皮肤
  await page.click('[data-testid="apply-button"]');

  // 验证应用成功提示
  await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  await expect(page.locator('[data-testid="success-toast"]')).toContainText('应用成功');

  // 进入游戏验证皮肤
  await page.goto('http://localhost:5173/game');
  // 验证棋盘背景（略）
});

test('Shop page - Insufficient coins', async ({ page }) => {
  // 修改金币为0（通过localStorage）
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

### 7.4 任务系统测试

```typescript
// tests/e2e/tasks.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173/tasks');
});

test('Tasks page - Complete task', async ({ page }) => {
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

test('Tasks page - Daily refresh', async ({ page }) => {
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

### 7.5 签到功能测试

```typescript
// tests/e2e/checkin.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173/checkin');
});

test('CheckIn page - Daily check-in', async ({ page }) => {
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

test('CheckIn page - Consecutive check-in', async ({ page }) => {
  // 模拟连续签到4天
  await page.evaluate(() => {
    const history = [];
    for (let i = 4; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      history.push(date.toDateString());
    }
    localStorage.setItem('gobang_check_in_v2', JSON.stringify({
      lastCheckInDate: history[history.length - 1],
      consecutiveDays: 5,
      totalCheckInDays: 5,
      checkInHistory: history,
    }));
  });

  // 刷新页面
  await page.reload();

  // 验证连续签到天数
  await expect(page.locator('[data-testid="consecutive-days"]')).toHaveText('5天');

  // 验证历史签到标记
  await expect(page.locator('[data-testid="history-day-4"]')).toHaveClass(/checked/);
});

test('CheckIn page - 7 day reward', async ({ page }) => {
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

### 7.6 响应式测试

```typescript
// tests/e2e/responsive.spec.ts
import { test, expect } from '@playwright/test';

test('Responsive design - Desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5173');

  // 验证桌面布局
  await expect(page.locator('[data-testid="game-board"]')).toHaveCSS('width', '600px');
  await expect(page.locator('[data-testid="control-panel"]')).toBeVisible();
});

test('Responsive design - Tablet', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('http://localhost:5173');

  // 验证平板布局
  const boardWidth = await page.locator('[data-testid="game-board"]').evaluate(el => {
    return window.getComputedStyle(el).width;
  });
  expect(parseInt(boardWidth)).toBeGreaterThan(500);
});

test('Responsive design - Mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:5173');

  // 验证移动端布局
  const boardWidth = await page.locator('[data-testid="game-board"]').evaluate(el => {
    return window.getComputedStyle(el).width;
  });
  expect(parseInt(boardWidth)).toBeLessThan(400);

  // 验证按钮竖向排列
  const buttons = await page.locator('[data-testid="control-panel"] button').all();
  const firstButtonTop = await buttons[0].evaluate(el => el.getBoundingClientRect().top);
  const secondButtonTop = await buttons[1].evaluate(el => el.getBoundingClientRect().top);
  expect(secondButtonTop).toBeGreaterThan(firstButtonTop);
});
```

---

## 8. 性能测试设计

### 8.1 Lighthouse测试

```javascript
// scripts/lighthouse.js
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function runLighthouse() {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });

  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
  };

  const runnerResult = await lighthouse('http://localhost:5173', options);

  console.log('Report is done for', runnerResult.lhr.finalUrl);
  console.log('Performance score:', runnerResult.lhr.categories.performance.score * 100);

  await chrome.kill();
}

runLighthouse();
```

### 8.2 AI性能基准测试

```typescript
// tests/ai-performance.test.ts
import { test, expect } from '@playwright/test';

test('AI performance benchmark - SimpleAI', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.click('[data-testid="pve-mode-button"]');
  await page.selectOption('[data-testid="difficulty-select"]', 'simple');
  await page.click('[data-testid="start-game-button"]');

  const startTime = Date.now();
  await page.locator('.konvajs-content').click({ position: { x: 300, y: 300 } });
  await page.waitForSelector('[data-testid="status"]:has-text("黑棋回合")');
  const duration = Date.now() - startTime;

  expect(duration).toBeLessThan(100); // <100ms
});

test('AI performance benchmark - MediumAI', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.click('[data-testid="pve-mode-button"]');
  await page.selectOption('[data-testid="difficulty-select"]', 'medium');
  await page.click('[data-testid="start-game-button"]');

  const startTime = Date.now();
  await page.locator('.konvajs-content').click({ position: { x: 300, y: 300 } });
  await page.waitForSelector('[data-testid="status"]:has-text("黑棋回合")');
  const duration = Date.now() - startTime;

  expect(duration).toBeLessThan(500); // <500ms
});

test('AI performance benchmark - HardAI', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.click('[data-testid="pve-mode-button"]');
  await page.selectOption('[data-testid="difficulty-select"]', 'hard');
  await page.click('[data-testid="start-game-button"]');

  const startTime = Date.now();
  await page.locator('.konvajs-content').click({ position: { x: 300, y: 300 } });
  await page.waitForSelector('[data-testid="status"]:has-text("黑棋回合")');
  const duration = Date.now() - startTime;

  expect(duration).toBeLessThan(5000); // <5s
});

test('AI performance benchmark - MasterAI', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.click('[data-testid="pve-mode-button"]');
  await page.selectOption('[data-testid="difficulty-select"]', 'master');
  await page.click('[data-testid="start-game-button"]');

  const startTime = Date.now();
  await page.locator('.konvajs-content').click({ position: { x: 300, y: 300 } });
  await page.waitForSelector('[data-testid="status"]:has-text("黑棋回合")');
  const duration = Date.now() - startTime;

  expect(duration).toBeLessThan(10000); // <10s
});
```

### 8.3 渲染性能测试

```typescript
// tests/rendering-performance.test.ts
import { test, expect } from '@playwright/test';

test('Rendering performance - Board render time', async ({ page }) => {
  await page.goto('http://localhost:5173');

  const metrics = await page.evaluate(async () => {
    const start = performance.now();

    // 触发棋盘渲染
    document.querySelector('[data-testid="start-game-button"]')?.click();

    // 等待下一帧
    await new Promise(resolve => requestAnimationFrame(resolve));

    const end = performance.now();
    return {
      renderTime: end - start,
      fps: 1000 / (end - start),
    };
  });

  expect(metrics.renderTime).toBeLessThan(100); // <100ms
  expect(metrics.fps).toBeGreaterThan(30); // >30fps
});

test('Rendering performance - Piece render time', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.click('[data-testid="pve-mode-button"]');
  await page.click('[data-testid="start-game-button"]');

  const startTime = Date.now();
  await page.locator('.konvajs-content').click({ position: { x: 300, y: 300 } });
  await page.waitForSelector('[data-testid="piece-at-7-7"]'); // 假设有这个data-testid
  const duration = Date.now() - startTime;

  expect(duration).toBeLessThan(50); // <50ms
});
```

---

## 9. 测试要点

### 9.1 Week 9.1测试
- [ ] 游戏结束触发金币奖励
- [ ] 游戏结束触发任务进度更新
- [ ] 数据自动保存到LocalStorage
- [ ] Week 1-9功能不受影响

### 9.2 AI性能优化测试
- [ ] Worker复用正常工作
- [ ] 内存无泄漏
- [ ] AI响应时间保持或改善
- [ ] 所有AI测试通过

### 9.3 Canvas渲染优化测试
- [ ] 离屏Canvas缓存正常工作
- [ ] 脏标记重绘正常工作
- [ ] 帧率保持60fps
- [ ] 内存占用合理

### 9.4 内存泄漏测试
- [ ] 无事件监听器泄漏
- [ ] 无定时器泄漏
- [ ] 无Worker泄漏
- [ ] 长时间运行内存稳定

### 9.5 代码分割测试
- [ ] 路由懒加载正常工作
- [ ] 首屏加载时间减少
- [ ] 所有功能正常

### 9.6 E2E测试
- [ ] PvP对局完整流程测试通过
- [ ] PvE对局完整流程测试通过
- [ ] 商城功能测试通过
- [ ] 任务系统测试通过
- [ ] 签到功能测试通过
- [ ] 响应式测试通过

### 9.7 性能测试
- [ ] Lighthouse分数>90
- [ ] AI响应时间达标
- [ ] 渲染性能达标
- [ ] 无内存泄漏

---

## 10. 后续扩展规划

### Week 11-12扩展
- 集成测试
- Bug修复
- 跨浏览器测试
- 移动端测试
- 生产环境部署
- 文档完善

---

**文档状态**: ✅ PL文档创建完成
**下一步**: QA设计测试用例
