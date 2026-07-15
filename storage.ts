import { ActivityLog } from './dataGenerator';
import { calculateXP } from './levelSystem';

const STORAGE_KEY = 'gaurav_analytics_data';

export interface StoredData {
  activities: ActivityLog[];
  lastUpdated: string;
}

export function loadActivities(): ActivityLog[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data: StoredData = JSON.parse(stored);
      return data.activities;
    }
  } catch (error) {
    console.error('Error loading activities:', error);
  }
  return [];
}

export function saveActivities(activities: ActivityLog[]): void {
  try {
    const data: StoredData = {
      activities,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving activities:', error);
  }
}

export function addActivity(activity: Omit<ActivityLog, 'id' | 'improvement'>): { activity: ActivityLog; xpGained: number } {
  const activities = loadActivities();
  
  // Calculate XP based on duration and category
  const xpGained = calculateXP(activity.duration, activity.category);
  
  const newActivity: ActivityLog = {
    ...activity,
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    improvement: Number((xpGained / 100).toFixed(2)) // Convert XP to improvement percentage
  };
  
  activities.unshift(newActivity); // Add to beginning
  saveActivities(activities);
  
  return { activity: newActivity, xpGained };
}

export function deleteActivity(id: string): void {
  const activities = loadActivities();
  const filtered = activities.filter(a => a.id !== id);
  saveActivities(filtered);
}

export function clearAllActivities(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing activities:', error);
  }
}

export function exportData(): string {
  const activities = loadActivities();
  return JSON.stringify({ activities, exportedAt: new Date().toISOString() }, null, 2);
}

export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.activities && Array.isArray(data.activities)) {
      saveActivities(data.activities);
      return true;
    }
  } catch (error) {
    console.error('Error importing data:', error);
  }
  return false;
}
