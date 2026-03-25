/**
 * CheckInService 单元测试
 * Week 8: 签到功能测试
 *
 * TDD流程:
 * RED: QA先编写测试（当前阶段）
 * GREEN: DEV实现功能让测试通过
 * REFACTOR: 优化代码
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CheckInService } from '../checkin-service';
import type { CheckInData } from '../../types/economy';

describe('CheckInService - 每日签到', () => {
  it('签到应获得50金币', () => {
    const service = new CheckInService();
    const result = service.checkIn();

    expect(result.success).toBe(true);
    expect(result.reward).toBe(50);
  });
});

describe('CheckInService - 重复签到', () => {
  it('每天只能签到1次', () => {
    const service = new CheckInService();

    // 首次签到
    service.checkIn();

    // 再次签到
    const result = service.checkIn();

    expect(result.success).toBe(false);
    expect(result.error).toBe('already_checked_in');
  });
});

describe('CheckInService - 连续签到', () => {
  it('连续签到应正确计算天数', () => {
    const service = new CheckInService();

    // 第1天
    service.checkIn();
    expect(service.getConsecutiveDays()).toBe(1);

    // 模拟第2天
    service.simulateNextDay();
    service.checkIn();
    expect(service.getConsecutiveDays()).toBe(2);

    // 模拟第7天
    for (let i = 3; i <= 7; i++) {
      service.simulateNextDay();
      service.checkIn();
    }
    expect(service.getConsecutiveDays()).toBe(7);
  });
});

describe('CheckInService - 签到中断', () => {
  it('签到中断应重新开始计算', () => {
    const service = new CheckInService();

    // 连续签到3天
    for (let i = 0; i < 3; i++) {
      service.checkIn();
      service.simulateNextDay();
    }
    expect(service.getConsecutiveDays()).toBe(3);

    // 跳过1天
    service.simulateNextDay();
    service.simulateNextDay();
    service.checkIn();

    expect(service.getConsecutiveDays()).toBe(1); // 重新开始
  });
});

describe('CheckInService - 连续7天奖励', () => {
  it('连续7天应额外获得100金币', () => {
    const service = new CheckInService();

    // 连续签到7天
    let result;
    for (let i = 0; i < 7; i++) {
      result = service.checkIn();  // 保存第7天的结果
      if (i < 6) service.simulateNextDay();
    }

    expect(result?.bonus).toBe(100);
    expect(service.getConsecutiveDays()).toBe(7);
  });
});

describe('CheckInService - 累计签到天数', () => {
  it('应正确记录累计签到天数', () => {
    const service = new CheckInService();

    service.checkIn();
    expect(service.getTotalCheckInDays()).toBe(1);

    service.simulateNextDay();
    service.checkIn();
    expect(service.getTotalCheckInDays()).toBe(2);
  });
});

describe('CheckInService - 签到数据', () => {
  it('应返回正确的签到数据', () => {
    const service = new CheckInService();

    service.checkIn();
    const data = service.getCheckInData();

    expect(data.consecutiveDays).toBe(1);
    expect(data.totalCheckInDays).toBe(1);
    expect(data.lastCheckInDate).toBeDefined();
  });
});
