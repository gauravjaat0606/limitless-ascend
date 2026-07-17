import { Flame, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { ActivityLog } from '../utils/dataGenerator';
import { subDays, format, isSameDay } from 'date-fns';

interface StreakTrackerProps {
  activities: ActivityLog[];
  darkMode: boolean;
}

export default function StreakTracker({ activities, darkMode }: StreakTrackerProps) {
  const streakData = useMemo(() => {
    if (activities.length === 0) {
      return { currentStreak: 0, longestStreak: 0, totalDays: 0 };
    }

    // Get unique dates with activities
    const uniqueDates = Array.from(
      new Set(activities.map(a => a.date))
    ).sort().reverse();

    if (uniqueDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0, totalDays: 0 };
    }

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    let checkDate = today;

    for (let i = 0; i < 365; i++) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      if (uniqueDates.includes(dateStr)) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      } else if (i === 0 && !isSameDay(checkDate, today)) {
        // If no activity today, check yesterday
        checkDate = subDays(checkDate, 1);
        continue;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currDate = new Date(uniqueDates[i]);
      const dayDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, currentStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      totalDays: uniqueDates.length
    };
  }, [activities]);

  return (
    <div className={`rounded-xl p-6 transition-all duration-300 ${
      darkMode 
        ? 'bg-gray-800 border border-gray-700' 
        : 'bg-white border border-gray-200 shadow-lg'
    }`}>
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Streak Tracker 🔥
      </h3>

      <div className="grid grid-cols-3 gap-4">
        {/* Current Streak */}
        <div className={`relative p-4 rounded-lg ${
          darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-orange-50 to-red-50'
        } border-2 ${
          streakData.currentStreak >= 7 ? 'border-orange-500' : darkMode ? 'border-gray-700' : 'border-orange-200'
        }`}>
          <div className="flex flex-col items-center">
            <Flame className={`h-8 w-8 mb-2 ${
              streakData.currentStreak >= 7 ? 'text-orange-500 animate-pulse' : 'text-orange-400'
            }`} />
            <div className={`text-3xl font-black ${
              streakData.currentStreak >= 7 
                ? 'bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent'
                : darkMode ? 'text-orange-400' : 'text-orange-600'
            }`}>
              {streakData.currentStreak}
            </div>
            <div className={`text-xs font-medium mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Current Streak
            </div>
          </div>
        </div>

        {/* Longest Streak */}
        <div className={`p-4 rounded-lg ${
          darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 to-pink-50'
        }`}>
          <div className="flex flex-col items-center">
            <TrendingUp className="h-8 w-8 text-purple-500 mb-2" />
            <div className={`text-3xl font-black ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
              {streakData.longestStreak}
            </div>
            <div className={`text-xs font-medium mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Best Streak
            </div>
          </div>
        </div>

        {/* Total Active Days */}
        <div className={`p-4 rounded-lg ${
          darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-cyan-50'
        }`}>
          <div className="flex flex-col items-center">
            <div className="text-2xl mb-2">📅</div>
            <div className={`text-3xl font-black ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {streakData.totalDays}
            </div>
            <div className={`text-xs font-medium mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Active Days
            </div>
          </div>
        </div>
      </div>

      {/* Motivational message */}
      {streakData.currentStreak >= 7 && (
        <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white text-center animate-pulse">
          <p className="font-bold text-sm">
            🔥 {streakData.currentStreak} DAY STREAK! YOU'RE ON FIRE! 🔥
          </p>
        </div>
      )}

      {streakData.currentStreak === 0 && activities.length > 0 && (
        <div className={`mt-4 p-3 rounded-lg text-center ${
          darkMode ? 'bg-gray-900 text-gray-400' : 'bg-gray-50 text-gray-600'
        }`}>
          <p className="text-sm">
            💪 Start a new streak today! Every journey begins with day 1.
          </p>
        </div>
      )}
    </div>
  );
}
