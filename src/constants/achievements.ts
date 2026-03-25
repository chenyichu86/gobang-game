/**
 * 成就系统常量
 * Week 7: 用户成长系统
 */

import { Achievement } from '../types/user';

/**
 * 成就定义列表
 */
export const ACHIEVEMENTS: Achievement[] = [
  // 对局成就
  {
    id: 'first_game',
    name: '初出茅庐',
    description: '完成第1局游戏',
    icon: '🎮',
    category: 'game',
    condition: { type: 'first_game' },
    reward: { exp: 50 },
  },
  {
    id: 'first_win',
    name: '首胜',
    description: '获得首次胜利',
    icon: '🎯',
    category: 'game',
    condition: { type: 'first_win' },
    reward: { exp: 100, coins: 50 },
  },
  {
    id: 'win_streak_5',
    name: '连胜大师',
    description: '达成5连胜',
    icon: '🔥',
    category: 'game',
    condition: { type: 'win_streak', count: 5 },
    reward: { exp: 200, coins: 100 },
  },
  {
    id: 'win_streak_10',
    name: '不败金身',
    description: '达成10连胜',
    icon: '🛡️',
    category: 'game',
    condition: { type: 'win_streak', count: 10 },
    reward: { exp: 300, coins: 150 },
  },
  {
    id: 'games_100',
    name: '百战将',
    description: '完成100局游戏',
    icon: '⚔️',
    category: 'collection',
    condition: { type: 'games_played', count: 100 },
    reward: { exp: 500, coins: 200 },
  },

  // 技巧成就
  {
    id: 'quick_win_10',
    name: '闪电战',
    description: '10步内获胜',
    icon: '⚡',
    category: 'skill',
    condition: { type: 'quick_win', moves: 10 },
    reward: { exp: 150, coins: 50 },
  },
  {
    id: 'perfect_defense',
    name: '完美防守',
    description: '未失一子获胜',
    icon: '🛡️',
    category: 'skill',
    condition: { type: 'perfect_defense' },
    reward: { exp: 200, coins: 100 },
  },

  // 收集成就
  {
    id: 'wins_1000',
    name: '千胜王者',
    description: '累计获胜1000局',
    icon: '👑',
    category: 'collection',
    condition: { type: 'total_wins', count: 1000 },
    reward: { exp: 1000, coins: 500 },
  },
  {
    id: 'hints_50',
    name: '博学者',
    description: '使用提示功能50次',
    icon: '📚',
    category: 'collection',
    condition: { type: 'hints_used', count: 50 },
    reward: { exp: 200 },
  },
  {
    id: 'daily_login_7',
    name: '坚持不懈',
    description: '连续7天登录',
    icon: '📅',
    category: 'collection',
    condition: { type: 'daily_login', days: 7 },
    reward: { exp: 300, coins: 100 },
  },
];

/**
 * 根据ID获取成就
 */
export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

/**
 * 根据分类获取成就
 */
export function getAchievementsByCategory(category: string): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.category === category);
}
