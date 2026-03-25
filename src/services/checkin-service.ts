/**
 * 签到服务
 * Week 8: 每日签到实现
 *
 * 职责:
 * - 处理每日签到
 * - 计算连续签到天数
 * - 发放签到奖励
 */

import type { CheckInData, CheckInResult } from '../types/economy';

export class CheckInService {
  private checkInData: CheckInData;
  private currentDate: Date = new Date();

  constructor() {
    this.checkInData = {
      lastCheckInDate: '',
      consecutiveDays: 0,
      totalCheckInDays: 0,
    };
  }

  /**
   * 签到
   */
  checkIn(): CheckInResult {
    const today = this.getCurrentDate();

    // 检查今天是否已签到
    if (this.checkInData.lastCheckInDate === today) {
      return {
        success: false,
        error: 'already_checked_in',
      };
    }

    // 计算连续签到天数
    const yesterday = this.getYesterday();
    if (this.checkInData.lastCheckInDate === yesterday) {
      // 连续签到
      this.checkInData.consecutiveDays += 1;
    } else {
      // 中断后重新开始
      this.checkInData.consecutiveDays = 1;
    }

    // 计算奖励
    const baseReward = 50;
    const bonus = this.calculateBonus(this.checkInData.consecutiveDays);
    const totalReward = baseReward + (bonus || 0);

    // 更新数据
    this.checkInData.lastCheckInDate = today;
    this.checkInData.totalCheckInDays += 1;

    return {
      success: true,
      reward: totalReward,
      consecutiveDays: this.checkInData.consecutiveDays,
      bonus: bonus || undefined,
    };
  }

  /**
   * 计算连续签到奖励
   */
  private calculateBonus(consecutiveDays: number): number {
    if (consecutiveDays === 7) {
      return 100;
    }
    if (consecutiveDays === 30) {
      return 500;
    }
    return 0;
  }

  /**
   * 获取连续签到天数
   */
  getConsecutiveDays(): number {
    return this.checkInData.consecutiveDays;
  }

  /**
   * 获取累计签到天数
   */
  getTotalCheckInDays(): number {
    return this.checkInData.totalCheckInDays;
  }

  /**
   * 获取签到数据
   */
  getCheckInData(): CheckInData {
    return { ...this.checkInData };
  }

  /**
   * 模拟下一天（用于测试）
   */
  simulateNextDay(): void {
    this.currentDate = new Date(this.currentDate.getTime() + 86400000); // +1天
  }

  /**
   * 获取当前日期字符串
   */
  private getCurrentDate(): string {
    return this.currentDate.toDateString();
  }

  /**
   * 获取昨天的日期字符串
   */
  private getYesterday(): string {
    return new Date(this.currentDate.getTime() - 86400000).toDateString();
  }
}
