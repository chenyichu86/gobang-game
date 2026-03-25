/**
 * 商城系统类型定义
 * Week 8: 皮肤商城
 */

/**
 * 商品类型
 */
export type ShopItemType = 'board_skin' | 'piece_skin';

/**
 * 稀有度
 */
export type Rarity = 'common' | 'rare' | 'legendary';

/**
 * 皮肤类型
 */
export type SkinType = 'board' | 'piece';

/**
 * 商城商品
 */
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: ShopItemType;
  rarity: Rarity;
  price: number;
  preview: string; // 预览图URL或emoji
  owned: boolean;
  locked: boolean; // 是否需要解锁条件
}

/**
 * 购买结果
 */
export interface PurchaseResult {
  success: boolean;
  item?: ShopItem;
  error?: 'insufficient_coins' | 'already_owned' | 'item_not_found' | 'item_locked';
}

/**
 * 用户皮肤数据
 */
export interface UserSkinData {
  unlockedSkins: string[];   // 已解锁的皮肤ID列表
  currentBoardSkin: string;  // 当前应用的棋盘皮肤
  currentPieceSkin: string;  // 当前应用的棋子皮肤
}
