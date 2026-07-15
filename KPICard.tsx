import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend: string;
  isPositive: boolean;
  icon: LucideIcon;
  iconColor: string;
  darkMode: boolean;
}

export default function KPICard({ 
  title, 
  value, 
  unit, 
  trend, 
  isPositive, 
  icon: Icon, 
  iconColor,
  darkMode 
}: KPICardProps) {
  return (
    <div className={`rounded-xl p-6 transition-all duration-300 hover:scale-105 ${
      darkMode 
        ? 'bg-gray-800 border border-gray-700' 
        : 'bg-white border border-gray-200 shadow-lg'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {value}
            </h3>
            {unit && (
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {unit}
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{trend}%
            </span>
            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              vs last period
            </span>
          </div>
        </div>
        <div className={`rounded-lg p-3 ${iconColor}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}
