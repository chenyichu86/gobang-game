/**
 * 商城服务
 * Week 8: 皮肤商城实现
 *
 * 职责:
 * - 管理商城商品
 * - 处理购买逻辑
 * - 皮肤应用
 */

import type { ShopItem, PurchaseResult, SkinType } from '../types/shop';

export class ShopService {
  private shopItems: ShopItem[] = [];
  private coinBalance: number = 0;
  private ownedSkins: Set<string> = new Set();
  private currentBoardSkin: string = 'classic_board';
  private currentPieceSkin: string = 'classic_piece';

  constructor() {
    this.initializeShopItems();
    this.initializeOwnedSkins();
  }

  /**
   * 初始化商城商品
   */
  private initializeShopItems(): void {
    this.shopItems = [
      // 棋盘皮肤（5款）
      {
        id: 'classic_board',
        name: '经典木纹',
        description: '经典的木质纹理棋盘',
        type: 'board_skin',
        rarity: 'common',
        price: 0,
        preview: '🟫',
        owned: true,
        locked: false,
      },
      {
        id: 'ocean_board',
        name: '碧海青天',
        description: '清新的蓝色海洋主题',
        type: 'board_skin',
        rarity: 'common',
        price: 200,
        preview: '🌊',
        owned: false,
        locked: false,
      },
      {
        id: 'magma_board',
        name: '赤焰熔岩',
        description: '炽热的岩浆主题',
        type: 'board_skin',
        rarity: 'rare',
        price: 1000,
        preview: '🔥',
        owned: false,
        locked: false,
      },
      {
        id: 'starry_board',
        name: '暗夜星空',
        description: '神秘的星空主题',
        type: 'board_skin',
        rarity: 'rare',
        price: 1500,
        preview: '✨',
        owned: false,
        locked: false,
      },
      {
        id: 'dragon_board',
        name: '龙之棋盘',
        description: '传说中的龙纹棋盘',
        type: 'board_skin',
        rarity: 'legendary',
        price: 3000,
        preview: '🐉',
        owned: false,
        locked: false,
      },
      // 棋子皮肤（5款）
      {
        id: 'classic_piece',
        name: '黑白经典',
        description: '经典的黑白棋子',
        type: 'piece_skin',
        rarity: 'common',
        price: 0,
        preview: '⚫⚪',
        owned: true,
        locked: false,
      },
      {
        id: 'jade_piece',
        name: '玉石对弈',
        description: '温润的玉石棋子',
        type: 'piece_skin',
        rarity: 'common',
        price: 100,
        preview: '💚',
        owned: false,
        locked: false,
      },
      {
        id: 'gold_piece',
        name: '黄金荣耀',
        description: '闪耀的黄金棋子',
        type: 'piece_skin',
        rarity: 'rare',
        price: 800,
        preview: '🥇',
        owned: false,
        locked: false,
      },
      {
        id: 'frost_piece',
        name: '冰霜之刃',
        description: '锋利的冰霜棋子',
        type: 'piece_skin',
        rarity: 'rare',
        price: 1200,
        preview: '❄️',
        owned: false,
        locked: false,
      },
      {
        id: 'phoenix_piece',
        name: '凤凰涅槃',
        description: '重生的凤凰主题',
        type: 'piece_skin',
        rarity: 'legendary',
        price: 2500,
        preview: '🔶',
        owned: false,
        locked: false,
      },
    ];
  }

  /**
   * 初始化已拥有的皮肤
   */
  private initializeOwnedSkins(): void {
    this.ownedSkins.add('classic_board');
    this.ownedSkins.add('classic_piece');
  }

  /**
   * 获取商城商品列表
   */
  getShopItems(): ShopItem[] {
    return [...this.shopItems];
  }

  /**
   * 购买皮肤
   */
  purchaseSkin(skinId: string): PurchaseResult {
    // 查找商品
    const item = this.shopItems.find(i => i.id === skinId);
    if (!item) {
      return { success: false, error: 'item_not_found' };
    }

    // 检查是否已拥有
    if (this.ownedSkins.has(skinId)) {
      return { success: false, error: 'already_owned' };
    }

    // 检查是否锁定
    if (item.locked) {
      return { success: false, error: 'item_locked' };
    }

    // 检查金币余额
    if (this.coinBalance < item.price) {
      return { success: false, error: 'insufficient_coins' };
    }

    // 扣除金币
    this.coinBalance -= item.price;

    // 解锁皮肤
    this.ownedSkins.add(skinId);
    item.owned = true;

    return { success: true, item };
  }

  /**
   * 应用皮肤
   */
  applySkin(skinId: string, type: SkinType): void {
    // 检查是否拥有该皮肤
    if (!this.ownedSkins.has(skinId)) {
      throw new Error('Skin not owned');
    }

    if (type === 'board') {
      this.currentBoardSkin = skinId;
    } else {
      this.currentPieceSkin = skinId;
    }
  }

  /**
   * 获取当前棋盘皮肤
   */
  getCurrentBoardSkin(): string {
    return this.currentBoardSkin;
  }

  /**
   * 获取当前棋子皮肤
   */
  getCurrentPieceSkin(): string {
    return this.currentPieceSkin;
  }

  /**
   * 检查皮肤是否已拥有
   */
  isSkinOwned(skinId: string): boolean {
    return this.ownedSkins.has(skinId);
  }

  /**
   * 设置金币余额（用于测试）
   */
  setCoinBalance(amount: number): void {
    this.coinBalance = amount;
  }

  /**
   * 获取金币余额（用于测试）
   */
  getCoinBalance(): number {
    return this.coinBalance;
  }
}
