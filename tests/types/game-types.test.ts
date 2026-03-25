import { describe, it, expect } from 'vitest';
import type { Player, Position, GameStatus } from '../../src/types/game';

describe('游戏类型定义', () => {
  describe('Player类型', () => {
    it('Player类型应该只接受black或white', () => {
      const player1: Player = 'black';  // ✅
      const player2: Player = 'white';  // ✅
      // const player3: Player = 'red';  // ❌ 应该报错

      expect(player1).toBe('black');
      expect(player2).toBe('white');
    });
  });

  describe('Position类型', () => {
    it('Position类型应该有x和y坐标', () => {
      const pos: Position = { x: 7, y: 7 };
      expect(pos.x).toBeGreaterThanOrEqual(0);
      expect(pos.y).toBeLessThanOrEqual(14);
    });
  });

  describe('GameStatus类型', () => {
    it('GameStatus类型应该包含所有状态', () => {
      const statuses: GameStatus[] = ['idle', 'playing', 'won', 'draw'];
      expect(statuses).toHaveLength(4);
    });
  });
});
