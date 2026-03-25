/**
 * TaskService 单元测试
 * Week 8: 任务系统测试
 *
 * TDD流程:
 * RED: QA先编写测试（当前阶段）
 * GREEN: DEV实现功能让测试通过
 * REFACTOR: 优化代码
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TaskService } from '../task-service';
import type { Task } from '../../types/task';

describe('TaskService - 生成每日任务', () => {
  it('应生成3个每日任务', () => {
    const service = new TaskService();
    const tasks = service.generateDailyTasks();

    expect(tasks).toHaveLength(3);
    expect(tasks.every(t => t.type === 'daily')).toBe(true);
  });
});

describe('TaskService - 任务配置', () => {
  it('每日任务应包含游戏达人、胜利者、博学先锋', () => {
    const service = new TaskService();
    const tasks = service.generateDailyTasks();

    const taskIds = tasks.map(t => t.id);
    expect(taskIds).toContain('daily_games_3');
    expect(taskIds).toContain('daily_win_1');
    expect(taskIds).toContain('daily_hint_1');
  });
});

describe('TaskService - 任务奖励', () => {
  it('任务奖励应配置正确', () => {
    const service = new TaskService();
    const tasks = service.generateDailyTasks();

    const gamesTask = tasks.find(t => t.id === 'daily_games_3');
    expect(gamesTask?.reward.coins).toBe(30);

    const winTask = tasks.find(t => t.id === 'daily_win_1');
    expect(winTask?.reward.coins).toBe(50);

    const hintTask = tasks.find(t => t.id === 'daily_hint_1');
    expect(hintTask?.reward.coins).toBe(20);
  });
});

describe('TaskService - 进度更新', () => {
  it('游戏结束后应更新任务进度', () => {
    const service = new TaskService();
    const tasks = service.generateDailyTasks();

    const gameTask = tasks.find(t => t.id === 'daily_games_3');
    expect(gameTask?.progress).toBe(0);

    service.updateTaskProgress('game_end');

    const updatedTasks = service.getDailyTasks();
    const updatedTask = updatedTasks.find(t => t.id === 'daily_games_3');
    expect(updatedTask?.progress).toBe(1);
  });
});

describe('TaskService - 完成检测', () => {
  it('进度达到目标时应标记为完成', () => {
    const service = new TaskService();
    service.generateDailyTasks();

    const winTask = service.getDailyTasks().find(t => t.id === 'daily_win_1');
    expect(winTask?.completed).toBe(false);

    // 更新进度
    service.updateTaskProgress('win');

    const updatedTasks = service.getDailyTasks();
    const updatedTask = updatedTasks.find(t => t.id === 'daily_win_1');
    expect(updatedTask?.completed).toBe(true);
    expect(updatedTask?.claimed).toBe(false);
  });
});

describe('TaskService - 领取奖励', () => {
  it('应正确发放任务奖励', () => {
    const service = new TaskService();
    service.generateDailyTasks();

    // 完成任务
    service.updateTaskProgress('win');

    // 领取奖励
    const result = service.claimTaskReward('daily_win_1');

    expect(result.success).toBe(true);
    expect(result.reward?.coins).toBe(50);

    const task = service.getDailyTasks().find(t => t.id === 'daily_win_1');
    expect(task?.claimed).toBe(true);
  });
});

describe('TaskService - 刷新逻辑', () => {
  it('每日0点应刷新任务', () => {
    const service = new TaskService();

    const today = new Date().toDateString();
    service.setLastRefreshDate(today);

    const shouldRefresh = service.shouldRefreshDailyTasks();

    expect(shouldRefresh).toBe(false); // 今天已刷新
  });
});

describe('TaskService - 周常任务', () => {
  it('应生成周常任务', () => {
    const service = new TaskService();
    const tasks = service.generateWeeklyTasks();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('weekly_wins_10');
    expect(tasks[0].reward.coins).toBe(200);
  });
});
