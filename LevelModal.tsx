import { X, Crown, Star, Zap, Trophy, Target, TrendingUp } from 'lucide-react';
import { getLevelData, getRankTitle, getXPForLevel, getMilestoneLevels } from '../utils/levelSystem';

interface LevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalXP: number;
  darkMode: boolean;
}

export default function LevelModal({ isOpen, onClose, totalXP, darkMode }: LevelModalProps) {
  if (!isOpen) return null;

  const currentLevelData = getLevelData(totalXP);
  const milestones = getMilestoneLevels();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm animate-fadeIn">
      <div className={`w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden ${
        darkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        {/* Header with gradient */}
        <div className={`relative p-6 bg-gradient-to-r ${currentLevelData.color} overflow-hidden`}>
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.8),transparent)]" />
          
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white bg-opacity-30 backdrop-blur-sm p-2 rounded-lg">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white drop-shadow-lg">
                    LEVEL {currentLevelData.currentLevel}
                  </h2>
                  <p className="text-white text-opacity-90 font-semibold">
                    {currentLevelData.title} • Rank {currentLevelData.rank}
                  </p>
                </div>
              </div>
              
              {/* Current progress */}
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-3 mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-semibold">Current Progress</span>
                  <span className="text-white text-sm">
                    {currentLevelData.currentXP.toLocaleString()} / {currentLevelData.xpForNextLevel.toLocaleString()} XP
                  </span>
                </div>
                <div className="w-full h-3 bg-black bg-opacity-30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-500"
                    style={{ width: `${currentLevelData.percentage}%` }}
                  />
                </div>
                <div className="text-white text-xs mt-1">
                  {(currentLevelData.xpForNextLevel - currentLevelData.currentXP).toLocaleString()} XP to Level {currentLevelData.currentLevel + 1}
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="ml-4 p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={`grid grid-cols-3 gap-4 p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className={`text-center p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <Zap className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {currentLevelData.totalXP.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Total XP Earned</div>
          </div>
          <div className={`text-center p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <Trophy className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {currentLevelData.currentLevel}
            </div>
            <div className="text-xs text-gray-500">Current Level</div>
          </div>
          <div className={`text-center p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {100 - currentLevelData.currentLevel}
            </div>
            <div className="text-xs text-gray-500">Levels to Max</div>
          </div>
        </div>

        {/* Level progression table */}
        <div className="overflow-y-auto max-h-[400px] p-6">
          <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            All Levels (1-100)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 100 }, (_, i) => i + 1).map((level) => {
              const rankInfo = getRankTitle(level);
              const xpRequired = getXPForLevel(level);
              const isCurrentLevel = level === currentLevelData.currentLevel;
              const isUnlocked = level <= currentLevelData.currentLevel;
              const isMilestone = milestones.includes(level);
              
              return (
                <div
                  key={level}
                  className={`relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    isCurrentLevel
                      ? `border-purple-500 ${darkMode ? 'bg-purple-900 bg-opacity-30' : 'bg-purple-50'} shadow-lg shadow-purple-500/20`
                      : isUnlocked
                      ? darkMode
                        ? 'border-gray-700 bg-gray-800'
                        : 'border-gray-200 bg-gray-50'
                      : darkMode
                      ? 'border-gray-800 bg-gray-900 opacity-50'
                      : 'border-gray-100 bg-gray-50 opacity-50'
                  }`}
                >
                  {/* Milestone indicator */}
                  {isMilestone && (
                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Milestone
                    </div>
                  )}

                  {/* Current level indicator */}
                  {isCurrentLevel && (
                    <div className="absolute -top-2 -left-2 bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                      <Target className="h-3 w-3" />
                      YOU ARE HERE
                    </div>
                  )}

                  {/* Rank badge */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br ${rankInfo.color} flex items-center justify-center shadow-lg relative`}
                  >
                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-black bg-opacity-70 rounded-lg flex items-center justify-center">
                        <span className="text-white text-2xl">🔒</span>
                      </div>
                    )}
                    <span className="text-white font-black text-sm">
                      {rankInfo.rank}
                    </span>
                  </div>

                  {/* Level info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${
                        isCurrentLevel
                          ? 'text-purple-600 dark:text-purple-400'
                          : darkMode
                          ? 'text-white'
                          : 'text-gray-900'
                      }`}>
                        Level {level}
                      </span>
                      {isMilestone && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {rankInfo.title}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Zap className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                        {xpRequired.toLocaleString()} XP
                      </span>
                    </div>
                  </div>

                  {/* Unlocked indicator */}
                  {isUnlocked && !isCurrentLevel && (
                    <div className="flex-shrink-0">
                      <div className="text-green-500">✓</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer tips */}
        <div className={`p-6 border-t ${darkMode ? 'border-gray-800 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <h4 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            How to Earn XP
          </h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-semibold text-purple-600 dark:text-purple-400">Study:</span>
              <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                1.5x XP multiplier
              </div>
            </div>
            <div>
              <span className="font-semibold text-green-600 dark:text-green-400">Fitness:</span>
              <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                1.3x XP multiplier
              </div>
            </div>
            <div>
              <span className="font-semibold text-orange-600 dark:text-orange-400">Mindfulness:</span>
              <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                1.2x XP multiplier
              </div>
            </div>
          </div>
          <div className={`mt-3 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            💡 Tip: Every minute of activity earns base XP, multiplied by category bonus!
          </div>
        </div>
      </div>
    </div>
  );
}
