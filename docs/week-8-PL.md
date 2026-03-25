# Week 8 产品逻辑详细设计 (PL)
## 金币 + 任务 + 商城系统

**日期**: 2026-03-25
**版本**: v1.0
**状态**: 草稿
**负责人**: 产品经理 (PO)

---

## 1. 金币系统设计

### 1.1 金币获取规则

#### 1.1.1 对局奖励

| 游戏结果 | 金币 | 说明 |
|---------|------|------|
| **获胜** | +10 | 正常胜利奖励 |
| **失败** | +2 | 参与奖励，鼓励继续游戏 |
| **和棋** | +5 | 平局奖励 |

**技术实现**:
```typescript
function calculateCoinGain(result: GameResult): number {
  switch (result) {
    case 'win': return 10;
    case 'lose': return 2;
    case 'draw': return 5;
    default: return 0;
  }
}
```

#### 1.1.2 每日签到奖励

```typescript
function getCheckInReward(consecutiveDays: number): { coins: number; bonus?: number } {
  const baseReward = 50;
  let bonus = 0;

  if (consecutiveDays === 7) {
    bonus = 100; // 连续7天额外奖励
  } else if (consecutiveDays === 30) {
    bonus = 500; // 连续30天额外奖励
  }

  return { coins: baseReward, bonus: bonus > 0 ? bonus : undefined };
}
```

#### 1.1.3 成就奖励

根据成就难度发放金币奖励：
- 简单成就：+50金币
- 中等成就：+100~200金币
- 困难成就：+300~500金币

### 1.2 金币上限

**设计决策**: 不设金币上限

**理由**:
- 鼓励用户长期游玩
- 用户可以攒钱购买昂贵皮肤
- 避免用户体验限制

### 1.3 金币数据结构

```typescript
interface CoinData {
  coins: number;           // 当前金币数量
  totalEarned: number;    // 累计获得金币
  totalSpent: number;     // 累计消费金币
  lastCheckIn: string;    // 上次签到日期 (YYYY-MM-DD)
  consecutiveDays: number; // 连续签到天数
}
```

---

## 2. 每日任务系统设计

### 2.1 任务定义结构

```typescript
interface Task {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly';
  reward: {
    coins: number;
    exp?: number;
    skinId?: string; // 周常任务可能奖励皮肤
  };
  target: number;         // 目标次数
  progress: number;       // 当前进度
  completed: boolean;     // 是否完成
  claimed: boolean;       // 是否已领取奖励
  condition: TaskCondition; // 完成条件
}

type TaskCondition =
  | { type: 'games_played'; count: number }
  | { type: 'wins'; count: number }
  | { type: 'hints_used'; count: number };
```

### 2.2 每日任务配置

**任务1：游戏达人**
```typescript
{
  id: 'daily_games_3',
  name: '游戏达人',
  description: '完成3局游戏',
  type: 'daily',
  reward: { coins: 30 },
  target: 3,
  condition: { type: 'games_played', count: 3 }
}
```

**任务2：胜利者**
```typescript
{
  id: 'daily_win_1',
  name: '胜利者',
  description: '获得1局胜利',
  type: 'daily',
  reward: { coins: 50 },
  target: 1,
  condition: { type: 'wins', count: 1 }
}
```

**任务3：博学先锋**
```typescript
{
  id: 'daily_hint_1',
  name: '博学先锋',
  description: '使用1次提示',
  type: 'daily',
  reward: { coins: 20 },
  target: 1,
  condition: { type: 'hints_used', count: 1 }
}
```

### 2.3 周常任务配置

**周常任务：千胜之路**
```typescript
{
  id: 'weekly_wins_10',
  name: '千胜之路',
  description: '累计获胜10局',
  type: 'weekly',
  reward: { coins: 200, skinId: 'dragon_board' },
  target: 10,
  condition: { type: 'wins', count: 10 }
}
```

### 2.4 任务刷新逻辑

```typescript
class TaskService {
  // 检查是否需要刷新每日任务
  shouldRefreshDailyTasks(): boolean {
    const lastRefresh = this.getLastRefreshDate();
    const today = new Date().toDateString();
    return lastRefresh !== today;
  }

  // 刷新每日任务
  refreshDailyTasks(): void {
    const tasks = this.generateDailyTasks();
    this.saveTasks(tasks);
    this.updateLastRefreshDate();
  }

  // 检查是否需要刷新周常任务
  shouldRefreshWeeklyTasks(): boolean {
    const lastRefresh = this.getLastWeeklyRefreshDate();
    const today = new Date();
    const weekNumber = this.getWeekNumber(today);
    return lastRefresh !== weekNumber;
  }
}
```

### 2.5 任务进度追踪

```typescript
// 游戏结束时检查任务进度
function checkTaskProgress(action: GameAction): void {
  const tasks = getActiveTasks();

  for (const task of tasks) {
    if (task.claimed) continue;

    // 更新进度
    if (this.matchesTask(action, task)) {
      task.progress = Math.min(task.progress + 1, task.target);

      // 检查是否完成
      if (task.progress >= task.target) {
        task.completed = true;
      }

      // 保存任务
      this.saveTask(task);
    }
  }
}
```

---

## 3. 商城系统设计

### 3.1 商品类型

```typescript
interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: 'board_skin' | 'piece_skin';
  rarity: 'common' | 'rare' | 'legendary';
  price: number;
  preview: string; // 预览图URL或emoji
  owned: boolean;
  locked: boolean;  // 是否需要解锁条件
}
```

### 3.2 皮肤配置

#### 棋盘皮肤（5款）

1. **经典木纹** (common)
   - 价格：已拥有（默认）
   - 描述：经典的木质纹理棋盘

2. **碧海青天** (common)
   - 价格：200金币
   - 描述：清新的蓝色海洋主题

3. **赤焰熔岩** (rare)
   - 价格：1000金币
   - 描述：炽热的岩浆主题

4. **暗夜星空** (rare)
   - 价格：1500金币
   - 描述：神秘的星空主题

5. **龙之棋盘** (legendary)
   - 价格：3000金币
   - 描述：传说中的龙纹棋盘
   - 特殊：可通过周常任务获得

#### 棋子皮肤（5款）

1. **黑白经典** (common)
   - 价格：已拥有（默认）
   - 描述：经典的黑白棋子

2. **玉石对弈** (common)
   - 价格：100金币
   - 描述：温润的玉石棋子

3. **黄金荣耀** (rare)
   - 价格：800金币
   - 描述：闪耀的黄金棋子

4. **冰霜之刃** (rare)
   - 价格：1200金币
   - 描述：锋利的冰霜棋子

5. **凤凰涅槃** (legendary)
   - 价格：2500金币
   - 描述：重生的凤凰主题

### 3.3 购买逻辑

```typescript
function purchaseItem(itemId: string): PurchaseResult {
  const item = getShopItem(itemId);
  const userData = getUserData();

  // 检查是否已拥有
  if (item.owned) {
    return { success: false, error: 'already_owned' };
  }

  // 检查金币余额
  if (userData.coins < item.price) {
    return { success: false, error: 'insufficient_coins' };
  }

  // 扣除金币
  userData.coins -= item.price;

  // 解锁皮肤
  userData.unlockedSkins.push(itemId);

  // 保存数据
  saveUserData(userData);

  return { success: true, item };
}
```

### 3.4 皮肤应用逻辑

```typescript
function applySkin(skinId: string, type: 'board' | 'piece'): void {
  const userData = getUserData();

  if (type === 'board') {
    userData.currentBoardSkin = skinId;
  } else {
    userData.currentPieceSkin = skinId;
  }

  saveUserData(userData);
}
```

---

## 4. 每日签到功能设计

### 4.1 签到规则

```typescript
interface CheckInData {
  lastCheckInDate: string;  // 上次签到日期 (YYYY-MM-DD)
  consecutiveDays: number;  // 连续签到天数
  totalCheckInDays: number; // 累计签到天数
}
```

### 4.2 签到流程

```typescript
function checkIn(): CheckInResult {
  const today = new Date().toDateString();
  const checkInData = getCheckInData();

  // 检查今天是否已签到
  if (checkInData.lastCheckInDate === today) {
    return { success: false, error: 'already_checked_in' };
  }

  // 计算连续签到天数
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (checkInData.lastCheckInDate === yesterday) {
    checkInData.consecutiveDays += 1;
  } else {
    checkInData.consecutiveDays = 1;
  }

  // 发放奖励
  const reward = getCheckInReward(checkInData.consecutiveDays);
  const totalCoins = reward.coins + (reward.bonus || 0);

  // 更新数据
  checkInData.lastCheckInDate = today;
  checkInData.totalCheckInDays += 1;

  // 添加金币
  addCoins(totalCoins);

  // 检查连续签到成就
  checkAchievement('daily_login_7', checkInData.consecutiveDays);

  saveCheckInData(checkInData);

  return {
    success: true,
    reward: totalCoins,
    consecutiveDays: checkInData.consecutiveDays,
    bonus: reward.bonus
  };
}
```

### 4.3 签到日历UI

**显示内容**:
- 当前月份日历
- 已签到日期标记（✓）
- 今日签到按钮（如果未签到）
- 连续签到天数
- 签到奖励提示

**UI示例**:
```
┌─────────────────────────────────────┐
│         📅 每日签到                 │
├─────────────────────────────────────┤
│  连续签到: 5天                       │
│  今日奖励: 50金币                    │
├─────────────────────────────────────┤
│  日 一 二 三 四 五 六                │
│         ✓ ✓ ✓ ✓ ✓                  │
│  1 2 3 4 5 6 7                     │
│  ✓ ✓ ✓ ✓ ✓                          │
│  8 9 10 11 12 13 14                 │
│                                     │
├─────────────────────────────────────┤
│      [ 立即签到 (领取50金币)]        │
└─────────────────────────────────────┘
```

---

## 5. 与现有系统集成

### 5.1 游戏结束流程扩展

**Week 7流程**:
```
游戏结束 → 判断胜负 → 计算经验值 → 检查等级升级 → 检查成就 → 显示结果 → 保存数据
```

**Week 8流程**:
```
游戏结束 → 判断胜负 → 计算金币 → 更新任务进度 → 检查成就 → 计算经验值 → 检查等级升级 → 显示结果 → 保存数据
```

### 5.2 用户状态管理扩展

**新增字段** (`src/store/user-store.ts`):
```typescript
interface UserState {
  // Week 7字段...
  exp: number;
  level: number;
  levelInfo: Level;
  achievements: Record<string, AchievementProgress>;
  stats: UserStats;

  // Week 8新增字段
  coins: number;
  tasks: Task[];
  checkInData: CheckInData;
  unlockedSkins: string[];
  currentBoardSkin: string;
  currentPieceSkin: string;

  // Week 8新增方法
  addCoins: (amount: number) => void;
  getCoinBalance: () => number;
  checkTaskProgress: (action: GameAction) => void;
  claimTaskReward: (taskId: string) => void;
  checkIn: () => CheckInResult;
  purchaseSkin: (skinId: string) => PurchaseResult;
}
```

---

## 6. 技术实现要点

### 6.1 数据存储

**LocalStorage键值**:
```typescript
const STORAGE_KEYS = {
  USER_DATA: 'gobang_user_data',
  TASKS: 'gobang_tasks',
  CHECK_IN: 'gobang_check_in',
  SHOP: 'gobang_shop',
};
```

### 6.2 数据迁移

**Week 8数据版本**: v2

```typescript
interface UserDataV2 extends UserData {
  version: 2;
  coins: number;
  tasks: Task[];
  checkInData: CheckInData;
  unlockedSkins: string[];
  currentBoardSkin: string;
  currentPieceSkin: string;
}

function migrateToV2(data: any): UserDataV2 {
  if (data.version >= 2) return data;

  return {
    ...data,
    version: 2,
    coins: data.coins || 0,
    tasks: data.tasks || generateDailyTasks(),
    checkInData: data.checkInData || createDefaultCheckInData(),
    unlockedSkins: data.unlockedSkins || ['default_board', 'default_piece'],
    currentBoardSkin: data.currentBoardSkin || 'default_board',
    currentPieceSkin: data.currentPieceSkin || 'default_piece',
  };
}
```

### 6.3 任务检测时机

**检测点**:
1. **游戏结束时**:
   - 更新"完成3局游戏"进度
   - 更新"获得1局胜利"进度
2. **使用提示时**:
   - 更新"使用1次提示"进度
3. **每日0点**:
   - 刷新每日任务
   - 重置任务进度

---

## 7. 测试要点

### 7.1 金币系统测试
- [ ] 胜利金币计算正确
- [ ] 失败金币计算正确
- [ ] 和棋金币计算正确
- [ ] 每日签到金币正确
- [ ] 成就金币正确发放

### 7.2 任务系统测试
- [ ] 每日任务正确生成
- [ ] 周常任务正确生成
- [ ] 任务进度正确更新
- [ ] 任务奖励正确发放
- [ ] 任务刷新逻辑正确

### 7.3 商城系统测试
- [ ] 皮肤列表正确显示
- [ ] 购买逻辑正确
- [ ] 金币扣除正确
- [ ] 皮肤解锁正确
- [ ] 皮肤应用正确

### 7.4 签到功能测试
- [ ] 每日只能签到1次
- [ ] 连续签到计算正确
- [ ] 签到奖励正确发放
- [ ] 签到日历正确显示

### 7.5 集成测试
- [ ] 与Week 1-7功能集成正确
- [ ] 不影响现有游戏流程
- [ ] 不影响AI性能
- [ ] 存储和加载数据正确

---

## 8. UI/UX设计要点

### 8.1 金币显示

**位置**: 游戏主界面顶部

**显示内容**:
- 金币图标 + 金币数量
- 实时更新

### 8.2 任务列表

**位置**: 主菜单 → 每日任务

**显示内容**:
- 任务名称和描述
- 进度条（x/y）
- 奖励信息
- 领取按钮

### 8.3 商城界面

**位置**: 主菜单 → 商城

**显示内容**:
- 皮肤分类标签（棋盘/棋子）
- 皮肤卡片（预览图、价格、拥有状态）
- 购买按钮
- 应用按钮

### 8.4 签到界面

**位置**: 主菜单 → 每日签到

**显示内容**:
- 签到日历
- 连续签到天数
- 签到按钮
- 奖励提示

---

## 9. 后续扩展规划

### Week 9扩展（UI完善）
- 成就解锁弹窗UI
- 等级升级提示UI
- 商城购买动画
- 签到奖励动画

### 未来扩展
- 更多皮肤类型
- 道具系统（撤销卡、提示卡）
- VIP系统
- 公测/版本更新活动

---

**文档状态**: ✅ PL文档创建完成
**下一步**: QA设计测试用例
