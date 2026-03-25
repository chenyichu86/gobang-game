/**
 * 金币服务
 * Week 8: 金币系统实现
 *
 * 职责:
 * - 金币计算（胜利/失败/和棋）
 * - 金币添加和扣除
 * - 金币统计
 */

import type { GameResult, CoinData } from '../types/economy';

export class CoinService {
  private coinData: CoinData;

  constructor() {
    // 初始化金币数据
    this.coinData = {
      coins: 0,
      totalEarned: 0,
      totalSpent: 0,
    };
  }

  /**
   * 计算游戏金币奖励
   * @param result 游戏结果
   * @returns 金币数量
   */
  calculateCoinGain(result: GameResult): number {
    switch (result) {
      case 'win':
        return 10;
      case 'lose':
        return 2;
      case 'draw':
        return 5;
      default:
        return 0;
    }
  }

  /**
   * 添加金币
   * @param amount 金币数量
   */
  addCoins(amount: number): void {
    if (amount <= 0) return;

    this.coinData.coins += amount;
    this.coinData.totalEarned += amount;
  }

  /**
   * 花费金币
   * @param amount 金币数量
   * @returns 是否成功
   */
  spendCoins(amount: number): boolean {
    if (amount <= 0) return false;
    if (this.coinData.coins < amount) return false;

    this.coinData.coins -= amount;
    this.coinData.totalSpent += amount;
    return true;
  }

  /**
   * 获取当前金币余额
   */
  getCoinBalance(): number {
    return this.coinData.coins;
  }

  /**
   * 获取累计获得金币
   */
  getTotalEarned(): number {
    return this.coinData.totalEarned;
  }

  /**
   * 获取累计消费金币
   */
  getTotalSpent(): number {
    return this.coinData.totalSpent;
  }

  /**
   * 获取金币数据（用于持久化）
   */
  getCoinData(): CoinData {
    return { ...this.coinData };
  }

  /**
   * 加载金币数据（用于从存储恢复）
   */
  loadCoinData(data: CoinData): void {
    this.coinData = { ...data };
  }
}
