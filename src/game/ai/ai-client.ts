/**
 * AI Client - AI计算的客户端封装
 * 使用Comlink与Web Worker通信
 * Week 3 - WO 2.3
 */

import { wrap } from 'comlink';
import type { BoardCell } from '../core/board';
import type { Player, Position } from '../core/rules';

export type AIType = 'simple' | 'medium' | 'hard' | 'master';

export interface AIRequest {
  boardData: BoardCell[][];
  player: Player;
  timeout?: number; // 超时时间（毫秒）
}

export interface AIResponse {
  success: boolean;
  position?: Position;
  error?: string;
}

interface AIWorkerInterface {
  calculateMove(request: AIRequest & { aiType: AIType }): Promise<AIResponse>;
}

// AI Client实例类型
export interface AIClient {
  calculateMove(request: AIRequest): Promise<AIResponse>;
  [Symbol.dispose]?: () => void;
}

// Worker实例缓存
let workerInstance: Worker | null = null;
let workerProxy: any | null = null;

/**
 * 创建AI Client
 */
export async function createAIClient(aiType: AIType): Promise<AIClient> {
  // 浏览器环境：暂时使用同步AI
  // TODO: 切换回 Web Worker AI
  if (typeof window !== 'undefined') {
    return await createTestAIClient(aiType);
  }

  // 在测试环境中，直接使用同步AI
  if (process.env.NODE_ENV === 'test') {
    return await createTestAIClient(aiType);
  }

  // 在浏览器环境中，使用Web Worker
  return createWorkerAIClient(aiType);
}

/**
 * 创建测试环境的AI Client（同步实现）
 */
async function createTestAIClient(aiType: AIType): Promise<AIClient> {
  // 动态导入ES模块
  const { SimpleAI } = await import('./simple-ai');
  const { MediumAI } = await import('./medium-ai');
  const { HardAI } = await import('./hard-ai');
  const { MasterAI } = await import('./master-ai');
  const { Board } = await import('../core/board');

  return {
    async calculateMove(request: AIRequest): Promise<AIResponse> {
      try {
        const board = new Board(15);
        // 恢复棋盘数据
        request.boardData.forEach((row, y) => {
          row.forEach((cell, x) => {
            if (cell) {
              board.setCell(x, y, cell);
            }
          });
        });

        let ai: SimpleAI | MediumAI | HardAI | MasterAI;
        if (aiType === 'simple') {
          ai = new SimpleAI();
        } else if (aiType === 'medium') {
          ai = new MediumAI();
        } else if (aiType === 'hard') {
          ai = new HardAI();
        } else if (aiType === 'master') {
          ai = new MasterAI();
        } else {
          throw new Error(`Unknown AI type: ${aiType}`);
        }

        const position = aiType === 'hard' || aiType === 'master'
          ? await ai.calculateMove(board, request.player)
          : ai.calculateMove(board, request.player);

        return {
          success: true,
          position,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  };
}

/**
 * 创建Web Worker AI Client
 */
function createWorkerAIClient(aiType: AIType): AIClient {
  // 初始化Worker（单例模式）
  if (!workerInstance) {
    const workerPath = new URL('./ai.worker.ts', import.meta.url);
    workerInstance = new Worker(workerPath, { type: 'module' });
    workerProxy = wrap(workerInstance);
  }

  const proxy = workerProxy!;

  return {
    async calculateMove(request: AIRequest): Promise<AIResponse> {
      try {
        // 根据AI类型设置默认超时时间
        const defaultTimeout = aiType === 'master' ? 10000 : aiType === 'hard' ? 5000 : 3000;
        const timeout = request.timeout || defaultTimeout;

        // 添加超时处理
        const timeoutPromise = new Promise<AIResponse>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`AI calculation timeout after ${timeout}ms`));
          }, timeout);
        });

        // 竞速：计算 vs 超时
        const response = await Promise.race([
          proxy.calculateMove({ ...request, aiType }),
          timeoutPromise,
        ]);

        return response;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },

    [Symbol.dispose]() {
      // 清理Worker（可选）
      workerProxy = null;
      if (workerInstance) {
        workerInstance.terminate();
        workerInstance = null;
      }
    },
  };
}

/**
 * 清理AI Worker资源
 */
export function cleanupAIWorker(): void {
  workerProxy = null;
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
  }
}
