/**
 * 等级系统工具函数
 * Week 7: 用户成长系统
 */

import type { Level, LevelUpResult } from '../types/user';
import { MAX_LEVEL, MAX_EXP, getLevelThreshold, getNextLevelThreshold, getLevelInfo } from '../constants/levels';

/**
 * 根据总经验值计算当前等级
 */
export function calculateLevel(totalExp: number): Level {
  // 确保经验值在有效范围内
  const exp = Math.min(Math.max(0, totalExp), MAX_EXP);

  // 从高到低检查等级
  if (exp >= 10000) return getLevelInfo(6);
  if (exp >= 6000) return getLevelInfo(5);
  if (exp >= 3000) return getLevelInfo(4);
  if (exp >= 1500) return getLevelInfo(3);
  if (exp >= 500) return getLevelInfo(2);
  return getLevelInfo(1);
}

/**
 * 检查是否升级
 */
export function checkLevelUp(currentExp: number, addedExp: number): LevelUpResult {
  const beforeLevel = calculateLevel(currentExp);
  const afterLevel = calculateLevel(currentExp + addedExp);

  if (afterLevel.level > beforeLevel.level) {
    return {
      leveledUp: true,
      from: beforeLevel,
      to: afterLevel,
      reward: {
        exp: addedExp,
        message: `恭喜升级到 ${afterLevel.name}!`,
      },
    };
  }

  return {
    leveledUp: false,
    from: beforeLevel,
    to: beforeLevel,
    reward: { exp: addedExp },
  };
}

/**
 * 计算当前等级的进度百分比
 */
export function calculateLevelProgress(currentExp: number): number {
  const currentLevel = calculateLevel(currentExp);
  if (currentLevel.level >= MAX_LEVEL) {
    return 100;
  }

  const currentLevelThreshold = getLevelThreshold(currentLevel.level);
  const nextLevelThreshold = getNextLevelThreshold(currentLevel.level);
  const expInRange = currentExp - currentLevelThreshold;
  const totalExpInRange = nextLevelThreshold - currentLevelThreshold;

  return Math.min(100, Math.max(0, (expInRange / totalExpInRange) * 100));
}

/**
 * 计算到下一级还需要多少经验
 */
export function calculateExpToNextLevel(currentExp: number): number {
  const currentLevel = calculateLevel(currentExp);
  if (currentLevel.level >= MAX_LEVEL) {
    return 0;
  }

  const nextLevelThreshold = getNextLevelThreshold(currentLevel.level);
  return Math.max(0, nextLevelThreshold - currentExp);
}
