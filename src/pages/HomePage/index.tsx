export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light to-primary-dark">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-8 drop-shadow-lg">
          五子棋游戏
        </h1>
        <p className="text-xl text-white mb-12">主页</p>
        <div className="space-x-4">
          <button className="bg-accent hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all hover:scale-105">
            人机对战
          </button>
          <button className="bg-white hover:bg-gray-100 text-gray-800 font-bold py-3 px-8 rounded-lg shadow-lg transition-all hover:scale-105">
            双人对战
          </button>
        </div>
      </div>
    </div>
  );
}
