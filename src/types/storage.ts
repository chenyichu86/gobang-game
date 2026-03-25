/**
 * Week 9: 数据持久化类型定义
 */

/**
 * 用户统计数据
 */
export interface UserStats {
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  currentStreak: number;
  maxWinStreak: number;
  hintsUsed: number;
}

/**
 * 成就进度
 */
export interface AchievementProgress {
  unlocked: boolean;
  unlockedAt?: Date;
}

/**
 * 签到数据
 */
export interface CheckInData {
  lastCheckInDate: string;
  consecutiveDays: number;
  totalCheckInDays: number;
  checkInHistory?: string[];
}

/**
 * 用户数据 V2 版本
 */
export interface UserDataV2 {
  version: 2;

  // Week 7: 经验值和等级
  exp: number;
  level: number;

  // Week 7: 成就
  achievements: Record<string, AchievementProgress>;

  // Week 7: 统计数据
  stats: UserStats;

  // Week 8: 金币系统
  coins: number;
  totalEarned: number;
  totalSpent: number;

  // Week 8: 签到系统
  checkInData: CheckInData;

  // Week 8: 商城系统
  unlockedSkins: string[];
  currentBoardSkin: string;
  currentPieceSkin: string;

  // Week 9: 数据持久化
  lastSaveTime: number;
}

/**
 * LocalStorage 键值常量
 */
export const STORAGE_KEYS = {
  USER_DATA: 'gobang_user_data_v2',
  TASKS: 'gobang_tasks_v2',
  CHECK_IN: 'gobang_check_in_v2',
  SHOP: 'gobang_shop_v2',
} as const;
