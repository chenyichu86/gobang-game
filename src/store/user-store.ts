/**
 * 用户状态管理Store
 * Week 7: 用户成长系统
 */

import { create } from 'zustand';
import type { UserData, GameResult, GameContext, Level, LevelUpResult, Achievement, UserStats } from '../types/user';
import { UserStorageService } from '../services/user-storage-service';
import { ExpService } from '../services/exp-service';
import { AchievementService } from '../services/achievement-service';
import { calculateLevel, checkLevelUp } from '../utils/level-utils';
import { persistenceService } from '../services/persistence-service';
import { STORAGE_KEYS } from '../types/storage';

interface UserState {
  // 数据服务
  storageService: UserStorageService;
  expService: ExpService;
  achievementService: AchievementService;
  persistenceService: typeof persistenceService;

  // 用户数据
  exp: number;
  level: number;
  levelInfo: Level;
  achievements: Record<string, { unlocked: boolean; unlockedAt?: Date }>;
  stats: UserStats;
  dailyLogin: {
    lastLoginDate: string;
    consecutiveDays: number;
  };
  settings: {
    soundEnabled: boolean;
    theme: string;
  };

  // Week 8: 金币系统
  coins: number;
  totalEarned: number;
  totalSpent: number;

  // Week 8: 任务系统
  tasks: any[];

  // Week 8: 签到系统
  checkInData: {
    lastCheckInDate: string;
    consecutiveDays: number;
    totalCheckInDays: number;
  };

  // Week 8: 商城系统
  unlockedSkins: string[];
  currentBoardSkin: string;
  currentPieceSkin: string;

  // 初始化
  initialize: () => void;

  // 经验值相关
  addExp: (result: GameResult, streak: number) => LevelUpResult | null;
  getTotalExp: () => number;

  // 等级相关
  getCurrentLevel: () => Level;
  getLevelProgress: () => number;

  // 成就相关
  checkAchievements: (context: GameContext) => Achievement[];
  checkMilestoneAchievements: (context: GameContext) => Achievement[];
  unlockAchievement: (id: string) => Achievement | null;
  isUnlocked: (id: string) => boolean;
  getAllAchievements: () => Achievement[];
  getUnlockedAchievements: () => Achievement[];
  getLockedAchievements: () => Achievement[];
  getAchievementStats: () => { total: number; unlocked: number; percentage: number };

  // 统计数据
  updateStats: (result: GameResult, moves: number, opponentPieces: number) => void;
  incrementHintUsage: () => void;

  // Week 9.1: 设置金币（测试用）
  setCoins: (coins: number) => void;

  // 保存数据
  saveData: () => void;

  // 重置数据
  resetData: () => void;

  // Week 9.1: 测试用重置方法
  reset: () => void;
}

export const useUserStore = create<UserState>((set, get) => {
  // 初始化服务实例
  const storageService = new UserStorageService();
  const expService = new ExpService();

  // 加载初始数据
  const initialData = storageService.getUserData();
  expService.setExp(initialData.exp);

  // 初始化成就服务（已解锁的成就）
  const unlockedIds = new Set(
    Object.entries(initialData.achievements)
      .filter(([_, data]) => data.unlocked)
      .map(([id, _]) => id)
  );

  // Week 8: 初始化金币、任务、签到、商城数据
  const initialCoins = (initialData as any).coins || 0;
  const initialTasks = (initialData as any).tasks || [];
  const initialCheckInData = (initialData as any).checkInData || {
    lastCheckInDate: '',
    consecutiveDays: 0,
    totalCheckInDays: 0,
  };
  const initialUnlockedSkins = (initialData as any).unlockedSkins || ['classic_board', 'classic_piece'];
  const initialCurrentBoardSkin = (initialData as any).currentBoardSkin || 'classic_board';
  const initialCurrentPieceSkin = (initialData as any).currentPieceSkin || 'classic_piece';
  const achievementService = new AchievementService(unlockedIds);

  return {
    // 服务实例
    storageService,
    expService,
    achievementService,
    persistenceService,

    // 初始状态
    exp: initialData.exp,
    level: initialData.level,
    levelInfo: calculateLevel(initialData.exp),
    achievements: initialData.achievements,
    stats: initialData.stats,
    dailyLogin: initialData.dailyLogin,
    settings: initialData.settings,

    // Week 8: 金币系统
    coins: initialCoins,
    totalEarned: 0,
    totalSpent: 0,

    // Week 8: 任务系统
    tasks: initialTasks,

    // Week 8: 签到系统
    checkInData: initialCheckInData,

    // Week 8: 商城系统
    unlockedSkins: initialUnlockedSkins,
    currentBoardSkin: initialCurrentBoardSkin,
    currentPieceSkin: initialCurrentPieceSkin,

    /**
     * 初始化用户数据
     */
    initialize: () => {
      const data = storageService.getUserData();
      expService.setExp(data.exp);

      const unlockedIds = new Set(
        Object.entries(data.achievements)
          .filter(([_, val]) => val.unlocked)
          .map(([id, _]) => id)
      );

      set({
        exp: data.exp,
        level: data.level,
        levelInfo: calculateLevel(data.exp),
        achievements: data.achievements,
        stats: data.stats,
        dailyLogin: data.dailyLogin,
        settings: data.settings,

        // Week 8: 初始化（如果数据中不存在，使用默认值）
        coins: (data as any).coins || 0,
        totalEarned: (data as any).totalEarned || 0,
        totalSpent: (data as any).totalSpent || 0,
        tasks: (data as any).tasks || [],
        checkInData: (data as any).checkInData || {
          lastCheckInDate: '',
          consecutiveDays: 0,
          totalCheckInDays: 0,
        },
        unlockedSkins: (data as any).unlockedSkins || ['classic_board', 'classic_piece'],
        currentBoardSkin: (data as any).currentBoardSkin || 'classic_board',
        currentPieceSkin: (data as any).currentPieceSkin || 'classic_piece',
      });
    },

    /**
     * 添加经验值
     */
    addExp: (result: GameResult, streak: number) => {
      const state = get();

      // Week 9.1修复：如果state.exp被直接修改（如测试场景），同步到expService
      const currentServiceExp = state.expService.getTotalExp();
      if (state.exp !== currentServiceExp) {
        state.expService.setExp(state.exp);
      }

      const expGain = state.expService.calculateExpGain(result, streak);
      const oldExp = state.expService.getTotalExp();
      const newExp = state.expService.addExp(expGain);

      // 检查是否升级
      const levelUpResult = checkLevelUp(oldExp, expGain);

      // 更新状态
      set({
        exp: newExp,
        level: levelUpResult.to.level,
        levelInfo: levelUpResult.to,
      });

      // 保存数据
      state.saveData();

      return levelUpResult;
    },

    /**
     * 获取总经验值
     */
    getTotalExp: () => {
      return get().expService.getTotalExp();
    },

    /**
     * 获取当前等级信息
     */
    getCurrentLevel: () => {
      return get().levelInfo;
    },

    /**
     * 获取等级进度百分比
     */
    getLevelProgress: () => {
      const exp = get().exp;
      const currentLevel = calculateLevel(exp);

      if (currentLevel.level >= 6) {
        return 100;
      }

      // 计算当前等级到下一级的进度
      const thresholds = [0, 500, 1500, 3000, 6000, 10000];
      const currentThreshold = thresholds[currentLevel.level - 1];
      const nextThreshold = thresholds[currentLevel.level];
      const progress = ((exp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

      return Math.min(100, Math.max(0, progress));
    },

    /**
     * 检查游戏结束成就
     */
    checkAchievements: (context: GameContext) => {
      const state = get();
      const unlocked = state.achievementService.checkGameEndAchievements(context);

      if (unlocked.length > 0) {
        // 更新成就状态
        const newAchievements = { ...state.achievements };
        unlocked.forEach(a => {
          if (a.id) {
            newAchievements[a.id] = {
              unlocked: true,
              unlockedAt: new Date(),
            };
          }
        });

        set({ achievements: newAchievements });
        state.saveData();
      }

      return unlocked;
    },

    /**
     * 检查里程碑成就
     */
    checkMilestoneAchievements: (context: GameContext) => {
      const state = get();
      const unlocked = state.achievementService.checkMilestoneAchievements(context);

      if (unlocked.length > 0) {
        // 更新成就状态
        const newAchievements = { ...state.achievements };
        unlocked.forEach(a => {
          if (a.id) {
            newAchievements[a.id] = {
              unlocked: true,
              unlockedAt: new Date(),
            };
          }
        });

        set({ achievements: newAchievements });
        state.saveData();
      }

      return unlocked;
    },

    /**
     * 手动解锁成就
     */
    unlockAchievement: (id: string) => {
      const state = get();
      const achievement = state.achievementService.unlockAchievement(id);

      if (achievement) {
        const newAchievements = {
          ...state.achievements,
          [id]: {
            unlocked: true,
            unlockedAt: new Date(),
          },
        };

        set({ achievements: newAchievements });
        state.saveData();
      }

      return achievement;
    },

    /**
     * 检查成就是否已解锁
     */
    isUnlocked: (id: string) => {
      return get().achievementService.isUnlocked(id);
    },

    /**
     * 获取所有成就
     */
    getAllAchievements: () => {
      return get().achievementService.getAllAchievements();
    },

    /**
     * 获取已解锁的成就
     */
    getUnlockedAchievements: () => {
      return get().achievementService.getUnlockedAchievements();
    },

    /**
     * 获取未解锁的成就
     */
    getLockedAchievements: () => {
      return get().achievementService.getLockedAchievements();
    },

    /**
     * 获取成就统计
     */
    getAchievementStats: () => {
      return get().achievementService.getAchievementStats();
    },

    /**
     * 更新统计数据
     */
    updateStats: (result: GameResult, moves: number, opponentPieces: number) => {
      const state = get();
      const newStats = { ...state.stats };

      newStats.totalGames += 1;

      if (result === 'win') {
        newStats.totalWins += 1;
        newStats.currentStreak += 1;
        newStats.maxWinStreak = Math.max(newStats.maxWinStreak, newStats.currentStreak);
      } else if (result === 'lose') {
        newStats.totalLosses += 1;
        newStats.currentStreak = 0;
      } else {
        newStats.totalDraws += 1;
        newStats.currentStreak = 0;
      }

      set({ stats: newStats });
      state.saveData();
    },

    /**
     * 增加提示使用次数
     */
    incrementHintUsage: () => {
      const state = get();
      const newStats = { ...state.stats };
      newStats.hintsUsed += 1;

      set({ stats: newStats });

      // 检查博学者成就
      const context: GameContext = {
        userStats: newStats,
      };
      state.achievementService.checkMilestoneAchievements(context);

      state.saveData();
    },

    /**
     * 保存数据
     */
    saveData: () => {
      const state = get();
      const data: UserData = {
        version: 1,
        exp: state.exp,
        level: state.level,
        achievements: state.achievements,
        stats: state.stats,
        dailyLogin: state.dailyLogin,
        settings: state.settings,
      };

      state.storageService.saveUserData(data);
    },

    /**
     * 重置数据
     */
    resetData: () => {
      const defaultData = storageService.getUserData();

      expService.setExp(defaultData.exp);

      set({
        exp: defaultData.exp,
        level: defaultData.level,
        levelInfo: calculateLevel(defaultData.exp),
        achievements: defaultData.achievements,
        stats: defaultData.stats,
        dailyLogin: defaultData.dailyLogin,
        settings: defaultData.settings,
      });

      storageService.clearUserData();
    },

    /**
     * Week 9.1: 测试用重置方法
     */
    reset: () => {
      // 清除所有存储的数据
      storageService.clearUserData();
      localStorage.removeItem('gobang_user_data_v2');

      // 重置经验服务
      expService.setExp(0);

      // 生成默认任务并直接设置状态（不依赖getUserData的缓存）
      const defaultTasks = [
        {
          id: 'daily_games_3',
          name: '游戏达人',
          description: '完成3局游戏',
          type: 'daily',
          reward: { coins: 30 },
          target: 3,
          progress: 0,
          completed: false,
          claimed: false,
          condition: { type: 'games_played', count: 3 },
        },
        {
          id: 'daily_win_1',
          name: '胜利者',
          description: '获得1局胜利',
          type: 'daily',
          reward: { coins: 50 },
          target: 1,
          progress: 0,
          completed: false,
          claimed: false,
          condition: { type: 'wins', count: 1 },
        },
        {
          id: 'daily_play_3',
          name: '游戏达人',
          description: '完成3局游戏',
          type: 'daily',
          reward: { coins: 30 },
          target: 3,
          progress: 0,
          completed: false,
          claimed: false,
          condition: { type: 'games_played', count: 3 },
        },
        {
          id: 'daily_hint_1',
          name: '博学先锋',
          description: '使用1次提示',
          type: 'daily',
          reward: { coins: 20 },
          target: 1,
          progress: 0,
          completed: false,
          claimed: false,
          condition: { type: 'hints_used', count: 1 },
        },
      ];

      // 直接set()重置状态到默认值，不依赖缓存
      set({
        exp: 0,
        level: 1,
        levelInfo: calculateLevel(0),
        achievements: [],
        stats: {
          totalGames: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          currentStreak: 0,
          maxStreak: 0,
          hintsUsed: 0,
        },
        dailyLogin: {
          lastLoginDate: '',
          consecutiveDays: 0,
          totalLoginDays: 0,
        },
        settings: { soundEnabled: true, theme: 'light' },
        coins: 0,  // Week 8: 默认0金币
        totalEarned: 0,
        totalSpent: 0,
        tasks: defaultTasks,
        checkInData: {
          lastCheckInDate: '',
          consecutiveDays: 0,
          totalCheckInDays: 0,
        },
        unlockedSkins: ['classic_board', 'classic_piece'],
        currentBoardSkin: 'classic_board',
        currentPieceSkin: 'classic_piece',
      });
    },

    // ========== Week 8: 金币系统 ==========

    /**
     * 添加金币
     */
    addCoins: (amount: number) => {
      const state = get();

      // Week 9.1修复：强制从store重新读取最新状态（处理测试中的直接赋值）
      const freshState = get();
      const newCoins = freshState.coins + amount;
      const newTotalEarned = freshState.totalEarned + amount;

      set((prevState) => ({
        ...prevState,
        coins: newCoins,
        totalEarned: newTotalEarned,
      }));

      // Week 9.1: 自动保存数据（直接调用，不依赖state中的persistenceService）
      const userData = {
        version: 2,
        exp: state.exp,
        level: state.level,
        achievements: state.achievements,
        stats: state.stats,
        dailyLogin: state.dailyLogin,
        settings: state.settings,
        coins: newCoins,
        totalEarned: newTotalEarned,
        totalSpent: state.totalSpent,
        tasks: state.tasks,
        checkInData: state.checkInData,
        unlockedSkins: state.unlockedSkins,
        currentBoardSkin: state.currentBoardSkin,
        currentPieceSkin: state.currentPieceSkin,
        lastSaveTime: Date.now(),
      };

      // 直接使用persistenceService
      const { persistenceService: ps } = (state as any);
      if (ps && typeof ps.save === 'function') {
        try {
          ps.save('gobang_user_data_v2', userData);
        } catch (error) {
          console.error('Failed to save user data:', error);
        }
      }
    },

    /**
     * 花费金币
     */
    spendCoins: (amount: number): boolean => {
      const state = get();
      if (state.coins < amount) return false;

      set({
        coins: state.coins - amount,
        totalSpent: state.totalSpent + amount,
      });
      return true;
    },

    // ========== Week 8: 任务系统 ==========

    /**
     * 检查任务进度
     */
    checkTaskProgress: (action: any) => {
      const state = get();
      const updatedTasks = state.tasks.map((task: any) => {
        if (task.claimed) return task;

        // 检查是否匹配任务条件
        let shouldIncrement = false;
        if (action === 'game_end' || action === 'win' || action === 'lose' || action === 'draw') {
          if (task.id === 'daily_games_3' || task.id === 'daily_play_3') shouldIncrement = true;
          if (task.id === 'daily_win_1' && action === 'win') shouldIncrement = true;
        }
        if (action === 'hint_used' && task.id === 'daily_hint_1') shouldIncrement = true;

        // 更新进度
        if (shouldIncrement) {
          const newProgress = Math.min(task.progress + 1, task.target);
          const completed = newProgress >= task.target;

          return {
            ...task,
            progress: newProgress,
            completed,
          };
        }

        return task;
      });

      set({ tasks: updatedTasks });
    },

    /**
     * 领取任务奖励
     */
    claimTaskReward: (taskId: string) => {
      const state = get();
      const task = state.tasks.find((t: any) => t.id === taskId);

      if (!task || !task.completed || task.claimed) {
        return { success: false, error: 'not_ready' };
      }

      // 发放奖励
      addCoins(task.reward.coins);
      task.claimed = true;

      set({ tasks: [...state.tasks] });
      return { success: true, reward: task.reward };
    },

    // ========== Week 8: 签到系统 ==========

    /**
     * 每日签到
     */
    checkIn: () => {
      const state = get();
      const today = new Date().toDateString();

      // 检查今天是否已签到
      if (state.checkInData.lastCheckInDate === today) {
        return { success: false, error: 'already_checked_in' };
      }

      // 计算连续签到天数
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const consecutiveDays =
        state.checkInData.lastCheckInDate === yesterday
          ? state.checkInData.consecutiveDays + 1
          : 1;

      // 计算奖励
      const baseReward = 50;
      const bonus = consecutiveDays === 7 ? 100 : 0;
      const totalReward = baseReward + bonus;

      // 更新签到数据
      const checkInHistory = (state.checkInData as any).checkInHistory || [];
      checkInHistory.push(today);

      set({
        checkInData: {
          lastCheckInDate: today,
          consecutiveDays,
          totalCheckInDays: state.checkInData.totalCheckInDays + 1,
          checkInHistory,
        } as any,
      });

      // 添加金币
      addCoins(totalReward);

      return {
        success: true,
        reward: totalReward,
        consecutiveDays,
        bonus: bonus || undefined,
      };
    },

    // ========== Week 8: 商城系统 ==========

    /**
     * 购买皮肤
     */
    purchaseSkin: (skinId: string) => {
      const state = get();

      // 检查是否已拥有
      if (state.unlockedSkins.includes(skinId)) {
        return { success: false, error: 'already_owned' };
      }

      // 从ShopService获取皮肤价格
      // 这里简化处理，实际应该从ShopService获取
      const prices: Record<string, number> = {
        ocean_board: 200,
        magma_board: 1000,
        starry_board: 1500,
        dragon_board: 3000,
        jade_piece: 100,
        gold_piece: 800,
        frost_piece: 1200,
        phoenix_piece: 2500,
      };

      const price = prices[skinId];
      if (!price) return { success: false, error: 'item_not_found' };

      // 检查金币余额
      if (state.coins < price) {
        return { success: false, error: 'insufficient_coins' };
      }

      // 扣除金币
      spendCoins(price);

      // 解锁皮肤
      const newUnlockedSkins = [...state.unlockedSkins, skinId];
      set({ unlockedSkins: newUnlockedSkins });

      return { success: true };
    },

    /**
     * 应用皮肤
     */
    applySkin: (skinId: string, type: 'board' | 'piece') => {
      const state = get();

      if (!state.unlockedSkins.includes(skinId)) {
        throw new Error('Skin not owned');
      }

      if (type === 'board') {
        set({ currentBoardSkin: skinId });
      } else {
        set({ currentPieceSkin: skinId });
      }
    },
  };
});
