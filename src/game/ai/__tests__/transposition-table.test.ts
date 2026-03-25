/**
 * TranspositionTable测试套件
 * Week 6 - 测试置换表功能
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TranspositionTable, ZobristHash, EntryFlag } from '../transposition-table';
import { Board } from '../../core/board';
import type { Position } from '../../core/rules';

describe('TranspositionTable', () => {
  let table: TranspositionTable;

  beforeEach(() => {
    table = new TranspositionTable(1000);
  });

  describe('基础操作', () => {
    it('应该初始化空表', () => {
      const stats = table.getStats();
      expect(stats.size).toBe(0);
      expect(stats.hitRate).toBe(0);
    });

    it('应该正确存储和检索条目', () => {
      const entry: TranspositionEntry = {
        hash: 12345n,
        depth: 4,
        score: 1000,
        flag: EntryFlag.EXACT,
        bestMove: { x: 7, y: 7 },
        age: Date.now(),
      };

      table.store(entry);
      const retrieved = table.retrieve(12345n, 4);

      expect(retrieved).toBeDefined();
      expect(retrieved!.score).toBe(1000);
      expect(retrieved!.bestMove).toEqual({ x: 7, y: 7 });
    });

    it('深度不匹配时应该返回null', () => {
      const entry: TranspositionEntry = {
        hash: 12345n,
        depth: 4,
        score: 1000,
        flag: EntryFlag.EXACT,
        bestMove: { x: 7, y: 7 },
        age: Date.now(),
      };

      table.store(entry);

      // 查询深度5，但存储的是深度4，应该返回null
      const retrieved = table.retrieve(12345n, 5);
      expect(retrieved).toBeNull();
    });

    it('应该覆盖已存在的条目（更深深度）', () => {
      const entry1: TranspositionEntry = {
        hash: 12345n,
        depth: 4,
        score: 1000,
        flag: EntryFlag.EXACT,
        bestMove: { x: 7, y: 7 },
        age: Date.now(),
      };

      const entry2: TranspositionEntry = {
        hash: 12345n,
        depth: 6,
        score: 2000,
        flag: EntryFlag.EXACT,
        bestMove: { x: 8, y: 8 },
        age: Date.now(),
      };

      table.store(entry1);
      table.store(entry2);

      const stats = table.getStats();
      expect(stats.size).toBe(1); // 表大小仍为1

      const retrieved = table.retrieve(12345n, 6);
      expect(retrieved).toBeDefined();
      expect(retrieved!.score).toBe(2000); // 新的更深条目覆盖了旧的
    });

    it('应该保留更深的条目', () => {
      const entry1: TranspositionEntry = {
        hash: 12345n,
        depth: 6,
        score: 1000,
        flag: EntryFlag.EXACT,
        bestMove: { x: 7, y: 7 },
        age: Date.now(),
      };

      const entry2: TranspositionEntry = {
        hash: 12345n,
        depth: 4,
        score: 2000,
        flag: EntryFlag.EXACT,
        bestMove: { x: 8, y: 8 },
        age: Date.now(),
      };

      table.store(entry1);
      table.store(entry2); // 尝试用更浅的深度覆盖

      const retrieved = table.retrieve(12345n, 6);
      expect(retrieved).toBeDefined();
      expect(retrieved!.score).toBe(1000); // 应该保留更深的条目
    });

    it('clear应该清空所有条目', () => {
      // 存储10个条目
      for (let i = 0; i < 10; i++) {
        const entry: TranspositionEntry = {
          hash: BigInt(i),
          depth: 4,
          score: i * 1000,
          flag: EntryFlag.EXACT,
          bestMove: { x: i, y: i },
          age: Date.now(),
        };
        table.store(entry);
      }

      let stats = table.getStats();
      expect(stats.size).toBe(10);

      table.clear();

      stats = table.getStats();
      expect(stats.size).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('LRU策略', () => {
    it('应该执行LRU清理', () => {
      const smallTable = new TranspositionTable(3);

      const entry1: TranspositionEntry = {
        hash: 1n,
        depth: 4,
        score: 1000,
        flag: EntryFlag.EXACT,
        bestMove: { x: 0, y: 0 },
        age: 1000, // 最老的条目
      };

      const entry2: TranspositionEntry = {
        hash: 2n,
        depth: 4,
        score: 2000,
        flag: EntryFlag.EXACT,
        bestMove: { x: 1, y: 1 },
        age: 2000,
      };

      const entry3: TranspositionEntry = {
        hash: 3n,
        depth: 4,
        score: 3000,
        flag: EntryFlag.EXACT,
        bestMove: { x: 2, y: 2 },
        age: 3000,
      };

      const entry4: TranspositionEntry = {
        hash: 4n,
        depth: 4,
        score: 4000,
        flag: EntryFlag.EXACT,
        bestMove: { x: 3, y: 3 },
        age: 4000,
      };

      smallTable.store(entry1);
      smallTable.store(entry2);
      smallTable.store(entry3);
      smallTable.store(entry4); // 触发LRU清理

      const stats = smallTable.getStats();
      expect(stats.size).toBeLessThanOrEqual(3); // 表大小不超过3
    });

    it('访问应该更新LRU时间', () => {
      const smallTable = new TranspositionTable(2); // 容量设为2，更容易测试LRU

      const now = Date.now();

      const entry1: TranspositionEntry = {
        hash: 1n,
        depth: 4,
        score: 1000,
        flag: EntryFlag.EXACT,
        bestMove: { x: 0, y: 0 },
        age: now - 2000, // 最老的条目
      };

      const entry2: TranspositionEntry = {
        hash: 2n,
        depth: 4,
        score: 2000,
        flag: EntryFlag.EXACT,
        bestMove: { x: 1, y: 1 },
        age: now - 1000, // 中间
      };

      smallTable.store(entry1);
      smallTable.store(entry2);

      // 访问entry1，更新其age为当前时间
      smallTable.retrieve(1n, 4);

      // 存储entry3，触发LRU清理（表从2个变成3个，达到maxSize）
      const entry3: TranspositionEntry = {
        hash: 3n,
        depth: 4,
        score: 3000,
        flag: EntryFlag.EXACT,
        bestMove: { x: 2, y: 2 },
        age: now, // 新条目
      };

      smallTable.store(entry3);

      // entry1应该仍在（刚被访问过）
      expect(smallTable.retrieve(1n, 4)).toBeDefined();
      // entry3应该存在（新添加的）
      expect(smallTable.retrieve(3n, 4)).toBeDefined();
      // entry2应该仍在（表还没满到需要驱逐）
      expect(smallTable.retrieve(2n, 4)).toBeDefined();
    });
  });

  describe('命中率统计', () => {
    it('应该正确计算命中率', () => {
      // 存储10个条目
      for (let i = 0; i < 10; i++) {
        const entry: TranspositionEntry = {
          hash: BigInt(i),
          depth: 4,
          score: i * 1000,
          flag: EntryFlag.EXACT,
          bestMove: { x: i, y: i },
          age: Date.now(),
        };
        table.store(entry);
      }

      // 查询5个存在的（命中）
      for (let i = 0; i < 5; i++) {
        table.retrieve(BigInt(i), 4);
      }

      // 查询5个不存在的（未命中）
      for (let i = 10; i < 15; i++) {
        table.retrieve(BigInt(i), 4);
      }

      const stats = table.getStats();
      expect(stats.hits).toBe(5);
      expect(stats.misses).toBe(5); // 5次未命中
      expect(stats.hitRate).toBeCloseTo(0.5, 1); // 50%命中率
    });

    it('初始命中率应该为0', () => {
      const stats = table.getStats();
      expect(stats.hitRate).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('边界条件', () => {
    it('空表查找应该返回null', () => {
      const emptyTable = new TranspositionTable(100);
      const result = emptyTable.retrieve(12345n, 4);
      expect(result).toBeNull();
    });

    it('容量为0的表应该正常工作', () => {
      const zeroTable = new TranspositionTable(0);

      const entry: TranspositionEntry = {
        hash: 12345n,
        depth: 4,
        score: 1000,
        flag: EntryFlag.EXACT,
        bestMove: { x: 7, y: 7 },
        age: Date.now(),
      };

      zeroTable.store(entry);

      const stats = zeroTable.getStats();
      expect(stats.size).toBe(0); // 容量为0，无法存储
    });

    it('应该正确处理大量条目', () => {
      const largeTable = new TranspositionTable(10000);

      // 存储1000个条目
      for (let i = 0; i < 1000; i++) {
        const entry: TranspositionEntry = {
          hash: BigInt(i),
          depth: 4,
          score: i,
          flag: EntryFlag.EXACT,
          bestMove: { x: i % 15, y: (i / 15) | 0 },
          age: Date.now(),
        };
        largeTable.store(entry);
      }

      const stats = largeTable.getStats();
      expect(stats.size).toBe(1000);
    });
  });
});

describe('ZobristHash', () => {
  let zobrist: ZobristHash;
  let board: Board;

  beforeEach(() => {
    zobrist = new ZobristHash();
    board = new Board(15);
  });

  describe('哈希生成', () => {
    it('空棋盘的哈希应该为0', () => {
      const hash = zobrist.computeHash(board);
      expect(hash).toBe(0n);
    });

    it('不同棋盘状态应该生成不同哈希', () => {
      board.setCell(7, 7, 'black');
      const hash1 = zobrist.computeHash(board);

      const board2 = new Board(15);
      board2.setCell(7, 8, 'black');
      const hash2 = zobrist.computeHash(board2);

      expect(hash1).not.toBe(hash2);
    });

    it('相同棋盘状态应该生成相同哈希', () => {
      board.setCell(7, 7, 'black');

      const hash1 = zobrist.computeHash(board);
      const hash2 = zobrist.computeHash(board);

      expect(hash1).toBe(hash2);
    });

    it('不同位置的相同棋子应该生成不同哈希', () => {
      board.setCell(7, 7, 'black');
      const hash1 = zobrist.computeHash(board);

      const board2 = new Board(15);
      board2.setCell(8, 8, 'black');
      const hash2 = zobrist.computeHash(board2);

      expect(hash1).not.toBe(hash2);
    });

    it('不同颜色的棋子应该生成不同哈希', () => {
      board.setCell(7, 7, 'black');
      const hash1 = zobrist.computeHash(board);

      const board2 = new Board(15);
      board2.setCell(7, 7, 'white');
      const hash2 = zobrist.computeHash(board2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('增量更新', () => {
    it('落子时应该正确更新哈希', () => {
      const initialHash = zobrist.computeHash(board);

      const newHash = zobrist.makeMove(initialHash, 7, 7, 'black');
      board.setCell(7, 7, 'black');
      const expectedHash = zobrist.computeHash(board);

      expect(newHash).toBe(expectedHash);
    });

    it('悔棋时应该正确恢复哈希', () => {
      board.setCell(7, 7, 'black');
      const initialHash = zobrist.computeHash(board);

      // 模拟落子
      const afterMoveHash = zobrist.makeMove(initialHash, 7, 8, 'black');

      // 模拟悔棋
      const afterUndoHash = zobrist.undoMove(afterMoveHash, 7, 8, 'black');

      expect(afterUndoHash).toBe(initialHash);
    });

    it('落子后悔棋应该回到初始哈希', () => {
      const initialHash = zobrist.computeHash(board);

      const afterMoveHash = zobrist.makeMove(initialHash, 7, 7, 'black');
      const afterUndoHash = zobrist.undoMove(afterMoveHash, 7, 7, 'black');

      expect(afterUndoHash).toBe(initialHash);
    });

    it('多个落子的增量更新应该一致', () => {
      const hash1 = zobrist.computeHash(board);

      const hash2 = zobrist.makeMove(hash1, 7, 7, 'black');
      board.setCell(7, 7, 'black');
      const expected2 = zobrist.computeHash(board);
      expect(hash2).toBe(expected2);

      const hash3 = zobrist.makeMove(hash2, 7, 8, 'white');
      board.setCell(7, 8, 'white');
      const expected3 = zobrist.computeHash(board);
      expect(hash3).toBe(expected3);

      const hash4 = zobrist.makeMove(hash3, 8, 8, 'black');
      board.setCell(8, 8, 'black');
      const expected4 = zobrist.computeHash(board);
      expect(hash4).toBe(expected4);
    });
  });
});

describe('EntryFlag', () => {
  it('应该定义三种标志类型', () => {
    expect(EntryFlag.EXACT).toBe(0);
    expect(EntryFlag.ALPHA).toBe(1);
    expect(EntryFlag.BETA).toBe(2);
  });
});
