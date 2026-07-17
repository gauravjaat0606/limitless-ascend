// Anime-style level system with 100 levels
export interface LevelData {
  currentLevel: number;
  currentXP: number;
  xpForNextLevel: number;
  totalXP: number;
  percentage: number;
  title: string;
  rank: string;
  color: string;
  nextTitle: string;
}

// XP calculation: exponential growth
export function getXPForLevel(level: number): number {
  // Base XP * level^1.5 for exponential curve
  return Math.floor(100 * Math.pow(level, 1.5));
}

// Get total XP needed to reach a level
export function getTotalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXPForLevel(i);
  }
  return total;
}

// Calculate XP from activity
export function calculateXP(duration: number, category: string): number {
  const baseXP = duration; // 1 minute = 1 XP
  
  // Bonus multipliers
  const categoryBonus: { [key: string]: number } = {
    'Study': 1.5,      // Study gets 1.5x XP
    'Fitness': 1.3,    // Fitness gets 1.3x XP
    'Mindfulness': 1.2 // Mindfulness gets 1.2x XP
  };
  
  const multiplier = categoryBonus[category] || 1.0;
  return Math.floor(baseXP * multiplier);
}

// Get rank title based on level
export function getRankTitle(level: number): { title: string; rank: string; color: string } {
  if (level >= 90) return { title: 'Legendary Master', rank: 'SSS', color: 'from-yellow-400 via-orange-500 to-red-500' };
  if (level >= 80) return { title: 'Supreme Champion', rank: 'SS', color: 'from-purple-400 via-pink-500 to-red-500' };
  if (level >= 70) return { title: 'Grand Master', rank: 'S', color: 'from-blue-400 via-purple-500 to-pink-500' };
  if (level >= 60) return { title: 'Elite Master', rank: 'A+', color: 'from-indigo-400 via-purple-500 to-pink-400' };
  if (level >= 50) return { title: 'Master', rank: 'A', color: 'from-cyan-400 via-blue-500 to-indigo-500' };
  if (level >= 40) return { title: 'Expert', rank: 'B+', color: 'from-green-400 via-cyan-500 to-blue-500' };
  if (level >= 30) return { title: 'Advanced', rank: 'B', color: 'from-lime-400 via-green-500 to-cyan-500' };
  if (level >= 20) return { title: 'Intermediate', rank: 'C', color: 'from-yellow-400 via-lime-500 to-green-500' };
  if (level >= 10) return { title: 'Apprentice', rank: 'D', color: 'from-orange-400 via-yellow-500 to-lime-500' };
  return { title: 'Novice', rank: 'E', color: 'from-gray-400 via-gray-500 to-gray-600' };
}

// Calculate level data from total XP
export function getLevelData(totalXP: number): LevelData {
  let level = 1;
  let xpAccumulated = 0;
  
  // Find current level
  while (level < 100 && xpAccumulated + getXPForLevel(level) <= totalXP) {
    xpAccumulated += getXPForLevel(level);
    level++;
  }
  
  const currentXP = totalXP - xpAccumulated;
  const xpForNextLevel = level < 100 ? getXPForLevel(level) : 0;
  const percentage = level < 100 ? (currentXP / xpForNextLevel) * 100 : 100;
  
  const currentRank = getRankTitle(level);
  const nextRank = getRankTitle(Math.min(level + 1, 100));
  
  return {
    currentLevel: level,
    currentXP,
    xpForNextLevel,
    totalXP,
    percentage,
    title: currentRank.title,
    rank: currentRank.rank,
    color: currentRank.color,
    nextTitle: nextRank.title
  };
}

// Save/Load XP from localStorage
const XP_STORAGE_KEY = 'gaurav_total_xp';

export function saveXP(totalXP: number): void {
  localStorage.setItem(XP_STORAGE_KEY, totalXP.toString());
}

export function loadXP(): number {
  const stored = localStorage.getItem(XP_STORAGE_KEY);
  return stored ? parseInt(stored, 10) : 0;
}

export function addXP(xpToAdd: number): LevelData {
  const currentTotalXP = loadXP();
  const newTotalXP = currentTotalXP + xpToAdd;
  saveXP(newTotalXP);
  return getLevelData(newTotalXP);
}

// Get all milestone levels
export function getMilestoneLevels(): number[] {
  return [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
}

// Check if level up occurred
export function checkLevelUp(oldXP: number, newXP: number): { leveledUp: boolean; oldLevel: number; newLevel: number } {
  const oldLevel = getLevelData(oldXP).currentLevel;
  const newLevel = getLevelData(newXP).currentLevel;
  
  return {
    leveledUp: newLevel > oldLevel,
    oldLevel,
    newLevel
  };
}
