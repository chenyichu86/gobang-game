/**
 * 用户数据存储服务
 * Week 7: 用户成长系统
 */

import { UserData, UserStats, DailyLoginInfo, UserSettings } from '../types/user';

const STORAGE_KEY = 'gobang_user_data';
const CURRENT_VERSION = 1;

/**
 * 默认用户统计数据
 */
function createDefaultStats(): UserStats {
  return {
    totalGames: 0,
    totalWins: 0,
    totalLosses: 0,
    totalDraws: 0,
    currentStreak: 0,
    maxWinStreak: 0,
    hintsUsed: 0,
  };
}

/**
 * 默认连续登录信息
 */
function createDefaultDailyLogin(): DailyLoginInfo {
  const today = new Date().toISOString().split('T')[0];
  return {
    lastLoginDate: today,
    consecutiveDays: 1,
  };
}

/**
 * 默认用户设置
 */
function createDefaultSettings(): UserSettings {
  return {
    soundEnabled: true,
    theme: 'light',
  };
}

/**
 * 创建默认用户数据
 */
function createDefaultUserData(): UserData {
  return {
    version: CURRENT_VERSION,
    exp: 0,
    level: 1,
    achievements: {},
    stats: createDefaultStats(),
    dailyLogin: createDefaultDailyLogin(),
    settings: createDefaultSettings(),
  };
}

export class UserStorageService {
  private cache: UserData | null = null;

  /**
   * 获取用户数据
   */
  getUserData(): UserData {
    // 如果有缓存，直接返回
    if (this.cache) {
      return this.cache;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // 首次使用，创建默认数据
        this.cache = createDefaultUserData();
        this.saveUserData(this.cache);
        return this.cache;
      }

      // 解析数据
      const data = JSON.parse(stored) as UserData;

      // 数据迁移
      const migrated = this.migrateUserData(data);

      // 缓存并返回
      this.cache = migrated;
      return this.cache;
    } catch (error) {
      console.error('Failed to load user data:', error);
      // 发生错误时返回默认数据
      this.cache = createDefaultUserData();
      return this.cache;
    }
  }

  /**
   * 保存用户数据
   */
  saveUserData(data: UserData): void {
    try {
      // 更新缓存
      this.cache = data;

      // 保存到LocalStorage
      const serialized = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      console.error('Failed to save user data:', error);
      throw new Error('存储空间不足或存储不可用');
    }
  }

  /**
   * 清除用户数据
   */
  clearUserData(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      this.cache = null;
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  }

  /**
   * 数据迁移
   */
  private migrateUserData(data: any): UserData {
    // 如果没有版本号，视为v0数据
    if (!data.version || data.version < CURRENT_VERSION) {
      return this.migrateToV1(data);
    }

    // 如果版本号过高，返回默认数据（拒绝加载未来版本）
    if (data.version > CURRENT_VERSION) {
      console.warn(`User data version ${data.version} is not supported, resetting to default`);
      return createDefaultUserData();
    }

    // 版本匹配，直接返回
    return data;
  }

  /**
   * 迁移到v1版本
   */
  private migrateToV1(data: any): UserData {
    return {
      version: CURRENT_VERSION,
      exp: data.exp || 0,
      level: data.level || 1,
      achievements: data.achievements || {},
      stats: {
        totalGames: data.stats?.totalGames || 0,
        totalWins: data.stats?.totalWins || 0,
        totalLosses: data.stats?.totalLosses || 0,
        totalDraws: data.stats?.totalDraws || 0,
        currentStreak: data.stats?.currentStreak || 0,
        maxWinStreak: data.stats?.maxWinStreak || 0,
        hintsUsed: data.stats?.hintsUsed || 0,
      },
      dailyLogin: data.dailyLogin || createDefaultDailyLogin(),
      settings: data.settings || createDefaultSettings(),
    };
  }

  /**
   * 检查存储是否可用
   */
  isStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}
