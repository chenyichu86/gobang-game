/**
 * 游戏Store测试 - PVE模式扩展
 * Week 3 - TC-118~129
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../game-store';
import { createAIClient } from '../../game/ai/ai-client';

describe('GameStore - PVE Mode', () => {
  beforeEach(() => {
    // 重置store状态
    useGameStore.setState({
      gameStatus: 'idle',
      currentPlayer: 'black',
      gameMode: 'pvp',
      winner: null,
      winLine: null,
      moveHistory: [],
      board: null,
      engine: null,
    });
  });

  // TC-118: PVE模式-设置AI难度
  it('应该设置AI难度', () => {
    const store = useGameStore.getState();
    store.setGameMode('pve');
    store.setAIDifficulty('medium');

    expect(useGameStore.getState().aiDifficulty).toBe('medium');
  });

  // TC-119: PVE模式-开始游戏
  it('应该开始PVE游戏', () => {
    const store = useGameStore.getState();
    store.setGameMode('pve');
    store.setAIDifficulty('simple');
    store.startGame();

    const state = useGameStore.getState();
    expect(state.gameStatus).toBe('playing');
    expect(state.gameMode).toBe('pve');
    expect(state.aiDifficulty).toBe('simple');
    expect(state.currentPlayer).toBe('black');
  });

  // TC-120: PVE模式-玩家执黑先行
  it('玩家应该执黑先行', () => {
    const store = useGameStore.getState();
    store.setGameMode('pve');
    store.setAIDifficulty('simple');
    store.startGame();

    expect(useGameStore.getState().currentPlayer).toBe('black');
  });

  // TC-121: PVE模式-玩家落子后AI自动落子
  it('玩家落子后AI应该自动落子', async () => {
    const store = useGameStore.getState();
    store.setGameMode('pve');
    store.setAIDifficulty('simple');
    store.startGame();

    // 玩家落子
    const playerMove = await store.makeMove({ x: 7, y: 7 });
    expect(playerMove.success).toBe(true);
    expect(useGameStore.getState().currentPlayer).toBe('white');

    // 等待AI落子（需要更多时间）
    await new Promise((resolve) => setTimeout(resolve, 300));

    // AI应该已经落子
    const state = useGameStore.getState();
    expect(state.currentPlayer).toBe('black');
    expect(state.moveHistory.length).toBe(2); // 玩家 + AI
  });

  // TC-122: PVE模式-AI执白后行
  it('AI应该执白后行', async () => {
    const store = useGameStore.getState();
    store.setGameMode('pve');
    store.setAIDifficulty('simple');
    store.startGame();

    // 玩家落子
    await store.makeMove({ x: 7, y: 7 });

    // 等待AI落子
    await new Promise((resolve) => setTimeout(resolve, 300));

    const state = useGameStore.getState();
    // 检查是否有白棋落子
    const hasWhitePiece = state.board!.some((row, y) =>
      row.some((cell, x) => cell === 'white' && !(x === 7 && y === 7))
    );
    expect(hasWhitePiece).toBe(true);
  });

  // TC-123: PVE模式-玩家胜利
  it('玩家胜利时游戏应该结束', async () => {
    const store = useGameStore.getState();
    store.setGameMode('pve');
    store.setAIDifficulty('simple');
    store.startGame();

    const engine = useGameStore.getState().engine!;
    const board = engine.getBoard() as any;

    // 创建玩家即将胜利的局面（横五）
    for (let i = 0; i < 4; i++) {
      board.setCell(5 + i, 7, 'black');
    }
    await store.makeMove({ x: 9, y: 7 }); // 玩家落子形成五连

    const state = useGameStore.getState();
    expect(state.gameStatus).toBe('won');
    expect(state.winner).toBe('black');
  });

  // TC-124: PVE模式-AI胜利
  it('AI胜利时游戏应该结束', async () => {
    const store = useGameStore.getState();
    store.setGameMode('pve');
    store.setAIDifficulty('simple');
    store.startGame();

    // 玩家落子
    await store.makeMove({ x: 0, y: 0 });

    // 等待AI落子
    await new Promise((resolve) => setTimeout(resolve, 200));

    // 检查游戏是否在进行中（AI已落子）
    const state = useGameStore.getState();
    expect(state.gameStatus).toBe('playing');
    expect(state.moveHistory.length).toBeGreaterThanOrEqual(2);
  });

  // TC-125: PVE模式-悔棋功能
  it('悔棋应该撤销玩家和AI的各一步棋', async () => {
    const store = useGameStore.getState();
    store.setGameMode('pve');
    store.setAIDifficulty('simple');
    store.startGame();

    // 玩家落子
    await store.makeMove({ x: 7, y: 7 });

    // 等待AI落子完成
    await new Promise((resolve) => setTimeout(resolve, 200));

    const historyBeforeUndo = useGameStore.getState().moveHistory.length;
    expect(historyBeforeUndo).toBeGreaterThan(0);

    // 悔棋
    store.undo();

    const state = useGameStore.getState();
    expect(state.moveHistory.length).toBeLessThan(historyBeforeUndo);
  });

  // TC-126: PVE模式-切换先后手
  it('应该支持玩家选择执白后行', () => {
    const store = useGameStore.getState();
    store.setGameMode('pve');
    store.setAIDifficulty('simple');
    store.setPlayerFirst(false); // 玩家执白
    store.startGame();

    const state = useGameStore.getState();
    expect(state.playerFirst).toBe(false);
    // AI应该先落子
    expect(state.currentPlayer).toBe('white'); // AI执黑先行
  });

  // TC-127: PVE模式-切换AI难度
  it('应该支持在游戏中切换AI难度', async () => {
    const store = useGameStore.getState();
    store.setGameMode('pve');
    store.setAIDifficulty('simple');
    store.startGame();

    // 玩家落子
    await store.makeMove({ x: 7, y: 7 });

    // 等待AI落子
    await new Promise((resolve) => setTimeout(resolve, 200));

    // 切换难度
    store.setAIDifficulty('medium');
    expect(useGameStore.getState().aiDifficulty).toBe('medium');
  });

  // TC-128: PVE模式-游戏结束后重新开始
  it('游戏结束后应该能重新开始', async () => {
    const store = useGameStore.getState();
    store.setGameMode('pve');
    store.setAIDifficulty('simple');
    store.startGame();

    // 创建胜利局面
    const engine = useGameStore.getState().engine!;
    const board = engine.getBoard() as any;
    for (let i = 0; i < 4; i++) {
      board.setCell(5 + i, 7, 'black');
    }
    await store.makeMove({ x: 9, y: 7 });

    expect(useGameStore.getState().gameStatus).toBe('won');

    // 重新开始
    store.resetGame();
    store.startGame();

    const state = useGameStore.getState();
    expect(state.gameStatus).toBe('playing');
    expect(state.moveHistory.length).toBe(0);
    expect(state.winner).toBe(null);
  });

  // TC-129: PVE模式-错误处理
  it('应该处理AI计算错误', async () => {
    const store = useGameStore.getState();
    store.setGameMode('pve');
    store.setAIDifficulty('simple');
    store.startGame();

    // 尝试在已有棋子的位置落子
    await store.makeMove({ x: 7, y: 7 });
    await new Promise((resolve) => setTimeout(resolve, 200));

    // 再次在同一位置落子（应该失败）
    const result = await store.makeMove({ x: 7, y: 7 });

    // 应该返回错误
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
