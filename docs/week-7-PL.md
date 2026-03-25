# Week 7 产品逻辑详细设计 (PL)
## 经验值 + 等级 + 成就系统

**日期**: 2026-03-25
**版本**: v1.0
**状态**: 草稿
**负责人**: 产品经理 (PO)

---

## 1. 经验值系统设计

### 1.1 经验值获取规则

#### 1.1.1 基础经验值

| 游戏结果 | 经验值 | 说明 |
|---------|--------|------|
| **获胜** | +100 | 正常胜利奖励 |
| **失败** | +20 | 参与奖励，鼓励继续游戏 |
| **和棋** | +50 | 平局奖励 |

#### 1.1.2 连胜奖励

```
连胜奖励规则：
- 连胜2局及以上：每局额外+50经验
- 连胜中断：重新开始计算
- 适用模式：PvP、PvE（AI难度不限）
```

**示例**：
- 第1局胜：100经验
- 第2局胜：100+50=150经验
- 第3局胜：100+50=150经验
- 第4局负：20经验（连胜中断）
- 第5局胜：100经验（重新开始）

**技术实现**：
```typescript
function calculateExpGain(result: GameResult, streak: number): number {
  let baseExp = 0;

  switch (result) {
    case 'win': baseExp = 100; break;
    case 'lose': baseExp = 20; break;
    case 'draw': baseExp = 50; break;
  }

  // 连胜奖励
  if (result === 'win' && streak >= 2) {
    baseExp += 50;
  }

  return baseExp;
}
```

### 1.2 经验值上限

```
最高等级：Lv6 宗师（10000经验）
超过上限后：经验值不再增加，等级保持不变
```

---

## 2. 等级系统设计

### 2.1 等级定义表

| 等级 | 名称 | 经验阈值 | 徽章 | 解锁条件 |
|------|------|---------|------|---------|
| Lv1 | 初学者 | 0 | 🌱 | 初始等级 |
| Lv2 | 新手 | 500 | 🌿 | 达到500经验 |
| Lv3 | 熟练者 | 1500 | ⚔️ | 达到1500经验 |
| Lv4 | 高手 | 3000 | 🏅 | 达到3000经验 |
| Lv5 | 大师 | 6000 | 🏆 | 达到6000经验 |
| Lv6 | 宗师 | 10000 | 👑 | 达到10000经验 |

### 2.2 等级计算逻辑

```typescript
function calculateLevel(totalExp: number): Level {
  if (totalExp >= 10000) return { level: 6, name: '宗师', icon: '👑' };
  if (totalExp >= 6000) return { level: 5, name: '大师', icon: '🏆' };
  if (totalExp >= 3000) return { level: 4, name: '高手', icon: '🏅' };
  if (totalExp >= 1500) return { level: 3, name: '熟练者', icon: '⚔️' };
  if (totalExp >= 500) return { level: 2, name: '新手', icon: '🌿' };
  return { level: 1, name: '初学者', icon: '🌱' };
}
```

### 2.3 升级逻辑

```typescript
function checkLevelUp(currentExp: number, addedExp: number): LevelUpResult {
  const beforeLevel = calculateLevel(currentExp);
  const afterLevel = calculateLevel(currentExp + addedExp);

  if (afterLevel.level > beforeLevel.level) {
    return {
      leveledUp: true,
      from: beforeLevel,
      to: afterLevel,
      reward: {
        exp: addedExp,
        message: `恭喜升级到 ${afterLevel.name}!`
      }
    };
  }

  return {
    leveledUp: false,
    from: beforeLevel,
    to: beforeLevel,
    reward: { exp: addedExp }
  };
}
```

### 2.4 等级显示UI

**位置**: 游戏主界面顶部（用户信息区域）

**显示内容**:
- 等级徽章（图标）
- 等级名称（如"Lv5 大师"）
- 经验进度条（当前经验/下一级经验）

**UI示例**:
```
┌─────────────────────────────┐
│ 👑 Lv6 宗师                 │
│ ████████████████████░░ 85%  │
│ 8500/10000                   │
└─────────────────────────────┘
```

---

## 3. 成就系统设计

### 3.1 成就数据结构

```typescript
interface Achievement {
  // 基础信息
  id: string;                    // 成就唯一标识
  name: string;                  // 成就名称
  description: string;           // 成就描述
  icon: string;                  // 成就图标（emoji）
  category: AchievementCategory; // 成就分类

  // 解锁条件
  condition: AchievementCondition; // 解锁条件函数

  // 奖励
  reward: {
    exp: number;       // 经验值奖励
    coins?: number;    // 金币奖励（Week 8实现）
  };

  // 状态
  unlocked: boolean;    // 是否已解锁
  unlockedAt?: Date;   // 解锁时间
  progress?: number;   // 进度（用于渐进式成就）
  progressMax?: number; // 进度上限
}

type AchievementCategory = 'game' | 'skill' | 'collection';

type AchievementCondition =
  | { type: 'first_game' }
  | { type: 'first_win' }
  | { type: 'win_streak'; count: number }
  | { type: 'quick_win'; moves: number }
  | { type: 'perfect_defense' }
  | { type: 'games_played'; count: number }
  | { type: 'total_wins'; count: number }
  | { type: 'win_streak'; count: number }
  | { type: 'hints_used'; count: number }
  | { type: 'daily_login'; days: number };
```

### 3.2 成就定义（初始10个）

#### 对局成就（Game）

**1. 初出茅庐**
```typescript
{
  id: 'first_game',
  name: '初出茅庐',
  description: '完成第1局游戏',
  icon: '🎮',
  category: 'game',
  condition: { type: 'first_game' },
  reward: { exp: 50 }
}
```

**2. 首胜**
```typescript
{
  id: 'first_win',
  name: '首胜',
  description: '获得首次胜利',
  icon: '🎯',
  category: 'game',
  condition: { type: 'first_win' },
  reward: { exp: 100, coins: 50 }
}
```

**3. 连胜大师**
```typescript
{
  id: 'win_streak_5',
  name: '连胜大师',
  description: '达成5连胜',
  icon: '🔥',
  category: 'game',
  condition: { type: 'win_streak'; count: 5 },
  reward: { exp: 200, coins: 100 }
}
```

**4. 不败金身**
```typescript
{
  id: 'win_streak_10',
  name: '不败金身',
  description: '达成10连胜',
  icon: '🛡️',
  category: 'game',
  condition: { type: 'win_streak'; count: 10 },
  reward: { exp: 300, coins: 150 }
}
```

**5. 百战将**
```typescript
{
  id: 'games_100',
  name: '百战将',
  description: '完成100局游戏',
  icon: '⚔️',
  category: 'collection',
  condition: { type: 'games_played'; count: 100 },
  reward: { exp: 500, coins: 200 }
}
```

#### 技巧成就（Skill）

**6. 闪电战**
```typescript
{
  id: 'quick_win_10',
  name: '闪电战',
  description: '10步内获胜',
  icon: '⚡',
  category: 'skill',
  condition: { type: 'quick_win'; moves: 10 },
  reward: { exp: 150, coins: 50 }
}
```

**7. 完美防守**
```typescript
{
  id: 'perfect_defense',
  name: '完美防守',
  description: '未失一子获胜',
  icon: '🛡️',
  category: 'skill',
  condition: { type: 'perfect_defense' },
  reward: { exp: 200, coins: 100 }
}
```

#### 收集成就（Collection）

**8. 千胜王者**
```typescript
{
  id: 'wins_1000',
  name: '千胜王者',
  description: '累计获胜1000局',
  icon: '👑',
  category: 'collection',
  condition: { type: 'total_wins'; count: 1000 },
  reward: { exp: 1000, coins: 500 }
}
```

**9. 博学者**
```typescript
{
  id: 'hints_50',
  name: '博学者',
  description: '使用提示功能50次',
  icon: '📚',
  category: 'collection',
  condition: { type: 'hints_used'; count: 50 },
  reward: { exp: 200 }
}
```

**10. 坚持不懈**
```typescript
{
  id: 'daily_login_7',
  name: '坚持不懈',
  description: '连续7天登录',
  icon: '📅',
  category: 'collection',
  condition: { type: 'daily_login'; days: 7 },
  reward: { exp: 300, coins: 100 }
}
```

### 3.3 成就检测逻辑

```typescript
class AchievementService {
  // 检测成就在游戏结束时
  async checkGameEndAchievements(context: GameContext): Promise<Achievement[]> {
    const unlocked: Achievement[] = [];

    // 检测首胜
    if (context.result === 'win' && context.userStats.totalWins === 1) {
      unlocked.push(this.unlockAchievement('first_win'));
    }

    // 检测连胜成就
    if (context.currentStreak >= 5) {
      unlocked.push(this.unlockAchievement('win_streak_5'));
    }
    if (context.currentStreak >= 10) {
      unlocked.push(this.unlockAchievement('win_streak_10'));
    }

    // 检测闪电战
    if (context.result === 'win' && context.totalMoves <= 10) {
      unlocked.push(this.unlockAchievement('quick_win_10'));
    }

    // 检测完美防守
    if (context.result === 'win' && context.opponentPieces === 0) {
      unlocked.push(this.unlockAchievement('perfect_defense'));
    }

    return unlocked;
  }

  // 检测里程碑成就（游戏开始/结束时）
  async checkMilestoneAchievements(context: GameContext): Promise<Achievement[]> {
    const unlocked: Achievement[] = [];

    // 检测游戏局数
    if (context.userStats.totalGames === 1) {
      unlocked.push(this.unlockAchievement('first_game'));
    }
    if (context.userStats.totalGames === 100) {
      unlocked.push(this.unlockAchievement('games_100'));
    }

    // 检测胜利局数
    if (context.userStats.totalWins === 1000) {
      unlocked.push(this.unlockAchievement('wins_1000'));
    }

    return unlocked;
  }
}
```

### 3.4 成就解锁提示

**触发时机**: 成就解锁后立即显示

**UI组件**: `AchievementModal.tsx`

**显示内容**:
- 成就图标（放大动画）
- 成就名称
- 成就描述
- 奖励信息
- "确定"按钮

**UI示例**:
```
┌─────────────────────────────┐
│         🎯 首胜              │
│   获得首次胜利              │
│                            │
│   奖励：                     │
│   • 经验值 +100             │
│   • 金币 +50                │
│                            │
│      [ 确定 ]              │
└─────────────────────────────┘
```

**动画效果**:
- 图标从0.5倍放大到1.2倍再缩小到1.0倍
- 背景淡入淡出（1秒）
- 金币/经验值数字滚动效果

---

## 4. 成就列表页面设计

### 4.1 页面布局

**路由**: `/achievements`

**页面结构**:
```
┌─────────────────────────────────────┐
│         🏆 我的成就                 │
├─────────────────────────────────────┤
│  分类筛选: [全部] [对局] [技巧] [收集] │
├─────────────────────────────────────┤
│                                     │
│  已解锁 (3/10)                       │
│  ┌─────────────────────────────┐   │
│  │ 🎯 首胜                    │   │
│  │ 获得首次胜利  2026-03-25    │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🔥 连胜大师                 │   │
│  │ 达成5连胜    2026-03-25    │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ ⚡ 闪电战                   │   │
│  │ 10步内获胜   2026-03-25    │   │
│  └─────────────────────────────┘   │
│                                     │
│  未解锁 (7/10)                       │
│  ┌─────────────────────────────┐   │
│  │ ⚔️ 百战将 (灰)               │   │
│  │ 完成100局游戏  0/100        │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 👑 千胜王者 (灰)             │   │
│  │ 累计获胜1000局  0/1000      │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### 4.2 成就详情

**点击成就后显示详情**:
```
┌─────────────────────────────────────┐
│         ⚡ 闪电战                 │
├─────────────────────────────────────┤
│  描述：10步内获胜                  │
│  分类：技巧成就                     │
│  状态：✅ 已解锁                   │
│  解锁时间：2026-03-25 09:30       │
│                                     │
│  奖励：                             │
│  • 经验值 +150                     │
│  • 金币 +50                        │
│                                     │
│  [ 返回 ]                          │
└─────────────────────────────────────┘
```

---

## 5. 用户数据存储设计

### 5.1 用户数据结构

```typescript
interface UserData {
  // 经验值和等级
  exp: number;
  level: number;

  // 成就数据
  achievements: {
    [id: string]: {
      unlocked: boolean;
      unlockedAt?: Date;
      progress?: number;
    }
  };

  // 统计数据
  stats: {
    totalGames: number;
    totalWins: number;
    totalLosses: number;
    totalDraws: number;
    currentStreak: number;
    maxWinStreak: number;
    hintsUsed: number;
  };

  // 连续登录
  dailyLogin: {
    lastLoginDate: string;
    consecutiveDays: number;
  };

  // 设置
  settings: {
    soundEnabled: boolean;
    theme: string;
  };
}
```

### 5.2 存储键值

```typescript
const STORAGE_KEYS = {
  USER_DATA: 'gobang_user_data',
  DAILY_LOGIN: 'gobang_daily_login',
};
```

### 5.3 数据迁移

**版本控制**:
```typescript
interface UserData {
  version: 1; // 数据版本号
  // ... 其他字段
}
```

**迁移逻辑**:
```typescript
function migrateUserData(data: any): UserData {
  if (!data.version) {
    // v0 → v1: 添加默认值
    return {
      version: 1,
      exp: data.exp || 0,
      achievements: data.achievements || {},
      // ... 其他字段
    };
  }
  return data;
}
```

---

## 6. 与现有系统集成

### 6.1 游戏结束流程扩展

**现有流程** (Week 1-6):
```
游戏结束 → 判断胜负 → 显示结果 → 重置
```

**新流程** (Week 7+):
```
游戏结束 → 判断胜负 → 计算经验值 → 检查等级升级 → 检查成就 → 显示结果 → 保存数据
```

**实现位置**: `src/store/game-store.ts` 的 `endGame` 方法

### 6.2 游戏主界面扩展

**新增UI元素**:
- 顶部用户信息栏：显示等级徽章、经验条
- 成就入口：导航菜单添加"成就"选项
- 升级提示：升级时显示弹窗

### 6.3 状态管理扩展

**新增store**: `src/store/user-store.ts`

**职责**:
- 管理用户数据（经验、等级、成就）
- 提供经验值计算方法
- 提供等级检查方法
- 提供成就检测方法

**与game-store的集成**:
```typescript
// game-store.ts
import { useUserStore } from './user-store';

const endGame = (result: GameResult) => {
  // 原有逻辑
  // ...

  // 新增逻辑：经验值和成就
  const { addExp, checkAchievements } = useUserStore();

  // 计算和添加经验值
  addExp(result, currentStreak);

  // 检查成就
  checkAchievements(gameContext);
};
```

---

## 7. 技术实现要点

### 7.1 成就检测时机

**检测点**:
1. **游戏结束时**:
   - 对局成就（首胜、连胜、闪电战等）
   - 技巧成就（完美防守等）
2. **游戏开始前**:
   - 里程碑成就（百战将、千胜王者）

### 7.2 成就解锁流程

```
检测条件 → 条件满足 → 标记已解锁 → 保存数据 → 显示弹窗 → 发放奖励
```

### 7.3 进度追踪（可选）

对于渐进式成就（如"千胜王者"），需要追踪进度：

```typescript
interface Achievement {
  // ...
  progress?: number;    // 当前进度
  progressMax?: number; // 进度上限
}

// 千胜王者的进度追踪
{
  id: 'wins_1000',
  progress: 150,     // 已获胜150局
  progressMax: 1000,  // 目标1000局
}
```

### 7.4 性能优化

**策略**:
- 成就检测异步处理（不阻塞游戏）
- 成就解锁延迟显示（避免影响游戏流程）
- 条件检查优化（先检查简单条件）

---

## 8. 测试要点

### 8.1 经验值计算测试
- [ ] 胜利经验计算正确
- [ ] 失败经验计算正确
- [ ] 和棋经验计算正确
- [ ] 连胜奖励计算正确
- [ ] 连胜中断后重置正确

### 8.2 等级系统测试
- [ ] 等级计算正确（所有6个等级）
- [ ] 升级逻辑正确
- [ ] 等级上限正确（不超过Lv6）
- [ ] 经验条显示正确

### 8.3 成就系统测试
- [ ] 成就定义完整（10个）
- [ ] 成就检测逻辑正确
- [ ] 成就解锁条件判断正确
- [ ] 成就弹窗显示正确
- [ ] 成就列表页面正确
- [ ] 成就进度追踪正确（如有）

### 8.4 集成测试
- [ ] 与Week 1-6功能集成正确
- [ ] 不影响现有游戏流程
- [ ] 不影响AI性能
- [ ] 存储和加载数据正确

---

## 9. UI/UX设计要点

### 9.1 成就解锁弹窗

**设计原则**:
- 不干扰游戏流程
- 可关闭（ESC键或点击背景）
- 动画流畅（1-2秒）
- 视觉吸引（图标放大、粒子效果）

**时机**:
- 游戏结束结算后显示
- 可连续弹出多个成就（队列显示）

### 9.2 等级升级提示

**设计原则**:
- 简洁明了（1秒弹窗）
- 突出等级提升（图标对比）
- 鼓励用户继续游戏

**时机**:
- 经验值增加导致等级提升时立即显示

### 9.3 成就列表页面

**设计原则**:
- 清晰分类（对局/技巧/收集）
- 视觉区分（已解锁高亮，未解锁置灰）
- 进度显示（对于渐进式成就）

---

## 10. 后续扩展规划

### Week 8扩展（金币+任务+商城）
- 成就奖励中添加金币
- 任务系统与成就系统联动
- 商城可使用金币购买皮肤

### 未来扩展
- 更多成就类型（特殊玩法成就）
- 成就分享功能（社交媒体）
- 成就排行榜（全球/好友）

---

**文档状态**: ✅ PL文档创建完成
**下一步**: QA设计测试用例
