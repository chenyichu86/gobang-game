/**
 * Week 9: 任务列表组件
 * TDD Phase: GREEN - 实现完成
 */

import React from 'react';
import { useUserStore } from '../../store/user-store';

export const TaskList: React.FC = () => {
  const { tasks, claimTaskReward } = useUserStore();

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">📋 每日任务</h2>

      <div className="space-y-3">
        {tasks.map((task: any) => (
          <div
            key={task.id}
            className="bg-white p-4 rounded-lg shadow-sm border"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="font-bold">{task.name}</h3>
                <p className="text-sm text-gray-600">{task.description}</p>
              </div>
              <div className="text-right">
                <div className="text-yellow-600 font-bold">
                  🪙 {task.reward.coins}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${(task.progress / task.target) * 100}%`,
                    }}
                  />
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {task.progress}/{task.target}
                </div>
              </div>

              {task.completed ? (
                task.claimed ? (
                  <button className="px-4 py-2 bg-gray-300 text-gray-600 rounded font-bold">
                    已领取
                  </button>
                ) : (
                  <button
                    onClick={() => claimTaskReward(task.id)}
                    className="px-4 py-2 bg-green-500 text-white rounded font-bold hover:bg-green-600"
                  >
                    领取
                  </button>
                )
              ) : (
                <button className="px-4 py-2 bg-gray-200 text-gray-600 rounded font-bold">
                  进行中
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
