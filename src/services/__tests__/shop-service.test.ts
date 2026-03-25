/**
 * ShopService 单元测试
 * Week 8: 商城系统测试
 *
 * TDD流程:
 * RED: QA先编写测试（当前阶段）
 * GREEN: DEV实现功能让测试通过
 * REFACTOR: 优化代码
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ShopService } from '../shop-service';
import type { ShopItem } from '../../types/shop';

describe('ShopService - 皮肤列表', () => {
  it('应加载10款皮肤（5棋盘+5棋子）', () => {
    const service = new ShopService();
    const items = service.getShopItems();

    const boardSkins = items.filter(i => i.type === 'board_skin');
    const pieceSkins = items.filter(i => i.type === 'piece_skin');

    expect(boardSkins).toHaveLength(5);
    expect(pieceSkins).toHaveLength(5);
  });
});

describe('ShopService - 皮肤价格', () => {
  it('皮肤价格应配置正确', () => {
    const service = new ShopService();
    const items = service.getShopItems();

    const classicBoard = items.find(i => i.id === 'classic_board');
    expect(classicBoard?.price).toBe(0); // 默认免费

    const oceanBoard = items.find(i => i.id === 'ocean_board');
    expect(oceanBoard?.price).toBe(200);

    const magmaBoard = items.find(i => i.id === 'magma_board');
    expect(magmaBoard?.price).toBe(1000);
  });
});

describe('ShopService - 购买皮肤', () => {
  it('应成功购买皮肤', () => {
    const service = new ShopService();
    service.setCoinBalance(1000);

    const result = service.purchaseSkin('ocean_board');

    expect(result.success).toBe(true);
    expect(result.item?.id).toBe('ocean_board');
    expect(service.getCoinBalance()).toBe(800); // 1000 - 200
  });
});

describe('ShopService - 金币不足', () => {
  it('金币不足时应购买失败', () => {
    const service = new ShopService();
    service.setCoinBalance(100);

    const result = service.purchaseSkin('magma_board');

    expect(result.success).toBe(false);
    expect(result.error).toBe('insufficient_coins');
    expect(service.getCoinBalance()).toBe(100); // 余额不变
  });
});

describe('ShopService - 重复购买', () => {
  it('已拥有的皮肤不能再次购买', () => {
    const service = new ShopService();
    service.setCoinBalance(1000);

    // 首次购买
    service.purchaseSkin('ocean_board');

    // 再次购买
    const result = service.purchaseSkin('ocean_board');

    expect(result.success).toBe(false);
    expect(result.error).toBe('already_owned');
  });
});

describe('ShopService - 应用皮肤', () => {
  it('应正确应用棋盘皮肤', () => {
    const service = new ShopService();
    service.setCoinBalance(1000);
    service.purchaseSkin('ocean_board');  // 先购买
    service.applySkin('ocean_board', 'board');

    expect(service.getCurrentBoardSkin()).toBe('ocean_board');
  });

  it('应正确应用棋子皮肤', () => {
    const service = new ShopService();
    service.setCoinBalance(1000);
    service.purchaseSkin('jade_piece');  // 先购买
    service.applySkin('jade_piece', 'piece');

    expect(service.getCurrentPieceSkin()).toBe('jade_piece');
  });
});

describe('ShopService - 皮肤拥有状态', () => {
  it('购买后皮肤应标记为已拥有', () => {
    const service = new ShopService();
    service.setCoinBalance(1000);

    expect(service.isSkinOwned('ocean_board')).toBe(false);

    service.purchaseSkin('ocean_board');

    expect(service.isSkinOwned('ocean_board')).toBe(true);
  });
});

describe('ShopService - 默认皮肤', () => {
  it('默认皮肤应已拥有', () => {
    const service = new ShopService();

    expect(service.isSkinOwned('classic_board')).toBe(true);
    expect(service.isSkinOwned('classic_piece')).toBe(true);
  });
});
