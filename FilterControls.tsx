import { Calendar, Filter } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface FilterControlsProps {
  dateRange: number;
  onDateRangeChange: (days: number) => void;
  segment: string;
  onSegmentChange: (segment: string) => void;
  darkMode: boolean;
}

export default function FilterControls({
  dateRange,
  onDateRangeChange,
  segment,
  onSegmentChange,
  darkMode
}: FilterControlsProps) {
  const endDate = new Date();
  const startDate = subDays(endDate, dateRange);

  return (
    <div className={`rounded-xl p-6 transition-all duration-300 ${
      darkMode 
        ? 'bg-gray-800 border border-gray-700' 
        : 'bg-white border border-gray-200 shadow-lg'
    }`}>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Date Range Selector */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className={`h-5 w-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <label className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Date Range
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => onDateRangeChange(days)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  dateRange === days
                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                    : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last {days} days
              </button>
            ))}
          </div>
          <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
          </p>
        </div>

        {/* Segment Filter */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Filter className={`h-5 w-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <label className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Segment
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {['All', 'Weekday', 'Weekend', 'High', 'Medium', 'Low'].map((seg) => (
              <button
                key={seg}
                onClick={() => onSegmentChange(seg)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  segment === seg
                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                    : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {seg}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
