/**
 * ExpService 测试
 * Week 7: 经验值系统测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExpService } from '../exp-service';

describe('ExpService', () => {
  let service: ExpService;

  beforeEach(() => {
    service = new ExpService();
  });

  describe('胜利经验', () => {
    it('应获得100基础经验', () => {
      const exp = service.calculateExpGain('win', 1);
      expect(exp).toBe(100);
    });
  });

  describe('失败经验', () => {
    it('应获得20基础经验', () => {
      const exp = service.calculateExpGain('lose', 0);
      expect(exp).toBe(20);
    });
  });

  describe('和棋经验', () => {
    it('应获得50基础经验', () => {
      const exp = service.calculateExpGain('draw', 0);
      expect(exp).toBe(50);
    });
  });

  describe('连胜奖励', () => {
    it('连胜2局应额外获得50经验', () => {
      const exp = service.calculateExpGain('win', 2);
      expect(exp).toBe(150); // 100 + 50
    });

    it('连胜5局每局应额外获得50经验', () => {
      const exp = service.calculateExpGain('win', 5);
      expect(exp).toBe(150); // 100 + 50
    });
  });

  describe('连胜中断', () => {
    it('连胜中断后应不获得连胜奖励', () => {
      const exp = service.calculateExpGain('win', 1);
      expect(exp).toBe(100); // 仅基础经验
    });
  });

  describe('添加经验值', () => {
    it('应正确添加经验值', () => {
      service.addExp(100);
      expect(service.getTotalExp()).toBe(100);

      service.addExp(50);
      expect(service.getTotalExp()).toBe(150);
    });
  });

  describe('经验值上限', () => {
    it('经验值超过10000后不应再增加', () => {
      service.addExp(15000);
      expect(service.getTotalExp()).toBe(10000);
    });

    it('经验值正好10000时应达到上限', () => {
      service.addExp(10000);
      expect(service.getTotalExp()).toBe(10000);
      expect(service.isMaxLevel()).toBe(true);
    });
  });

  describe('设置经验值', () => {
    it('应正确设置经验值', () => {
      service.setExp(500);
      expect(service.getTotalExp()).toBe(500);
    });

    it('设置负数应重置为0', () => {
      service.setExp(-100);
      expect(service.getTotalExp()).toBe(0);
    });
  });

  describe('重置经验值', () => {
    it('应重置为0', () => {
      service.addExp(100);
      service.reset();
      expect(service.getTotalExp()).toBe(0);
    });
  });
});
