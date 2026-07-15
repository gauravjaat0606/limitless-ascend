import { useState, useEffect } from 'react';
import { Zap, Star, Trophy, Sparkles } from 'lucide-react';
import { getLevelData, LevelData } from '../utils/levelSystem';

interface LevelDisplayProps {
  totalXP: number;
  darkMode: boolean;
  onClick: () => void;
}

export default function LevelDisplay({ totalXP, darkMode, onClick }: LevelDisplayProps) {
  const [levelData, setLevelData] = useState<LevelData>(getLevelData(totalXP));
  const [isGlowing, setIsGlowing] = useState(false);

  useEffect(() => {
    const newData = getLevelData(totalXP);
    if (newData.currentLevel > levelData.currentLevel) {
      // Level up animation
      setIsGlowing(true);
      setTimeout(() => setIsGlowing(false), 2000);
    }
    setLevelData(newData);
  }, [totalXP]);

  return (
    <button
      onClick={onClick}
      className={`relative group transition-all duration-300 hover:scale-105 ${
        darkMode ? 'text-white' : 'text-gray-900'
      }`}
    >
      {/* Glow effect on level up */}
      {isGlowing && (
        <div className="absolute inset-0 animate-ping rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 opacity-75" />
      )}
      
      <div className={`relative rounded-lg px-4 py-2 border-2 transition-all ${
        isGlowing 
          ? 'border-yellow-400 shadow-lg shadow-yellow-500/50' 
          : darkMode
          ? 'border-gray-700 hover:border-purple-500'
          : 'border-gray-300 hover:border-purple-500'
      } ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        
        {/* Level badge */}
        <div className="flex items-center gap-3">
          {/* Rank icon */}
          <div className={`relative flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${levelData.color} flex items-center justify-center shadow-lg`}>
            <div className="absolute inset-0 rounded-full bg-white opacity-20 animate-pulse" />
            <span className="relative text-white font-black text-lg z-10">
              {levelData.rank}
            </span>
            
            {/* Sparkle effect */}
            {isGlowing && (
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-300 animate-spin" />
            )}
          </div>

          {/* Level info */}
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                LEVEL {levelData.currentLevel}
              </span>
              {levelData.currentLevel >= 50 && (
                <Trophy className="h-4 w-4 text-yellow-500" />
              )}
            </div>
            <div className="text-xs font-semibold bg-gradient-to-r bg-clip-text text-transparent" style={{
              backgroundImage: `linear-gradient(to right, ${darkMode ? '#a78bfa' : '#7c3aed'}, ${darkMode ? '#ec4899' : '#db2777'})`
            }}>
              {levelData.title}
            </div>
          </div>

          {/* XP indicator */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-yellow-500" />
              <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">
                {levelData.currentXP.toLocaleString()}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              / {levelData.xpForNextLevel.toLocaleString()} XP
            </span>
          </div>
        </div>

        {/* XP bar */}
        <div className="mt-2 w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${levelData.color} transition-all duration-500 ease-out relative`}
            style={{ width: `${Math.min(levelData.percentage, 100)}%` }}
          >
            <div className="absolute inset-0 bg-white opacity-30 animate-pulse" />
          </div>
        </div>

        {/* Hover tooltip */}
        <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap ${
          darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <Star className="h-3 w-3 text-yellow-500" />
              <span className="font-semibold">Next: {levelData.nextTitle}</span>
            </div>
            <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              {(levelData.xpForNextLevel - levelData.currentXP).toLocaleString()} XP needed
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
