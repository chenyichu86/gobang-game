/**
 * OpeningStrategy - 开局策略
 * 实现多样化的开局选择，避免每次都是天元
 *
 * 开局策略分布：
 * - 天元(7,7): 50%
 * - 小目(6,6),(6,8),(8,6),(8,8): 各10% (共40%)
 * - 星位(3,3),(3,11),(11,3),(11,11): 各2-3% (共10%)
 */

import type { Position } from '../core/rules';

/**
 * 开局策略定义
 */
interface OpeningStrategy {
  position: Position;
  weight: number; // 权重（0-1之间）
}

/**
 * 所有开局策略
 * 权重总和应该等于1.0
 */
const OPENING_STRATEGIES: OpeningStrategy[] = [
  { position: { x: 7, y: 7 }, weight: 0.50 },  // 天元 - 50%
  { position: { x: 6, y: 6 }, weight: 0.10 },  // 小目左上 - 10%
  { position: { x: 8, y: 8 }, weight: 0.10 },  // 小目右下 - 10%
  { position: { x: 6, y: 8 }, weight: 0.10 },  // 小目左下 - 10%
  { position: { x: 8, y: 6 }, weight: 0.10 },  // 小目右上 - 10%
  { position: { x: 3, y: 3 }, weight: 0.04 },  // 星位左上 - 4%
  { position: { x: 3, y: 11 }, weight: 0.04 }, // 星位左下 - 4%
  { position: { x: 11, y: 3 }, weight: 0.04 }, // 星位右上 - 4%
  { position: { x: 11, y: 11 }, weight: 0.04 },// 星位右下 - 4%
  { position: { x: 5, y: 5 }, weight: 0.02 },  // 其他位置 - 2%
];

export class OpeningStrategyClass {
  /**
   * 选择一个开局位置
   * 根据权重随机选择
   *
   * @returns 选中的开局位置
   */
  static selectOpening(): Position {
    const rand = Math.random();
    let cumulative = 0;

    for (const strategy of OPENING_STRATEGIES) {
      cumulative += strategy.weight;
      if (rand < cumulative) {
        return strategy.position;
      }
    }

    // 理论上不会执行到这里（因为权重总和是1.0）
    return { x: 7, y: 7 }; // 默认天元
  }

  /**
   * 检查位置是否是开局位置
   *
   * @param position 要检查的位置
   * @returns 是否是开局位置
   */
  static isOpeningPosition(position: Position): boolean {
    return OPENING_STRATEGIES.some(
      strategy =>
        strategy.position.x === position.x && strategy.position.y === position.y
    );
  }

  /**
   * 获取所有开局位置列表
   *
   * @returns 开局位置数组
   */
  static getAllOpenings(): Position[] {
    return OPENING_STRATEGIES.map(strategy => strategy.position);
  }

  /**
   * 获取开局策略数量
   *
   * @returns 开局策略数量
   */
  static getOpeningCount(): number {
    return OPENING_STRATEGIES.length;
  }
}

// 导出单例访问
export const OpeningStrategy = OpeningStrategyClass;
