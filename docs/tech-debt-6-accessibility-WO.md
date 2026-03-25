# 技术债偿还 #6: 可访问性改进

**优先级**: 🟡 中优先级
**状态**: ⏸️ 待启动
**创建日期**: 2026-03-25
**来源**: Week 9遗漏

---

## 📋 工作对象（Work Object）定义

### 背景说明

**问题描述**:
Week 9原计划实现可访问性改进，但未实现。当前应用对残障用户可能不友好。

**业务价值**:
- ✅ 符合WCAG标准
- ✅ 扩大用户群
- ✅ 社会责任感

### 工作目标

**主要目标**:
1. ARIA标签添加
2. 键盘导航支持

**次要目标**:
3. 屏幕阅读器支持
4. 高对比度模式

### 成功标准

**门禁标准**:
- [ ] 所有交互元素有ARIA标签
- [ ] 完整键盘导航支持
- [ ] 屏幕阅读器可用
- [ ] 无WCAG A级错误

**验收标准**:
- ✅ Tab键可导航所有按钮
- ✅ 屏幕阅读器读出状态
- ✅ 焦点指示器清晰
- ✅ 无语义错误

---

## ♿ 可访问性设计

### ARIA标签

```typescript
// src/components/Board/BoardStage.tsx
export const BoardStage: React.FC = () => {
  return (
    <div
      role="grid"
      aria-label="五子棋棋盘"
      aria-describedby="board-instructions"
    >
      {/* 棋盘格子 */}
      {cells.map((cell, index) => (
        <div
          key={index}
          role="gridcell"
          aria-label={`位置 ${Math.floor(index / 15) + 1}行${(index % 15) + 1}列`}
          aria-selected={cell.piece !== null}
          aria-pressed={cell.piece !== null}
        >
          {/* 棋子 */}
        </div>
      ))}
    </div>
  );
};

// 控制按钮
export const GameControls: React.FC = () => {
  return (
    <div className="game-controls" role="group" aria-label="游戏控制">
      <button
        onClick={handleRestart}
        aria-label="重新开始游戏"
        aria-describedby="restart-desc"
      >
        <RestartIcon aria-hidden="true" />
        重新开始
      </button>
      <span id="restart-desc" className="sr-only">
        清空棋盘，开始新游戏
      </span>

      <button
        onClick={handleUndo}
        aria-label={`悔棋，剩余${undoCount}次`}
        disabled={undoCount === 0}
      >
        <UndoIcon aria-hidden="true" />
        悔棋 ({undoCount})
      </button>

      <button
        onClick={handleHint}
        aria-label={`使用提示，剩余${hintCount}次`}
        disabled={hintCount === 0}
      >
        <LightbulbIcon aria-hidden="true" />
        提示 ({hintCount})
      </button>
    </div>
  );
};

// 状态指示器
export const StatusIndicator: React.FC = () => {
  const { gameStatus, currentPlayer, winner } = useGameStore();

  const statusText = useMemo(() => {
    if (gameStatus === 'playing') {
      return `${currentPlayer === 'black' ? '黑棋' : '白棋'}回合`;
    }
    if (gameStatus === 'won') {
      return `${winner === 'black' ? '黑棋' : '白棋'}获胜`;
    }
    return '游戏未开始';
  }, [gameStatus, currentPlayer, winner]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="游戏状态"
    >
      {statusText}
    </div>
  );
};
```

### 键盘导航

```typescript
// src/components/Board/KeyboardNavigation.tsx
export const BoardKeyboard: React.FC = () => {
  const [focusedPosition, setFocusedPosition] = useState<Position>({ x: 7, y: 7 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setFocusedPosition((prev) => ({ ...prev, y: Math.max(0, prev.y - 1) }));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedPosition((prev) => ({ ...prev, y: Math.min(14, prev.y + 1) }));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFocusedPosition((prev) => ({ ...prev, x: Math.max(0, prev.x - 1) }));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setFocusedPosition((prev) => ({ ...prev, x: Math.min(14, prev.x + 1) }));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          makeMove(focusedPosition);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedPosition]);

  return (
    <div
      className="keyboard-focus-indicator"
      style={{
        left: `${focusedPosition.x * cellSize + cellSize / 2}px`,
        top: `${focusedPosition.y * cellSize + cellSize / 2}px`,
      }}
      aria-hidden="true"
    />
  );
};
```

### 屏幕阅读器隐藏

```css
/* src/styles/accessibility.css */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* 焦点指示器 */
*:focus-visible {
  outline: 3px solid #FFD700;
  outline-offset: 2px;
}

/* 跳过链接 */
.skip-to-content {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-to-content:focus {
  top: 0;
}
```

---

## 🧪 测试用例设计

### TC-A11Y-01: ARIA标签

**测试步骤**:
1. 使用axe DevTools检查
2. 验证所有交互元素有ARIA标签

**预期结果**:
- 无ARIA错误
- 标签描述准确

**优先级**: P0

---

### TC-A11Y-02: 键盘导航

**测试步骤**:
1. 使用Tab键导航
2. 使用方向键选择棋盘位置
3. 使用Enter落子

**预期结果**:
- 所有按钮可Tab访问
- 焦点指示器清晰
- 方向键可移动焦点

**优先级**: P0

---

### TC-A11Y-03: 屏幕阅读器

**测试步骤**:
1. 启用NVDA/VoiceOver
2. 打开游戏
3. 听到状态读出

**预期结果**:
- 读出当前状态
- 读出棋盘位置
- 读出按钮功能

**优先级**: P0

---

### TC-A11Y-04: 颜色对比度

**测试步骤**:
1. 使用对比度检查工具
2. 验证所有文本

**预期结果**:
- 对比度>4.5:1（小字）
- 对比度>3:1（大字）

**优先级**: P1

---

## ✅ 验收清单

### 功能验收
- [ ] ARIA标签完整
- [ ] 键盘导航完整
- [ ] 屏幕阅读器可用
- [ ] 焦点管理正确

### 合规验收
- [ ] WCAG A级通过
- [ ] 无axe错误
- [ ] 颜色对比度合规

### 用户体验验收
- [ ] 焦点指示器清晰
- [ ] 键盘操作流畅
- [ ] 屏幕阅读器信息准确

---

## 📊 工作量估算

| 任务 | 工作量 | 优先级 |
|------|--------|--------|
| ARIA标签添加 | 4小时 | P0 |
| 键盘导航实现 | 4小时 | P0 |
| 屏幕阅读器测试 | 2小时 | P0 |
| 焦点管理优化 | 2小时 | P1 |
| 对比度优化 | 1小时 | P1 |
| 测试和修复 | 2小时 | P0 |
| **总计** | **15小时** (~2天) | - |

---

**文档版本**: v1.0
**创建日期**: 2026-03-25
**创建者**: PM Agent
**状态**: ⏸️ 待启动
**下一步**: 完成响应式优化后启动
