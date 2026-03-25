/**
 * 用户数据类型定义
 * Week 7: 用户成长系统
 */

/**
 * 用户数据结构
 */
export interface UserData {
  // 数据版本
  version: number;

  // 经验值和等级
  exp: number;
  level: number;

  // 成就数据
  achievements: Record<string, AchievementProgress>;

  // 统计数据
  stats: UserStats;

  // 连续登录
  dailyLogin: DailyLoginInfo;

  // 设置
  settings: UserSettings;
}

/**
 * 成就进度
 */
export interface AchievementProgress {
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number;
  progressMax?: number;
}

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
 * 连续登录信息
 */
export interface DailyLoginInfo {
  lastLoginDate: string; // YYYY-MM-DD格式
  consecutiveDays: number;
}

/**
 * 用户设置
 */
export interface UserSettings {
  soundEnabled: boolean;
  theme: string;
}

/**
 * 等级信息
 */
export interface Level {
  level: number;
  name: string;
  icon: string;
}

/**
 * 升级结果
 */
export interface LevelUpResult {
  leveledUp: boolean;
  from: Level;
  to: Level;
  reward: {
    exp: number;
    message?: string;
  };
}

/**
 * 游戏结果类型
 */
export type GameResult = 'win' | 'lose' | 'draw';

/**
 * 成就分类
 */
export type AchievementCategory = 'game' | 'skill' | 'collection';

/**
 * 成就条件
 */
export type AchievementCondition =
  | { type: 'first_game' }
  | { type: 'first_win' }
  | { type: 'win_streak'; count: number }
  | { type: 'quick_win'; moves: number }
  | { type: 'perfect_defense' }
  | { type: 'games_played'; count: number }
  | { type: 'total_wins'; count: number }
  | { type: 'hints_used'; count: number }
  | { type: 'daily_login'; days: number };

/**
 * 成就定义
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  condition: AchievementCondition;
  reward: {
    exp: number;
    coins?: number;
  };
  unlocked?: boolean;
  unlockedAt?: Date;
  progress?: number;
  progressMax?: number;
}

/**
 * 游戏上下文（用于成就检测）
 */
export interface GameContext {
  result?: GameResult;
  totalMoves?: number;
  opponentPieces?: number;
  currentStreak?: number;
  userStats: UserStats;
}
