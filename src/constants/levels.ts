/**
 * 等级系统常量
 * Week 7: 用户成长系统
 */

import type { Level } from '../types/user';

/**
 * 等级阈值配置
 */
export const LEVEL_THRESHOLDS = [
  { level: 1, name: '初学者', icon: '🌱', exp: 0 },
  { level: 2, name: '新手', icon: '🌿', exp: 500 },
  { level: 3, name: '熟练者', icon: '⚔️', exp: 1500 },
  { level: 4, name: '高手', icon: '🏅', exp: 3000 },
  { level: 5, name: '大师', icon: '🏆', exp: 6000 },
  { level: 6, name: '宗师', icon: '👑', exp: 10000 },
] as const;

/**
 * 最大等级
 */
export const MAX_LEVEL = 6;

/**
 * 最大经验值
 */
export const MAX_EXP = 10000;

/**
 * 获取指定等级的阈值经验值
 */
export function getLevelThreshold(level: number): number {
  if (level < 1 || level > MAX_LEVEL) {
    return MAX_EXP;
  }
  return LEVEL_THRESHOLDS[level - 1].exp;
}

/**
 * 获取下一等级的阈值经验值
 */
export function getNextLevelThreshold(currentLevel: number): number {
  if (currentLevel >= MAX_LEVEL) {
    return MAX_EXP;
  }
  return LEVEL_THRESHOLDS[currentLevel].exp;
}

/**
 * 获取等级信息
 */
export function getLevelInfo(level: number): Level {
  if (level < 1) level = 1;
  if (level > MAX_LEVEL) level = MAX_LEVEL;

  const info = LEVEL_THRESHOLDS[level - 1];
  return {
    level: info.level,
    name: info.name,
    icon: info.icon,
  };
}
