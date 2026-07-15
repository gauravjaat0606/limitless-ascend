import { useMemo } from 'react';
import { ActivityLog } from '../utils/dataGenerator';
import { subDays, format } from 'date-fns';

interface ActivityHeatmapProps {
  activities: ActivityLog[];
  darkMode: boolean;
}

export default function ActivityHeatmap({ activities, darkMode }: ActivityHeatmapProps) {
  const heatmapData = useMemo(() => {
    const today = new Date();
    
    // Group activities by date and count total minutes
    const activityMap = new Map<string, number>();
    
    activities.forEach(activity => {
      const existing = activityMap.get(activity.date) || 0;
      activityMap.set(activity.date, existing + activity.duration);
    });

    // Generate 90 days of data
    const days: Array<{ date: Date; dateStr: string; minutes: number; level: number }> = [];
    
    for (let i = 0; i < 90; i++) {
      const date = subDays(today, 89 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const minutes = activityMap.get(dateStr) || 0;
      
      // Level: 0 (none), 1 (<60), 2 (60-120), 3 (120-180), 4 (180+)
      let level = 0;
      if (minutes > 0) level = 1;
      if (minutes >= 60) level = 2;
      if (minutes >= 120) level = 3;
      if (minutes >= 180) level = 4;
      
      days.push({ date, dateStr, minutes, level });
    }

    // Organize into weeks (14 weeks for better visualization)
    const weeks: Array<Array<{ date: Date; dateStr: string; minutes: number; level: number }>> = [];
    let week: Array<{ date: Date; dateStr: string; minutes: number; level: number }> = [];
    
    days.forEach((day, index) => {
      week.push(day);
      if (week.length === 7 || index === days.length - 1) {
        if (week.length < 7) {
          while (week.length < 7) {
            week.push({ date: new Date(), dateStr: '', minutes: 0, level: 0 });
          }
        }
        weeks.push([...week]);
        week = [];
      }
    });

    return weeks;
  }, [activities]);

  const getColor = (level: number) => {
    if (darkMode) {
      switch (level) {
        case 0: return 'bg-gray-800';
        case 1: return 'bg-green-900';
        case 2: return 'bg-green-700';
        case 3: return 'bg-green-500';
        case 4: return 'bg-green-400';
        default: return 'bg-gray-800';
      }
    } else {
      switch (level) {
        case 0: return 'bg-gray-100';
        case 1: return 'bg-green-200';
        case 2: return 'bg-green-400';
        case 3: return 'bg-green-600';
        case 4: return 'bg-green-700';
        default: return 'bg-gray-100';
      }
    }
  };

  return (
    <div className={`rounded-xl p-6 transition-all duration-300 ${
      darkMode 
        ? 'bg-gray-800 border border-gray-700' 
        : 'bg-white border border-gray-200 shadow-lg'
    }`}>
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Consistency Heatmap (Last 90 Days)
      </h3>

      {/* Day labels */}
      <div className="flex gap-2 mb-2">
        <div className="w-8" /> {/* Spacer for week labels */}
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {day}
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="flex gap-1">
        {/* Week numbers */}
        <div className="flex flex-col gap-1">
          {heatmapData.map((_week, weekIndex) => (
            <div key={weekIndex} className={`h-3 w-8 text-xs flex items-center ${
              darkMode ? 'text-gray-600' : 'text-gray-400'
            }`}>
              {weekIndex % 4 === 0 ? `W${weekIndex + 1}` : ''}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="flex flex-col gap-1">
          {heatmapData.map((week, weekIndex) => (
            <div key={weekIndex} className="flex gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`group relative w-3 h-3 rounded-sm ${getColor(day.level)} transition-all hover:ring-2 hover:ring-purple-500 cursor-pointer`}
                  title={day.dateStr ? `${format(day.date, 'MMM dd, yyyy')}: ${day.minutes} min` : ''}
                >
                  {/* Tooltip */}
                  {day.dateStr && (
                    <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 text-xs ${
                      darkMode ? 'bg-gray-900 text-white border border-gray-700' : 'bg-white text-gray-900 border border-gray-200'
                    }`}>
                      {format(day.date, 'MMM dd, yyyy')}
                      <br />
                      <span className="font-semibold">{day.minutes} minutes</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-xs">
        <span className={darkMode ? 'text-gray-500' : 'text-gray-500'}>Less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map(level => (
            <div
              key={level}
              className={`w-3 h-3 rounded-sm ${getColor(level)}`}
            />
          ))}
        </div>
        <span className={darkMode ? 'text-gray-500' : 'text-gray-500'}>More</span>
        <span className={`ml-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          (Minutes per day)
        </span>
      </div>
    </div>
  );
}
