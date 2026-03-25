# Week 9 产品逻辑详细设计 (PL)
## 数据持久化 + UI集成

**日期**: 2026-03-25
**版本**: v1.0
**状态**: 草稿
**负责人**: 产品经理 (PO)

---

## 1. 数据持久化设计

### 1.1 LocalStorage键值设计

```typescript
const STORAGE_KEYS = {
  // 用户数据（金币、经验、等级、成就）
  USER_DATA: 'gobang_user_data_v2',

  // 任务数据（每日任务、周常任务）
  TASKS: 'gobang_tasks_v2',

  // 签到数据（连续签到、累计签到）
  CHECK_IN: 'gobang_check_in_v2',

  // 商城数据（已拥有皮肤、当前应用皮肤）
  SHOP: 'gobang_shop_v2',
};
```

### 1.2 数据结构设计

#### 用户数据结构
```typescript
interface UserDataV2 extends UserData {
  version: 2;

  // Week 7字段
  exp: number;
  level: number;
  achievements: Record<string, AchievementProgress>;
  stats: UserStats;

  // Week 8字段
  coins: number;
  totalEarned: number;
  totalSpent: number;
  checkInData: CheckInData;
  unlockedSkins: string[];
  currentBoardSkin: string;
  currentPieceSkin: string;

  // Week 9新增字段
  lastSaveTime: number;  // 最后保存时间戳
}
```

#### 任务数据结构
```typescript
interface TasksData {
  version: 2;

  dailyTasks: {
    date: string;        // YYYY-MM-DD
    tasks: Task[];       // 3个每日任务
  };

  weeklyTasks: {
    weekNumber: number;  // 周数
    tasks: Task[];       // 1个周常任务
  };

  lastRefreshDate: {
    daily: string;       // 最后刷新每日任务的日期
    weekly: string;      // 最后刷新周常任务的周数
  };
}
```

#### 签到数据结构
```typescript
interface CheckInData {
  lastCheckInDate: string;      // YYYY-MM-DD
  consecutiveDays: number;      // 连续签到天数
  totalCheckInDays: number;     // 累计签到天数
  checkInHistory: string[];     // 签到历史记录（最近30天）
}
```

#### 商城数据结构
```typescript
interface ShopData {
  version: 2;

  ownedSkins: string[];         // 已拥有的皮肤ID列表
  currentBoardSkin: string;     // 当前应用的棋盘皮肤
  currentPieceSkin: string;     // 当前应用的棋子皮肤
  purchaseHistory: {            // 购买历史
    skinId: string;
    purchaseDate: string;       // YYYY-MM-DD
    price: number;
  }[];
}
```

### 1.3 数据自动保存机制

```typescript
class AutoSaveManager {
  // 监听store变化，自动保存
  setupAutoSave(): void {
    // 监听金币变化
    useUserStore.subscribe(
      (state) => state.coins,
      (coins) => this.saveUserData()
    );

    // 监听任务进度变化
    useUserStore.subscribe(
      (state) => state.tasks,
      (tasks) => this.saveTasks()
    );

    // 监听签到变化
    useUserStore.subscribe(
      (state) => state.checkInData,
      (checkInData) => this.saveCheckIn()
    );

    // 监听商城变化
    useUserStore.subscribe(
      (state) => state.unlockedSkins,
      (unlockedSkins) => this.saveShop()
    );
  }

  // 节流保存，避免频繁写入
  private saveUserData = debounce(() => {
    const userData = useUserStore.getState().getUserData();
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  }, 1000);
}
```

### 1.4 数据迁移逻辑

```typescript
function migrateToV2(data: any): UserDataV2 {
  // 已经是v2，直接返回
  if (data.version >= 2) return data;

  // v0或v1 → v2迁移
  return {
    ...data,
    version: 2,
    // Week 8字段（如果不存在）
    coins: data.coins || 0,
    totalEarned: data.totalEarned || 0,
    totalSpent: data.totalSpent || 0,
    checkInData: data.checkInData || createDefaultCheckInData(),
    unlockedSkins: data.unlockedSkins || ['classic_board', 'classic_piece'],
    currentBoardSkin: data.currentBoardSkin || 'classic_board',
    currentPieceSkin: data.currentPieceSkin || 'classic_piece',
    // Week 9新增字段
    lastSaveTime: Date.now(),
  };
}
```

### 1.5 错误处理

```typescript
class SafeStorage {
  // 安全保存
  save(key: string, data: any): boolean {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(key, json);
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        // 存储空间不足，清理旧数据
        this.cleanOldData();
        // 重试一次
        localStorage.setItem(key, json);
        return true;
      }
      console.error('保存失败:', error);
      return false;
    }
  }

  // 安全加载
  load<T>(key: string): T | null {
    try {
      const json = localStorage.getItem(key);
      if (!json) return null;
      return JSON.parse(json) as T;
    } catch (error) {
      console.error('加载失败:', error);
      return null;
    }
  }

  // 清理旧数据（保留最近7天的签到记录）
  private cleanOldData(): void {
    const checkInData = this.load<CheckInData>(STORAGE_KEYS.CHECK_IN);
    if (checkInData && checkInData.checkInHistory) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      checkInData.checkInHistory = checkInData.checkInHistory.filter(date => {
        return new Date(date) >= sevenDaysAgo;
      });

      this.save(STORAGE_KEYS.CHECK_IN, checkInData);
    }
  }
}
```

---

## 2. UI组件设计

### 2.1 金币显示组件（CoinDisplay）

**组件路径**: `src/components/CoinDisplay/CoinDisplay.tsx`

**Props**:
```typescript
interface CoinDisplayProps {
  showLabel?: boolean;       // 是否显示"金币"标签
  clickable?: boolean;       // 是否可点击
  onClick?: () => void;      // 点击回调
}
```

**功能**:
- 显示金币图标（🪙或自定义图标）
- 显示金币数量（格式化：1,250）
- 响应store变化
- 点击可跳转到商城

**实现逻辑**:
```typescript
export const CoinDisplay: React.FC<CoinDisplayProps> = ({
  showLabel = true,
  clickable = true,
  onClick
}) => {
  const coins = useUserStore(state => state.coins);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (clickable) {
      // 默认跳转到商城页面
      // navigate('/shop');
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        clickable && "cursor-pointer hover:scale-105 transition-transform"
      )}
      onClick={handleClick}
    >
      <span className="text-2xl">🪙</span>
      <span className="text-xl font-bold text-yellow-600">
        {coins.toLocaleString()}
      </span>
      {showLabel && (
        <span className="text-sm text-gray-600">金币</span>
      )}
    </div>
  );
};
```

### 2.2 任务列表组件（TaskList）

**组件路径**: `src/components/Tasks/TaskList.tsx`

**Props**:
```typescript
interface TaskListProps {
  showWeekly?: boolean;      // 是否显示周常任务
}
```

**功能**:
- 显示每日任务列表
- 可选显示周常任务
- 任务进度条
- 领取奖励按钮
- 任务完成标记

**实现逻辑**:
```typescript
export const TaskList: React.FC<TaskListProps> = ({ showWeekly = true }) => {
  const dailyTasks = useUserStore(state =>
    state.tasks.filter(t => t.type === 'daily')
  );
  const weeklyTasks = useUserStore(state =>
    state.tasks.filter(t => t.type === 'weekly')
  );
  const claimReward = useUserStore(state => state.claimTaskReward);

  return (
    <div className="space-y-4">
      {/* 每日任务 */}
      <section>
        <h3 className="text-lg font-bold mb-3">每日任务</h3>
        <div className="space-y-3">
          {dailyTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onClaim={() => claimReward(task.id)}
            />
          ))}
        </div>
      </section>

      {/* 周常任务 */}
      {showWeekly && weeklyTasks.length > 0 && (
        <section>
          <h3 className="text-lg font-bold mb-3">周常任务</h3>
          <div className="space-y-3">
            {weeklyTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onClaim={() => claimReward(task.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
```

**任务卡片子组件**:
```typescript
const TaskCard: React.FC<{
  task: Task;
  onClaim: () => void;
}> = ({ task, onClaim }) => {
  const progress = (task.progress / task.target) * 100;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-bold">{task.name}</h4>
          <p className="text-sm text-gray-600">{task.description}</p>
        </div>
        {task.completed && task.claimed && (
          <span className="text-green-500">✓ 已完成</span>
        )}
      </div>

      {/* 进度条 */}
      <div className="mb-2">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>进度: {task.progress}/{task.target}</span>
          <span>{progress.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 奖励和按钮 */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-yellow-600">
          奖励: {task.reward.coins}金币
        </span>
        {task.completed && !task.claimed && (
          <button
            onClick={onClaim}
            className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            领取
          </button>
        )}
        {!task.completed && (
          <button
            disabled
            className="px-4 py-1 bg-gray-300 text-gray-600 rounded cursor-not-allowed"
          >
            领取
          </button>
        )}
      </div>
    </div>
  );
};
```

### 2.3 商城页面组件（ShopPage）

**组件路径**: `src/components/Shop/ShopPage.tsx`

**Props**:
```typescript
interface ShopPageProps {
  defaultTab?: 'board' | 'piece';  // 默认显示标签
}
```

**功能**:
- 分类标签（棋盘/棋子）
- 皮肤网格显示
- 皮肤购买
- 皮肤应用

**实现逻辑**:
```typescript
export const ShopPage: React.FC<ShopPageProps> = ({ defaultTab = 'board' }) => {
  const [activeTab, setActiveTab] = useState<'board' | 'piece'>(defaultTab);
  const coins = useUserStore(state => state.coins);
  const ownedSkins = useUserStore(state => state.unlockedSkins);
  const currentBoardSkin = useUserStore(state => state.currentBoardSkin);
  const currentPieceSkin = useUserStore(state => state.currentPieceSkin);

  const purchaseSkin = useUserStore(state => state.purchaseSkin);
  const applySkin = useUserStore(state => state.applySkin);

  const shopItems = useShopItems(); // 从ShopService获取

  const filteredItems = shopItems.filter(item => {
    if (activeTab === 'board') return item.type === 'board_skin';
    return item.type === 'piece_skin';
  });

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* 标题 */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">商城</h1>
        <CoinDisplay />
      </div>

      {/* 分类标签 */}
      <div className="flex gap-2 mb-6">
        <button
          className={cn(
            "px-4 py-2 rounded",
            activeTab === 'board'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700'
          )}
          onClick={() => setActiveTab('board')}
        >
          棋盘皮肤
        </button>
        <button
          className={cn(
            "px-4 py-2 rounded",
            activeTab === 'piece'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700'
          )}
          onClick={() => setActiveTab('piece')}
        >
          棋子皮肤
        </button>
      </div>

      {/* 皮肤网格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filteredItems.map(item => (
          <SkinCard
            key={item.id}
            item={item}
            owned={ownedSkins.includes(item.id)}
            current={
              item.type === 'board_skin'
                ? currentBoardSkin === item.id
                : currentPieceSkin === item.id
            }
            onPurchase={() => purchaseSkin(item.id)}
            onApply={() => applySkin(
              item.id,
              item.type === 'board_skin' ? 'board' : 'piece'
            )}
          />
        ))}
      </div>
    </div>
  );
};
```

**皮肤卡片子组件**:
```typescript
const SkinCard: React.FC<{
  item: ShopItem;
  owned: boolean;
  current: boolean;
  onPurchase: () => void;
  onApply: () => void;
}> = ({ item, owned, current, onPurchase, onApply }) => {
  return (
    <div className={cn(
      "border rounded-lg p-4 text-center",
      current && "ring-2 ring-blue-500"
    )}>
      {/* 预览 */}
      <div className="text-4xl mb-2">{item.preview}</div>

      {/* 名称和描述 */}
      <h3 className="font-bold mb-1">{item.name}</h3>
      <p className="text-sm text-gray-600 mb-2">{item.description}</p>

      {/* 价格或拥有状态 */}
      {owned ? (
        current ? (
          <div className="text-green-500 font-bold">应用中</div>
        ) : (
          <button
            onClick={onApply}
            className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            应用
          </button>
        )
      ) : (
        <>
          <div className="text-yellow-600 font-bold mb-2">
            {item.price}金币
          </div>
          <button
            onClick={onPurchase}
            className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            购买
          </button>
        </>
      )}

      {/* 稀有度标识 */}
      <div className="mt-2 text-xs">
        {item.rarity === 'common' && <span className="text-gray-500">普通</span>}
        {item.rarity === 'rare' && <span className="text-blue-500">稀有</span>}
        {item.rarity === 'legendary' && <span className="text-yellow-500">限定</span>}
      </div>
    </div>
  );
};
```

### 2.4 签到日历组件（CheckInCalendar）

**组件路径**: `src/components/CheckIn/CheckInCalendar.tsx`

**Props**:
```typescript
interface CheckInCalendarProps {
  onCheckIn?: () => void;
}
```

**功能**:
- 显示当月日历
- 已签到日期标记
- 今日签到按钮
- 连续签到天数
- 签到奖励提示

**实现逻辑**:
```typescript
export const CheckInCalendar: React.FC<CheckInCalendarProps> = ({ onCheckIn }) => {
  const checkInData = useUserStore(state => state.checkInData);
  const checkIn = useUserStore(state => state.checkIn);

  const [currentDate, setCurrentDate] = useState(new Date());

  // 检查今天是否已签到
  const today = currentDate.toDateString();
  const hasCheckedInToday = checkInData.lastCheckInDate === today;

  // 计算当月日历
  const calendar = generateMonthCalendar(currentDate, checkInData.checkInHistory);

  const handleCheckIn = () => {
    const result = checkIn();
    if (result.success && onCheckIn) {
      onCheckIn();
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">📅 每日签到</h2>

      {/* 连续签到和奖励提示 */}
      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-600">连续签到</div>
            <div className="text-2xl font-bold text-blue-600">
              {checkInData.consecutiveDays}天
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">今日奖励</div>
            <div className="text-xl font-bold text-yellow-600">50金币</div>
          </div>
        </div>
      </div>

      {/* 日历 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
        {/* 星期标题 */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
            <div key={day} className="text-center text-sm font-bold text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* 日期格子 */}
        <div className="grid grid-cols-7 gap-2">
          {calendar.map((day, index) => (
            <div
              key={index}
              className={cn(
                "aspect-square flex items-center justify-center rounded",
                "text-sm",
                day.date === today && "bg-blue-100",
                day.checkedIn && "bg-green-100",
                !day.inMonth && "text-gray-300"
              )}
            >
              {day.date && (
                <>
                  <span>{day.dayNumber}</span>
                  {day.checkedIn && (
                    <span className="ml-1 text-green-600">✓</span>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 签到按钮 */}
      {hasCheckedInToday ? (
        <div className="w-full py-3 bg-gray-200 text-gray-600 rounded text-center font-bold">
          今日已签到
        </div>
      ) : (
        <button
          onClick={handleCheckIn}
          className="w-full py-3 bg-blue-500 text-white rounded font-bold hover:bg-blue-600"
        >
          立即签到 (领取50金币)
        </button>
      )}
    </div>
  );
};
```

**日历生成工具函数**:
```typescript
function generateMonthCalendar(
  currentDate: Date,
  checkInHistory: string[]
): CalendarDay[] {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 获取当月第一天是星期几
  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay();

  // 获取当月总天数
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendar: CalendarDay[] = [];

  // 填充月初空白
  for (let i = 0; i < startDayOfWeek; i++) {
    calendar.push({ inMonth: false });
  }

  // 填充当月日期
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day).toDateString();
    const checkedIn = checkInHistory.includes(date);

    calendar.push({
      inMonth: true,
      date,
      dayNumber: day,
      checkedIn
    });
  }

  return calendar;
}
```

---

## 3. 游戏流程集成设计

### 3.1 游戏结束流程扩展

**当前流程（Week 7）**:
```typescript
游戏结束 → 判断胜负 → 计算经验值 → 更新成就 → 检查等级 → 保存数据
```

**Week 9流程**:
```typescript
游戏结束 → 判断胜负 → 计算金币 → 更新任务进度 → 计算经验值 → 更新成就 → 检查等级 → 保存数据
```

### 3.2 GameStore扩展

```typescript
// game-store.ts
interface GameStore {
  // ... 现有字段

  // Week 9新增方法
  endGameWithRewards: (result: GameResult) => GameResult;
}

const endGameWithRewards = (result: GameResult) => {
  const set = get();

  // 1. 计算金币奖励
  const coins = coinService.calculateCoinGain(result);
  userStore.addCoins(coins);

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

### 3.3 UserStore扩展（自动保存）

```typescript
// user-store.ts
interface UserStore {
  // ... 现有字段

  // Week 9新增：自动保存
  _hybrid: Partial<UserStore>; // Zustand持久化中间件
}

// 使用Zustand的persist中间件
import { persist } from 'zustand/middleware';

export const useUserStore = create(
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

## 4. UI路由和导航

### 4.1 路由设计

```typescript
// App.tsx路由配置
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/game" element={<GamePage />} />
  <Route path="/tasks" element={<TasksPage />} />
  <Route path="/shop" element={<ShopPage />} />
  <Route path="/checkin" element={<CheckInPage />} />
  <Route path="/settings" element={<SettingsPage />} />
</Routes>
```

### 4.2 主菜单扩展

在HomePage添加新入口：
```typescript
// HomePage.tsx
const menuItems = [
  { path: '/game', label: '开始游戏', icon: '🎮' },
  { path: '/tasks', label: '每日任务', icon: '📋' },
  { path: '/shop', label: '商城', icon: '🛍️' },
  { path: '/checkin', label: '每日签到', icon: '📅' },
  { path: '/settings', label: '设置', icon: '⚙️' },
];
```

---

## 5. 用户体验优化

### 5.1 Toast通知组件

**组件路径**: `src/components/Toast/Toast.tsx`

**功能**:
- 显示临时通知
- 自动消失（3秒）
- 支持多种类型（成功、错误、信息）

**使用场景**:
- 金币获得时显示提示
- 任务完成时显示提示
- 签到成功时显示提示
- 购买成功时显示提示

**实现逻辑**:
```typescript
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    const toast: Toast = { id, message, type };
    setToasts((prev) => [...prev, toast]);

    // 3秒后自动消失
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "px-4 py-2 rounded shadow-lg",
              toast.type === 'success' && "bg-green-500 text-white",
              toast.type === 'error' && "bg-red-500 text-white",
              toast.type === 'info' && "bg-blue-500 text-white"
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
```

### 5.2 金币获得动画（可选）

**效果**:
- 金币数字跳动
- 金币图标放大缩小
- 持续1秒

**实现**:
```typescript
const CoinAnimation: React.FC<{ amount: number }> = ({ amount }) => {
  return (
    <div className="animate-bounce">
      <span className="text-2xl">🪙 +{amount}</span>
    </div>
  );
};
```

---

## 6. 测试要点

### 6.1 数据持久化测试
- [ ] 数据正确保存到LocalStorage
- [ ] 刷新页面数据不丢失
- [ ] 数据版本控制正常工作
- [ ] 数据迁移正确（Week 7/8 → Week 9）

### 6.2 UI组件测试
- [ ] 金币显示正确更新
- [ ] 任务列表正确显示
- [ ] 商城页面正确渲染
- [ ] 签到日历正确显示

### 6.3 集成测试
- [ ] 游戏结束触发金币奖励
- [ ] 游戏结束触发任务进度更新
- [ ] 数据自动保存
- [ ] Week 1-8功能不受影响

---

## 7. 后续扩展规划

### Week 10-12扩展
- UI动画优化
- 性能优化
- E2E测试
- 生产环境部署

---

**文档状态**: ✅ PL文档创建完成
**下一步**: QA设计测试用例
