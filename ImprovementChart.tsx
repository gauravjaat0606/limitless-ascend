import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

interface ImprovementChartProps {
  data: any[];
  darkMode: boolean;
}

export default function ImprovementChart({ data, darkMode }: ImprovementChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`rounded-lg p-4 shadow-lg ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <p className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {format(parseISO(label), 'MMM dd, yyyy')}
          </p>
          <p className="text-sm font-semibold text-blue-500">
            Total Improvement: {payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`rounded-xl p-6 transition-all duration-300 ${
      darkMode 
        ? 'bg-gray-800 border border-gray-700' 
        : 'bg-white border border-gray-200 shadow-lg'
    }`}>
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Cumulative 1% Daily Improvement
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorImprovement" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
          <XAxis 
            dataKey="date" 
            tickFormatter={(date) => format(parseISO(date), 'MMM dd')}
            stroke={darkMode ? '#9ca3af' : '#6b7280'}
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke={darkMode ? '#9ca3af' : '#6b7280'}
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="improvement" 
            stroke="#3b82f6" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorImprovement)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
