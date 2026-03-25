/**
 * 经济系统类型定义
 * Week 8: 金币系统
 */

/**
 * 游戏结果
 */
export type GameResult = 'win' | 'lose' | 'draw';

/**
 * 金币数据
 */
export interface CoinData {
  coins: number;           // 当前金币数量
  totalEarned: number;    // 累计获得金币
  totalSpent: number;     // 累计消费金币
}

/**
 * 签到数据
 */
export interface CheckInData {
  lastCheckInDate: string;  // 上次签到日期 (YYYY-MM-DD)
  consecutiveDays: number;  // 连续签到天数
  totalCheckInDays: number; // 累计签到天数
}

/**
 * 签到结果
 */
export interface CheckInResult {
  success: boolean;
  reward?: number;
  consecutiveDays?: number;
  bonus?: number;
  error?: 'already_checked_in' | 'system_error';
}

/**
 * 成就奖励
 */
export interface AchievementReward {
  coins: number;
  exp?: number;
  skinId?: string;
}
