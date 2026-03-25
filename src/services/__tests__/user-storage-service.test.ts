/**
 * UserStorageService 测试
 * Week 7: 用户数据存储测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UserStorageService } from '../user-storage-service';
import type { UserData } from '../../types/user';

describe('UserStorageService', () => {
  let service: UserStorageService;

  beforeEach(() => {
    service = new UserStorageService();
    // 清除LocalStorage
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('初始化', () => {
    it('应创建默认用户数据', () => {
      const data = service.getUserData();

      expect(data.version).toBe(1);
      expect(data.exp).toBe(0);
      expect(data.level).toBe(1);
      expect(data.stats.totalGames).toBe(0);
      expect(data.achievements).toEqual({});
    });

    it('首次使用时应保存默认数据', () => {
      service.getUserData();
      const stored = localStorage.getItem('gobang_user_data');

      expect(stored).toBeDefined();
      const data = JSON.parse(stored!) as UserData;
      expect(data.exp).toBe(0);
      expect(data.level).toBe(1);
    });
  });

  describe('保存和加载数据', () => {
    it('应正确保存用户数据', () => {
      const mockData: UserData = {
        version: 1,
        exp: 500,
        level: 2,
        achievements: {
          'first_win': { unlocked: true, unlockedAt: new Date() },
        },
        stats: {
          totalGames: 10,
          totalWins: 5,
          totalLosses: 4,
          totalDraws: 1,
          currentStreak: 2,
          maxWinStreak: 3,
          hintsUsed: 1,
        },
        dailyLogin: {
          lastLoginDate: '2026-03-25',
          consecutiveDays: 3,
        },
        settings: {
          soundEnabled: true,
          theme: 'light',
        },
      };

      service.saveUserData(mockData);
      const stored = localStorage.getItem('gobang_user_data');
      expect(stored).toBeDefined();

      const loaded = JSON.parse(stored!) as UserData;
      expect(loaded.exp).toBe(500);
      expect(loaded.level).toBe(2);
    });

    it('应正确加载已保存的数据', () => {
      const mockData: UserData = {
        version: 1,
        exp: 1000,
        level: 3,
        achievements: {},
        stats: {
          totalGames: 20,
          totalWins: 15,
          totalLosses: 4,
          totalDraws: 1,
          currentStreak: 5,
          maxWinStreak: 5,
          hintsUsed: 3,
        },
        dailyLogin: {
          lastLoginDate: '2026-03-25',
          consecutiveDays: 5,
        },
        settings: {
          soundEnabled: false,
          theme: 'dark',
        },
      };

      localStorage.setItem('gobang_user_data', JSON.stringify(mockData));

      const loaded = service.getUserData();
      expect(loaded.exp).toBe(1000);
      expect(loaded.level).toBe(3);
    });
  });

  describe('数据迁移', () => {
    it('应从v0版本迁移到v1版本', () => {
      // 模拟旧数据（没有version字段）
      const oldData = {
        exp: 500,
        level: 2,
        achievements: {},
        stats: {
          totalGames: 5,
          totalWins: 3,
          totalLosses: 2,
          totalDraws: 0,
          currentStreak: 1,
          maxWinStreak: 1,
          hintsUsed: 0,
        },
      };

      localStorage.setItem('gobang_user_data', JSON.stringify(oldData));

      const loaded = service.getUserData();
      expect(loaded.version).toBe(1);
      expect(loaded.exp).toBe(500);
      expect(loaded.level).toBe(2);
    });

    it('应拒绝加载未来版本数据', () => {
      const futureData = {
        version: 999,
        exp: 10000,
        level: 6,
        achievements: {},
        stats: {
          totalGames: 1000,
          totalWins: 800,
          totalLosses: 150,
          totalDraws: 50,
          currentStreak: 10,
          maxWinStreak: 20,
          hintsUsed: 100,
        },
        dailyLogin: {
          lastLoginDate: '2026-03-25',
          consecutiveDays: 30,
        },
        settings: {
          soundEnabled: true,
          theme: 'light',
        },
      };

      localStorage.setItem('gobang_user_data', JSON.stringify(futureData));

      const loaded = service.getUserData();
      // 应返回默认数据
      expect(loaded.version).toBe(1);
      expect(loaded.exp).toBe(0);
    });
  });

  describe('清除数据', () => {
    it('应正确清除用户数据', () => {
      const mockData: UserData = {
        version: 1,
        exp: 500,
        level: 2,
        achievements: {},
        stats: {
          totalGames: 10,
          totalWins: 5,
          totalLosses: 4,
          totalDraws: 1,
          currentStreak: 0,
          maxWinStreak: 2,
          hintsUsed: 0,
        },
        dailyLogin: {
          lastLoginDate: '2026-03-25',
          consecutiveDays: 1,
        },
        settings: {
          soundEnabled: true,
          theme: 'light',
        },
      };

      service.saveUserData(mockData);
      expect(localStorage.getItem('gobang_user_data')).toBeDefined();

      service.clearUserData();
      expect(localStorage.getItem('gobang_user_data')).toBeNull();
    });
  });

  describe('存储可用性检查', () => {
    it('应检测LocalStorage是否可用', () => {
      const available = service.isStorageAvailable();
      expect(available).toBe(true);
    });
  });
});
