/**
 * CoinService 单元测试
 * Week 8: 金币系统测试
 *
 * TDD流程:
 * RED: QA先编写测试（当前阶段）
 * GREEN: DEV实现功能让测试通过
 * REFACTOR: 优化代码
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CoinService } from '../coin-service';
import type { GameResult } from '../../types/economy';

describe('CoinService - 胜利奖励', () => {
  it('胜利应获得10金币', () => {
    const service = new CoinService();
    const coins = service.calculateCoinGain('win');
    expect(coins).toBe(10);
  });
});

describe('CoinService - 失败奖励', () => {
  it('失败应获得2金币', () => {
    const service = new CoinService();
    const coins = service.calculateCoinGain('lose');
    expect(coins).toBe(2);
  });
});

describe('CoinService - 和棋奖励', () => {
  it('和棋应获得5金币', () => {
    const service = new CoinService();
    const coins = service.calculateCoinGain('draw');
    expect(coins).toBe(5);
  });
});

describe('CoinService - 添加金币', () => {
  it('应正确添加金币', () => {
    const service = new CoinService();
    service.addCoins(10);
    expect(service.getCoinBalance()).toBe(10);

    service.addCoins(50);
    expect(service.getCoinBalance()).toBe(60);
  });
});

describe('CoinService - 扣除金币', () => {
  it('应正确扣除金币', () => {
    const service = new CoinService();
    service.addCoins(100);
    const success = service.spendCoins(30);

    expect(success).toBe(true);
    expect(service.getCoinBalance()).toBe(70);
  });
});

describe('CoinService - 金币不足', () => {
  it('余额不足时应返回false', () => {
    const service = new CoinService();
    service.addCoins(10);
    const success = service.spendCoins(50);

    expect(success).toBe(false);
    expect(service.getCoinBalance()).toBe(10);
  });
});

describe('CoinService - 统计数据', () => {
  it('应正确统计累计金币', () => {
    const service = new CoinService();

    service.addCoins(100);
    expect(service.getTotalEarned()).toBe(100);
    expect(service.getTotalSpent()).toBe(0);

    service.spendCoins(30);
    expect(service.getTotalEarned()).toBe(100);
    expect(service.getTotalSpent()).toBe(30);
  });
});
