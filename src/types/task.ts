/**
 * 任务系统类型定义
 * Week 8: 每日任务 + 周常任务
 */

/**
 * 任务类型
 */
export type TaskType = 'daily' | 'weekly';

/**
 * 任务条件类型
 */
export type TaskCondition =
  | { type: 'games_played'; count: number }
  | { type: 'wins'; count: number }
  | { type: 'hints_used'; count: number };

/**
 * 奖励配置
 */
export interface TaskReward {
  coins: number;
  exp?: number;
  skinId?: string;
}

/**
 * 任务定义
 */
export interface Task {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  reward: TaskReward;
  target: number;         // 目标次数
  progress: number;       // 当前进度
  completed: boolean;     // 是否完成
  claimed: boolean;       // 是否已领取奖励
  condition: TaskCondition;
}

/**
 * 游戏动作类型（用于任务进度追踪）
 */
export type GameAction =
  | 'game_end'
  | 'win'
  | 'lose'
  | 'draw'
  | 'hint_used';

/**
 * 领取奖励结果
 */
export interface ClaimRewardResult {
  success: boolean;
  reward?: TaskReward;
  error?: 'not_completed' | 'already_claimed' | 'task_not_found';
}
