# Week 4 - 测试用例文档

## 文档信息
- **文档版本**: v1.0
- **创建日期**: 2026-03-24
- **负责人**: 测试工程师 (QA)
- **阶段**: Phase 1 - MVP基础版本
- **周次**: Week 4
- **关联文档**: week-4-WO.md, week-4-PL.md

---

## 测试概览

### 测试范围
- **UI组件测试**: 15个（之前延后）
- **E2E测试**: 9个（之前延后）
- **双人对战测试**: 10个
- **提示功能测试**: 8个
- **集成测试**: 12个
- **总计**: 54个测试用例

### 测试框架
- **UI组件测试**: React Testing Library (RTL)
- **E2E测试**: Playwright
- **集成测试**: Vitest

### 测试覆盖率目标
- 代码覆盖率: >90% (Week 1-3是90.3%，要保持或提升)
- 功能覆盖率: >95%
- 核心UI组件: 100%

---

## 一、UI组件测试（15个）

### 1.1 Timer组件测试（5个）

## TC-125: Timer组件初始化显示00:00

**优先级**: P0
**类型**: 单元测试
**前置条件**:
- Timer组件已挂载
- isRunning = false

**测试步骤**:
1. 渲染Timer组件，设置isRunning={false}
2. 查询计时器显示元素
3. 验证初始显示内容

**期望结果**:
- 计时器显示"00:00"
- 组件正确渲染

**测试数据**:
```typescript
{
  isRunning: false
}
```

**框架**: RTL
**文件位置**: `src/components/Timer/__tests__/Timer.test.tsx`

---

## TC-126: Timer秒数累加

**优先级**: P0
**类型**: 单元测试
**前置条件**:
- Timer组件已挂载
- isRunning = true

**测试步骤**:
1. 渲染Timer组件，设置isRunning={true}
2. 等待3秒（使用vi.useFakeTimers）
3. 快进时间3秒
4. 查询计时器显示内容

**期望结果**:
- 计时器显示"00:03"
- 每秒正确累加

**测试数据**:
```typescript
{
  isRunning: true
}
```

**框架**: RTL
**文件位置**: `src/components/Timer/__tests__/Timer.test.tsx`

---

## TC-127: Timer分钟进位

**优先级**: P0
**类型**: 单元测试
**前置条件**:
- Timer组件已挂载
- isRunning = true

**测试步骤**:
1. 渲染Timer组件，设置isRunning={true}
2. 快进时间65秒
3. 查询计时器显示内容

**期望结果**:
- 计时器显示"01:05"
- 正确处理分钟进位

**测试数据**:
```typescript
{
  isRunning: true
}
```

**框架**: RTL
**文件位置**: `src/components/Timer/__tests__/Timer.test.tsx`

---

## TC-128: Timer暂停和恢复

**优先级**: P0
**类型**: 单元测试
**前置条件**:
- Timer组件已挂载
- isRunning初始为true

**测试步骤**:
1. 渲染Timer组件，设置isRunning={true}
2. 快进时间5秒，验证显示"00:05"
3. 更新props: isRunning={false}
4. 快进时间5秒
5. 验证计时器仍显示"00:05"（未增加）
6. 更新props: isRunning={true}
7. 快进时间3秒
8. 验证计时器显示"00:08"

**期望结果**:
- 暂停时计时停止
- 恢复后继续计时
- 总时间正确累加

**测试数据**:
```typescript
初始: { isRunning: true }
更新: { isRunning: false }
最后: { isRunning: true }
```

**框架**: RTL
**文件位置**: `src/components/Timer/__tests__/Timer.test.tsx`

---

## TC-129: Timer回合切换重置

**优先级**: P0
**类型**: 单元测试
**前置条件**:
- Timer组件已挂载
- 计时器已运行一段时间

**测试步骤**:
1. 渲染Timer组件，设置isRunning={true}
2. 快进时间30秒
3. 验证显示"00:30"
4. 模拟游戏重新开始（key prop变化或组件重新挂载）
5. 验证计时器重置为"00:00"

**期望结果**:
- 重新开始时计时器归零
- 组件状态正确重置

**测试数据**:
```typescript
{
  isRunning: true
}
```

**框架**: RTL
**文件位置**: `src/components/Timer/__tests__/Timer.test.tsx`

---

### 1.2 StatusIndicator组件测试（5个）

## TC-130: StatusIndicator显示当前玩家

**优先级**: P0
**类型**: 单元测试
**前置条件**:
- StatusIndicator组件已挂载
- gameStatus = 'playing'

**测试步骤**:
1. 渲染组件，设置gameStatus='playing', currentPlayer='black'
2. 查询状态文本
3. 验证显示"轮到黑棋落子"
4. 更新props: currentPlayer='white'
5. 验证显示"轮到白棋落子"

**期望结果**:
- 正确显示当前玩家
- 显示正确的图标（⚫或⚪）

**测试数据**:
```typescript
{
  gameStatus: 'playing',
  currentPlayer: 'black'
}
{
  gameStatus: 'playing',
  currentPlayer: 'white'
}
```

**框架**: RTL
**文件位置**: `src/components/StatusIndicator/__tests__/StatusIndicator.test.tsx`

---

## TC-131: StatusIndicator显示游戏状态

**优先级**: P0
**类型**: 单元测试
**前置条件**:
- StatusIndicator组件已挂载

**测试步骤**:
1. 渲染组件，设置gameStatus='playing'
2. 验证显示"轮到X落子"
3. 更新props: gameStatus='paused'
4. 验证显示"游戏已暂停"
5. 更新props: gameStatus='won', winner='black'
6. 验证显示"黑棋获胜"
7. 更新props: gameStatus='draw'
8. 验证显示"平局"

**期望结果**:
- 每种状态显示正确文本
- 每种状态显示正确图标

**测试数据**:
```typescript
[
  { gameStatus: 'playing', currentPlayer: 'black' },
  { gameStatus: 'paused' },
  { gameStatus: 'won', winner: 'black' },
  { gameStatus: 'draw' }
]
```

**框架**: RTL
**文件位置**: `src/components/StatusIndicator/__tests__/StatusIndicator.test.tsx`

---

## TC-132: StatusIndicator显示获胜方

**优先级**: P0
**类型**: 单元测试
**前置条件**:
- StatusIndicator组件已挂载
- gameStatus = 'won'

**测试步骤**:
1. 渲染组件，设置gameStatus='won', winner='black'
2. 验证显示"黑棋获胜"和🏆图标
3. 更新props: winner='white'
4. 验证显示"白棋获胜"和🏆图标

**期望结果**:
- 正确显示获胜方
- 显示奖杯图标
- 使用绿色文字（胜利色）

**测试数据**:
```typescript
{
  gameStatus: 'won',
  winner: 'black'
}
{
  gameStatus: 'won',
  winner: 'white'
}
```

**框架**: RTL
**文件位置**: `src/components/StatusIndicator/__tests__/StatusIndicator.test.tsx`

---

## TC-133: StatusIndicator显示AI思考状态

**优先级**: P1
**类型**: 单元测试
**前置条件**:
- StatusIndicator组件已挂载
- 游戏模式为PvE

**测试步骤**:
1. 渲染组件，设置gameMode='pve', isAiThinking=true
2. 验证显示"AI思考中..."
3. 验证显示加载动画或图标
4. 更新props: isAiThinking=false
5. 验证恢复到正常状态显示

**期望结果**:
- AI思考时显示提示
- 有视觉反馈（动画或图标）

**测试数据**:
```typescript
{
  gameMode: 'pve',
  isAiThinking: true
}
```

**框架**: RTL
**文件位置**: `src/components/StatusIndicator/__tests__/StatusIndicator.test.tsx`

---

## TC-134: StatusIndicator提示信息显示

**优先级**: P1
**类型**: 单元测试
**前置条件**:
- StatusIndicator组件已挂载
- 有提示信息需要显示

**测试步骤**:
1. 渲染组件，设置message="黑棋悔棋成功"
2. 验证显示提示信息
3. 验证提示信息有特殊样式（如黄色背景）
4. 等待3秒
5. 验证提示信息自动消失

**期望结果**:
- 提示信息正确显示
- 提示信息有视觉区分
- 提示信息自动消失

**测试数据**:
```typescript
{
  message: "黑棋悔棋成功"
}
```

**框架**: RTL
**文件位置**: `src/components/StatusIndicator/__tests__/StatusIndicator.test.tsx`

---

### 1.3 GameControls组件测试（5个）

## TC-135: GameControls重新开始按钮

**优先级**: P0
**类型**: 单元测试
**前置条件**:
- GameControls组件已挂载
- onRestart回调已提供

**测试步骤**:
1. 渲染组件，传入onRestart模拟函数
2. 查询"重新开始"按钮
3. 验证按钮存在且未被禁用
4. 点击按钮
5. 验证onRestart被调用1次

**期望结果**:
- 按钮正确渲染
- 点击触发回调
- 按钮始终可用（任何状态下都可重新开始）

**测试数据**:
```typescript
{
  onRestart: vi.fn(),
  gameStatus: 'playing'
}
```

**框架**: RTL
**文件位置**: `src/components/GameControls/__tests__/GameControls.test.tsx`

---

## TC-136: GameControls返回菜单按钮

**优先级**: P0
**类型**: 单元测试
**前置条件**:
- GameControls组件已挂载
- onMainMenu回调已提供

**测试步骤**:
1. 渲染组件，传入onMainMenu模拟函数
2. 查询"返回主菜单"按钮
3. 验证按钮存在且未被禁用
4. 点击按钮
5. 验证onMainMenu被调用1次

**期望结果**:
- 按钮正确渲染
- 点击触发回调
- 按钮始终可用

**测试数据**:
```typescript
{
  onMainMenu: vi.fn(),
  gameStatus: 'playing'
}
```

**框架**: RTL
**文件位置**: `src/components/GameControls/__tests__/GameControls.test.tsx`

---

## TC-137: GameControls悔棋按钮（PvP和PvE不同行为）

**优先级**: P0
**类型**: 单元测试
**前置条件**:
- GameControls组件已挂载
- 悔棋次数>0

**测试步骤**:
1. 渲染组件，设置gameMode='pvp', canUndo=true, undoCount=3
2. 查询"悔棋 (3)"按钮
3. 验证按钮未被禁用
4. 点击按钮
5. 验证onUndo被调用1次
6. 更新props: undoCount=0
7. 验证按钮被禁用

**期望结果**:
- 悔棋按钮显示剩余次数
- 次数为0时禁用
- PvP和PvE模式显示正确

**测试数据**:
```typescript
PvP模式: {
  gameMode: 'pvp',
  canUndo: true,
  undoCount: 3
}
PvE模式: {
  gameMode: 'pve',
  canUndo: true,
  undoCount: 3
}
```

**框架**: RTL
**文件位置**: `src/components/GameControls/__tests__/GameControls.test.tsx`

---

## TC-138: GameControls提示按钮

**优先级**: P0
**类型**: 单元测试
**前置条件**:
- GameControls组件已挂载
- onHint回调已提供

**测试步骤**:
1. 渲染组件，传入onHint模拟函数
2. 查询"提示"或"💡 提示"按钮
3. 验证按钮存在
4. 验证游戏进行中时按钮未禁用
5. 点击按钮
6. 验证onHint被调用1次
7. 更新props: gameStatus='won'
8. 验证按钮被禁用

**期望结果**:
- 提示按钮正确渲染
- 游戏进行时可用
- 游戏结束时禁用

**测试数据**:
```typescript
{
  onHint: vi.fn(),
  gameStatus: 'playing'
}
{
  onHint: vi.fn(),
  gameStatus: 'won'
}
```

**框架**: RTL
**文件位置**: `src/components/GameControls/__tests__/GameControls.test.tsx`

---

## TC-139: GameControls认输按钮

**优先级**: P1
**类型**: 单元测试
**前置条件**:
- GameControls组件已挂载
- onSurrender回调已提供

**测试步骤**:
1. 渲染组件，传入onSurrender模拟函数
2. 查询"认输"按钮
3. 验证按钮存在
4. 验证游戏进行中时按钮未禁用
5. 点击按钮
6. 验证显示确认对话框（如果实现）
7. 确认后验证onSurrender被调用

**期望结果**:
- 认输按钮正确渲染
- 点击触发认输流程
- 可能有二次确认

**测试数据**:
```typescript
{
  onSurrender: vi.fn(),
  gameStatus: 'playing'
}
```

**框架**: RTL
**文件位置**: `src/components/GameControls/__tests__/GameControls.test.tsx`

---

## 二、E2E测试（9个）

## TC-140: 完整PvP对局流程（黑棋获胜）

**优先级**: P0
**类型**: E2E测试
**前置条件**:
- 应用已启动（http://localhost:5173）
- LocalStorage已清空

**测试步骤**:
1. 打开应用首页
2. 点击"开始游戏"按钮
3. 点击"双人对战"模式
4. 选择"执黑先行"
5. 等待进入游戏页面
6. 黑棋落子(7,7) - 天元
7. 白棋落子(7,8)
8. 黑棋落子(8,8)
9. 白棋落子(8,9)
10. 黑棋落子(9,9)
11. 白棋落子(9,10)
12. 黑棋落子(10,10) - 形成五连
13. 等待游戏结束判断
14. 验证显示"黑棋获胜"对话框
15. 点击"再来一局"
16. 验证游戏重新开始

**期望结果**:
- 完成对局流程
- 正确判断胜负
- 胜利界面正确显示
- 可以重新开始

**测试数据**:
```typescript
对局路径: [
  { player: 'black', x: 7, y: 7 },
  { player: 'white', x: 7, y: 8 },
  { player: 'black', x: 8, y: 8 },
  { player: 'white', x: 8, y: 9 },
  { player: 'black', x: 9, y: 9 },
  { player: 'white', x: 9, y: 10 },
  { player: 'black', x: 10, y: 10 }
]
```

**框架**: Playwright
**文件位置**: `tests/e2e/pvp-game.spec.ts`

---

## TC-141: 完整PvP对局流程（平局）

**优先级**: P1
**类型**: E2E测试
**前置条件**:
- 应用已启动
- LocalStorage已清空

**测试步骤**:
1. 打开应用首页
2. 进入双人对战模式
3. 模拟落子直到棋盘接近满（224手）
4. 验证没有形成五连
5. 继续落子直到棋盘完全填满（225手）
6. 验证显示"平局"对话框
7. 验证记录已保存

**期望结果**:
- 正确判断平局
- 平局界面正确显示
- 记录正确保存

**测试数据**:
```typescript
使用脚本生成完整棋盘落子序列（无五连）
```

**框架**: Playwright
**文件位置**: `tests/e2e/pvp-game.spec.ts`

---

## TC-142: 完整PvE对局流程（玩家获胜）

**优先级**: P0
**类型**: E2E测试
**前置条件**:
- 应用已启动
- AI难度设置为"简单"

**测试步骤**:
1. 打开应用首页
2. 点击"开始游戏"
3. 点击"人机对战"
4. 选择"简单"难度
5. 选择"执黑先行"
6. 玩家落子(7,7)
7. 等待AI响应（<500ms）
8. 验证AI已落子
9. 继续对局直到玩家获胜
10. 验证显示"黑棋获胜"
11. 点击"返回主菜单"
12. 验证返回首页

**期望结果**:
- AI正常响应
- 胜负正确判断
- 导航功能正常

**测试数据**:
```typescript
难度: 'easy'
先手: 'black'
```

**框架**: Playwright
**文件位置**: `tests/e2e/pve-game.spec.ts`

---

## TC-143: 完整PvE对局流程（AI获胜）

**优先级**: P1
**类型**: E2E测试
**前置条件**:
- 应用已启动
- AI难度设置为"中等"

**测试步骤**:
1. 打开应用首页
2. 进入人机对战模式
3. 选择"中等"难度
4. 选择"执白后行"
5. AI（黑棋）先行落子
6. 玩家（白棋）落子
7. 继续对局直到AI获胜
8. 验证显示"黑棋（AI）获胜"
9. 点击"查看对局记录"
10. 验证进入历史记录页面

**期望结果**:
- AI能够获胜
- 正确显示获胜方
- 查看记录功能正常

**测试数据**:
```typescript
难度: 'medium'
先手: 'white'
```

**框架**: Playwright
**文件位置**: `tests/e2e/pve-game.spec.ts`

---

## TC-144: 提示功能使用

**优先级**: P0
**类型**: E2E测试
**前置条件**:
- 应用已启动
- 进入游戏进行中

**测试步骤**:
1. 开始一局新游戏（PvE或PvP）
2. 落子第一步
3. 点击"提示"按钮
4. 验证棋盘上显示蓝色半透明提示标记
5. 验证显示推荐理由（如"进攻：活三"）
6. 等待2秒
7. 在提示位置落子
8. 验证提示标记自动消失
9. 再次点击"提示"
10. 验证显示新的提示位置

**期望结果**:
- 提示标记正确显示
- 推荐理由正确显示
- 落子后自动清除
- 可以多次使用

**测试数据**:
```typescript
游戏模式: 'pve' 或 'pvp'
```

**框架**: Playwright
**文件位置**: `tests/e2e/hint-feature.spec.ts`

---

## TC-145: 悔棋功能使用（PvP模式）

**优先级**: P0
**类型**: E2E测试
**前置条件**:
- 应用已启动
- 进入双人对战模式

**测试步骤**:
1. 开始双人对战
2. 黑棋落子(7,7)
3. 白棋落子(7,8)
4. 验证悔棋按钮显示"悔棋 (3)"
5. 白棋点击"悔棋"按钮
6. 验证棋盘回到黑棋落子后状态
7. 验证显示"白棋悔棋成功"
8. 验证白棋悔棋次数显示为2
9. 白棋重新落子(8,8)
10. 继续对局
11. 验证黑棋悔棋次数仍为3

**期望结果**:
- 悔棋功能正常
- 悔棋次数独立计数
- UI正确更新

**测试数据**:
```typescript
黑棋落子: (7,7)
白棋落子: (7,8)
悔棋后白棋落子: (8,8)
```

**框架**: Playwright
**文件位置**: `tests/e2e/undo-feature.spec.ts`

---

## TC-146: 游戏记录保存和查看

**优先级**: P0
**类型**: E2E测试
**前置条件**:
- 应用已启动
- LocalStorage已清空

**测试步骤**:
1. 完成一局完整游戏（任意模式）
2. 游戏结束后点击"返回主菜单"
3. 点击"对局记录"
4. 验证显示刚才的对局记录
5. 验证记录信息完整（日期、模式、结果、时长、手数）
6. 点击该记录
7. 验证进入记录详情页面
8. 验证显示完整棋谱
9. 点击"返回"返回记录列表

**期望结果**:
- 记录自动保存
- 记录信息完整
- 可以查看详情

**测试数据**:
```typescript
完成任意一局对局
```

**框架**: Playwright
**文件位置**: `tests/e2e/game-record.spec.ts`

---

## TC-147: 游戏回放播放

**优先级**: P0
**类型**: E2E测试
**前置条件**:
- 应用已启动
- 至少有一条游戏记录

**测试步骤**:
1. 进入对局记录页面
2. 点击一条记录进入详情
3. 点击"开始回放"按钮
4. 验证进入回放界面
5. 验证棋盘显示为初始状态
6. 点击"播放"按钮
7. 验证棋子按顺序自动落子
8. 验证每步间隔约1秒
9. 等待回放完成
10. 验证显示最终棋盘状态
11. 点击"暂停"
12. 验证回放暂停
13. 点击"上一步"/"下一步"
14. 验证可以手动控制步数

**期望结果**:
- 回放功能正常
- 自动播放流畅
- 可以手动控制

**测试数据**:
```typescript
使用已有的游戏记录
```

**框架**: Playwright
**文件位置**: `tests/e2e/game-replay.spec.ts`

---

## TC-148: 页面切换和响应式

**优先级**: P1
**类型**: E2E测试
**前置条件**:
- 应用已启动

**测试步骤**:
1. 打开应用首页
2. 验证页面标题正确
3. 点击"开始游戏"进入模式选择
4. 点击"返回"返回首页
5. 调整浏览器窗口大小为移动端（375px宽）
6. 验证布局适应移动端
7. 验证按钮纵向排列
8. 进入游戏页面
9. 验证棋盘自适应屏幕大小
10. 验证控制按钮纵向排列
11. 调整回桌面端（1920px宽）
12. 验证布局恢复桌面端

**期望结果**:
- 页面切换流畅
- 响应式布局正确
- 移动端体验良好

**测试数据**:
```typescript
视口尺寸: [375px, 1920px]
```

**框架**: Playwright
**文件位置**: `tests/e2e/responsive.spec.ts`

---

## 三、双人对战测试（10个）

## TC-149: PvP模式初始化

**优先级**: P0
**类型**: 集成测试
**前置条件**:
- 应用已启动
- 处于模式选择界面

**测试步骤**:
1. 调用gameStore.setGameMode('pvp')
2. 验证gameMode为'pvp'
3. 验证pvpSettings已初始化：
   - maxUndos: 3
   - blackUndos: 3
   - whiteUndos: 3
4. 验证currentPlayer已设置（black或white）
5. 验证gameStatus为'ready'
6. 验证棋盘为空（15x15，所有位置为0）

**期望结果**:
- PvP模式正确初始化
- 所有状态正确设置
- 悔棋次数正确初始化

**测试数据**:
```typescript
{
  gameMode: 'pvp',
  pvpSettings: {
    maxUndos: 3,
    blackUndos: 3,
    whiteUndos: 3
  },
  currentPlayer: 'black',
  gameStatus: 'ready'
}
```

**框架**: Vitest
**文件位置**: `src/store/__tests__/game-store-pvp.test.ts`

---

## TC-150: 两名玩家交替落子

**优先级**: P0
**类型**: 集成测试
**前置条件**:
- PvP游戏已初始化
- currentPlayer = 'black'

**测试步骤**:
1. 黑棋落子(7,7)
2. 验证棋盘[7][7]为'black'
3. 验证moveHistory长度为1
4. 验证currentPlayer切换为'white'
5. 白棋落子(7,8)
6. 验证棋盘[7][8]为'white'
7. 验证moveHistory长度为2
8. 验证currentPlayer切换为'black'
9. 尝试黑棋在已有棋子位置(7,7)落子
10. 验证落子失败
11. 验证currentPlayer仍为'black'
12. 验证moveHistory长度仍为2

**期望结果**:
- 玩家正确交替
- 落子正确记录
- 非法落子被拒绝

**测试数据**:
```typescript
黑棋: { x: 7, y: 7 }
白棋: { x: 7, y: 8 }
重复落子: { x: 7, y: 7 }
```

**框架**: Vitest
**文件位置**: `src/store/__tests__/game-store-pvp.test.ts`

---

## TC-151: 悔棋功能（每方独立计数3次）

**优先级**: P0
**类型**: 集成测试
**前置条件**:
- PvP游戏进行中
- 双方都已落子

**测试步骤**:
1. 设置初始状态：
   - moveHistory有4步（黑、白、黑、白）
   - blackUndos: 3, whiteUndos: 3
2. 当前玩家为黑棋
3. 黑棋点击悔棋
4. 验证撤销最后一步（白棋的棋）
5. 验证blackUndos减少为2
6. 验证whiteUndos仍为3
7. 验证moveHistory长度为3
8. 验证currentPlayer仍为'black'（不切换）
9. 白棋重新落子
10. 白棋点击悔棋
11. 验证撤销黑棋的棋
12. 验证whiteUndos减少为2
13. 黑棋连续使用3次悔棋
14. 验证blackUndos为0
15. 验证悔棋按钮禁用

**期望结果**:
- 悔棋次数独立计数
- 只撤销对手的棋
- 次数用尽后禁用

**测试数据**:
```typescript
初始悔棋次数: { black: 3, white: 3 }
黑棋悔棋3次后: { black: 0, white: 2 }
```

**框架**: Vitest
**文件位置**: `src/store/__tests__/game-store-pvp.test.ts`

---

## TC-152: 游戏结束判断（黑棋获胜）

**优先级**: P0
**类型**: 集成测试
**前置条件**:
- PvP游戏进行中
- 棋盘上有接近五连的棋型

**测试步骤**:
1. 设置棋盘状态：黑棋在(7,7)到(7,11)有四连
2. 黑棋落子(7,12)形成五连
3. 验证checkWin()返回true
4. 验证winner为'black'
5. 验证gameStatus变为'won'
6. 验证endRecording()被调用
7. 验证saveRecord()被调用
8. 验证游戏记录包含完整信息

**期望结果**:
- 正确判断胜负
- 正确记录获胜方
- 自动保存记录

**测试数据**:
```typescript
黑棋五连: (7,7), (7,8), (7,9), (7,10), (7,11)
```

**框架**: Vitest
**文件位置**: `src/game/__tests__/win-checker.test.ts`

---

## TC-153: 游戏结束判断（白棋获胜）

**优先级**: P0
**类型**: 集成测试
**前置条件**:
- PvP游戏进行中

**测试步骤**:
1. 设置棋盘状态：白棋在对角线有四连
2. 白棋落子形成五连
3. 验证checkWin()返回true
4. 验证winner为'white'
5. 验证gameStatus变为'won'
6. 验证显示"白棋获胜"界面

**期望结果**:
- 白棋获胜正确判断
- 界面正确显示

**测试数据**:
```typescript
白棋五连: 对角线五子
```

**框架**: Vitest
**文件位置**: `src/game/__tests__/win-checker.test.ts`

---

## TC-154: 和棋判断（棋盘已满）

**优先级**: P1
**类型**: 集成测试
**前置条件**:
- PvP游戏进行中
- 棋盘接近满

**测试步骤**:
1. 设置棋盘状态：224个位置已有棋子（只有1个空位）
2. 最后一个空位落子后不会形成五连
3. 在空位落子
4. 验证checkDraw()返回true
5. 验证gameStatus变为'draw'
6. 验证显示"平局"界面
7. 验证保存记录，result为'draw'

**期望结果**:
- 正确判断平局
- 界面正确显示
- 记录正确保存

**测试数据**:
```typescript
棋盘状态: 224个位置已占用
最后落子: 不形成五连
```

**框架**: Vitest
**文件位置**: `src/game/__tests__/win-checker.test.ts`

---

## TC-155: 游戏记录保存（PvP完整信息）

**优先级**: P0
**类型**: 集成测试
**前置条件**:
- PvP游戏刚结束

**测试步骤**:
1. 完成一局PvP游戏
2. 游戏结束时调用generateGameRecord()
3. 验证生成的记录包含：
   - id: UUID格式
   - date: 当前时间
   - mode: 'pvp'
   - result: 获胜方或'draw'
   - duration: 对局时长（秒）
   - moves: 所有落子记录
   - finalBoard: 最终棋盘状态
   - pvpStats: { blackUndos, whiteUndos, totalMoves }
4. 调用saveGameRecord()
5. 验证LocalStorage中有记录
6. 验证记录数量不超过50条

**期望结果**:
- 记录信息完整
- 正确保存到LocalStorage
- 符合50条限制

**测试数据**:
```typescript
对局时长: 120秒
手数: 45手
悔棋: { black: 1, white: 2 }
```

**框架**: Vitest
**文件位置**: `src/services/__tests__/storage-service.test.ts`

---

## TC-156: PvP模式切换（从PvE切换到PvP）

**优先级**: P0
**类型**: 集成测试
**前置条件**:
- 当前在PvE模式
- 游戏未开始

**测试步骤**:
1. 初始状态：gameMode='pve'
2. 调用setGameMode('pvp')
3. 验证gameMode更新为'pvp'
4. 验证pvpSettings初始化
5. 验证PvE相关状态清除（如AI思考状态）
6. 验证棋盘重置
7. 开始游戏
8. 验证是双人对战模式

**期望结果**:
- 模式切换成功
- 状态正确更新
- 无残留状态

**测试数据**:
```typescript
初始模式: 'pve'
目标模式: 'pvp'
```

**框架**: Vitest
**文件位置**: `src/store/__tests__/game-store-pvp.test.ts`

---

## TC-157: PvP悔棋边界条件（无历史记录）

**优先级**: P1
**类型**: 集成测试
**前置条件**:
- PvP游戏刚开始
- moveHistory为空

**测试步骤**:
1. 初始化PvP游戏
2. moveHistory为空数组
3. 调用canUndo()
4. 验证返回false
5. 尝试调用undoPvPMove()
6. 验证返回{ success: false, message: '无法悔棋' }
7. 验证悔棋按钮被禁用

**期望结果**:
- 无法悔棋
- 按钮正确禁用
- 返回正确错误信息

**测试数据**:
```typescript
moveHistory: []
blackUndos: 3
whiteUndos: 3
```

**框架**: Vitest
**文件位置**: `src/store/__tests__/game-store-pvp.test.ts`

---

## TC-158: PvP悔棋边界条件（次数用尽）

**优先级**: P1
**类型**: 集成测试
**前置条件**:
- PvP游戏进行中
- 一方悔棋次数已用完

**测试步骤**:
1. 设置状态：blackUndos=0, whiteUndos=2
2. 当前玩家为黑棋
3. 调用canUndo()
4. 验证返回false
5. 尝试调用undoPvPMove()
6. 验证返回{ success: false, message: '悔棋次数已用完' }
7. 验证悔棋按钮被禁用
8. 切换到白棋
9. 验证白棋可以悔棋（whiteUndos=2）

**期望结果**:
- 次数用尽时无法悔棋
- 对方仍可悔棋
- 按钮状态正确更新

**测试数据**:
```typescript
blackUndos: 0
whiteUndos: 2
currentPlayer: 'black'
```

**框架**: Vitest
**文件位置**: `src/store/__tests__/game-store-pvp.test.ts`

---

## 四、提示功能测试（8个）

## TC-159: 提示触发条件

**优先级**: P0
**类型**: 集成测试
**前置条件**:
- 游戏进行中
- hintSettings未达上限

**测试步骤**:
1. 设置gameStatus='playing'
2. 设置hintSettings: { maxHints: 5, usedHints: 2 }
3. 调用canRequestHint()
4. 验证返回true
5. 调用requestHint()
6. 验证hintPosition已设置
7. 验证showHint=true
8. 验证usedHints增加为3
9. 设置gameStatus='won'
10. 调用canRequestHint()
11. 验证返回false

**期望结果**:
- 游戏进行时可请求提示
- 游戏结束时不能请求
- 使用次数正确累加

**测试数据**:
```typescript
hintSettings: {
  maxHints: 5,
  usedHints: 2
}
```

**框架**: Vitest
**文件位置**: `src/game/__tests__/hint-system.test.ts`

---

## TC-160: AI推荐位置准确性（进攻）

**优先级**: P0
**类型**: 集成测试
**前置条件**:
- 棋盘上有进攻机会

**测试步骤**:
1. 设置棋盘状态：黑棋有活三（如(7,7), (7,8), (7,9)）
2. 黑棋请求提示
3. 验证AI推荐位置为(7,10)或(7,6)（形成活四）
4. 验证reason包含"进攻"和"活三"
5. 验证score分数合理（>80）
6. 验证推荐位置在棋盘范围内
7. 验证推荐位置为空位

**期望结果**:
- AI识别进攻机会
- 推荐最佳进攻位置
- 理由描述准确

**测试数据**:
```typescript
黑棋活三: (7,7), (7,8), (7,9)
推荐位置: (7,10) 或 (7,6)
```

**框架**: Vitest
**文件位置**: `src/game/__tests__/hint-system.test.ts`

---

## TC-161: AI推荐位置准确性（防守）

**优先级**: P0
**类型**: 集成测试
**前置条件**:
- 棋盘上有对手威胁

**测试步骤**:
1. 设置棋盘状态：白棋有活四（如(7,7), (7,8), (7,9), (7,10)）
2. 黑棋请求提示
3. 验证AI推荐位置为(7,11)或(7,6)（阻止白棋）
4. 验证reason包含"防守"
5. 验证score分数高（>90）
6. 验证推荐位置正确阻止对手

**期望结果**:
- AI识别防守需求
- 优先阻止对手获胜
- 理由描述准确

**测试数据**:
```typescript
白棋活四: (7,7), (7,8), (7,9), (7,10)
黑棋推荐: (7,11) 或 (7,6)
```

**框架**: Vitest
**文件位置**: `src/game/__tests__/hint-system.test.ts`

---

## TC-162: 提示标记显示

**优先级**: P0
**类型**: 组件测试
**前置条件**:
- hintPosition已设置
- showHint=true

**测试步骤**:
1. 设置hintPosition={x: 7, y: 7}
2. 设置showHint=true
3. 渲染棋盘组件
4. 查询提示标记元素
5. 验证标记存在
6. 验证标记位置正确（x: 7*CELL_SIZE, y: 7*CELL_SIZE）
7. 验证标记颜色为蓝色半透明
8. 验证标记有脉冲动画

**期望结果**:
- 提示标记正确渲染
- 位置准确
- 样式符合设计

**测试数据**:
```typescript
hintPosition: { x: 7, y: 7 }
showHint: true
颜色: 'rgba(59, 130, 246, 0.5)'
```

**框架**: RTL
**文件位置**: `src/components/Board/__tests__/HintMarker.test.tsx`

---

## TC-163: 提示清除

**优先级**: P0
**类型**: 集成测试
**前置条件**:
- 提示已显示
- 玩家准备落子

**测试步骤**:
1. 设置hintPosition={x: 7, y: 7}, showHint=true
2. 验证提示标记显示
3. 模拟玩家落子(7, 8)
4. 调用clearHint()
5. 验证hintPosition=null
6. 验证showHint=false
7. 验证提示标记消失

**期望结果**:
- 落子后自动清除提示
- 提示标记消失
- 状态正确重置

**测试数据**:
```typescript
落子位置: (7, 8)
清除后: hintPosition=null, showHint=false
```

**框架**: Vitest
**文件位置**: `src/store/__tests__/game-store-hint.test.ts`

---

## TC-164: 提示次数限制（每日3次）

**优先级**: P1
**类型**: 集成测试
**前置条件**:
- 提示功能有每日限制

**测试步骤**:
1. 设置hintSettings: { maxDailyHints: 3, usedDailyHints: 2 }
2. 当前日期为2026-03-24
3. 请求提示
4. 验证成功，usedDailyHints=3
5. 再次请求提示
6. 验证失败，返回"今日提示次数已用完"
7. 修改日期为2026-03-25
8. 验证usedDailyHints重置为0
9. 请求提示
10. 验证成功

**期望结果**:
- 每日限制生效
- 次数正确累加
- 跨日自动重置

**测试数据**:
```typescript
maxDailyHints: 3
日期1: 2026-03-24, used: 3
日期2: 2026-03-25, used: 0
```

**框架**: Vitest
**文件位置**: `src/store/__tests__/game-store-hint.test.ts`

---

## TC-165: 提示金币消耗（可选功能）

**优先级**: P2
**类型**: 集成测试
**前置条件**:
- 提示功能消耗金币
- 玩家有足够金币

**测试步骤**:
1. 设置玩家金币为100
2. 设置提示消耗为10金币
3. 请求提示
4. 验证金币减少为90
5. 验证提示正常显示
6. 设置金币为5
7. 请求提示
8. 验证失败，返回"金币不足"

**期望结果**:
- 正确扣除金币
- 金币不足时拒绝
- 余额管理正确

**测试数据**:
```typescript
初始金币: 100
提示消耗: 10
剩余金币: 90
```

**框架**: Vitest
**文件位置**: `src/store/__tests__/game-store-hint.test.ts`

---

## TC-166: 提示计算超时处理

**优先级**: P1
**类型**: 集成测试
**前置条件**:
- 提示计算可能耗时较长

**测试步骤**:
1. 设置AI计算超时为500ms
2. 模拟AI计算时间1000ms
3. 请求提示
4. 验证显示"计算中..."加载状态
5. 等待超时
6. 验证返回超时错误
7. 验证提示不显示
8. 验证不计入使用次数

**期望结果**:
- 超时正确处理
- 不影响游戏继续
- 错误提示友好

**测试数据**:
```typescript
超时设置: 500ms
实际计算: 1000ms
```

**框架**: Vitest
**文件位置**: `src/game/__tests__/hint-system.test.ts`

---

## 五、集成测试（12个）

## TC-167: PvP完整流程（从开始到结束）

**优先级**: P0
**类型**: 集成测试
**前置条件**:
- 应用已启动
- LocalStorage已清空

**测试步骤**:
1. 导航到模式选择页
2. 选择"双人对战"
3. 选择"执黑先行"
4. 模拟完整的对局过程（10-15手）
5. 形成胜负
6. 验证游戏结束流程
7. 验证记录保存
8. 验证UI状态更新
9. 点击"再来一局"
10. 验证游戏重置

**期望结果**:
- 完整流程无错误
- 所有状态正确更新
- 记录正确保存

**测试数据**:
```typescript
对局手数: 12手
结果: 黑棋获胜
```

**框架**: Vitest
**文件位置**: `src/integration/__tests__/pvp-flow.test.ts`

---

## TC-168: PvE完整流程（从开始到结束）

**优先级**: P0
**类型**: 集成测试
**前置条件**:
- 应用已启动
- AI可用

**测试步骤**:
1. 导航到模式选择页
2. 选择"人机对战"
3. 选择"简单"难度
4. 选择"执黑先行"
5. 模拟玩家落子
6. 验证AI自动响应
7. 继续对局直到结束
8. 验证AI落子合法
9. 验证胜负判断
10. 验证记录保存

**期望结果**:
- AI正确响应
- 流程完整无错误
- AI落子合理

**测试数据**:
```typescript
难度: 'easy'
先手: 'black'
```

**框架**: Vitest
**文件位置**: `src/integration/__tests__/pve-flow.test.ts`

---

## TC-169: 模式切换（PvE ↔ PvP）

**优先级**: P0
**类型**: 集成测试
**前置条件**:
- 应用已启动

**测试步骤**:
1. 开始PvE游戏
2. 落子2手
3. 返回主菜单
4. 切换到PvP模式
5. 开始PvP游戏
6. 验证棋盘重置
7. 验证悔棋逻辑变化（PvE撤2步，PvP撤1步）
8. 落子2手
9. 返回主菜单
10. 切换回PvE模式
11. 验证状态正确切换

**期望结果**:
- 模式切换无冲突
- 状态正确重置
- 逻辑正确应用

**测试数据**:
```typescript
模式切换: pve → pvp → pve
```

**框架**: Vitest
**文件位置**: `src/integration/__tests__/mode-switch.test.ts`

---

## TC-170: 游戏记录查看（列表和详情）

**优先级**: P0
**类型**: 集成测试
**前置条件**:
- LocalStorage有5条游戏记录

**测试步骤**:
1. 导航到对局记录页面
2. 调用getGameRecords()
3. 验证返回5条记录
4. 验证记录按日期倒序排列
5. 点击第1条记录
6. 验证进入详情页
7. 验证显示完整信息
8. 验证显示棋谱列表
9. 点击"返回"
10. 验证返回列表页

**期望结果**:
- 记录列表正确显示
- 详情信息完整
- 导航流畅

**测试数据**:
```typescript
记录数量: 5条
排序: 日期倒序
```

**框架**: Vitest
**文件位置**: `src/integration/__tests__/record-view.test.ts`

---

## TC-171: 游戏回放播放（完整流程）

**优先级**: P0
**类型**: 集成测试
**前置条件**:
- 有一条20手的游戏记录

**测试步骤**:
1. 进入记录详情页
2. 点击"开始回放"
3. 验证进入回放界面
4. 验证currentMoveIndex=0
5. 点击"播放"
6. 验证isPlaying=true
7. 验证棋子按顺序出现
8. 验证每步间隔1秒
9. 等待播放到第10步
10. 点击"暂停"
11. 验证isPlaying=false
12. 点击"下一步"
13. 验证currentMoveIndex=11
14. 点击"上一步"
15. 验证currentMoveIndex=10
16. 点击"跳转到开始"
17. 验证currentMoveIndex=0
18. 点击"跳转到结束"
19. 验证currentMoveIndex=19

**期望结果**:
- 回放功能完整
- 控制功能正常
- 棋盘正确渲染

**测试数据**:
```typescript
记录手数: 20手
播放速度: 1000ms/步
```

**框架**: Vitest
**文件位置**: `src/integration/__tests__/replay-flow.test.ts`

---

## TC-172: 悔棋流程（PvE模式）

**优先级**: P0
**类型**: 集成测试
**前置条件**:
- PvE游戏进行中
- 玩家和AI各落子2手

**测试步骤**:
1. 设置moveHistory有4步（玩家、AI、玩家、AI）
2. 设置undoCount=3
3. 玩家点击"悔棋"
4. 验证撤销2步（玩家和AI各一步）
5. 验证undoCount减少为2
6. 验证moveHistory长度为2
7. 验证当前玩家仍为玩家
8. 棋盘状态回到第2手后
9. 再次悔棋
10. 验证回到初始状态
11. 验证undoCount=1
12. 悔棋3次后
13. 验证undoCount=0
14. 验证悔棋按钮禁用

**期望结果**:
- PvE悔棋撤2步
- 次数正确扣除
- 按钮状态正确

**测试数据**:
```typescript
初始手数: 4手（玩家、AI各2）
悔棋后: 2手
再次悔棋: 0手
```

**框架**: Vitest
**文件位置**: `src/integration/__tests__/undo-pve.test.ts`

---

## TC-173: 边界情况：棋盘边界落子

**优先级**: P1
**类型**: 集成测试
**前置条件**:
- 游戏进行中

**测试步骤**:
1. 尝试在(0,0)落子
2. 验证成功
3. 尝试在(0,14)落子
4. 验证成功
5. 尝试在(14,0)落子
6. 验证成功
7. 尝试在(14,14)落子
8. 验证成功
9. 尝试在(-1,0)落子
10. 验证失败，返回"超出棋盘范围"
11. 尝试在(0,15)落子
12. 验证失败

**期望结果**:
- 边界位置可落子
- 超出边界被拒绝

**测试数据**:
```typescript
有效边界: (0,0), (0,14), (14,0), (14,14)
无效位置: (-1,0), (0,15), (15,15)
```

**框架**: Vitest
**文件位置**: `src/integration/__tests__/boundary-cases.test.ts`

---

## TC-174: 边界情况：快速连续落子

**优先级**: P1
**类型**: 集成测试
**前置条件**:
- PvP游戏进行中
- 当前玩家为黑棋

**测试步骤**:
1. 黑棋落子(7,7)
2. 立即尝试黑棋再次落子(7,8)
3. 验证第二次落子被拒绝
4. 验证显示"不是您的回合"
5. 验证currentPlayer未切换
6. 白棋正常落子(7,8)
7. 验证currentPlayer切换为黑棋

**期望结果**:
- 防止连续落子
- 提示信息友好
- 回合正确切换

**测试数据**:
```typescript
黑棋: (7,7)
黑棋尝试: (7,8) - 被拒绝
白棋: (7,8)
```

**框架**: Vitest
**文件位置**: `src/integration/__tests__/boundary-cases.test.ts`

---

## TC-175: 边界情况：网络断开恢复

**优先级**: P2
**类型**: 集成测试
**前置条件**:
- 游戏进行中
- 模拟网络断开

**测试步骤**:
1. 游戏进行中（3手）
2. 模拟网络断开（window.navigator.offline=true）
3. 尝试落子
4. 验证显示"网络已断开，请检查连接"
5. 验证游戏暂停
6. 模拟网络恢复（window.navigator.offline=false）
7. 验证显示"网络已恢复"
8. 验证可以继续落子
9. 验证棋盘状态未丢失

**期望结果**:
- 网络断开时保护状态
- 恢复后可继续
- 提示信息友好

**测试数据**:
```typescript
网络状态: online → offline → online
```

**框架**: Vitest
**文件位置**: `src/integration/__tests__/boundary-cases.test.ts`

---

## TC-176: 性能测试：大棋盘性能

**优先级**: P1
**类型**: 性能测试
**前置条件**:
- 棋盘上有200个棋子

**测试步骤**:
1. 设置棋盘状态：200个棋子
2. 测量落子响应时间
3. 验证<50ms
4. 测量UI更新时间
5. 验证<100ms
6. 测量内存占用
7. 验证<50MB
8. 测量提示计算时间
9. 验证<500ms
10. 测量悔棋响应时间
11. 验证<100ms

**期望结果**:
- 所有操作在性能要求内
- 无明显卡顿
- 内存占用合理

**测试数据**:
```typescript
棋子数量: 200个
性能要求:
- 落子: <50ms
- UI更新: <100ms
- 提示: <500ms
- 悔棋: <100ms
- 内存: <50MB
```

**框架**: Vitest
**文件位置**: `src/integration/__tests__/performance.test.ts`

---

## TC-177: 并发测试：多个状态更新

**优先级**: P1
**类型**: 集成测试
**前置条件**:
- 游戏进行中

**测试步骤**:
1. 同时触发多个操作：
   - 计时器更新（每秒）
   - 玩家落子
   - 请求提示
2. 验证所有操作正确执行
3. 验证无竞态条件
4. 验证状态一致性
5. 验证UI无闪烁

**期望结果**:
- 并发操作正确处理
- 状态保持一致
- UI渲染正常

**测试数据**:
```typescript
并发操作: 计时器 + 落子 + 提示
```

**框架**: Vitest
**文件位置**: `src/integration/__tests__/concurrency.test.ts`

---

## TC-178: 持久化测试：LocalStorage恢复

**优先级**: P0
**类型**: 集成测试
**前置条件**:
- LocalStorage有游戏记录

**测试步骤**:
1. 完成一局游戏
2. 验证记录保存到LocalStorage
3. 刷新页面（模拟重启应用）
4. 导航到对局记录页
5. 验证记录仍存在
6. 验证记录信息完整
7. 点击记录查看详情
8. 验证可以正常回放
9. 删除一条记录
10. 验证LocalStorage同步删除

**期望结果**:
- 记录正确持久化
- 刷新后数据不丢失
- 删除操作同步

**测试数据**:
```typescript
记录数量: 3条
操作: 保存 → 刷新 → 查看 → 删除
```

**框架**: Vitest
**文件位置**: `src/integration/__tests__/persistence.test.ts`

---

## 六、测试验收标准

### 6.1 测试数量要求

- UI组件测试: 15个 ✅
  - Timer: 5个 ✅
  - StatusIndicator: 5个 ✅
  - GameControls: 5个 ✅

- E2E测试: 9个 ✅
  - PvP对局: 2个 ✅
  - PvE对局: 2个 ✅
  - 提示功能: 1个 ✅
  - 悔棋功能: 1个 ✅
  - 游戏记录: 1个 ✅
  - 游戏回放: 1个 ✅
  - 响应式: 1个 ✅

- 双人对战测试: 10个 ✅

- 提示功能测试: 8个 ✅

- 集成测试: 12个 ✅

**总计**: 54个测试用例

### 6.2 测试覆盖率要求

- 代码覆盖率: >90%
- 功能覆盖率: >95%
- 核心UI组件（Timer, StatusIndicator, GameControls）: 100%
- 关键逻辑（PvP对战、悔棋、提示、记录）: >95%

### 6.3 测试通过要求

- 所有54个新测试必须通过 ✅
- Week 1-3的124个测试必须保持通过 ✅
- 总测试数量: 178个（124 + 54）
- 无skipped或pending测试
- 无flaky测试（不稳定测试）

### 6.4 性能要求

- 测试执行时间: <5分钟（全部测试）
- 单个测试: <10秒（E2E测试除外）
- E2E测试: <30秒/个
- 内存占用: <100MB（测试运行时）

### 6.5 代码质量要求

- ESLint: 0错误
- TypeScript: 0类型错误
- 测试代码遵循最佳实践
- 测试用例有清晰的描述
- 测试数据合理且有意义

---

## 七、测试执行计划

### 7.1 测试执行顺序

1. **第一阶段**: UI组件测试（15个）
   - 执行时间: ~30秒
   - 并发执行: 是
   - 优先级: P0

2. **第二阶段**: 单元测试（双人对战、提示功能）（18个）
   - 执行时间: ~1分钟
   - 并发执行: 是
   - 优先级: P0, P1

3. **第三阶段**: 集成测试（12个）
   - 执行时间: ~2分钟
   - 并发执行: 部分并发
   - 优先级: P0, P1

4. **第四阶段**: E2E测试（9个）
   - 执行时间: ~3分钟
   - 并发执行: 否（顺序执行）
   - 优先级: P0, P1

### 7.2 测试环境

```bash
# 开发环境
npm run test              # 运行所有测试
npm run test:ui          # 运行UI组件测试
npm run test:unit        # 运行单元测试
npm run test:integration # 运行集成测试
npm run test:e2e         # 运行E2E测试

# 覆盖率报告
npm run test:coverage    # 生成覆盖率报告

# CI环境
npm run test:ci          # CI环境运行所有测试
```

### 7.3 测试失败处理

1. 单个测试失败:
   - 查看错误日志
   - 查看截图（E2E测试）
   - 修复代码或测试
   - 重新运行测试

2. 批量测试失败:
   - 检查是否有共同依赖
   - 检查环境配置
   - 检查数据准备
   - 逐个调试

3. Flaky测试（不稳定）:
   - 增加等待时间
   - 优化异步处理
   - 增加重试机制
   - 修复竞态条件

---

## 八、测试报告模板

### 8.1 测试执行摘要

```
日期: 2026-03-24
测试工程师: QA
测试范围: Week 4 - 双人对战 + UI优化 + 补充测试

测试结果:
- 总测试数: 178个（124 + 54）
- 通过: 178个 ✅
- 失败: 0个
- 跳过: 0个

测试覆盖率:
- 代码覆盖率: XX.XX%
- 功能覆盖率: XX.XX%
- 核心组件覆盖率: 100%

执行时间:
- UI组件测试: XX秒
- 单元测试: XX秒
- 集成测试: XX秒
- E2E测试: XX秒
- 总计: XX分钟

问题统计:
- P0问题: 0个
- P1问题: 0个
- P2问题: 0个
```

### 8.2 覆盖率详情

```
文件覆盖率:
- src/components/Timer: 100%
- src/components/StatusIndicator: 100%
- src/components/GameControls: 100%
- src/store/game-store: XX.XX%
- src/game/hint: XX.XX%
- src/services/storage: XX.XX%

分支覆盖率:
- PvP逻辑: XX.XX%
- 悔棋逻辑: XX.XX%
- 提示逻辑: XX.XX%
- 记录逻辑: XX.XX%
```

---

## 九、附录

### 9.1 测试文件组织结构

```
gobang-game/
├── src/
│   ├── components/
│   │   ├── Timer/
│   │   │   └── __tests__/
│   │   │       └── Timer.test.tsx
│   │   ├── StatusIndicator/
│   │   │   └── __tests__/
│   │   │       └── StatusIndicator.test.tsx
│   │   ├── GameControls/
│   │   │   └── __tests__/
│   │   │       └── GameControls.test.tsx
│   │   └── Board/
│   │       └── __tests__/
│   │           └── HintMarker.test.tsx
│   ├── store/
│   │   └── __tests__/
│   │       ├── game-store-pvp.test.ts
│   │       ├── game-store-hint.test.ts
│   │       └── game-store-undo.test.ts
│   ├── game/
│   │   └── __tests__/
│   │       ├── hint-system.test.ts
│   │       └── win-checker.test.ts
│   ├── services/
│   │   └── __tests__/
│   │       └── storage-service.test.ts
│   └── integration/
│       └── __tests__/
│           ├── pvp-flow.test.ts
│           ├── pve-flow.test.ts
│           ├── mode-switch.test.ts
│           ├── record-view.test.ts
│           ├── replay-flow.test.ts
│           ├── undo-pve.test.ts
│           ├── boundary-cases.test.ts
│           ├── performance.test.ts
│           ├── concurrency.test.ts
│           └── persistence.test.ts
├── tests/
│   └── e2e/
│       ├── pvp-game.spec.ts
│       ├── pve-game.spec.ts
│       ├── hint-feature.spec.ts
│       ├── undo-feature.spec.ts
│       ├── game-record.spec.ts
│       ├── game-replay.spec.ts
│       └── responsive.spec.ts
└── vitest.config.ts
```

### 9.2 测试编号对照表

| 编号范围 | 测试类型 | 数量 |
|---------|---------|------|
| TC-001 ~ TC-013 | Week 1测试 | 13 |
| TC-014 ~ TC-083 | Week 2测试 | 70 |
| TC-084 ~ TC-124 | Week 3测试 | 41 |
| TC-125 ~ TC-139 | UI组件测试 | 15 |
| TC-140 ~ TC-148 | E2E测试 | 9 |
| TC-149 ~ TC-158 | 双人对战测试 | 10 |
| TC-159 ~ TC-166 | 提示功能测试 | 8 |
| TC-167 ~ TC-178 | 集成测试 | 12 |
| **总计** | | **178** |

### 9.3 测试优先级说明

- **P0**: 核心功能，必须实现和测试
- **P1**: 重要功能，应该实现和测试
- **P2**: 次要功能，可以实现和测试

---

**文档版本**: v1.0
**创建日期**: 2026-03-24
**负责人**: 测试工程师 (QA)
**最后更新**: 2026-03-24

**审核状态**: ✅ 待开发团队审核
