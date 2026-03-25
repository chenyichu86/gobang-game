/**
 * AchievementService 测试
 * Week 7: 成就系统测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AchievementService } from '../achievement-service';
import type { GameContext, UserStats } from '../../types/user';

describe('AchievementService - 对局成就', () => {
  let service: AchievementService;

  beforeEach(() => {
    service = new AchievementService();
  });

  it('第1局游戏应解锁初出茅庐成就', () => {
    const context: GameContext = {
      userStats: { totalGames: 1, totalWins: 0, totalLosses: 0, totalDraws: 0, currentStreak: 0, maxWinStreak: 0, hintsUsed: 0 } as UserStats,
    };

    const unlocked = service.checkMilestoneAchievements(context);
    const firstGame = unlocked.find(a => a.id === 'first_game');

    expect(firstGame).toBeDefined();
    expect(firstGame?.id).toBe('first_game');
    expect(firstGame?.name).toBe('初出茅庐');
  });

  it('首次胜利应解锁首胜成就', () => {
    const context: GameContext = {
      result: 'win',
      userStats: { totalGames: 1, totalWins: 1, totalLosses: 0, totalDraws: 0, currentStreak: 1, maxWinStreak: 1, hintsUsed: 0 } as UserStats,
    };

    const unlocked = service.checkGameEndAchievements(context);
    const firstWin = unlocked.find(a => a.id === 'first_win');

    expect(firstWin).toBeDefined();
    expect(firstWin?.id).toBe('first_win');
  });

  it('5连胜应解锁连胜大师成就', () => {
    const context: GameContext = {
      result: 'win',
      currentStreak: 5,
      userStats: { totalGames: 5, totalWins: 5, totalLosses: 0, totalDraws: 0, currentStreak: 5, maxWinStreak: 5, hintsUsed: 0 } as UserStats,
    };

    const unlocked = service.checkGameEndAchievements(context);
    const winStreak5 = unlocked.find(a => a.id === 'win_streak_5');

    expect(winStreak5).toBeDefined();
    expect(winStreak5?.id).toBe('win_streak_5');
  });

  it('10连胜应解锁不败金身成就', () => {
    const context: GameContext = {
      result: 'win',
      currentStreak: 10,
      userStats: { totalGames: 10, totalWins: 10, totalLosses: 0, totalDraws: 0, currentStreak: 10, maxWinStreak: 10, hintsUsed: 0 } as UserStats,
    };

    const unlocked = service.checkGameEndAchievements(context);
    const winStreak10 = unlocked.find(a => a.id === 'win_streak_10');

    expect(winStreak10).toBeDefined();
    expect(winStreak10?.id).toBe('win_streak_10');
  });

  it('10步内获胜应解锁闪电战成就', () => {
    const context: GameContext = {
      result: 'win',
      totalMoves: 10,
      userStats: { totalGames: 1, totalWins: 1, totalLosses: 0, totalDraws: 0, currentStreak: 1, maxWinStreak: 1, hintsUsed: 0 } as UserStats,
    };

    const unlocked = service.checkGameEndAchievements(context);
    const quickWin = unlocked.find(a => a.id === 'quick_win_10');

    expect(quickWin).toBeDefined();
    expect(quickWin?.id).toBe('quick_win_10');
  });

  it('未失一子获胜应解锁完美防守成就', () => {
    const context: GameContext = {
      result: 'win',
      opponentPieces: 0,
      userStats: { totalGames: 1, totalWins: 1, totalLosses: 0, totalDraws: 0, currentStreak: 1, maxWinStreak: 1, hintsUsed: 0 } as UserStats,
    };

    const unlocked = service.checkGameEndAchievements(context);
    const perfectDefense = unlocked.find(a => a.id === 'perfect_defense');

    expect(perfectDefense).toBeDefined();
    expect(perfectDefense?.id).toBe('perfect_defense');
  });
});

describe('AchievementService - 里程碑成就', () => {
  let service: AchievementService;

  beforeEach(() => {
    service = new AchievementService();
  });

  it('完成100局游戏应解锁百战将成就', () => {
    const context: GameContext = {
      userStats: { totalGames: 100, totalWins: 50, totalLosses: 40, totalDraws: 10, currentStreak: 0, maxWinStreak: 5, hintsUsed: 0 } as UserStats,
    };

    const unlocked = service.checkMilestoneAchievements(context);
    const games100 = unlocked.find(a => a.id === 'games_100');

    expect(games100).toBeDefined();
    expect(games100?.id).toBe('games_100');
  });

  it('累计获胜1000局应解锁千胜王者成就', () => {
    const context: GameContext = {
      userStats: { totalGames: 1500, totalWins: 1000, totalLosses: 450, totalDraws: 50, currentStreak: 0, maxWinStreak: 20, hintsUsed: 0 } as UserStats,
    };

    const unlocked = service.checkMilestoneAchievements(context);
    const wins1000 = unlocked.find(a => a.id === 'wins_1000');

    expect(wins1000).toBeDefined();
    expect(wins1000?.id).toBe('wins_1000');
  });

  it('使用提示50次应解锁博学者成就', () => {
    const context: GameContext = {
      userStats: { totalGames: 20, totalWins: 10, totalLosses: 8, totalDraws: 2, currentStreak: 0, maxWinStreak: 3, hintsUsed: 50 } as UserStats,
    };

    const unlocked = service.checkMilestoneAchievements(context);
    const hints50 = unlocked.find(a => a.id === 'hints_50');

    expect(hints50).toBeDefined();
    expect(hints50?.id).toBe('hints_50');
  });
});

describe('AchievementService - 成就不重复解锁', () => {
  it('已解锁的成就不应再次解锁', () => {
    const service = new AchievementService();
    service.unlockAchievement('first_win');

    const context: GameContext = {
      result: 'win',
      userStats: { totalGames: 2, totalWins: 2, totalLosses: 0, totalDraws: 0, currentStreak: 2, maxWinStreak: 2, hintsUsed: 0 } as UserStats,
    };

    const unlocked = service.checkGameEndAchievements(context);
    const firstWin = unlocked.find(a => a.id === 'first_win');

    expect(firstWin).toBeUndefined();
  });
});

describe('AchievementService - 成就查询', () => {
  let service: AchievementService;

  beforeEach(() => {
    service = new AchievementService();
  });

  it('应正确返回所有成就', () => {
    const all = service.getAllAchievements();
    expect(all.length).toBe(10);
  });

  it('解锁成就后应增加已解锁数量', () => {
    expect(service.getUnlockedAchievements().length).toBe(0);

    service.unlockAchievement('first_game');
    expect(service.getUnlockedAchievements().length).toBe(1);

    service.unlockAchievement('first_win');
    expect(service.getUnlockedAchievements().length).toBe(2);
  });

  it('应正确计算成就统计', () => {
    const stats = service.getAchievementStats();
    expect(stats.total).toBe(10);
    expect(stats.unlocked).toBe(0);
    expect(stats.percentage).toBe(0);

    service.unlockAchievement('first_game');
    service.unlockAchievement('first_win');

    const newStats = service.getAchievementStats();
    expect(newStats.unlocked).toBe(2);
    expect(newStats.percentage).toBe(20);
  });
});

describe('AchievementService - 连续登录成就', () => {
  it('连续登录7天应解锁坚持不懈成就', () => {
    const service = new AchievementService();
    const achievement = service.checkDailyLoginAchievement(7);

    expect(achievement).toBeDefined();
    expect(achievement?.id).toBe('daily_login_7');
  });

  it('连续登录3天不应解锁成就', () => {
    const service = new AchievementService();
    const achievement = service.checkDailyLoginAchievement(3);

    expect(achievement).toBeNull();
  });
});
