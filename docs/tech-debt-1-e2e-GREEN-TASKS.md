# E2E测试 - GREEN阶段任务清单

**状态**: 🔄 等待DEV实现
**创建日期**: 2026-03-25
**任务**: 添加data-testid选择器，使E2E测试通过

---

## 📋 任务说明

E2E测试已编写完成（9个测试用例），当前处于**RED阶段**（测试失败）。

失败原因：缺少必要的`data-testid`选择器，导致：
1. Playwright无法找到元素
2. 应用程序可能崩溃

**下一步（DEV任务）**：在组件中添加`data-testid`属性

---

## 🎯 需要添加的data-testid属性

### 1. 主菜单页面组件

**文件**: `src/pages/HomePage/HomeMenu.tsx` (或类似文件)

```typescript
// 需要添加的data-testid
<div data-testid="main-menu">
  <button data-testid="pvp-mode-button">双人对战</button>
  <button data-testid="pve-mode-button">人机对战</button>

  {/* PvE难度选择 */}
  <select data-testid="ai-difficulty">
    <option value="simple">简单</option>
    <option value="medium">中等</option>
    <option value="hard">困难</option>
    <option value="master">大师</option>
  </select>

  <button data-testid="start-game-button">开始游戏</button>
  <button data-testid="game-records-button">游戏记录</button>
</div>
```

### 2. 游戏页面组件

**文件**: `src/pages/GamePage/index.tsx` (或类似文件)

```typescript
// 需要添加的data-testid
<div data-testid="game-page">
  {/* 游戏棋盘容器 */}
  <div data-testid="game-board">
    {/* Konva Stage在这里 */}
  </div>

  {/* 游戏结果弹窗 */}
  {gameStatus === 'won' && (
    <div data-testid="game-result">
      <p>{winner}获胜</p>
      <button>确定</button>
    </div>
  )}
</div>
```

### 3. Board/Konva组件

**文件**: `src/components/Board/BoardStage.tsx`

```typescript
// 需要添加的data-testid
<Stage
  data-testid="game-board"
  width={size}
  height={size}
>
  {/* ... */}
</Stage>
```

### 4. 游戏控制组件

**文件**: `src/components/GameControls/GameControls.tsx`

已有`data-testid="game-controls"`，需要添加：

```typescript
// 需要添加的data-testid
<div data-testid="game-controls" className="...">
  <button data-testid="undo-button">悔棋</button>
  <button data-testid="hint-button">提示</button>
  <button data-testid="return-to-menu-button">返回主菜单</button>
  <button data-testid="resign-button">认输</button>
</div>
```

### 5. 提示标记组件

**文件**: `src/components/Board/PiecesLayer.tsx` (或类似文件)

```typescript
// 需要添加的提示标记
{isShowingHint && hintPosition && (
  <Circle
    data-testid="hint-marker"
    x={hintPosition.x * cellSize + cellSize / 2}
    y={hintPosition.y * cellSize + cellSize / 2}
    radius={cellSize / 3}
    fill="yellow"
    opacity={0.5}
  />
)}
```

### 6. 胜利连线组件

**文件**: `src/components/Board/HighlightLayer.tsx` (或类似文件)

```typescript
// 需要添加的胜利连线
{winLine && winLine.map((pos, index) => (
  <Line
    key={index}
    data-testid="win-line"
    points={...}
    stroke="gold"
    strokeWidth={5}
  />
))}
```

### 7. 游戏记录页面

**文件**: `src/pages/GameRecordsPage/index.tsx` (或类似文件)

```typescript
// 需要添加的data-testid
<div data-testid="game-records-page">
  <div data-testid="game-record-list">
    {records.map(record => (
      <div
        key={record.id}
        data-testid="game-record-item"
        onClick={() => showRecord(record)}
      >
        <p>{record.mode}</p>
        <p>{record.result}</p>
        <button data-testid="replay-button">回放</button>
      </div>
    ))}
  </div>
</div>
```

### 8. 游戏回放控制组件

**文件**: 回放相关的组件

```typescript
// 需要添加的data-testid
<div data-testid="replay-controls">
  <button data-testid="replay-play">播放</button>
  <button data-testid="replay-pause">暂停</button>
  <button data-testid="replay-step-forward">下一步</button>
  <button data-testid="replay-step-backward">上一步</button>
  <select data-testid="replay-speed">
    <option value="0.5">0.5x</option>
    <option value="1">1x</option>
    <option value="2">2x</option>
  </select>
</div>
```

---

## ✅ 实现检查清单

- [ ] HomePage/HomeMenu.tsx
  - [ ] `data-testid="pvp-mode-button"`
  - [ ] `data-testid="pve-mode-button"`
  - [ ] `data-testid="ai-difficulty"`
  - [ ] `data-testid="start-game-button"`
  - [ ] `data-testid="game-records-button"`

- [ ] GamePage/index.tsx
  - [ ] `data-testid="game-page"`
  - [ ] `data-testid="game-board"`
  - [ ] `data-testid="game-result"`

- [ ] Board/BoardStage.tsx
  - [ ] `data-testid="game-board"` (Stage)

- [ ] GameControls/GameControls.tsx
  - [ ] `data-testid="undo-button"`
  - [ ] `data-testid="hint-button"`
  - [ ] `data-testid="return-to-menu-button"`
  - [ ] `data-testid="resign-button"`

- [ ] Board/PiecesLayer.tsx
  - [ ] `data-testid="hint-marker"` (提示圆圈)

- [ ] Board/HighlightLayer.tsx
  - [ ] `data-testid="win-line"` (胜利连线)

- [ ] GameRecordsPage/index.tsx
  - [ ] `data-testid="game-record-list"`
  - [ ] `data-testid="game-record-item"`
  - [ ] `data-testid="replay-button"`

- [ ] ReplayControls组件
  - [ ] `data-testid="replay-play"`
  - [ ] `data-testid="replay-pause"`
  - [ ] `data-testid="replay-step-forward"`
  - [ ] `data-testid="replay-step-backward"`
  - [ ] `data-testid="replay-speed"`

---

## 🧪 验证步骤

1. **添加data-testid属性**
   - 按照上述清单，在对应组件中添加`data-testid`属性
   - 确保每个交互元素都有合适的testid

2. **运行E2E测试**
   ```bash
   npx playwright test tests/e2e/tech-debt-e2e.spec.ts --project=chromium
   ```

3. **验证测试通过**
   - 9个测试应该全部通过（或大部分通过）
   - 如果仍有失败，检查是否缺少其他testid

4. **运行所有浏览器测试**
   ```bash
   npx playwright test tests/e2e/tech-debt-e2e.spec.ts
   ```

5. **回归测试**
   ```bash
   npm run test
   ```
   - 确保Week 1-10的436个单元测试继续通过

---

## 📊 预期结果

**GREEN阶段**达成后：
- ✅ 9个E2E测试通过（或大部分通过）
- ✅ Week 1-10的436个单元测试继续通过
- ✅ 总测试数：445个（436单元+9E2E）
- ✅ 测试覆盖率保持>90%

---

**文档版本**: v1.0
**创建日期**: 2026-03-25
**创建者**: QA Agent
**状态**: 🔄 等待DEV实现
**下一步**: DEV添加data-testid后，运行测试验证GREEN阶段
