/**
 * Week 9: 签到日历组件
 * TDD Phase: GREEN - 实现完成
 */

import React, { useState } from 'react';
import { useUserStore } from '../../store/user-store';
import type { CalendarDay } from '../../types/storage';

export interface CheckInCalendarProps {
  onCheckIn?: () => void;
  className?: string;
}

/**
 * 生成当月日历
 */
function generateMonthCalendar(
  currentDate: Date,
  checkInHistory: string[]
): CalendarDay[] {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 获取当月第一天是星期几
  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay();

  // 获取当月总天数
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendar: CalendarDay[] = [];

  // 填充月初空白
  for (let i = 0; i < startDayOfWeek; i++) {
    calendar.push({ inMonth: false });
  }

  // 填充当月日期
  const today = new Date().toDateString();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day).toDateString();
    const checkedIn = checkInHistory.includes(date);

    calendar.push({
      inMonth: true,
      date,
      dayNumber: day,
      checkedIn,
    });
  }

  return calendar;
}

export const CheckInCalendar: React.FC<CheckInCalendarProps> = ({
  onCheckIn,
  className = '',
}) => {
  const checkInData = useUserStore((state) => state.checkInData);
  const checkIn = useUserStore((state) => state.checkIn);
  const [currentDate, setCurrentDate] = useState(new Date());

  // 检查今天是否已签到
  const today = currentDate.toDateString();
  const hasCheckedInToday = checkInData.lastCheckInDate === today;

  // 计算当月日历
  const checkInHistory = (checkInData as any).checkInHistory || [];
  const calendar = generateMonthCalendar(currentDate, checkInHistory);

  const handleCheckIn = () => {
    const result = checkIn();
    if (result.success && onCheckIn) {
      onCheckIn();
    }
  };

  return (
    <div className={`max-w-md mx-auto p-4 ${className}`}>
      <h2 className="text-xl font-bold mb-4">📅 每日签到</h2>

      {/* 连续签到和奖励提示 */}
      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-600">连续签到</div>
            <div className="text-2xl font-bold text-blue-600">
              {checkInData.consecutiveDays}天
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">今日奖励</div>
            <div className="text-xl font-bold text-yellow-600">50金币</div>
          </div>
        </div>
      </div>

      {/* 签到按钮 */}
      {hasCheckedInToday ? (
        <div className="w-full py-3 bg-gray-200 text-gray-600 rounded text-center font-bold">
          今日已签到
        </div>
      ) : (
        <button
          onClick={handleCheckIn}
          className="w-full py-3 bg-blue-500 text-white rounded font-bold hover:bg-blue-600"
        >
          立即签到 (领取50金币)
        </button>
      )}
    </div>
  );
};
