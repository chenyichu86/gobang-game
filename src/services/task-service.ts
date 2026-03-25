/**
 * 任务服务
 * Week 8: 每日任务 + 周常任务实现
 *
 * 职责:
 * - 生成每日任务和周常任务
 * - 更新任务进度
 * - 领取任务奖励
 * - 任务刷新逻辑
 */

import type { Task, GameAction, ClaimRewardResult } from '../types/task';

export class TaskService {
  private dailyTasks: Task[] = [];
  private weeklyTasks: Task[] = [];
  private lastRefreshDate: string = '';

  /**
   * 生成每日任务
   */
  generateDailyTasks(): Task[] {
    this.dailyTasks = [
      {
        id: 'daily_games_3',
        name: '游戏达人',
        description: '完成3局游戏',
        type: 'daily',
        reward: { coins: 30 },
        target: 3,
        progress: 0,
        completed: false,
        claimed: false,
        condition: { type: 'games_played', count: 3 },
      },
      {
        id: 'daily_win_1',
        name: '胜利者',
        description: '获得1局胜利',
        type: 'daily',
        reward: { coins: 50 },
        target: 1,
        progress: 0,
        completed: false,
        claimed: false,
        condition: { type: 'wins', count: 1 },
      },
      {
        id: 'daily_hint_1',
        name: '博学先锋',
        description: '使用1次提示',
        type: 'daily',
        reward: { coins: 20 },
        target: 1,
        progress: 0,
        completed: false,
        claimed: false,
        condition: { type: 'hints_used', count: 1 },
      },
    ];

    this.lastRefreshDate = new Date().toDateString();
    return [...this.dailyTasks];
  }

  /**
   * 生成周常任务
   */
  generateWeeklyTasks(): Task[] {
    this.weeklyTasks = [
      {
        id: 'weekly_wins_10',
        name: '千胜之路',
        description: '累计获胜10局',
        type: 'weekly',
        reward: { coins: 200, skinId: 'dragon_board' },
        target: 10,
        progress: 0,
        completed: false,
        claimed: false,
        condition: { type: 'wins', count: 10 },
      },
    ];

    return [...this.weeklyTasks];
  }

  /**
   * 获取每日任务
   */
  getDailyTasks(): Task[] {
    return [...this.dailyTasks];
  }

  /**
   * 获取周常任务
   */
  getWeeklyTasks(): Task[] {
    return [...this.weeklyTasks];
  }

  /**
   * 更新任务进度
   */
  updateTaskProgress(action: GameAction): void {
    // 更新每日任务
    this.updateTasksProgress(this.dailyTasks, action);
    // 更新周常任务
    this.updateTasksProgress(this.weeklyTasks, action);
  }

  /**
   * 更新指定任务列表的进度
   */
  private updateTasksProgress(tasks: Task[], action: GameAction): void {
    for (const task of tasks) {
      // 跳过已领取的任务
      if (task.claimed) continue;

      // 跳过已完成的任务
      if (task.completed) continue;

      // 检查是否匹配任务条件
      if (this.matchesAction(action, task)) {
        task.progress = Math.min(task.progress + 1, task.target);

        // 检查是否完成
        if (task.progress >= task.target) {
          task.completed = true;
        }
      }
    }
  }

  /**
   * 检查动作是否匹配任务条件
   */
  private matchesAction(action: GameAction, task: Task): boolean {
    switch (task.condition.type) {
      case 'games_played':
        return action === 'game_end' || action === 'win' || action === 'lose' || action === 'draw';
      case 'wins':
        return action === 'win';
      case 'hints_used':
        return action === 'hint_used';
      default:
        return false;
    }
  }

  /**
   * 领取任务奖励
   */
  claimTaskReward(taskId: string): ClaimRewardResult {
    // 查找任务
    const task = this.findTask(taskId);
    if (!task) {
      return { success: false, error: 'task_not_found' };
    }

    // 检查是否已完成
    if (!task.completed) {
      return { success: false, error: 'not_completed' };
    }

    // 检查是否已领取
    if (task.claimed) {
      return { success: false, error: 'already_claimed' };
    }

    // 领取奖励
    task.claimed = true;
    return { success: true, reward: task.reward };
  }

  /**
   * 查找任务
   */
  private findTask(taskId: string): Task | undefined {
    return [...this.dailyTasks, ...this.weeklyTasks].find(t => t.id === taskId);
  }

  /**
   * 设置上次刷新日期
   */
  setLastRefreshDate(date: string): void {
    this.lastRefreshDate = date;
  }

  /**
   * 检查是否需要刷新每日任务
   */
  shouldRefreshDailyTasks(): boolean {
    const today = new Date().toDateString();
    return this.lastRefreshDate !== today;
  }
}
