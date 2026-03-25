/**
 * Week 9: ShopPage 组件测试
 * TDD Phase: RED - 测试代码编写完成，等待实现
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShopPage } from '../../components/Shop/ShopPage';
import { useShopItems } from '../../hooks/useShopItems';
import { useUserStore } from '../../store/user-store';

// Mock hooks
vi.mock('../../hooks/useShopItems');
vi.mock('../../store/user-store');

const mockUseShopItems = vi.mocked(useShopItems);
const mockUseUserStore = vi.mocked(useUserStore);

describe('ShopPage - 商城页面组件', () => {
  const mockPurchaseSkin = vi.fn();
  const mockApplySkin = vi.fn();

  beforeEach(() => {
    mockUseUserStore.mockReturnValue({
      coins: 500,
      unlockedSkins: ['classic_board', 'classic_piece'],
      purchaseSkin: mockPurchaseSkin,
      applySkin: mockApplySkin,
    } as any);

    mockUseShopItems.mockReturnValue([
      {
        id: 'ocean_board',
        type: 'board',
        name: '海洋棋盘',
        description: '清凉的海洋风格',
        price: 200,
        icon: '🌊',
      },
      {
        id: 'magma_board',
        type: 'board',
        name: '岩浆棋盘',
        description: '炽热的岩浆风格',
        price: 1000,
        icon: '🌋',
      },
    ]);
  });

  /**
   * 测试用例 1: 渲染商城页面
   */
  it('应该正确渲染商城页面', () => {
    render(<ShopPage />);

    expect(screen.getByText('商城')).toBeInTheDocument();
  });

  /**
   * 测试用例 2: 显示金币余额
   */
  it('应该显示用户金币余额', () => {
    render(<ShopPage />);

    expect(screen.getByText('500')).toBeInTheDocument();
  });

  /**
   * 测试用例 3: 渲染皮肤列表
   */
  it('应该正确渲染皮肤列表', () => {
    render(<ShopPage />);

    expect(screen.getByText('海洋棋盘')).toBeInTheDocument();
    expect(screen.getByText('岩浆棋盘')).toBeInTheDocument();
  });

  /**
   * 测试用例 4: 显示皮肤价格
   */
  it('应该显示皮肤价格', () => {
    render(<ShopPage />);

    // 使用函数匹配器，因为价格和金币图标在一起
    expect(screen.getByText((content) => content.includes('200'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('1000'))).toBeInTheDocument();
  });

  /**
   * 测试用例 5: 购买按钮（金币不足）
   */
  it('应该禁用购买按钮当金币不足', () => {
    mockUseUserStore.mockReturnValue({
      coins: 100,
      unlockedSkins: ['classic_board'],
      purchaseSkin: mockPurchaseSkin,
      applySkin: mockApplySkin,
    } as any);

    render(<ShopPage />);

    // 找所有包含"购买"的按钮
    const buyButtons = screen.getAllByText('购买');
    // 应该有禁用状态的按钮
    const disabledButton = buyButtons.find(btn => btn instanceof HTMLButtonElement && btn.disabled);
    expect(disabledButton).toBeDefined();
  });

  /**
   * 测试用例 6: 点击购买
   */
  it('应该调用 purchaseSkin 当点击购买按钮', () => {
    mockUseUserStore.mockReturnValue({
      coins: 500,
      unlockedSkins: ['classic_board'],
      purchaseSkin: mockPurchaseSkin,
      applySkin: mockApplySkin,
    } as any);

    render(<ShopPage />);

    // 找第一个"购买"按钮
    const buyButtons = screen.getAllByText('购买');
    fireEvent.click(buyButtons[0]);

    expect(mockPurchaseSkin).toHaveBeenCalled();
  });

  /**
   * 测试用例 7: 应用皮肤
   */
  it('应该调用 applySkin 当点击应用按钮', () => {
    mockUseUserStore.mockReturnValue({
      coins: 500,
      unlockedSkins: ['ocean_board'],
      purchaseSkin: mockPurchaseSkin,
      applySkin: mockApplySkin,
    } as any);

    render(<ShopPage />);

    const applyButton = screen.getByText('应用');
    fireEvent.click(applyButton);

    expect(mockApplySkin).toHaveBeenCalled();
  });
});
