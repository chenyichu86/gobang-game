/**
 * Week 9: 数据持久化测试
 * TDD Phase: RED - 测试代码编写完成，等待实现
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PersistenceService } from '../../services/persistence-service';
import type { UserDataV2 } from '../../types/storage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('PersistenceService - 数据持久化', () => {
  let persistenceService: PersistenceService;

  beforeEach(() => {
    localStorage.clear();
    persistenceService = new PersistenceService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * 测试用例 1: 保存用户数据到 LocalStorage
   */
  it('应该成功保存用户数据到 LocalStorage', () => {
    // Arrange
    const userData: UserDataV2 = {
      version: 2,
      exp: 1500,
      level: 3,
      achievements: {
        'first_win': { unlocked: true, unlockedAt: new Date('2026-03-25') },
      },
      stats: {
        totalGames: 10,
        totalWins: 7,
        totalLosses: 2,
        totalDraws: 1,
        currentStreak: 3,
        maxWinStreak: 5,
        hintsUsed: 2,
      },
      coins: 500,
      totalEarned: 800,
      totalSpent: 300,
      checkInData: {
        lastCheckInDate: '2026-03-25',
        consecutiveDays: 5,
        totalCheckInDays: 20,
      },
      unlockedSkins: ['classic_board', 'ocean_board'],
      currentBoardSkin: 'ocean_board',
      currentPieceSkin: 'classic_piece',
      lastSaveTime: Date.now(),
    };

    // Act
    const result = persistenceService.save('gobang_user_data_v2', userData);

    // Assert
    expect(result).toBe(true);

    const saved = localStorage.getItem('gobang_user_data_v2');
    expect(saved).not.toBeNull();

    const parsed = JSON.parse(saved!);
    expect(parsed.version).toBe(2);
    expect(parsed.exp).toBe(1500);
    expect(parsed.coins).toBe(500);
  });

  /**
   * 测试用例 2: 加载数据从 LocalStorage
   */
  it('应该成功加载数据从 LocalStorage', () => {
    // Arrange
    const userData: UserDataV2 = {
      version: 2,
      exp: 2000,
      level: 4,
      achievements: {},
      stats: {
        totalGames: 20,
        totalWins: 15,
        totalLosses: 4,
        totalDraws: 1,
        currentStreak: 5,
        maxWinStreak: 8,
        hintsUsed: 5,
      },
      coins: 1000,
      totalEarned: 1500,
      totalSpent: 500,
      checkInData: {
        lastCheckInDate: '2026-03-25',
        consecutiveDays: 7,
        totalCheckInDays: 30,
      },
      unlockedSkins: ['classic_board', 'classic_piece'],
      currentBoardSkin: 'classic_board',
      currentPieceSkin: 'classic_piece',
      lastSaveTime: Date.now(),
    };

    localStorage.setItem('gobang_user_data_v2', JSON.stringify(userData));

    // Act
    const loaded = persistenceService.load<UserDataV2>('gobang_user_data_v2');

    // Assert
    expect(loaded).not.toBeNull();
    expect(loaded!.version).toBe(2);
    expect(loaded!.exp).toBe(2000);
    expect(loaded!.coins).toBe(1000);
    expect(loaded!.level).toBe(4);
  });

  /**
   * 测试用例 3: 数据版本迁移 v1 → v2
   */
  it('应该正确迁移 v1 数据到 v2', () => {
    // Arrange - v1 数据（没有 Week 8/9 字段）
    const v1Data = {
      version: 1,
      exp: 500,
      level: 2,
      achievements: {},
      stats: {
        totalGames: 5,
        totalWins: 3,
        totalLosses: 2,
        totalDraws: 0,
        currentStreak: 2,
        maxWinStreak: 2,
        hintsUsed: 1,
      },
      // v1 没有 coins, totalEarned, totalSpent 等字段
    };

    // Act
    const migrated = persistenceService.migrateUserDataV2(v1Data);

    // Assert
    expect(migrated.version).toBe(2);
    expect(migrated.coins).toBe(0); // 应该有默认值
    expect(migrated.totalEarned).toBe(0);
    expect(migrated.totalSpent).toBe(0);
    expect(migrated.checkInData).toBeDefined();
    expect(migrated.checkInData.consecutiveDays).toBe(0);
    expect(migrated.unlockedSkins).toEqual(['classic_board', 'classic_piece']);
    expect(migrated.lastSaveTime).toBeGreaterThan(0);
  });

  /**
   * 测试用例 4: 自动保存机制
   */
  it('应该支持自动保存机制（回调注册）', () => {
    // Arrange
    let callbackCalled = false;
    const getDataCallback = () => {
      callbackCalled = true;
      return { test: 'data' };
    };

    // Act - 注册保存回调
    persistenceService.registerSaveCallback('test_key', getDataCallback);

    // 触发保存
    persistenceService.saveAll();

    // Assert
    expect(callbackCalled).toBe(true);

    const saved = localStorage.getItem('test_key');
    expect(saved).not.toBeNull();
    expect(JSON.parse(saved!)).toEqual({ test: 'data' });
  });

  /**
   * 测试用例 5: QuotaExceededError 处理
   */
  it('应该正确处理 QuotaExceededError 并清理旧数据', () => {
    // Arrange
    const mockSetItem = vi.spyOn(localStorage, 'setItem');

    // 第一次调用抛出 QuotaExceededError，第二次成功
    let callCount = 0;
    mockSetItem.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        const error: any = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      }
      // 第二次调用成功
    });

    const testData = { data: 'test' };

    // Act
    const result = persistenceService.save('test_key', testData);

    // Assert
    expect(result).toBe(true);
    expect(callCount).toBe(2); // 第一次失败，第二次成功

    mockSetItem.mockRestore();
  });

  /**
   * 测试用例 6: 检查 LocalStorage 可用性
   */
  it('应该正确检测 LocalStorage 是否可用', () => {
    // Act
    const isAvailable = persistenceService.isStorageAvailable();

    // Assert
    expect(isAvailable).toBe(true);
  });

  /**
   * 测试用例 7: 加载不存在的数据返回 null
   */
  it('应该返回 null 当加载不存在的数据', () => {
    // Act
    const loaded = persistenceService.load<any>('non_existent_key');

    // Assert
    expect(loaded).toBeNull();
  });

  /**
   * 测试用例 8: v2 数据不需要迁移
   */
  it('不应该迁移已经是 v2 版本的数据', () => {
    // Arrange
    const v2Data: UserDataV2 = {
      version: 2,
      exp: 3000,
      level: 5,
      achievements: {},
      stats: {
        totalGames: 50,
        totalWins: 40,
        totalLosses: 8,
        totalDraws: 2,
        currentStreak: 10,
        maxWinStreak: 15,
        hintsUsed: 10,
      },
      coins: 2000,
      totalEarned: 3000,
      totalSpent: 1000,
      checkInData: {
        lastCheckInDate: '2026-03-25',
        consecutiveDays: 10,
        totalCheckInDays: 50,
      },
      unlockedSkins: ['classic_board', 'ocean_board', 'magma_board'],
      currentBoardSkin: 'magma_board',
      currentPieceSkin: 'jade_piece',
      lastSaveTime: Date.now(),
    };

    // Act
    const migrated = persistenceService.migrateUserDataV2(v2Data);

    // Assert
    expect(migrated.version).toBe(2);
    expect(migrated.exp).toBe(3000); // 数据未改变
    expect(migrated.coins).toBe(2000);
  });
});
