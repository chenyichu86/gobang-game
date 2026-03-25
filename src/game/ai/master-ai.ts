/**
 * MasterAI - 大师AI（深度6搜索 + 置换表优化）
 * Week 6 - 大师AI核心实现
 *
 * 功能：
 * - 深度6层搜索（迭代加深）
 * - 置换表缓存优化
 * - 超时保护（10秒超时）
 * - 性能目标：深度6搜索<10秒
 */

import { Board } from '../core/board';
import { GameRules } from '../core/rules';
import type { Position, Player } from '../core/rules';
import { BoardEvaluator } from './board-evaluator';
import { MoveGenerator } from './move-generator';
import { HardAI, HardAIConfig, AIStats } from './hard-ai';
import { TranspositionTable, ZobristHash, EntryFlag, TranspositionEntry } from './transposition-table';

/**
 * MasterAI配置
 */
export interface MasterAIConfig extends HardAIConfig {
  enableTranspositionTable: boolean; // 启用置换表（默认true）
  enableIterativeDeepening: boolean; // 启用迭代加深（默认true）
  tableSize: number; // 置换表大小（默认100000）
}

/**
 * MasterAI统计信息（扩展HardAI）
 */
export interface MasterAIStats extends AIStats {
  tableHitRate: number; // 置换表命中率
  tableSize: number; // 置换表当前大小
  searchDepth: number; // 实际搜索深度
  fromFallback: boolean; // 是否来自降级
}

export class MasterAI extends HardAI {
  private masterConfig: MasterAIConfig;
  private transpositionTable: TranspositionTable;
  private zobristHash: ZobristHash;
  private currentHash: bigint = 0n;
  private actualSearchDepth: number = 0;
  private fromFallback: boolean = false;

  constructor(config?: Partial<MasterAIConfig>) {
    // 初始化HardAI部分，默认深度6
    const hardAIConfig: Partial<HardAIConfig> = {
      searchDepth: 6,
      timeLimit: 10000,
      enableAlphaBeta: true,
      ...config,
    };

    super(hardAIConfig);

    this.masterConfig = {
      searchDepth: 6,
      timeLimit: 10000,
      enableAlphaBeta: true,
      enableTranspositionTable: true,
      enableIterativeDeepening: true,
      tableSize: 100000,
      ...config,
    };

    this.transpositionTable = new TranspositionTable(this.masterConfig.tableSize);
    this.zobristHash = new ZobristHash();
  }

  /**
   * 计算AI下一步的落子位置
   * 策略：Minimax + Alpha-Beta剪枝 + 置换表 + 迭代加深
   */
  async calculateMove(board: Board, aiPlayer: Player): Promise<Position> {
    const startTime = Date.now();

    try {
      // 重置标志
      this.fromFallback = false;
      this.actualSearchDepth = 0;

      // 计算初始哈希
      this.currentHash = this.zobristHash.computeHash(board);

      // 生成候选着法
      const moveGenerator = new MoveGenerator();
      const candidates = moveGenerator.generateCandidates(board);

      // 如果棋盘为空，占据中心位置
      if (candidates.length === 1 && candidates[0].position.x === 7 && candidates[0].position.y === 7) {
        return candidates[0].position;
      }

      // 如果只有一个候选着法
      if (candidates.length === 1) {
        return candidates[0].position;
      }

      let bestPosition = candidates[0].position;
      let bestScore = -Infinity;

      // 使用迭代加深搜索
      if (this.masterConfig.enableIterativeDeepening) {
        const maxDepth = this.masterConfig.searchDepth;

        // 从深度1逐步增加到目标深度
        for (let depth = 1; depth <= maxDepth; depth++) {
          // 检查超时
          if (Date.now() - startTime > this.masterConfig.timeLimit - 200) {
            console.log(`Master AI: 超时，返回深度${depth - 1}的结果`);
            break;
          }

          // 搜索当前深度
          const result = await this.searchDepth(
            board,
            aiPlayer,
            depth,
            this.currentHash,
            startTime,
            candidates,
          );

          if (result.position) {
            bestPosition = result.position;
            bestScore = result.score;
            this.actualSearchDepth = depth;

            // 如果找到必胜着法，立即返回
            if (Math.abs(bestScore) > 900000) {
              console.log(`Master AI: 找到必胜着法，深度${depth}`);
              break;
            }
          }

          console.log(`Master AI: 深度${depth}完成，分数${bestScore}`);
        }
      } else {
        // 不使用迭代加深，直接搜索最大深度
        const result = await this.searchDepth(
          board,
          aiPlayer,
          this.masterConfig.searchDepth,
          this.currentHash,
          startTime,
          candidates,
        );

        if (result.position) {
          bestPosition = result.position;
          this.actualSearchDepth = this.masterConfig.searchDepth;
        }
      }

      return bestPosition;
    } catch (error) {
      // 超时或其他错误，降级到HardAI
      console.warn('Master AI降级到HardAI:', error);
      this.fromFallback = true;
      return super.calculateMove(board, aiPlayer);
    }
  }

  /**
   * 搜索特定深度
   */
  private async searchDepth(
    board: Board,
    player: Player,
    depth: number,
    hash: bigint,
    startTime: number,
    candidates: { position: Position; score: number }[],
  ): Promise<{ position: Position | null; score: number }> {
    let bestPosition: Position | null = null;
    let bestScore = player === 'black' ? -Infinity : Infinity;

    const isMaximizing = player === 'black';
    const alpha = -Infinity;
    const beta = Infinity;

    // 遍历所有候选着法
    for (const { position } of candidates) {
      // 检查超时
      if (Date.now() - startTime > this.masterConfig.timeLimit - 200) {
        break;
      }

      // 模拟落子
      board.setCell(position.x, position.y, player);
      const newHash = this.zobristHash.makeMove(hash, position.x, position.y, player);

      // 递归搜索
      const score = this.minimaxWithTranspositionTable(
        board,
        depth - 1,
        alpha,
        beta,
        !isMaximizing,
        player,
        newHash,
        startTime,
      );

      // 撤销落子
      board.setCell(position.x, position.y, null);

      // 更新最佳着法
      if (isMaximizing) {
        if (score > bestScore) {
          bestScore = score;
          bestPosition = position;
        }
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestPosition = position;
        }
      }
    }

    return { position: bestPosition, score: bestScore };
  }

  /**
   * 带置换表的Minimax搜索
   * 重写HardAI的minimax方法，添加置换表查询
   */
  private minimaxWithTranspositionTable(
    board: Board,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    aiPlayer: Player,
    hash: bigint,
    startTime: number,
  ): number {
    // 检查超时
    if (Date.now() - startTime > this.masterConfig.timeLimit - 200) {
      return this.evaluator.evaluate(board, aiPlayer);
    }

    // 查询置换表
    if (this.masterConfig.enableTranspositionTable) {
      const entry = this.transpositionTable.retrieve(hash, depth);
      if (entry) {
        // 根据条目类型返回值
        if (entry.flag === EntryFlag.EXACT) {
          return entry.score;
        }
        if (entry.flag === EntryFlag.ALPHA && entry.score <= alpha) {
          return entry.score;
        }
        if (entry.flag === EntryFlag.BETA && entry.score >= beta) {
          return entry.score;
        }
      }
    }

    // 基础终止条件
    if (depth === 0 || this.isGameOver(board)) {
      return this.evaluator.evaluate(board, aiPlayer);
    }

    // 生成候选着法
    const moveGenerator = new MoveGenerator();
    const candidates = moveGenerator.generateCandidates(board);

    if (candidates.length === 0) {
      return this.evaluator.evaluate(board, aiPlayer);
    }

    let bestScore: number;
    let bestMove: Position | null = null;

    if (isMaximizing) {
      // AI的回合（最大化）
      bestScore = -Infinity;

      for (const { position } of candidates) {
        // 检查超时
        if (Date.now() - startTime > this.masterConfig.timeLimit - 200) {
          break;
        }

        // 模拟落子
        board.setCell(position.x, position.y, aiPlayer);
        const newHash = this.zobristHash.makeMove(hash, position.x, position.y, aiPlayer);

        // 递归搜索
        const evalScore = this.minimaxWithTranspositionTable(
          board,
          depth - 1,
          alpha,
          beta,
          false,
          aiPlayer,
          newHash,
          startTime,
        );

        // 撤销落子
        board.setCell(position.x, position.y, null);

        // 更新最大值
        if (evalScore > bestScore) {
          bestScore = evalScore;
          bestMove = position;
        }

        alpha = Math.max(alpha, evalScore);

        // Alpha-Beta剪枝
        if (this.masterConfig.enableAlphaBeta && beta <= alpha) {
          break;
        }
      }
    } else {
      // 对手的回合（最小化）
      const opponent: Player = aiPlayer === 'black' ? 'white' : 'black';
      bestScore = Infinity;

      for (const { position } of candidates) {
        // 检查超时
        if (Date.now() - startTime > this.masterConfig.timeLimit - 200) {
          break;
        }

        // 模拟落子
        board.setCell(position.x, position.y, opponent);
        const newHash = this.zobristHash.makeMove(hash, position.x, position.y, opponent);

        // 递归搜索
        const evalScore = this.minimaxWithTranspositionTable(
          board,
          depth - 1,
          alpha,
          beta,
          true,
          aiPlayer,
          newHash,
          startTime,
        );

        // 撤销落子
        board.setCell(position.x, position.y, null);

        // 更新最小值
        if (evalScore < bestScore) {
          bestScore = evalScore;
          bestMove = position;
        }

        beta = Math.min(beta, evalScore);

        // Alpha-Beta剪枝
        if (this.masterConfig.enableAlphaBeta && beta <= alpha) {
          break;
        }
      }
    }

    // 存储到置换表
    if (this.masterConfig.enableTranspositionTable && bestMove) {
      let flag: EntryFlag;
      if (bestScore <= alpha) {
        flag = EntryFlag.ALPHA;
      } else if (bestScore >= beta) {
        flag = EntryFlag.BETA;
      } else {
        flag = EntryFlag.EXACT;
      }

      this.transpositionTable.store({
        hash,
        depth,
        score: bestScore,
        flag,
        bestMove,
        age: Date.now(),
      });
    }

    return bestScore;
  }

  /**
   * 检查游戏是否结束（复用HardAI的私有方法）
   */
  private isGameOver(board: Board): boolean {
    // 检查是否有玩家获胜
    const size = board.getSize();
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cell = board.getCell(x, y);
        if (cell !== null) {
          const winLine = GameRules.checkWin(board, { x, y });
          if (winLine !== null) {
            return true;
          }
        }
      }
    }

    // 检查是否平局（棋盘满）
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (board.isEmpty(x, y)) {
          return false;
        }
      }
    }

    return true; // 平局
  }

  /**
   * 获取详细搜索统计信息
   */
  getDetailedStats(): MasterAIStats {
    const baseStats = this.getStats();
    const tableStats = this.transpositionTable.getStats();

    return {
      ...baseStats,
      tableHitRate: tableStats.hitRate,
      tableSize: tableStats.size,
      searchDepth: this.actualSearchDepth,
      fromFallback: this.fromFallback,
    };
  }

  /**
   * 获取置换表大小
   */
  getTranspositionTableSize(): number {
    return this.transpositionTable.getStats().size;
  }

  /**
   * 获取缓存命中率
   */
  getCacheHitRate(): number {
    return this.transpositionTable.getHitRate();
  }

  /**
   * 清空置换表（用于新游戏）
   */
  clearTranspositionTable(): void {
    this.transpositionTable.clear();
  }

  /**
   * 获取搜索深度
   */
  getSearchDepth(): number {
    return this.actualSearchDepth;
  }
}
