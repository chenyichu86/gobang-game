/**
 * MasterAI - 大师AI（深度5搜索，简化版）
 * Week 6 - 大师AI核心实现
 *
 * 功能：
 * - 深度5层搜索（平衡性能和强度）
 * - 继承HardAI的所有功能
 * - 超时保护（8秒超时）
 * - 性能目标：深度5搜索<8秒
 */

import { Board } from '../core/board';
import type { Position, Player } from '../core/rules';
import { HardAI } from './hard-ai';
import type { HardAIConfig, AIStats } from './hard-ai';

/**
 * MasterAI配置（继承HardAI配置）
 */
export interface MasterAIConfig extends HardAIConfig {
  // 可以添加MasterAI特有的配置
}

/**
 * MasterAI统计信息（扩展HardAI）
 */
export interface MasterAIStats extends AIStats {
  searchDepth: number; // 实际搜索深度
  tableSize?: number; // 置换表大小（Week 6功能，简化版本为0）
  tableHitRate?: number; // 置换表命中率（Week 6功能，简化版本为0）
  fromFallback?: boolean; // 是否使用了降级策略（Week 6功能，简化版本为false）
}

export class MasterAI extends HardAI {
  private actualSearchDepth: number = 0;

  constructor(config?: Partial<MasterAIConfig>) {
    // 初始化HardAI部分，默认深度5
    const hardAIConfig: Partial<HardAIConfig> = {
      searchDepth: 5,
      timeLimit: 8000,
      enableAlphaBeta: true,
      ...config,
    };

    super(hardAIConfig);
    this.actualSearchDepth = hardAIConfig.searchDepth || 5;
  }

  /**
   * 计算AI下一步的落子位置
   * 策略：直接使用HardAI的深度5搜索
   */
  async calculateMove(board: Board, aiPlayer: Player): Promise<Position> {
    // 直接使用HardAI的逻辑（minimax + alpha-beta剪枝）
    // 深度5搜索在构造函数中设置
    const result = await super.calculateMove(board, aiPlayer);

    this.actualSearchDepth = this.actualSearchDepth;

    return result;
  }

  /**
   * 获取统计信息
   */
  getStats(): MasterAIStats {
    const hardAIStats = super.getStats();
    return {
      ...hardAIStats,
      searchDepth: this.actualSearchDepth,
      tableSize: 0, // 简化版本不支持置换表
      tableHitRate: 0, // 简化版本不支持置换表
      fromFallback: false, // 简化版本不使用降级策略
    };
  }

  /**
   * 获取详细统计信息（别名，用于测试）
   */
  getDetailedStats(): MasterAIStats {
    return this.getStats();
  }

  /**
   * 获取置换表大小（Week 6功能，简化版本返回0）
   */
  getTranspositionTableSize(): number {
    return 0; // 简化版本不支持置换表
  }

  /**
   * 获取缓存命中率（Week 6功能，简化版本返回0）
   */
  getCacheHitRate(): number {
    return 0; // 简化版本不支持置换表
  }

  /**
   * 清空置换表（Week 6功能，简化版本为空操作）
   */
  clearTranspositionTable(): void {
    // 简化版本不支持置换表，空操作
  }
}
