import { Trophy, Target, Zap, Award, Crown, Star } from 'lucide-react';
import { useMemo } from 'react';
import { ActivityLog } from '../utils/dataGenerator';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: typeof Trophy;
  unlocked: boolean;
  progress?: number;
  total?: number;
  color: string;
}

interface AchievementBadgesProps {
  activities: ActivityLog[];
  totalXP: number;
  currentLevel: number;
  darkMode: boolean;
}

export default function AchievementBadges({ activities, totalXP, currentLevel, darkMode }: AchievementBadgesProps) {
  const badges = useMemo((): Badge[] => {
    const uniqueDates = new Set(activities.map(a => a.date)).size;
    const totalActivities = activities.length;
    const totalMinutes = activities.reduce((sum, a) => sum + a.duration, 0);
    
    // Calculate current streak
    let currentStreak = 0;
    const sortedDates = Array.from(new Set(activities.map(a => a.date))).sort().reverse();
    
    if (sortedDates.length > 0) {
      for (let i = 0; i < sortedDates.length; i++) {
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - i);
        const expectedDateStr = expectedDate.toISOString().split('T')[0];
        
        if (sortedDates.includes(expectedDateStr)) {
          currentStreak++;
        } else if (i > 0) {
          break;
        }
      }
    }

    return [
      {
        id: 'first_step',
        name: 'First Step',
        description: 'Log your first activity',
        icon: Star,
        unlocked: totalActivities >= 1,
        color: 'from-gray-400 to-gray-600'
      },
      {
        id: 'week_warrior',
        name: 'Week Warrior',
        description: '7 day streak',
        icon: Target,
        unlocked: currentStreak >= 7,
        progress: Math.min(currentStreak, 7),
        total: 7,
        color: 'from-orange-400 to-red-500'
      },
      {
        id: 'century_club',
        name: 'Century Club',
        description: 'Log 100 activities',
        icon: Trophy,
        unlocked: totalActivities >= 100,
        progress: Math.min(totalActivities, 100),
        total: 100,
        color: 'from-blue-400 to-indigo-500'
      },
      {
        id: 'time_master',
        name: 'Time Master',
        description: '10,000 total minutes',
        icon: Zap,
        unlocked: totalMinutes >= 10000,
        progress: Math.min(totalMinutes, 10000),
        total: 10000,
        color: 'from-yellow-400 to-orange-500'
      },
      {
        id: 'dedicated',
        name: 'Dedicated',
        description: '30 active days',
        icon: Award,
        unlocked: uniqueDates >= 30,
        progress: Math.min(uniqueDates, 30),
        total: 30,
        color: 'from-green-400 to-cyan-500'
      },
      {
        id: 'level_50',
        name: 'Master Level',
        description: 'Reach Level 50',
        icon: Crown,
        unlocked: currentLevel >= 50,
        progress: Math.min(currentLevel, 50),
        total: 50,
        color: 'from-purple-400 to-pink-500'
      }
    ];
  }, [activities, totalXP, currentLevel]);

  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <div className={`rounded-xl p-6 transition-all duration-300 ${
      darkMode 
        ? 'bg-gray-800 border border-gray-700' 
        : 'bg-white border border-gray-200 shadow-lg'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Achievements
        </h3>
        <div className={`text-sm font-semibold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
          {unlockedCount} / {badges.length}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`group relative p-4 rounded-lg transition-all ${
              badge.unlocked
                ? `bg-gradient-to-br ${badge.color} shadow-lg hover:scale-105 cursor-pointer`
                : darkMode
                ? 'bg-gray-900 opacity-50'
                : 'bg-gray-100 opacity-50'
            }`}
          >
            {/* Badge Icon */}
            <div className="flex flex-col items-center">
              <div className={`relative ${badge.unlocked ? 'animate-bounce-slow' : ''}`}>
                <badge.icon className={`h-8 w-8 ${
                  badge.unlocked ? 'text-white' : darkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
                {badge.unlocked && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              
              <div className={`text-xs font-bold mt-2 text-center ${
                badge.unlocked ? 'text-white' : darkMode ? 'text-gray-500' : 'text-gray-600'
              }`}>
                {badge.name}
              </div>
            </div>

            {/* Progress bar for incomplete badges */}
            {!badge.unlocked && badge.progress !== undefined && badge.total !== undefined && (
              <div className="mt-2">
                <div className={`h-1 rounded-full overflow-hidden ${
                  darkMode ? 'bg-gray-800' : 'bg-gray-200'
                }`}>
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                    style={{ width: `${(badge.progress / badge.total) * 100}%` }}
                  />
                </div>
                <div className={`text-xs text-center mt-1 ${
                  darkMode ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {badge.progress} / {badge.total}
                </div>
              </div>
            )}

            {/* Tooltip */}
            <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 ${
              darkMode ? 'bg-gray-900 border border-gray-700 text-white' : 'bg-white border border-gray-200 text-gray-900'
            }`}>
              <div className="text-xs font-semibold">{badge.name}</div>
              <div className="text-xs text-gray-500">{badge.description}</div>
              {badge.unlocked && (
                <div className="text-xs text-green-500 mt-1">✓ Unlocked!</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {unlockedCount === badges.length && (
        <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-center">
          <p className="font-bold">🎉 All Achievements Unlocked! You're a Legend! 🏆</p>
        </div>
      )}
    </div>
  );
}
