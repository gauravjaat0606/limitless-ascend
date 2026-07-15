import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ActivityLog } from '../utils/dataGenerator';

interface DataTableProps {
  data: ActivityLog[];
  darkMode: boolean;
}

type SortField = 'date' | 'category' | 'duration' | 'improvement';
type SortDirection = 'asc' | 'desc';

export default function DataTable({ data, darkMode }: DataTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Apply category filter
    if (categoryFilter !== 'All') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'date') {
        aValue = new Date(a.date + ' ' + a.time).getTime();
        bValue = new Date(b.date + ' ' + b.time).getTime();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [data, sortField, sortDirection, searchTerm, categoryFilter]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Study':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Fitness':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Mindfulness':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className={`rounded-xl p-6 transition-all duration-300 ${
      darkMode 
        ? 'bg-gray-800 border border-gray-700' 
        : 'bg-white border border-gray-200 shadow-lg'
    }`}>
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Activity Log
      </h3>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
            darkMode ? 'text-gray-500' : 'text-gray-400'
          }`} />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-purple-500`}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={`px-4 py-2 rounded-lg border transition-colors ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          } focus:outline-none focus:ring-2 focus:ring-purple-500`}
        >
          <option value="All">All Categories</option>
          <option value="Study">Study</option>
          <option value="Fitness">Fitness</option>
          <option value="Mindfulness">Mindfulness</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <th 
                className={`text-left py-3 px-4 cursor-pointer hover:bg-opacity-50 ${
                  darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => handleSort('date')}
              >
                Date & Time <SortIcon field="date" />
              </th>
              <th 
                className={`text-left py-3 px-4 cursor-pointer hover:bg-opacity-50 ${
                  darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => handleSort('category')}
              >
                Category <SortIcon field="category" />
              </th>
              <th className={`text-left py-3 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Activity
              </th>
              <th 
                className={`text-left py-3 px-4 cursor-pointer hover:bg-opacity-50 ${
                  darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => handleSort('duration')}
              >
                Duration <SortIcon field="duration" />
              </th>
              <th 
                className={`text-left py-3 px-4 cursor-pointer hover:bg-opacity-50 ${
                  darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => handleSort('improvement')}
              >
                Impact <SortIcon field="improvement" />
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedData.slice(0, 20).map((row) => (
              <tr 
                key={row.id}
                className={`border-b transition-colors ${
                  darkMode 
                    ? 'border-gray-700 hover:bg-gray-700' 
                    : 'border-gray-100 hover:bg-gray-50'
                }`}
              >
                <td className={`py-3 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                  <div className="text-sm">
                    {format(parseISO(row.date), 'MMM dd, yyyy')}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {row.time}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(row.category)}`}>
                    {row.category}
                  </span>
                </td>
                <td className={`py-3 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                  {row.activity}
                </td>
                <td className={`py-3 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                  {row.duration} min
                </td>
                <td className={`py-3 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                  +{row.improvement}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredAndSortedData.length === 0 && (
          <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            No activities found
          </div>
        )}
        {filteredAndSortedData.length > 20 && (
          <div className={`text-center py-4 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Showing 20 of {filteredAndSortedData.length} activities
          </div>
        )}
      </div>
    </div>
  );
}
