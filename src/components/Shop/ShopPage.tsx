/**
 * Week 9: 商城页面组件
 * TDD Phase: GREEN - 实现完成
 */

import React, { useState } from 'react';
import { useUserStore } from '../../store/user-store';
import { useShopItems } from '../../hooks/useShopItems';

export const ShopPage: React.FC = () => {
  const { coins, unlockedSkins, purchaseSkin, applySkin } = useUserStore();
  const shopItems = useShopItems();
  const [filter, setFilter] = useState<'all' | 'board' | 'piece'>('all');

  const filteredItems = shopItems.filter((item) =>
    filter === 'all' ? true : item.type === filter
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">商城</h1>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🪙</span>
          <span className="text-xl font-bold text-yellow-600">{coins}</span>
        </div>
      </div>

      {/* 分类筛选 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${
            filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          全部
        </button>
        <button
          onClick={() => setFilter('board')}
          className={`px-4 py-2 rounded ${
            filter === 'board' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          棋盘
        </button>
        <button
          onClick={() => setFilter('piece')}
          className={`px-4 py-2 rounded ${
            filter === 'piece' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          棋子
        </button>
      </div>

      {/* 皮肤列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item: any) => {
          const isOwned = unlockedSkins.includes(item.id);
          const canAfford = coins >= item.price;

          return (
            <div
              key={item.id}
              className="bg-white p-4 rounded-lg shadow-sm border"
            >
              <div className="text-4xl mb-2 text-center">{item.icon}</div>
              <h3 className="font-bold text-center mb-1">{item.name}</h3>
              <p className="text-sm text-gray-600 text-center mb-3">
                {item.description}
              </p>

              <div className="text-center mb-3">
                <span className="text-yellow-600 font-bold">🪙 {item.price}</span>
              </div>

              {isOwned ? (
                <button
                  onClick={() => applySkin(item.id, item.type)}
                  className="w-full py-2 bg-green-500 text-white rounded font-bold hover:bg-green-600"
                >
                  应用
                </button>
              ) : (
                <button
                  onClick={() => purchaseSkin(item.id)}
                  disabled={!canAfford}
                  className={`w-full py-2 rounded font-bold ${
                    canAfford
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  购买
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
