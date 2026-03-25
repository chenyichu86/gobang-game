import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../../src/store/ui-store';

describe('UIStore', () => {
  beforeEach(() => {
    // 重置UI状态
    useUIStore.setState({ currentPage: '/', soundEnabled: true });
  });

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      const state = useUIStore.getState();
      expect(state.currentPage).toBe('/');
      expect(state.soundEnabled).toBe(true);
    });
  });

  describe('状态更新', () => {
    it('toggleSound应该切换声音状态', () => {
      const { toggleSound } = useUIStore.getState();

      toggleSound();
      expect(useUIStore.getState().soundEnabled).toBe(false);

      toggleSound();
      expect(useUIStore.getState().soundEnabled).toBe(true);
    });

    it('setCurrentPage应该更新当前页面', () => {
      const { setCurrentPage } = useUIStore.getState();
      setCurrentPage('/game');
      expect(useUIStore.getState().currentPage).toBe('/game');
    });
  });
});
