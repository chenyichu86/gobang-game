/**
 * GamePage组件 - 游戏页面
 * Week 2 - WO 2.8
 */

import { useEffect } from 'react';
import { useGameStore } from '../store/game-store';
import { BoardStage, BoardLayer, PiecesLayer, HighlightLayer } from '../components/Board/index';

export default function GamePage() {
  const {
    gameStatus,
    currentPlayer,
    winner,
    winLine,
    moveHistory,
    startGame,
    makeMove,
  } = useGameStore();

  // 组件挂载时自动开始游戏（仅当游戏尚未开始时）
  useEffect(() => {
    if (gameStatus === 'idle' && moveHistory.length === 0) {
      startGame();
    }
  }, []); // 只在组件挂载时执行一次

  // 处理落子
  const handleCellClick = (x: number, y: number) => {
    if (gameStatus !== 'playing') return;
    makeMove({ x, y });
  };

  // 获取所有棋子
  const pieces = moveHistory.map((pos, index) => ({
    x: pos.x,
    y: pos.y,
    player: (index % 2 === 0 ? 'black' : 'white') as 'black' | 'white',
  }));

  // 获取最新落子
  const lastMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex flex-col items-center justify-center p-4">
      {/* 游戏标题 */}
      <h1 className="text-4xl font-bold text-amber-900 mb-6">五子棋</h1>

      {/* 游戏状态显示 */}
      <div className="mb-6 text-center">
        {gameStatus === 'playing' && (
          <p className="text-xl text-amber-800">
            当前回合: {currentPlayer === 'black' ? '黑棋 ⚫' : '白棋 ⚪'}
          </p>
        )}
        {gameStatus === 'won' && (
          <p className="text-2xl font-bold text-green-600">
            {winner === 'black' ? '黑棋 ⚫' : '白棋 ⚪'} 获胜！
          </p>
        )}
        {gameStatus === 'draw' && (
          <p className="text-2xl font-bold text-gray-600">和棋！</p>
        )}
      </div>

      {/* 棋盘 */}
      <div className="bg-amber-200 p-4 rounded-lg shadow-2xl">
        <BoardStage size={600} onCellClick={handleCellClick} padding={600 / 30}>
          <BoardLayer size={600} padding={600 / 30} />
          <PiecesLayer
            pieces={pieces}
            cellSize={600 / 15}
            padding={600 / 30}
            lastMove={lastMove}
          />
          <HighlightLayer
            size={600}
            cellSize={600 / 15}
            padding={600 / 30}
            winLine={winLine}
          />
        </BoardStage>
      </div>

      {/* 控制按钮 */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={startGame}
          className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          重新开始
        </button>
        <button
          onClick={() => (window.location.href = '/')}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          返回主页
        </button>
      </div>

      {/* 落子历史 */}
      <div className="mt-6 text-center text-amber-800">
        <p>总落子数: {moveHistory.length}</p>
      </div>
    </div>
  );
}
