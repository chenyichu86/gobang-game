/**
 * 游戏记录和回放基础功能测试
 * TC-166 ~ TC-171
 */

import { GameRecorder } from '../../game/recorder';
import { GameEngine } from '../../game/core/game-engine';

describe('游戏记录和回放基础功能', () => {
  let recorder: GameRecorder;
  let engine: GameEngine;

  beforeEach(() => {
    recorder = new GameRecorder();
    engine = new GameEngine();
    // 清空localStorage
    localStorage.clear();
  });

  describe('TC-166: 棋谱记录格式', () => {
    it('应该正确记录游戏棋谱', () => {
      engine.startGame();

      // 落子
      engine.makeMove({ x: 7, y: 7 });
      engine.makeMove({ x: 7, y: 8 });
      engine.makeMove({ x: 8, y: 7 });

      const moves = engine.getMoveHistory();

      const gameRecord = recorder.createRecord({
        mode: 'pvp',
        moves,
        winner: null,
        gameStatus: 'playing',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      });

      expect(gameRecord).toBeDefined();
      expect(gameRecord.id).toBeDefined();
      expect(gameRecord.mode).toBe('pvp');
      expect(gameRecord.moves).toEqual(moves);
      expect(gameRecord.winner).toBeNull();
      expect(gameRecord.gameStatus).toBe('playing');
      expect(gameRecord.metadata).toBeDefined();
      expect(gameRecord.metadata.startTime).toBeDefined();
      expect(gameRecord.metadata.endTime).toBeDefined();
    });

    it('应该记录获胜者信息', () => {
      engine.startGame();

      // 黑方连五
      const moves = [
        { x: 7, y: 7 },
        { x: 0, y: 0 },
        { x: 8, y: 7 },
        { x: 0, y: 1 },
        { x: 9, y: 7 },
        { x: 0, y: 2 },
        { x: 10, y: 7 },
        { x: 0, y: 3 },
        { x: 11, y: 7 },
      ];

      moves.forEach((move) => engine.makeMove(move));

      const gameRecord = recorder.createRecord({
        mode: 'pvp',
        moves: engine.getMoveHistory(),
        winner: 'black',
        gameStatus: 'won',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      });

      expect(gameRecord.winner).toBe('black');
      expect(gameRecord.gameStatus).toBe('won');
    });
  });

  describe('TC-167: LocalStorage保存', () => {
    it('应该能够保存棋谱到LocalStorage', () => {
      const gameRecord = recorder.createRecord({
        mode: 'pvp',
        moves: [{ x: 7, y: 7 }, { x: 7, y: 8 }],
        winner: null,
        gameStatus: 'playing',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      });

      recorder.saveRecord(gameRecord);

      const saved = localStorage.getItem(`gobang_game_${gameRecord.id}`);
      expect(saved).toBeDefined();

      const parsed = JSON.parse(saved!);
      expect(parsed.id).toBe(gameRecord.id);
      expect(parsed.mode).toBe(gameRecord.mode);
    });

    it('应该能够从LocalStorage加载棋谱', () => {
      const gameRecord = recorder.createRecord({
        mode: 'pve',
        moves: [{ x: 7, y: 7 }, { x: 7, y: 8 }],
        winner: 'black',
        gameStatus: 'won',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      });

      recorder.saveRecord(gameRecord);

      const loaded = recorder.loadRecord(gameRecord.id);
      expect(loaded).toBeDefined();
      expect(loaded!.id).toBe(gameRecord.id);
      expect(loaded!.mode).toBe('pve');
      expect(loaded!.winner).toBe('black');
    });

    it('应该能够删除LocalStorage中的棋谱', () => {
      const gameRecord = recorder.createRecord({
        mode: 'pvp',
        moves: [{ x: 7, y: 7 }],
        winner: null,
        gameStatus: 'playing',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      });

      recorder.saveRecord(gameRecord);
      expect(localStorage.getItem(`gobang_game_${gameRecord.id}`)).toBeDefined();

      recorder.deleteRecord(gameRecord.id);
      expect(localStorage.getItem(`gobang_game_${gameRecord.id}`)).toBeNull();
    });
  });

  describe('TC-168: 棋谱列表', () => {
    it('应该能够获取所有保存的棋谱', () => {
      // 创建3个棋谱
      for (let i = 0; i < 3; i++) {
        const record = recorder.createRecord({
          mode: 'pvp',
          moves: [{ x: i, y: i }],
          winner: null,
          gameStatus: 'playing',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
        });
        recorder.saveRecord(record);
      }

      const allRecords = recorder.getAllRecords();
      expect(allRecords).toHaveLength(3);
    });

    it('应该按时间倒序排列棋谱', () => {
      // 创建3个棋谱
      const records = [];
      for (let i = 0; i < 3; i++) {
        const record = recorder.createRecord({
          mode: 'pvp',
          moves: [{ x: i, y: i }],
          winner: null,
          gameStatus: 'playing',
          startTime: new Date(Date.now() + i * 1000).toISOString(),
          endTime: new Date(Date.now() + i * 1000).toISOString(),
        });
        records.push(record);
        recorder.saveRecord(record);
      }

      const allRecords = recorder.getAllRecords();
      expect(allRecords[0].id).toBe(records[2].id); // 最新的在前
      expect(allRecords[2].id).toBe(records[0].id); // 最旧的在后
    });

    it('应该限制最多返回50个棋谱', () => {
      // 创建60个棋谱
      for (let i = 0; i < 60; i++) {
        const record = recorder.createRecord({
          mode: 'pvp',
          moves: [{ x: i % 15, y: Math.floor(i / 15) % 15 }],
          winner: null,
          gameStatus: 'playing',
          startTime: new Date(Date.now() + i * 1000).toISOString(),
          endTime: new Date(Date.now() + i * 1000).toISOString(),
        });
        recorder.saveRecord(record);
      }

      const allRecords = recorder.getAllRecords();
      expect(allRecords.length).toBeLessThanOrEqual(50);
    });
  });

  describe('TC-169: 基础回放功能', () => {
    it('应该能够创建回放会话', () => {
      const moves = [
        { x: 7, y: 7 },
        { x: 7, y: 8 },
        { x: 8, y: 7 },
        { x: 8, y: 8 },
      ];

      const replaySession = recorder.createReplaySession(moves);

      expect(replaySession).toBeDefined();
      expect(replaySession.moves).toEqual(moves);
      expect(replaySession.currentMoveIndex).toBe(0);
      expect(replaySession.isPlaying).toBe(false);
    });

    it('应该能够前进到下一步', () => {
      const moves = [
        { x: 7, y: 7 },
        { x: 7, y: 8 },
        { x: 8, y: 7 },
      ];

      const replaySession = recorder.createReplaySession(moves);

      const nextMove = replaySession.next();
      expect(nextMove).toEqual({ x: 7, y: 7 });
      expect(replaySession.currentMoveIndex).toBe(1);

      const nextMove2 = replaySession.next();
      expect(nextMove2).toEqual({ x: 7, y: 8 });
      expect(replaySession.currentMoveIndex).toBe(2);
    });

    it('应该能够后退到上一步', () => {
      const moves = [
        { x: 7, y: 7 },
        { x: 7, y: 8 },
        { x: 8, y: 7 },
      ];

      const replaySession = recorder.createReplaySession(moves);

      // 前进2步
      replaySession.next();
      replaySession.next();

      expect(replaySession.currentMoveIndex).toBe(2);

      // 后退1步
      const prevMove = replaySession.prev();
      expect(prevMove).toEqual({ x: 7, y: 8 });
      expect(replaySession.currentMoveIndex).toBe(1);
    });

    it('应该能够在到达末尾时返回null', () => {
      const moves = [{ x: 7, y: 7 }, { x: 7, y: 8 }];
      const replaySession = recorder.createReplaySession(moves);

      replaySession.next();
      replaySession.next();

      const nextMove = replaySession.next();
      expect(nextMove).toBeNull();
    });

    it('应该能够在到达开始时返回null', () => {
      const moves = [{ x: 7, y: 7 }, { x: 7, y: 8 }];
      const replaySession = recorder.createReplaySession(moves);

      const prevMove = replaySession.prev();
      expect(prevMove).toBeNull();
    });
  });

  describe('TC-170: 回放控制', () => {
    it('应该能够播放回放', () => {
      const moves = [{ x: 7, y: 7 }, { x: 7, y: 8 }, { x: 8, y: 7 }];
      const replaySession = recorder.createReplaySession(moves);

      replaySession.play();
      expect(replaySession.isPlaying).toBe(true);
    });

    it('应该能够暂停回放', () => {
      const moves = [{ x: 7, y: 7 }, { x: 7, y: 8 }];
      const replaySession = recorder.createReplaySession(moves);

      replaySession.play();
      expect(replaySession.isPlaying).toBe(true);

      replaySession.pause();
      expect(replaySession.isPlaying).toBe(false);
    });

    it('应该能够跳转到指定步', () => {
      const moves = [
        { x: 7, y: 7 },
        { x: 7, y: 8 },
        { x: 8, y: 7 },
        { x: 8, y: 8 },
        { x: 9, y: 7 },
      ];

      const replaySession = recorder.createReplaySession(moves);

      replaySession.seek(3);
      expect(replaySession.currentMoveIndex).toBe(3);

      const nextMove = replaySession.next();
      expect(nextMove).toEqual({ x: 8, y: 8 }); // 索引3的值
      expect(replaySession.currentMoveIndex).toBe(4); // next后递增到4
    });

    it('应该能够重置回放', () => {
      const moves = [{ x: 7, y: 7 }, { x: 7, y: 8 }, { x: 8, y: 7 }];
      const replaySession = recorder.createReplaySession(moves);

      replaySession.next();
      replaySession.next();
      expect(replaySession.currentMoveIndex).toBe(2);

      replaySession.reset();
      expect(replaySession.currentMoveIndex).toBe(0);
      expect(replaySession.isPlaying).toBe(false);
    });
  });

  describe('TC-171: 回放速度控制', () => {
    it('应该能够设置回放速度', () => {
      const moves = [{ x: 7, y: 7 }, { x: 7, y: 8 }];
      const replaySession = recorder.createReplaySession(moves);

      replaySession.setSpeed(2); // 2倍速
      expect(replaySession.speed).toBe(2);

      replaySession.setSpeed(0.5); // 0.5倍速
      expect(replaySession.speed).toBe(0.5);
    });

    it('应该限制回放速度在合理范围内', () => {
      const moves = [{ x: 7, y: 7 }];
      const replaySession = recorder.createReplaySession(moves);

      replaySession.setSpeed(10); // 超出最大值
      expect(replaySession.speed).toBeLessThanOrEqual(5);

      replaySession.setSpeed(0.1); // 低于最小值
      expect(replaySession.speed).toBeGreaterThanOrEqual(0.25);
    });
  });
});
