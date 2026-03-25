/**
 * Week 9: 数据持久化服务
 * TDD Phase: GREEN - 实现完成
 */

import type { UserDataV2, CheckInData } from '../types/storage';
import { STORAGE_KEYS } from '../types/storage';

export class PersistenceService {
  private saveCallbacks: Map<string, () => any> = new Map();

  /**
   * 保存数据到 LocalStorage
   */
  save<T>(key: string, data: T): boolean {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(key, json);
      return true;
    } catch (error: any) {
      if (error.name === 'QuotaExceededError') {
        // 存储空间不足，清理旧数据
        this.cleanOldData();
        // 重试一次
        try {
          localStorage.setItem(key, JSON.stringify(data));
          return true;
        } catch (retryError) {
          console.error('保存失败（重试后）:', retryError);
          return false;
        }
      }
      console.error('保存失败:', error);
      return false;
    }
  }

  /**
   * 从 LocalStorage 加载数据
   */
  load<T>(key: string): T | null {
    try {
      const json = localStorage.getItem(key);
      if (!json) return null;
      return JSON.parse(json) as T;
    } catch (error) {
      console.error('加载失败:', error);
      return null;
    }
  }

  /**
   * 迁移用户数据到 v2
   */
  migrateUserDataV2(data: any): UserDataV2 {
    // 已经是v2，直接返回
    if (data.version >= 2) return data;

    // 创建默认签到数据
    const createDefaultCheckInData = (): CheckInData => ({
      lastCheckInDate: '',
      consecutiveDays: 0,
      totalCheckInDays: 0,
      checkInHistory: [],
    });

    // v0或v1 → v2迁移
    return {
      ...data,
      version: 2,
      // Week 8字段（如果不存在）
      coins: data.coins || 0,
      totalEarned: data.totalEarned || 0,
      totalSpent: data.totalSpent || 0,
      checkInData: data.checkInData || createDefaultCheckInData(),
      unlockedSkins: data.unlockedSkins || ['classic_board', 'classic_piece'],
      currentBoardSkin: data.currentBoardSkin || 'classic_board',
      currentPieceSkin: data.currentPieceSkin || 'classic_piece',
      // Week 9新增字段
      lastSaveTime: Date.now(),
    };
  }

  /**
   * 清理旧数据（保留最近7天的签到记录）
   */
  private cleanOldData(): void {
    try {
      const checkInJson = localStorage.getItem(STORAGE_KEYS.CHECK_IN);
      if (checkInJson) {
        const checkInData = JSON.parse(checkInJson) as CheckInData;
        if (checkInData.checkInHistory) {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          checkInData.checkInHistory = checkInData.checkInHistory.filter((date) => {
            return new Date(date) >= sevenDaysAgo;
          });

          localStorage.setItem(STORAGE_KEYS.CHECK_IN, JSON.stringify(checkInData));
        }
      }
    } catch (error) {
      console.error('清理旧数据失败:', error);
    }
  }

  /**
   * 注册保存回调
   */
  registerSaveCallback(key: string, getData: () => any): void {
    this.saveCallbacks.set(key, getData);
  }

  /**
   * 保存所有已注册的数据
   */
  saveAll(): void {
    for (const [key, getData] of this.saveCallbacks.entries()) {
      try {
        const data = getData();
        this.save(key, data);
      } catch (error) {
        console.error(`保存 ${key} 失败:`, error);
      }
    }
  }

  /**
   * 检查 LocalStorage 是否可用
   */
  isStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const persistenceService = new PersistenceService();
