import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/game-store';

type AIDifficulty = 'simple' | 'medium' | 'hard' | 'master';

const AI_OPTIONS = [
  { value: 'simple' as AIDifficulty, label: '简单', color: 'bg-green-500 hover:bg-green-600', desc: '适合新手，随机+防守' },
  { value: 'medium' as AIDifficulty, label: '中等', color: 'bg-blue-500 hover:bg-blue-600', desc: '推荐选择，评分系统' },
  { value: 'hard' as AIDifficulty, label: '困难', color: 'bg-orange-500 hover:bg-orange-600', desc: '⚠️ 可能卡顿2-5秒' },
  { value: 'master' as AIDifficulty, label: '大师', color: 'bg-red-500 hover:bg-red-600', desc: '⚠️ 严重卡顿5-10秒' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { setGameMode, setAIDifficulty, startGame } = useGameStore();
  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>('medium');

  const handlePvEClick = () => {
    setGameMode('pve');
    setAIDifficulty(selectedDifficulty);
    startGame();
    navigate('/game');
  };

  const handlePvPClick = () => {
    setGameMode('pvp');
    startGame();
    navigate('/game');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light to-primary-dark">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-8 drop-shadow-lg">
          五子棋游戏
        </h1>
        <p className="text-xl text-white mb-12">选择游戏模式</p>

        {/* 模式选择按钮 */}
        <div className="space-x-4 mb-12">
          <button
            onClick={handlePvPClick}
            className="px-8 py-4 bg-white hover:bg-gray-100 text-gray-800 font-bold text-lg rounded-lg shadow-lg transition-all hover:scale-105"
          >
            双人对战
          </button>
          <button
            onClick={handlePvEClick}
            className="px-8 py-4 bg-accent hover:bg-yellow-600 text-white font-bold text-lg rounded-lg shadow-lg transition-all hover:scale-105"
          >
            人机对战
          </button>
        </div>

        {/* AI 难度选择 */}
        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">AI 难度选择</h2>
          <p className="text-white/80 mb-6 text-sm">选择人机对战的 AI 难度（当前选中: {AI_OPTIONS.find(o => o.value === selectedDifficulty)?.label}）</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {AI_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedDifficulty(option.value)}
                className={`${
                  selectedDifficulty === option.value
                    ? `${option.color} ring-4 ring-white ring-opacity-50`
                    : 'bg-gray-600 hover:bg-gray-500'
                } text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all transform hover:scale-105`}
              >
                <div className="text-lg">{option.label}</div>
                <div className="text-xs mt-1 opacity-80">{option.desc}</div>
              </button>
            ))}
          </div>

          {/* 难度说明 */}
          <div className="mt-6 text-left text-white/90 text-sm space-y-2">
            <div className="bg-white/10 rounded p-3">
              <p className="font-semibold mb-1">💡 推荐选择：中等难度</p>
              <ul className="list-disc list-inside space-y-1 text-xs opacity-90">
                <li>• 简单：随机走棋，偶尔防守（适合完全新手）</li>
                <li>• 中等：评分系统，会攻守兼顾（推荐）</li>
                <li>• 困难：Minimax算法，可能卡顿2-5秒</li>
                <li>• 大师：深度搜索，严重卡顿5-10秒</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
