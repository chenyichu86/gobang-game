# Week 4 - PL文档（产品逻辑规范）

## 文档信息
- **文档版本**: v1.0
- **创建日期**: 2026-03-24
- **负责人**: 产品经理
- **阶段**: Phase 1 - MVP基础版本
- **周次**: Week 4
- **关联文档**: week-4-WO.md

---

## 一、产品逻辑概述

### 1.1 本周目标
实现完整的双人对战功能，优化游戏UI体验，提供智能提示功能，完善悔棋系统，建立游戏记录和回放基础，补全UI和E2E测试。

### 1.2 核心原则
- **社交体验**: 双人对战要流畅、公平、有趣
- **清晰反馈**: UI组件要提供清晰的状态指示和操作反馈
- **智能辅助**: 提示功能要有帮助但不能破坏游戏平衡
- **公平悔棋**: PvP模式下悔棋要公平，每方独立计数
- **完整记录**: 游戏记录要完整保存，支持回放
- **测试完善**: 补全UI组件和E2E测试，确保质量

### 1.3 本周不包含的逻辑
- 在线对战功能（Phase 2）
- 困难/大师AI（Week 5-7）
- 完整的棋谱回放（Week 6）
- 高级动画特效（Week 7）
- 成就系统（Week 8）

---

## 二、双人对战逻辑

### 2.1 对战模式选择

#### 2.1.1 入口逻辑

**用户操作流程**:
```
主菜单
  ↓
点击"开始游戏"
  ↓
显示模式选择界面：
  ┌─────────────────────┐
  │   选择游戏模式       │
  ├─────────────────────┤
  │ [ 🤖 人机对战 ]      │
  │ [ 👥 双人对战 ]      │
  └─────────────────────┘
  ↓
点击"双人对战"
  ↓
显示难度选择（跳过，直接进入）
  ↓
显示先后手选择界面：
  ┌─────────────────────┐
  │   选择先后手         │
  ├─────────────────────┤
  │ [ ⚫ 执黑先行 ]      │
  │ [ ⚪ 执白后行 ]      │
  │ [ 🎲 随机决定 ]      │
  └─────────────────────┘
  ↓
进入游戏
```

**配置逻辑**:
```typescript
function startPvPMode(firstPlayer: 'black' | 'white' | 'random') {
  // 设置游戏模式
  gameStore.setGameMode('pvp');

  // 确定先手
  if (firstPlayer === 'random') {
    firstPlayer = Math.random() < 0.5 ? 'black' : 'white';
  }

  // 初始化游戏
  gameStore.initGame({
    mode: 'pvp',
    firstPlayer: firstPlayer,
    pvpSettings: {
      maxUndos: 3,
      blackUndos: 3,
      whiteUndos: 3,
    }
  });

  // 开始记录游戏
  gameStore.startRecording();

  // 导航到游戏页面
  navigate('/game');
}
```

#### 2.1.2 游戏流程逻辑

**双人对战流程**:
```
游戏开始
  ↓
设置当前玩家 = 先手
  ↓
显示"轮到黑棋/白棋落子"
  ↓
等待玩家落子
  ↓
玩家点击棋盘
  ↓
验证落子合法性
  ├─ 非法 → 显示错误提示，等待重新落子
  └─ 合法 → 继续
  ↓
执行落子
  ↓
记录落子（moveHistory）
  ↓
检查胜负
  ├─ 有胜负 → 显示胜利界面，保存记录
  ├─ 平局 → 显示平局界面，保存记录
  └─ 继续 → 切换玩家，继续等待落子
```

**切换玩家逻辑**:
```typescript
function switchPlayer() {
  const currentPlayer = gameStore.currentPlayer;

  // 切换玩家
  gameStore.setCurrentPlayer(
    currentPlayer === 'black' ? 'white' : 'black'
  );

  // 更新UI提示
  uiStore.showMessage(
    `轮到${currentPlayer === 'black' ? '白棋' : '黑棋'}落子`
  );
}
```

### 2.2 PvP悔棋逻辑

#### 2.2.1 悔棋触发条件

**时机**: 当前玩家可以随时点击"悔棋"按钮

**限制条件**:
```typescript
function canUndoPvP(): boolean {
  const currentPlayer = gameStore.currentPlayer;
  const settings = gameStore.pvpSettings;

  // 检查剩余次数
  const remainingUndos =
    currentPlayer === 'black'
      ? settings.blackUndos
      : settings.whiteUndos;

  // 检查是否有历史记录
  const hasHistory = gameStore.moveHistory.length > 0;

  return remainingUndos > 0 && hasHistory;
}
```

#### 2.2.2 悔棋执行逻辑

**简化版逻辑**（Week 4实现）:
```
当前玩家点击"悔棋"
  ↓
检查canUndoPvP()
  ├─ 不可悔棋 → 显示提示："已无悔棋次数"
  └─ 可悔棋 → 继续
  ↓
执行悔棋
  ├─ 从moveHistory移除最后一步
  ├─ 从棋盘移除最后落子
  ├─ 扣除当前玩家悔棋次数
  └─ 切换回上一个玩家
  ↓
显示提示："黑棋/白棋悔棋，轮到白棋/黑棋"
  ↓
更新UI（棋盘、悔棋按钮）
```

**完整版逻辑**（Phase 2实现）:
- 添加对手确认机制
- 提供悔棋历史记录
- 支持连续悔棋

**悔棋计数规则**:
```typescript
function undoPvPMove() {
  const currentPlayer = gameStore.currentPlayer;
  const lastMove = gameStore.moveHistory[gameStore.moveHistory.length - 1];

  // 验证：只能撤销对方的棋子
  if (lastMove.player === currentPlayer) {
    return {
      success: false,
      message: '不能撤销自己的棋子'
    };
  }

  // 执行撤销
  gameStore.removePiece(lastMove.position);
  gameStore.moveHistory.pop();

  // 扣除当前玩家的悔棋次数
  if (currentPlayer === 'black') {
    gameStore.pvpSettings.blackUndos--;
  } else {
    gameStore.pvpSettings.whiteUndos--;
  }

  // 切换回上一个玩家（不切换，保持当前玩家）
  // 实际上currentPlayer不变，因为撤销的是对手的棋

  return {
    success: true,
    message: `${currentPlayer === 'black' ? '黑棋' : '白棋'}请求悔棋`
  };
}
```

**重要逻辑说明**:
- PvP悔棋只撤销对手的最后一步
- 不像PvE模式撤销两步（玩家+AI）
- 悔棋后仍然是当前玩家的回合（对手重新落子）

#### 2.2.3 悔棋UI表现

**按钮状态**:
```typescript
// 悔棋按钮文本
function getUndoButtonText(): string {
  const currentPlayer = gameStore.currentPlayer;
  const settings = gameStore.pvpSettings;
  const remaining =
    currentPlayer === 'black'
      ? settings.blackUndos
      : settings.whiteUndos;

  return `悔棋 (${remaining})`;
}

// 按钮禁用状态
const isUndoDisabled = !canUndoPvP() || gameStore.gameStatus !== 'playing';
```

**视觉反馈**:
- 悔棋时显示动画（棋子消失）
- 显示Toast提示："黑棋悔棋成功"
- 悔棋次数为0时，按钮置灰

### 2.3 游戏结束逻辑

#### 2.3.1 胜负判定

```typescript
function handleGameOver(result: 'black' | 'white' | 'draw') {
  // 1. 设置游戏状态
  gameStore.setGameStatus(result === 'draw' ? 'draw' : 'won');
  gameStore.setWinner(result);

  // 2. 结束记录
  gameStore.endRecording(result);

  // 3. 保存记录
  gameStore.saveRecord();

  // 4. 显示结果界面
  showModal({
    title: result === 'draw' ? '平局' : `${result === 'black' ? '黑棋' : '白棋'}获胜`,
    actions: ['再来一局', '返回主菜单', '查看对局记录']
  });

  // 5. 播放音效（如果配置）
  if (settings.soundEnabled) {
    audioService.play(result === 'draw' ? 'draw' : 'win');
  }
}
```

#### 2.3.2 数据统计

```typescript
// 游戏记录数据结构
interface GameRecord {
  id: string;
  date: Date;
  mode: 'pve' | 'pvp';
  result: 'black' | 'white' | 'draw';
  duration: number;
  moves: Move[];
  finalBoard: Board;
  pvpStats?: {
    blackUndos: number;
    whiteUndos: number;
    totalMoves: number;
  };
}

// 生成记录
function generateGameRecord(): GameRecord {
  return {
    id: generateUUID(),
    date: new Date(),
    mode: 'pvp',
    result: gameStore.winner || 'draw',
    duration: gameStore.timerSeconds,
    moves: [...gameStore.moveHistory],
    finalBoard: gameStore.board.clone(),
    pvpStats: {
      blackUndos: 3 - gameStore.pvpSettings.blackUndos,
      whiteUndos: 3 - gameStore.pvpSettings.whiteUndos,
      totalMoves: gameStore.moveHistory.length,
    },
  };
}
```

---

## 三、UI组件逻辑

### 3.1 Timer组件逻辑

#### 3.1.1 计时逻辑

```typescript
// 使用useEffect实现计时
export function Timer({ isRunning, onTimeUpdate }: TimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSeconds(prev => {
        const newSeconds = prev + 1;
        onTimeUpdate?.(newSeconds);
        return newSeconds;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onTimeUpdate]);

  // 格式化时间
  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="timer">
      <span className="timer-display">{formatTime(seconds)}</span>
    </div>
  );
}
```

#### 3.1.2 状态控制

```typescript
// 从gameStore获取状态
function TimerContainer() {
  const isRunning = useGameStore(state =>
    state.gameStatus === 'playing'
  );

  return (
    <Timer
      isRunning={isRunning}
      onTimeUpdate={(seconds) => {
        useGameStore.getState().setTimerSeconds(seconds);
      }}
    />
  );
}
```

#### 3.1.3 重置逻辑

```typescript
// 游戏重新开始时重置计时器
function resetTimer() {
  setSeconds(0);
  onTimeUpdate?.(0);
}
```

### 3.2 StatusIndicator组件逻辑

#### 3.2.1 状态显示逻辑

```typescript
export function StatusIndicator({
  gameStatus,
  currentPlayer,
  winner
}: StatusIndicatorProps) {
  const getStatusText = (): string => {
    switch (gameStatus) {
      case 'playing':
        return `轮到${currentPlayer === 'black' ? '黑棋' : '白棋'}落子`;
      case 'paused':
        return '游戏已暂停';
      case 'won':
        return winner === 'black' ? '黑棋获胜' : '白棋获胜';
      case 'draw':
        return '平局';
      default:
        return '';
    }
  };

  const getStatusColor = (): string => {
    switch (gameStatus) {
      case 'playing':
        return currentPlayer === 'black' ? 'text-black' : 'text-gray-600';
      case 'paused':
        return 'text-yellow-600';
      case 'won':
        return 'text-green-600';
      case 'draw':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (): string => {
    switch (gameStatus) {
      case 'playing':
        return currentPlayer === 'black' ? '⚫' : '⚪';
      case 'paused':
        return '⏸️';
      case 'won':
        return '🏆';
      case 'draw':
        return '🤝';
      default:
        return '';
    }
  };

  return (
    <div className={`status-indicator ${getStatusColor()}`}>
      <span className="status-icon">{getStatusIcon()}</span>
      <span className="status-text">{getStatusText()}</span>
    </div>
  );
}
```

#### 3.2.2 动画效果

```typescript
// 使用CSS动画
const statusVariants = {
  playing: { animation: 'pulse 2s infinite' },
  paused: { animation: 'none' },
  won: { animation: 'bounce 1s' },
  draw: { animation: 'shake 0.5s' },
};

// 状态变化动画
function StatusIndicator(props) {
  return (
    <motion.div
      className="status-indicator"
      variants={statusVariants}
      animate={props.gameStatus}
      transition={{ duration: 0.3 }}
    >
      {/* 内容 */}
    </motion.div>
  );
}
```

### 3.3 GameControls组件逻辑

#### 3.3.1 按钮状态逻辑

```typescript
export function GameControls({
  gameStatus,
  gameMode,
  canUndo,
  undoCount,
  onRestart,
  onUndo,
  onPause,
  onResume,
  onMainMenu
}: GameControlsProps) {
  // 按钮可用性判断
  const isUndoDisabled = !canUndo || gameStatus !== 'playing';
  const isPauseDisabled = gameStatus !== 'playing';
  const isResumeDisabled = gameStatus !== 'paused';
  const isRestartDisabled = false; // 始终可以重新开始

  // 悔棋按钮文本
  const undoButtonText = `悔棋 (${undoCount})`;

  return (
    <div className="game-controls">
      {/* 重新开始按钮 */}
      <Button
        onClick={onRestart}
        disabled={isRestartDisabled}
        variant="secondary"
      >
        重新开始
      </Button>

      {/* 悔棋按钮 */}
      <Button
        onClick={onUndo}
        disabled={isUndoDisabled}
        variant="outline"
      >
        {undoButtonText}
      </Button>

      {/* 暂停/继续按钮 */}
      {gameStatus === 'playing' && (
        <Button
          onClick={onPause}
          disabled={isPauseDisabled}
          variant="outline"
        >
          暂停
        </Button>
      )}

      {gameStatus === 'paused' && (
        <Button
          onClick={onResume}
          disabled={isResumeDisabled}
          variant="primary"
        >
          继续
        </Button>
      )}

      {/* 返回主菜单按钮 */}
      <Button
        onClick={onMainMenu}
        variant="ghost"
      >
        返回主菜单
      </Button>
    </div>
  );
}
```

#### 3.3.2 布局逻辑

```css
/* 响应式布局 */
.game-controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

/* 移动端 */
@media (max-width: 768px) {
  .game-controls {
    flex-direction: column;
  }

  .game-controls button {
    width: 100%;
  }
}
```

#### 3.3.3 按钮交互逻辑

```typescript
// 重新开始确认
function handleRestart() {
  if (gameStore.moveHistory.length > 0) {
    // 显示确认对话框
    showConfirm({
      title: '重新开始',
      message: '确定要重新开始游戏吗？当前进度将丢失。',
      onConfirm: () => {
        gameStore.restartGame();
      }
    });
  } else {
    gameStore.restartGame();
  }
}

// 返回主菜单确认
function handleMainMenu() {
  if (gameStore.gameStatus === 'playing') {
    showConfirm({
      title: '返回主菜单',
      message: '游戏正在进行中，确定要退出吗？',
      onConfirm: () => {
        navigate('/');
      }
    });
  } else {
    navigate('/');
  }
}
```

---

## 四、提示功能逻辑

### 4.1 提示触发逻辑

#### 4.1.1 用户操作

```typescript
// 提示按钮（在GameControls中）
<Button
  onClick={handleHint}
  disabled={gameStore.gameStatus !== 'playing'}
  variant="outline"
>
  💡 提示
</Button>

// 提示处理
async function handleHint() {
  // 检查是否可以请求提示
  if (gameStore.gameStatus !== 'playing') {
    return;
  }

  // 显示加载状态
  uiStore.setHintLoading(true);

  // 请求提示（使用MediumAI计算）
  await gameStore.requestHint();

  // 隐藏加载状态
  uiStore.setHintLoading(false);
}
```

#### 4.1.2 提示计算逻辑

```typescript
async function requestHint() {
  const board = gameStore.board;
  const player = gameStore.currentPlayer;

  // 使用MediumAI计算最佳位置
  const ai = new MediumAI();
  const position = ai.calculateMove(board, player);

  // 评估该位置
  const score = ai.evaluatePosition(board, position, player);
  const reason = generateHintReason(score, board, position, player);

  // 设置提示
  gameStore.setHintPosition(position);
  gameStore.setShowHint(true);
  gameStore.setHintReason(reason);
}

// 生成提示理由
function generateHintReason(
  score: number,
  board: Board,
  position: Position,
  player: Player
): string {
  // 分析该位置的棋型
  const patterns = analyzePatterns(board, position, player);

  if (patterns.hasFive) {
    return '进攻：连五（必胜）';
  } else if (patterns.hasLiveFour) {
    return '进攻：活四（即将获胜）';
  } else if (patterns.hasDeadFour) {
    return '进攻：冲四';
  } else if (patterns.hasLiveThree) {
    return '进攻：活三';
  } else if (patterns.blocksOpponent) {
    return '防守：阻止对方';
  } else {
    return '建议：最佳位置';
  }
}
```

### 4.2 提示显示逻辑

#### 4.2.1 视觉表现

```typescript
// 在PiecesLayer中渲染提示标记
function PiecesLayer({ hintPosition, showHint }) {
  return (
    <Layer>
      {/* 棋子 */}
      {pieces.map(piece => (
        <Piece key={piece.id} {...piece} />
      ))}

      {/* 提示标记 */}
      {showHint && hintPosition && (
        <HintMarker
          x={hintPosition.x * CELL_SIZE}
          y={hintPosition.y * CELL_SIZE}
          color="rgba(59, 130, 246, 0.5)" // 蓝色半透明
          reason={hintReason}
        />
      )}
    </Layer>
  );
}

// 提示标记组件
function HintMarker({ x, y, color, reason }) {
  return (
    <Group x={x} y={y}>
      {/* 半透明圆圈 */}
      <Circle
        radius={CELL_SIZE / 2 - 5}
        fill={color}
        opacity={0.5}
      />

      {/* 脉冲动画 */}
      <Circle
        radius={CELL_SIZE / 2 - 5}
        stroke={color}
        strokeWidth={2}
        opacity={0.8}
      >
        <Tween
          to={{
            radius: CELL_SIZE / 2,
            opacity: 0,
          }}
          duration={1000}
          repeat={Infinity}
          easing={Tween.Easing.Linear.None}
        />
      </Circle>

      {/* 提示文本 */}
      <Text
        text={reason}
        x={CELL_SIZE}
        y={-CELL_SIZE}
        fontSize={14}
        fill="#1e40af"
      />
    </Group>
  );
}
```

#### 4.2.2 自动清除逻辑

```typescript
// 监听落子事件，自动清除提示
useEffect(() => {
  if (gameStore.lastMove) {
    // 玩家落子后，自动清除提示
    gameStore.clearHint();
  }
}, [gameStore.lastMove]);

// 清除提示
function clearHint() {
  gameStore.setHintPosition(null);
  gameStore.setShowHint(false);
  gameStore.setHintReason('');
}
```

### 4.3 提示限制逻辑

```typescript
// 限制每局使用次数（可选）
interface HintSettings {
  maxHints: number;  // 每局最多使用次数
  usedHints: number;  // 已使用次数
}

function canRequestHint(): boolean {
  return gameStore.hintSettings.usedHints < gameStore.hintSettings.maxHints;
}

function handleHint() {
  if (!canRequestHint()) {
    showMessage('本局提示次数已用完');
    return;
  }

  // 请求提示
  gameStore.requestHint();

  // 增加使用次数
  gameStore.hintSettings.usedHints++;
}
```

---

## 五、游戏记录和回放逻辑

### 5.1 记录保存逻辑

#### 5.1.1 记录时机

```typescript
// 游戏开始时
function startRecording() {
  gameStore.currentGameRecord = {
    id: generateUUID(),
    date: new Date(),
    mode: gameStore.gameMode,
    startTime: Date.now(),
    moves: [],
  };
}

// 每次落子时
function recordMove(move: Move) {
  gameStore.currentGameRecord.moves.push({
    ...move,
    timestamp: Date.now() - gameStore.currentGameRecord.startTime,
  });
}

// 游戏结束时
function endRecording(result: 'black' | 'white' | 'draw') {
  const record = gameStore.currentGameRecord;

  record.result = result;
  record.duration = Date.now() - record.startTime;
  record.finalBoard = gameStore.board.clone();
  record.pvpStats = {
    blackUndos: 3 - gameStore.pvpSettings.blackUndos,
    whiteUndos: 3 - gameStore.pvpSettings.whiteUndos,
    totalMoves: gameStore.moveHistory.length,
  };

  // 保存到LocalStorage
  storageService.saveGameRecord(record);
}
```

#### 5.1.2 存储管理

```typescript
// LocalStorage存储
const STORAGE_KEY = 'gobang_game_records';

function saveGameRecord(record: GameRecord) {
  const records = getGameRecords();

  // 添加新记录
  records.unshift(record);

  // 限制最多保存50局
  if (records.length > 50) {
    records.splice(50);
  }

  // 保存到LocalStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function getGameRecords(limit?: number): GameRecord[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];

  const records: GameRecord[] = JSON.parse(data);

  // 按日期倒序排序
  records.sort((a, b) => b.date.getTime() - a.date.getTime());

  // 限制返回数量
  return limit ? records.slice(0, limit) : records;
}
```

### 5.2 记录查看逻辑

#### 5.2.1 历史记录列表

```typescript
// 历史记录页面
function HistoryPage() {
  const records = storageService.getGameRecords();

  return (
    <div className="history-page">
      <h1>对局记录</h1>

      <div className="records-list">
        {records.map(record => (
          <RecordCard
            key={record.id}
            record={record}
            onClick={() => viewRecord(record.id)}
          />
        ))}
      </div>
    </div>
  );
}

// 记录卡片
function RecordCard({ record, onClick }) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN');
  };

  const getResultText = () => {
    if (record.result === 'draw') return '平局';
    return record.result === 'black' ? '黑棋胜' : '白棋胜';
  };

  return (
    <div className="record-card" onClick={onClick}>
      <div className="record-header">
        <span className="record-mode">
          {record.mode === 'pve' ? '人机' : '双人'}
        </span>
        <span className="record-result">{getResultText()}</span>
      </div>

      <div className="record-info">
        <span>{formatDate(record.date)}</span>
        <span>{formatDuration(record.duration)}</span>
        <span>{record.moves.length}手</span>
      </div>

      {record.mode === 'pvp' && record.pvpStats && (
        <div className="record-pvp-stats">
          <span>黑棋悔棋: {record.pvpStats.blackUndos}次</span>
          <span>白棋悔棋: {record.pvpStats.whiteUndos}次</span>
        </div>
      )}
    </div>
  );
}
```

#### 5.2.2 记录详情

```typescript
// 记录详情页面
function RecordDetailPage({ recordId }) {
  const record = storageService.getGameRecord(recordId);

  if (!record) {
    return <div>记录不存在</div>;
  }

  return (
    <div className="record-detail">
      <h1>对局详情</h1>

      {/* 基本信息 */}
      <div className="record-info">
        <div>模式: {record.mode === 'pve' ? '人机' : '双人'}</div>
        <div>结果: {getResultText(record.result)}</div>
        <div>时长: {formatDuration(record.duration)}</div>
        <div>手数: {record.moves.length}</div>
      </div>

      {/* 操作按钮 */}
      <div className="record-actions">
        <Button onClick={() => startReplay(record)}>
          ▶️ 开始回放
        </Button>
        <Button onClick={() => deleteRecord(record.id)}>
          🗑️ 删除记录
        </Button>
      </div>

      {/* 棋谱列表 */}
      <div className="move-list">
        <h2>棋谱</h2>
        {record.moves.map((move, index) => (
          <div key={index} className="move-item">
            <span>{index + 1}.</span>
            <span>{move.player === 'black' ? '黑' : '白'}</span>
            <span>({move.position.x}, {move.position.y})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5.3 回放功能逻辑（基础版）

#### 5.3.1 回放控制器

```typescript
interface ReplayState {
  isPlaying: boolean;
  currentMoveIndex: number;
  speed: number; // 播放速度（毫秒/步）
}

function ReplayController({ record }) {
  const [state, setState] = useState<ReplayState>({
    isPlaying: false,
    currentMoveIndex: 0,
    speed: 1000,
  });

  // 播放/暂停
  const togglePlay = () => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  // 前进
  const nextMove = () => {
    setState(prev => ({
      ...prev,
      currentMoveIndex: Math.min(
        prev.currentMoveIndex + 1,
        record.moves.length - 1
      ),
    }));
  };

  // 后退
  const prevMove = () => {
    setState(prev => ({
      ...prev,
      currentMoveIndex: Math.max(prev.currentMoveIndex - 1, 0),
    }));
  };

  // 跳转到指定步
  const jumpTo = (index: number) => {
    setState(prev => ({ ...prev, currentMoveIndex: index }));
  };

  // 自动播放
  useEffect(() => {
    if (!state.isPlaying) return;

    const timer = setInterval(() => {
      setState(prev => {
        if (prev.currentMoveIndex >= record.moves.length - 1) {
          return { ...prev, isPlaying: false };
        }
        return {
          ...prev,
          currentMoveIndex: prev.currentMoveIndex + 1,
        };
      });
    }, state.speed);

    return () => clearInterval(timer);
  }, [state.isPlaying, state.speed, record.moves.length]);

  return (
    <div className="replay-controls">
      <Button onClick={prevMove} disabled={state.currentMoveIndex === 0}>
        ⏮️ 上一步
      </Button>

      <Button onClick={togglePlay}>
        {state.isPlaying ? '⏸️ 暂停' : '▶️ 播放'}
      </Button>

      <Button
        onClick={nextMove}
        disabled={state.currentMoveIndex >= record.moves.length - 1}
      >
        下一步 ⏭️
      </Button>

      <select
        value={state.speed}
        onChange={(e) => setState(prev => ({
          ...prev,
          speed: parseInt(e.target.value)
        }))}
      >
        <option value={500}>0.5x</option>
        <option value={1000}>1x</option>
        <option value={2000}>2x</option>
      </select>

      <div className="move-info">
        步数: {state.currentMoveIndex + 1} / {record.moves.length}
      </div>
    </div>
  );
}
```

#### 5.3.2 棋盘回放渲染

```typescript
// 回放棋盘
function ReplayBoard({ record, currentMoveIndex }) {
  // 创建空棋盘
  const board = useMemo(() => new Board(), []);

  // 重放到当前步
  useEffect(() => {
    board.clear();

    for (let i = 0; i <= currentMoveIndex; i++) {
      const move = record.moves[i];
      board.placePiece(move.position, move.player);
    }
  }, [record, currentMoveIndex, board]);

  return (
    <BoardStage board={board} interactive={false}>
      {/* 棋盘渲染 */}
    </BoardStage>
  );
}
```

---

## 六、测试框架配置逻辑

### 6.1 React Testing Library配置

#### 6.1.1 安装和配置

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev jsdom @types/testing-library__jest-dom
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
```

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// 每个测试后清理
afterEach(() => {
  cleanup();
});
```

#### 6.1.2 测试工具函数

```typescript
// src/test/utils.tsx
import { render } from '@testing-library/react';
import { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';

// 渲染组件的辅助函数
export function renderWithProviders(
  ui: ReactElement,
  options = {}
) {
  function AllTheProviders({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: AllTheProviders, ...options });
}

// 导出所有RTL工具
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
```

### 6.2 Playwright配置

#### 6.2.1 安装和配置

```bash
npm install --save-dev @playwright/test
npx playwright install
```

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### 6.2.2 E2E测试基类

```typescript
// tests/e2e/fixtures.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  gamePage: async ({ page }, use) => {
    await page.goto('/');
    await use(page);
  },
});

export { expect } from '@playwright/test';
```

---

## 七、边界条件和异常处理

### 7.1 双人对战边界条件

| 场景 | 处理逻辑 |
|------|----------|
| 棋盘已满 | 判定为平局 |
| 网络断开 | 显示提示，等待恢复 |
| 刷新页面 | 重新开始（暂不保存进度） |
| 同时落子 | 忽略第二次点击 |
| 悔棋次数用尽 | 禁用悔棋按钮，显示提示 |
| 一方退出 | 判定为另一方获胜 |

### 7.2 UI组件边界条件

| 组件 | 边界条件 | 处理逻辑 |
|------|----------|----------|
| Timer | 时间>99:59 | 显示为99:59（上限） |
| StatusIndicator | 状态为空 | 显示默认状态 |
| GameControls | 按钮被禁用 | 添加disabled样式 |

### 7.3 提示功能边界条件

| 场景 | 处理逻辑 |
|------|----------|
| 游戏已结束 | 禁用提示按钮 |
| 棋盘已满 | 不提供提示 |
| 无可用位置 | 显示"无提示"消息 |
| 计算超时 | 显示"计算中..." |

---

## 八、性能优化逻辑

### 8.1 组件渲染优化

```typescript
// 使用React.memo优化组件
export const Timer = React.memo(({ isRunning, onTimeUpdate }: TimerProps) => {
  // 组件实现
});

export const StatusIndicator = React.memo(({ gameStatus, currentPlayer, winner }: StatusIndicatorProps) => {
  // 组件实现
});

export const GameControls = React.memo(({ ... }: GameControlsProps) => {
  // 组件实现
});
```

### 8.2 状态更新优化

```typescript
// 使用useCallback优化回调函数
function GameControls(props) {
  const handleUndo = useCallback(() => {
    if (props.canUndo) {
      props.onUndo();
    }
  }, [props.canUndo, props.onUndo]);

  const handleRestart = useCallback(() => {
    props.onRestart();
  }, [props.onRestart]);

  // ...
}
```

### 8.3 提示计算优化

```typescript
// 使用防抖优化提示请求
const debouncedRequestHint = useMemo(
  () => debounce(async () => {
    await gameStore.requestHint();
  }, 300),
  []
);

function handleHint() {
  debouncedRequestHint();
}
```

---

## 九、验收测试场景

### 9.1 双人对战场景

**场景1: 完整对局流程**
```
1. 打开游戏
2. 点击"开始游戏"
3. 选择"双人对战"
4. 选择"执黑先行"
5. 黑棋落子(7,7)
6. 白棋落子(7,8)
7. 继续对局直到一方获胜
8. 验证: 显示获胜界面
9. 验证: 记录已保存
```

**场景2: 悔棋流程**
```
1. 开始双人对战
2. 黑棋落子(7,7)
3. 白棋落子(7,8)
4. 黑棋点击"悔棋"
5. 验证: 棋盘回到白棋落子前状态
6. 验证: 黑棋悔棋次数减少1
7. 白棋重新落子(7,8)
```

### 9.2 UI组件场景

**场景3: 计时器功能**
```
1. 开始游戏
2. 验证: 计时器从00:00开始
3. 等待5秒
4. 验证: 计时器显示00:05
5. 暂停游戏
6. 验证: 计时器停止
7. 继续游戏
8. 验证: 计时器继续
```

**场景4: 状态指示器**
```
1. 开始游戏
2. 验证: 显示"轮到黑棋落子"
3. 黑棋落子
4. 验证: 显示"轮到白棋落子"
5. 白棋获胜
6. 验证: 显示"白棋获胜"
```

### 9.3 提示功能场景

**场景5: 提示推荐**
```
1. 开始游戏
2. 黑棋落子(7,7)
3. 白棋点击"提示"
4. 验证: 显示推荐位置（蓝色高亮）
5. 验证: 显示推荐理由
6. 白棋落子
7. 验证: 提示标记消失
```

### 9.4 游戏记录场景

**场景6: 记录保存和查看**
```
1. 完成一局双人对战
2. 返回主菜单
3. 点击"对局记录"
4. 验证: 显示刚才的对局记录
5. 点击记录
6. 验证: 显示对局详情
7. 点击"开始回放"
8. 验证: 进入回放界面
```

---

## 十、非功能性需求

### 10.1 性能要求

| 指标 | 目标值 | 测量方法 |
|------|--------|----------|
| 模式切换响应时间 | <100ms | Performance API |
| UI组件渲染时间 | <50ms | React DevTools |
| 提示计算时间 | <500ms | Console.time |
| 记录保存时间 | <100ms | Performance API |
| 内存占用 | <50MB | Chrome DevTools |

### 10.2 可访问性要求

| 要求 | 实现方式 |
|------|----------|
| 键盘导航 | 添加tabindex和键盘事件 |
| 屏幕阅读器 | 使用ARIA属性 |
| 高对比度 | 支持高对比度模式 |
| 字体大小 | 支持字体缩放 |

### 10.3 浏览器兼容性

| 浏览器 | 最低版本 | 测试覆盖 |
|--------|----------|----------|
| Chrome | 90+ | ✅ |
| Firefox | 88+ | ✅ |
| Safari | 14+ | ✅ |
| Edge | 90+ | ✅ |

---

**文档版本**: v1.0
**创建日期**: 2026-03-24
**负责人**: 产品经理
**最后更新**: 2026-03-24
