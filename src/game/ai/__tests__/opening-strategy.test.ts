/**
 * OpeningStrategy测试
 * 验证开局多样性功能
 */

import { describe, it, expect, vi } from 'vitest';
import { OpeningStrategy } from '../opening-strategy';

describe('OpeningStrategy', () => {
  describe('selectOpening', () => {
    it('应该返回有效的位置（在棋盘范围内）', () => {
      const opening = OpeningStrategy.selectOpening();

      expect(opening.x).toBeGreaterThanOrEqual(0);
      expect(opening.x).toBeLessThan(15);
      expect(opening.y).toBeGreaterThanOrEqual(0);
      expect(opening.y).toBeLessThan(15);
    });

    it('多次选择应该有不同的开局（测试多样性）', () => {
      const openings = new Set();
      const trials = 100;

      for (let i = 0; i < trials; i++) {
        const opening = OpeningStrategy.selectOpening();
        const key = `${opening.x},${opening.y}`;
        openings.add(key);
      }

      // 至少应该有5种不同的开局（总共10种）
      expect(openings.size).toBeGreaterThanOrEqual(5);
    });

    it('天元(7,7)应该是最常见的开局', () => {
      const openings = { x7y7: 0 };
      const trials = 1000;

      for (let i = 0; i < trials; i++) {
        const opening = OpeningStrategy.selectOpening();
        if (opening.x === 7 && opening.y === 7) {
          openings.x7y7++;
        }
      }

      // 天元应该占大约50%（允许±10%的误差）
      const ratio = openings.x7y7 / trials;
      expect(ratio).toBeGreaterThan(0.4);
      expect(ratio).toBeLessThan(0.6);
    });
  });

  describe('isOpeningPosition', () => {
    it('应该正确识别天元位置', () => {
      expect(OpeningStrategy.isOpeningPosition({ x: 7, y: 7 })).toBe(true);
    });

    it('应该正确识别小目位置', () => {
      expect(OpeningStrategy.isOpeningPosition({ x: 6, y: 6 })).toBe(true);
      expect(OpeningStrategy.isOpeningPosition({ x: 8, y: 8 })).toBe(true);
    });

    it('应该正确识别星位位置', () => {
      expect(OpeningStrategy.isOpeningPosition({ x: 3, y: 3 })).toBe(true);
      expect(OpeningStrategy.isOpeningPosition({ x: 11, y: 11 })).toBe(true);
    });

    it('应该返回false对于非开局位置', () => {
      expect(OpeningStrategy.isOpeningPosition({ x: 0, y: 0 })).toBe(false);
      expect(OpeningStrategy.isOpeningPosition({ x: 7, y: 6 })).toBe(false);
    });
  });

  describe('getAllOpenings', () => {
    it('应该返回所有10种开局位置', () => {
      const openings = OpeningStrategy.getAllOpenings();
      expect(openings).toHaveLength(10);
    });

    it('所有位置都应该在棋盘范围内', () => {
      const openings = OpeningStrategy.getAllOpenings();

      openings.forEach(opening => {
        expect(opening.x).toBeGreaterThanOrEqual(0);
        expect(opening.x).toBeLessThan(15);
        expect(opening.y).toBeGreaterThanOrEqual(0);
        expect(opening.y).toBeLessThan(15);
      });
    });

    it('应该包含天元', () => {
      const openings = OpeningStrategy.getAllOpenings();
      const hasTianyuan = openings.some(
        opening => opening.x === 7 && opening.y === 7
      );
      expect(hasTianyuan).toBe(true);
    });
  });

  describe('getOpeningCount', () => {
    it('应该返回10', () => {
      expect(OpeningStrategy.getOpeningCount()).toBe(10);
    });
  });
});
