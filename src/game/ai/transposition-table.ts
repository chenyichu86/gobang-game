/**
 * TranspositionTable - 置换表（Transposition Table）
 * Week 6 - 置换表缓存优化
 *
 * 功能：
 * - 缓存已评估的棋盘状态
 * - 使用Zobrist哈希生成唯一标识
 * - LRU淘汰策略
 * - 性能优化：存储<1ms，查找<0.1ms
 */

import type { Position } from '../core/rules';

/**
 * 条目类型标志
 */
export enum EntryFlag {
  EXACT = 0, // 精确值
  ALPHA = 1, // 下界（Alpha剪枝）
  BETA = 2,  // 上界（Beta剪枝）
}

/**
 * 置换表条目
 */
export interface TranspositionEntry {
  hash: bigint; // 棋盘状态哈希值（Zobrist哈希）
  depth: number; // 搜索深度
  score: number; // 评估分数
  flag: EntryFlag; // 边界标志
  bestMove: Position; // 最优着法
  age: number; // 年龄（用于LRU替换策略）
}

/**
 * 置换表类
 */
export class TranspositionTable {
  private table: Map<string, TranspositionEntry>;
  private maxSize: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(size: number = 100000) {
    this.table = new Map();
    this.maxSize = size;
  }

  /**
   * 存储条目到置换表
   */
  store(entry: TranspositionEntry): void {
    // 处理容量为0的情况
    if (this.maxSize === 0) {
      return;
    }

    const key = this.hashToKey(entry.hash);

    // 如果表已满，执行LRU清理
    if (this.table.size >= this.maxSize) {
      this.evictLRU();
    }

    // 替换策略：更深深度覆盖更浅深度
    const existing = this.table.get(key);
    if (existing && existing.depth > entry.depth) {
      return; // 保留更深的条目
    }

    entry.age = Date.now();
    this.table.set(key, entry);
  }

  /**
   * 从置换表查找条目
   */
  retrieve(hash: bigint, depth: number): TranspositionEntry | null {
    const key = this.hashToKey(hash);
    const entry = this.table.get(key);

    // 验证hash和深度（避免冲突）
    if (entry && entry.hash === hash && entry.depth >= depth) {
      this.hits++;
      entry.age = Date.now(); // 更新访问时间
      return entry;
    }

    if (entry) {
      this.misses++;
    } else {
      this.misses++;
    }

    return null;
  }

  /**
   * LRU清理：删除最老的条目
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAge = Infinity;

    for (const [key, entry] of this.table.entries()) {
      if (entry.age < oldestAge) {
        oldestAge = entry.age;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.table.delete(oldestKey);
    }
  }

  /**
   * hash转key（取模）
   */
  private hashToKey(hash: bigint): string {
    // 处理容量为0的情况
    if (this.maxSize === 0) {
      return '0';
    }
    // 使用BigInt模运算
    const mod = BigInt(this.maxSize);
    const result = ((hash % mod) + mod) % mod; // 确保结果为正数
    return result.toString();
  }

  /**
   * 获取命中率
   */
  getHitRate(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : this.hits / total;
  }

  /**
   * 清空表
   */
  clear(): void {
    this.table.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    return {
      size: this.table.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.getHitRate(),
    };
  }
}

/**
 * Zobrist哈希生成器
 */
export class ZobristHash {
  private table: bigint[][][];
  private readonly BOARD_SIZE = 15;

  constructor() {
    this.table = this.generateRandomTable();
  }

  /**
   * 生成随机哈希表
   */
  private generateRandomTable(): bigint[][][] {
    const table: bigint[][][] = [];

    for (let x = 0; x < this.BOARD_SIZE; x++) {
      table[x] = [];
      for (let y = 0; y < this.BOARD_SIZE; y++) {
        table[x][y] = {
          black: this.generateRandom64(),
          white: this.generateRandom64(),
        };
      }
    }

    return table;
  }

  /**
   * 生成随机64位整数
   */
  private generateRandom64(): bigint {
    // 使用简单的伪随机数生成器
    // 在实际应用中应该使用crypto.getRandomValues()
    const array = new Uint32Array(2);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      // Fallback for Node.js environment
      array[0] = Math.floor(Math.random() * 0xffffffff);
      array[1] = Math.floor(Math.random() * 0xffffffff);
    }
    return (BigInt(array[0]) << 32n) | BigInt(array[1]);
  }

  /**
   * 计算棋盘的哈希值
   */
  computeHash(board: import('../core/board').Board): bigint {
    let hash = 0n;

    for (let y = 0; y < this.BOARD_SIZE; y++) {
      for (let x = 0; x < this.BOARD_SIZE; x++) {
        const cell = board.getCell(x, y);
        if (cell !== null) {
          hash ^= this.table[x][y][cell];
        }
      }
    }

    return hash;
  }

  /**
   * 增量更新哈希值（落子）
   */
  makeMove(hash: bigint, x: number, y: number, player: 'black' | 'white'): bigint {
    return hash ^ this.table[x][y][player];
  }

  /**
   * 增量更新哈希值（悔棋）
   * 注意：悔棋也是异或操作，因为异或是可逆的
   */
  undoMove(hash: bigint, x: number, y: number, player: 'black' | 'white'): bigint {
    // 悔棋也是异或操作（XOR是可逆的）
    return hash ^ this.table[x][y][player];
  }
}
