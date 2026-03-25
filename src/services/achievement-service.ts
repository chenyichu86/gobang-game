/**
 * 成就系统服务
 * Week 7: 用户成长系统
 */

import type { Achievement, AchievementCondition, GameContext, AchievementProgress } from '../types/user';
import { ACHIEVEMENTS } from '../constants/achievements';

export class AchievementService {
  private achievements: Achievement[];
  private unlockedAchievements: Set<string>;

  constructor(unlockedAchievements: Set<string> = new Set()) {
    this.achievements = ACHIEVEMENTS;
    this.unlockedAchievements = unlockedAchievements;
  }

  /**
   * 检查游戏结束时的成就
   */
  checkGameEndAchievements(context: GameContext): Achievement[] {
    const unlocked: Achievement[] = [];

    // 检测首胜
    if (this.checkCondition({ type: 'first_win' }, context)) {
      const achievement = this.tryUnlock('first_win');
      if (achievement) unlocked.push(achievement);
    }

    // 检测连胜成就
    if (context.currentStreak && context.currentStreak >= 5) {
      const achievement = this.tryUnlock('win_streak_5');
      if (achievement) unlocked.push(achievement);
    }

    if (context.currentStreak && context.currentStreak >= 10) {
      const achievement = this.tryUnlock('win_streak_10');
      if (achievement) unlocked.push(achievement);
    }

    // 检测闪电战
    if (this.checkCondition({ type: 'quick_win', moves: 10 }, context)) {
      const achievement = this.tryUnlock('quick_win_10');
      if (achievement) unlocked.push(achievement);
    }

    // 检测完美防守
    if (this.checkCondition({ type: 'perfect_defense' }, context)) {
      const achievement = this.tryUnlock('perfect_defense');
      if (achievement) unlocked.push(achievement);
    }

    return unlocked;
  }

  /**
   * 检查里程碑成就（游戏开始/结束时）
   */
  checkMilestoneAchievements(context: GameContext): Achievement[] {
    const unlocked: Achievement[] = [];

    // 检测首局游戏
    if (this.checkCondition({ type: 'first_game' }, context)) {
      const achievement = this.tryUnlock('first_game');
      if (achievement) unlocked.push(achievement);
    }

    // 检测游戏局数
    if (this.checkCondition({ type: 'games_played', count: 100 }, context)) {
      const achievement = this.tryUnlock('games_100');
      if (achievement) unlocked.push(achievement);
    }

    // 检测胜利局数
    if (this.checkCondition({ type: 'total_wins', count: 1000 }, context)) {
      const achievement = this.tryUnlock('wins_1000');
      if (achievement) unlocked.push(achievement);
    }

    // 检测提示使用次数
    if (this.checkCondition({ type: 'hints_used', count: 50 }, context)) {
      const achievement = this.tryUnlock('hints_50');
      if (achievement) unlocked.push(achievement);
    }

    // 检测连续登录（需要在登录时检查）
    if (this.checkCondition({ type: 'daily_login', days: 7 }, context)) {
      const achievement = this.tryUnlock('daily_login_7');
      if (achievement) unlocked.push(achievement);
    }

    return unlocked;
  }

  /**
   * 检查条件是否满足
   */
  private checkCondition(condition: AchievementCondition, context: GameContext): boolean {
    switch (condition.type) {
      case 'first_game':
        return context.userStats.totalGames === 1;

      case 'first_win':
        return context.result === 'win' && context.userStats.totalWins === 1;

      case 'win_streak':
        return context.currentStreak !== undefined && context.currentStreak >= condition.count;

      case 'quick_win':
        return context.result === 'win' &&
               context.totalMoves !== undefined &&
               context.totalMoves <= condition.moves;

      case 'perfect_defense':
        return context.result === 'win' && context.opponentPieces === 0;

      case 'games_played':
        return context.userStats.totalGames >= condition.count;

      case 'total_wins':
        return context.userStats.totalWins >= condition.count;

      case 'hints_used':
        return context.userStats.hintsUsed >= condition.count;

      case 'daily_login':
        // 连续登录天数需要在登录时单独处理
        return false;

      default:
        return false;
    }
  }

  /**
   * 尝试解锁成就
   */
  private tryUnlock(achievementId: string): Achievement | null {
    // 如果已解锁，不重复解锁
    if (this.unlockedAchievements.has(achievementId)) {
      return null;
    }

    const achievement = this.achievements.find(a => a.id === achievementId);
    if (!achievement) {
      return null;
    }

    // 标记为已解锁
    this.unlockedAchievements.add(achievementId);

    // 返回解锁的成就
    return {
      ...achievement,
      unlocked: true,
      unlockedAt: new Date(),
    };
  }

  /**
   * 手动解锁成就（用于外部触发）
   */
  unlockAchievement(achievementId: string): Achievement | null {
    return this.tryUnlock(achievementId);
  }

  /**
   * 检查成就是否已解锁
   */
  isUnlocked(achievementId: string): boolean {
    return this.unlockedAchievements.has(achievementId);
  }

  /**
   * 获取所有成就
   */
  getAllAchievements(): Achievement[] {
    return this.achievements.map(achievement => ({
      ...achievement,
      unlocked: this.unlockedAchievements.has(achievement.id),
    }));
  }

  /**
   * 根据分类获取成就
   */
  getAchievementsByCategory(category: string): Achievement[] {
    return this.achievements
      .filter(a => a.category === category)
      .map(achievement => ({
        ...achievement,
        unlocked: this.unlockedAchievements.has(achievement.id),
      }));
  }

  /**
   * 获取已解锁的成就
   */
  getUnlockedAchievements(): Achievement[] {
    return this.achievements
      .filter(a => this.unlockedAchievements.has(a.id))
      .map(achievement => ({
        ...achievement,
        unlocked: true,
      }));
  }

  /**
   * 获取未解锁的成就
   */
  getLockedAchievements(): Achievement[] {
    return this.achievements
      .filter(a => !this.unlockedAchievements.has(a.id))
      .map(achievement => ({
        ...achievement,
        unlocked: false,
      }));
  }

  /**
   * 获取成就统计
   */
  getAchievementStats(): { total: number; unlocked: number; percentage: number } {
    const total = this.achievements.length;
    const unlocked = this.unlockedAchievements.size;
    const percentage = total > 0 ? (unlocked / total) * 100 : 0;

    return { total, unlocked, percentage };
  }

  /**
   * 获取已解锁成就ID列表
   */
  getUnlockedAchievementIds(): Set<string> {
    return new Set(this.unlockedAchievements);
  }

  /**
   * 检查连续登录成就
   */
  checkDailyLoginAchievement(consecutiveDays: number): Achievement | null {
    if (consecutiveDays >= 7) {
      return this.tryUnlock('daily_login_7');
    }
    return null;
  }
}
