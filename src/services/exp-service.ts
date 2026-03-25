/**
 * 经验值系统服务
 * Week 7: 用户成长系统
 */

import type { GameResult } from '../types/user';
import { MAX_EXP } from '../constants/levels';

export class ExpService {
  private currentExp: number;

  constructor(initialExp: number = 0) {
    this.currentExp = Math.min(initialExp, MAX_EXP);
  }

  /**
   * 计算单局游戏获得的经验值
   */
  calculateExpGain(result: GameResult, streak: number): number {
    let baseExp = 0;

    // 基础经验值
    switch (result) {
      case 'win':
        baseExp = 100;
        break;
      case 'lose':
        baseExp = 20;
        break;
      case 'draw':
        baseExp = 50;
        break;
    }

    // 连胜奖励（连胜2局及以上）
    if (result === 'win' && streak >= 2) {
      baseExp += 50;
    }

    return baseExp;
  }

  /**
   * 添加经验值
   */
  addExp(exp: number): number {
    const newExp = this.currentExp + exp;

    // 确保不超过上限
    this.currentExp = Math.min(newExp, MAX_EXP);

    return this.currentExp;
  }

  /**
   * 获取当前总经验值
   */
  getTotalExp(): number {
    return this.currentExp;
  }

  /**
   * 设置经验值（用于数据恢复）
   */
  setExp(exp: number): void {
    this.currentExp = Math.min(Math.max(0, exp), MAX_EXP);
  }

  /**
   * 重置经验值
   */
  reset(): void {
    this.currentExp = 0;
  }

  /**
   * 检查是否已达到经验值上限
   */
  isMaxLevel(): boolean {
    return this.currentExp >= MAX_EXP;
  }
}
