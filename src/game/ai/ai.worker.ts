/**
 * AI Web Worker - 在Worker线程中执行AI计算
 * Week 3 - WO 2.3
 */

import { expose } from 'comlink';
import { Board } from '../core/board';
import { SimpleAI } from './simple-ai';
import { MediumAI } from './medium-ai';
import { HardAI } from './hard-ai';
import { MasterAI } from './master-ai';
import type { AIRequest, AIResponse } from './ai-client';
import type { AIType } from './ai-client';

/**
 * AI Worker API
 */
interface AIWorkerAPI {
  calculateMove(request: AIRequest & { aiType: AIType }): Promise<AIResponse>;
}

/**
 * 执行AI计算
 */
async function calculateMove(
  request: AIRequest & { aiType: AIType }
): Promise<AIResponse> {
  try {
    const { boardData, player, aiType } = request;

    // 验证输入
    if (!boardData || !Array.isArray(boardData)) {
      throw new Error('Invalid board data');
    }

    // 恢复棋盘
    const board = new Board(15);
    boardData.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          board.setCell(x, y, cell);
        }
      });
    });

    // 创建AI实例
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

    // 计算落子
    const position = aiType === 'hard' || aiType === 'master'
      ? await ai.calculateMove(board, player)
      : ai.calculateMove(board, player);

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
}

// 暴露Worker API
expose({
  calculateMove,
} as AIWorkerAPI);

export type {};
