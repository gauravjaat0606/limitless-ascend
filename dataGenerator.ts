import { subDays, format } from 'date-fns';

export interface DailyData {
  date: string;
  study: number;
  fitness: number;
  improvement: number;
  studyGoal: number;
  fitnessGoal: number;
  category: string;
  activity: string;
}

export interface ActivityLog {
  id: string;
  date: string;
  time: string;
  category: 'Study' | 'Fitness' | 'Mindfulness';
  activity: string;
  duration: number;
  improvement: number;
  notes: string;
}

// Generate realistic daily data for the past 90 days
export function generateDailyData(days: number = 90): DailyData[] {
  const data: DailyData[] = [];
  const today = new Date();
  
  let baseStudy = 120; // minutes
  let baseFitness = 45; // minutes
  
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    
    // Add some realistic variation and growth trend
    const growthFactor = 1 + (days - i) * 0.001; // 0.1% daily compound growth
    const randomVariation = 0.8 + Math.random() * 0.4; // ±20% variation
    
    const study = Math.round(baseStudy * growthFactor * randomVariation);
    const fitness = Math.round(baseFitness * growthFactor * randomVariation);
    
    // Calculate improvement percentage (cumulative)
    const improvement = Number((((days - i) * 0.01 + 1) * 100 - 100).toFixed(2));
    
    data.push({
      date: format(date, 'yyyy-MM-dd'),
      study,
      fitness,
      improvement,
      studyGoal: 150,
      fitnessGoal: 60,
      category: i % 7 === 0 || i % 7 === 6 ? 'Weekend' : 'Weekday',
      activity: study > 130 ? 'High' : study > 100 ? 'Medium' : 'Low'
    });
  }
  
  return data;
}

// Generate activity logs
export function generateActivityLogs(count: number = 100): ActivityLog[] {
  const categories: Array<'Study' | 'Fitness' | 'Mindfulness'> = ['Study', 'Fitness', 'Mindfulness'];
  const studyActivities = ['Deep Work Session', 'Reading', 'Online Course', 'Practice Problems', 'Research', 'Writing'];
  const fitnessActivities = ['Running', 'Gym Workout', 'Yoga', 'Swimming', 'Cycling', 'HIIT'];
  const mindfulnessActivities = ['Meditation', 'Journaling', 'Breathing Exercise', 'Walking'];
  
  const logs: ActivityLog[] = [];
  const today = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = subDays(today, Math.floor(Math.random() * 90));
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    let activity: string;
    let duration: number;
    
    if (category === 'Study') {
      activity = studyActivities[Math.floor(Math.random() * studyActivities.length)];
      duration = 30 + Math.floor(Math.random() * 150);
    } else if (category === 'Fitness') {
      activity = fitnessActivities[Math.floor(Math.random() * fitnessActivities.length)];
      duration = 20 + Math.floor(Math.random() * 90);
    } else {
      activity = mindfulnessActivities[Math.floor(Math.random() * mindfulnessActivities.length)];
      duration = 5 + Math.floor(Math.random() * 30);
    }
    
    const hour = 6 + Math.floor(Math.random() * 16);
    const minute = Math.floor(Math.random() * 60);
    
    logs.push({
      id: `log-${i}`,
      date: format(date, 'yyyy-MM-dd'),
      time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      category,
      activity,
      duration,
      improvement: Number((Math.random() * 2).toFixed(2)),
      notes: Math.random() > 0.7 ? 'Great session!' : ''
    });
  }
  
  return logs.sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime());
}

// Calculate KPI metrics
// Generate daily data from activity logs
export function aggregateDailyDataFromLogs(logs: ActivityLog[], days: number = 90): DailyData[] {
  const dailyMap = new Map<string, { study: number; fitness: number; mindfulness: number }>();
  const today = new Date();
  
  // Initialize all days with zero values
  for (let i = days - 1; i >= 0; i--) {
    const date = format(subDays(today, i), 'yyyy-MM-dd');
    dailyMap.set(date, { study: 0, fitness: 0, mindfulness: 0 });
  }
  
  // Aggregate activities by date and category
  logs.forEach(log => {
    const existing = dailyMap.get(log.date);
    if (existing) {
      if (log.category === 'Study') {
        existing.study += log.duration;
      } else if (log.category === 'Fitness') {
        existing.fitness += log.duration;
      } else {
        existing.mindfulness += log.duration;
      }
    }
  });
  
  // Convert to DailyData array
  const data: DailyData[] = [];
  let cumulativeImprovement = 0;
  
  Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([date, values]) => {
      // Calculate daily improvement (1% if there was any activity)
      const hasActivity = values.study > 0 || values.fitness > 0;
      if (hasActivity) {
        cumulativeImprovement = (cumulativeImprovement + 1) * 1.01 - 1;
      }
      
      const dayOfWeek = new Date(date).getDay();
      
      data.push({
        date,
        study: values.study,
        fitness: values.fitness,
        improvement: Number((cumulativeImprovement * 100).toFixed(2)),
        studyGoal: 150,
        fitnessGoal: 60,
        category: dayOfWeek === 0 || dayOfWeek === 6 ? 'Weekend' : 'Weekday',
        activity: values.study > 130 ? 'High' : values.study > 100 ? 'Medium' : 'Low'
      });
    });
  
  return data;
}

export function calculateKPIs(data: DailyData[], previousData: DailyData[]) {
  const currentAvgStudy = data.reduce((sum, d) => sum + d.study, 0) / data.length;
  const currentAvgFitness = data.reduce((sum, d) => sum + d.fitness, 0) / data.length;
  const currentImprovement = data[data.length - 1]?.improvement || 0;
  const totalMinutes = data.reduce((sum, d) => sum + d.study + d.fitness, 0);
  
  const prevAvgStudy = previousData.reduce((sum, d) => sum + d.study, 0) / previousData.length;
  const prevAvgFitness = previousData.reduce((sum, d) => sum + d.fitness, 0) / previousData.length;
  const prevImprovement = previousData[previousData.length - 1]?.improvement || 0;
  const prevTotalMinutes = previousData.reduce((sum, d) => sum + d.study + d.fitness, 0);
  
  return {
    avgStudy: {
      value: Math.round(currentAvgStudy),
      trend: ((currentAvgStudy - prevAvgStudy) / prevAvgStudy * 100).toFixed(1),
      isPositive: currentAvgStudy >= prevAvgStudy
    },
    avgFitness: {
      value: Math.round(currentAvgFitness),
      trend: ((currentAvgFitness - prevAvgFitness) / prevAvgFitness * 100).toFixed(1),
      isPositive: currentAvgFitness >= prevAvgFitness
    },
    totalImprovement: {
      value: currentImprovement.toFixed(1),
      trend: ((currentImprovement - prevImprovement)).toFixed(1),
      isPositive: currentImprovement >= prevImprovement
    },
    totalMinutes: {
      value: totalMinutes,
      trend: ((totalMinutes - prevTotalMinutes) / prevTotalMinutes * 100).toFixed(1),
      isPositive: totalMinutes >= prevTotalMinutes
    }
  };
}
