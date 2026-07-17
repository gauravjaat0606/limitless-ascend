import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

interface LineChartCardProps {
  data: any[];
  title: string;
  darkMode: boolean;
}

export default function LineChartCard({ data, title, darkMode }: LineChartCardProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`rounded-lg p-4 shadow-lg ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <p className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {format(parseISO(label), 'MMM dd, yyyy')}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value} min
            </p>
          ))}
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
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
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
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="study" 
            name="Study" 
            stroke="#8b5cf6" 
            strokeWidth={3}
            dot={{ fill: '#8b5cf6', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="fitness" 
            name="Fitness" 
            stroke="#10b981" 
            strokeWidth={3}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="studyGoal" 
            name="Study Goal" 
            stroke="#8b5cf6" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="fitnessGoal" 
            name="Fitness Goal" 
            stroke="#10b981" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
