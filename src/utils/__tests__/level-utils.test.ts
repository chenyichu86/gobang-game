/**
 * LevelUtils 测试
 * Week 7: 等级系统测试
 */

import { describe, it, expect } from 'vitest';
import { calculateLevel, checkLevelUp, calculateLevelProgress, calculateExpToNextLevel } from '../level-utils';

describe('LevelUtils - 等级计算', () => {
  it('0经验应返回Lv1初学者', () => {
    const level = calculateLevel(0);
    expect(level.level).toBe(1);
    expect(level.name).toBe('初学者');
    expect(level.icon).toBe('🌱');
  });

  it('500经验应返回Lv2新手', () => {
    const level = calculateLevel(500);
    expect(level.level).toBe(2);
    expect(level.name).toBe('新手');
    expect(level.icon).toBe('🌿');
  });

  it('1500经验应返回Lv3熟练者', () => {
    const level = calculateLevel(1500);
    expect(level.level).toBe(3);
    expect(level.name).toBe('熟练者');
    expect(level.icon).toBe('⚔️');
  });

  it('3000经验应返回Lv4高手', () => {
    const level = calculateLevel(3000);
    expect(level.level).toBe(4);
    expect(level.name).toBe('高手');
    expect(level.icon).toBe('🏅');
  });

  it('6000经验应返回Lv5大师', () => {
    const level = calculateLevel(6000);
    expect(level.level).toBe(5);
    expect(level.name).toBe('大师');
    expect(level.icon).toBe('🏆');
  });

  it('10000经验应返回Lv6宗师', () => {
    const level = calculateLevel(10000);
    expect(level.level).toBe(6);
    expect(level.name).toBe('宗师');
    expect(level.icon).toBe('👑');
  });

  it('超过10000经验应仍返回Lv6宗师', () => {
    const level = calculateLevel(15000);
    expect(level.level).toBe(6);
    expect(level.name).toBe('宗师');
  });
});

describe('LevelUtils - 升级检测', () => {
  it('从400经验升到600经验应触发升级', () => {
    const result = checkLevelUp(400, 200);
    expect(result.leveledUp).toBe(true);
    expect(result.from.level).toBe(1);
    expect(result.to.level).toBe(2);
    expect(result.reward.message).toBe('恭喜升级到 新手!');
  });

  it('从400经验升到450经验不应触发升级', () => {
    const result = checkLevelUp(400, 50);
    expect(result.leveledUp).toBe(false);
    expect(result.from.level).toBe(1);
    expect(result.to.level).toBe(1);
  });

  it('跨级升级: Lv1 → Lv3', () => {
    const result = checkLevelUp(0, 2000);
    expect(result.leveledUp).toBe(true);
    expect(result.from.level).toBe(1);
    expect(result.to.level).toBe(3);
  });

  it('多级升级: Lv1 → Lv6', () => {
    const result = checkLevelUp(0, 10000);
    expect(result.leveledUp).toBe(true);
    expect(result.from.level).toBe(1);
    expect(result.to.level).toBe(6);
  });

  it('已达最高等级时不应触发升级', () => {
    const result = checkLevelUp(10000, 1000);
    expect(result.leveledUp).toBe(false);
    expect(result.from.level).toBe(6);
    expect(result.to.level).toBe(6);
  });
});

describe('LevelUtils - 等级进度', () => {
  it('0经验应显示0%进度', () => {
    const progress = calculateLevelProgress(0);
    expect(progress).toBe(0);
  });

  it('250经验应显示50%进度(Lv1→Lv2)', () => {
    const progress = calculateLevelProgress(250);
    expect(progress).toBe(50);
  });

  it('500经验应显示0%进度(Lv2起点)', () => {
    const progress = calculateLevelProgress(500);
    expect(progress).toBe(0);
  });

  it('1000经验应显示50%进度(Lv2→Lv3)', () => {
    const progress = calculateLevelProgress(1000);
    expect(progress).toBeCloseTo(50, 1);
  });

  it('Lv6应显示100%进度', () => {
    const progress = calculateLevelProgress(10000);
    expect(progress).toBe(100);
  });
});

describe('LevelUtils - 下一级所需经验', () => {
  it('Lv1(0经验)需要500经验', () => {
    const expNeeded = calculateExpToNextLevel(0);
    expect(expNeeded).toBe(500);
  });

  it('Lv1(250经验)需要250经验', () => {
    const expNeeded = calculateExpToNextLevel(250);
    expect(expNeeded).toBe(250);
  });

  it('Lv2(500经验)需要1000经验', () => {
    const expNeeded = calculateExpToNextLevel(500);
    expect(expNeeded).toBe(1000);
  });

  it('Lv6(10000经验)需要0经验', () => {
    const expNeeded = calculateExpToNextLevel(10000);
    expect(expNeeded).toBe(0);
  });
});
