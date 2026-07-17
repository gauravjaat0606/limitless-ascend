import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DonutChartCardProps {
  data: any[];
  title: string;
  darkMode: boolean;
}

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export default function DonutChartCard({ data, title, darkMode }: DonutChartCardProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`rounded-lg p-4 shadow-lg ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {payload[0].name}
          </p>
          <p className="text-sm mt-1" style={{ color: payload[0].payload.fill }}>
            {payload[0].value} minutes ({((payload[0].value / payload[0].payload.total) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const dataWithTotal = data.map(item => ({
    ...item,
    total: data.reduce((sum, d) => sum + d.value, 0)
  }));

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
        <PieChart>
          <Pie
            data={dataWithTotal}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            formatter={(value) => (
              <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
