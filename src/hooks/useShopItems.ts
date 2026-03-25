/**
 * Week 9: 商城数据 Hook
 * TDD Phase: GREEN - 实现完成
 */

import { ShopService } from '../services/shop-service';

export function useShopItems() {
  const service = new ShopService();
  return service.getShopItems();
}
