import { Download, Upload, Trash2, Database } from 'lucide-react';
import { exportData, importData, clearAllActivities } from '../utils/storage';

interface DataManagementPanelProps {
  darkMode: boolean;
  onDataChange: () => void;
  activityCount: number;
}

export default function DataManagementPanel({ darkMode, onDataChange, activityCount }: DataManagementPanelProps) {
  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gaurav-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          if (importData(content)) {
            alert('Data imported successfully!');
            onDataChange();
          } else {
            alert('Failed to import data. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to delete all activities? This cannot be undone!')) {
      clearAllActivities();
      alert('All activities have been cleared.');
      onDataChange();
    }
  };

  return (
    <div className={`rounded-xl p-6 transition-all duration-300 ${
      darkMode 
        ? 'bg-gray-800 border border-gray-700' 
        : 'bg-white border border-gray-200 shadow-lg'
    }`}>
      <div className="flex items-center gap-2 mb-4">
        <Database className={`h-5 w-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Data Management
        </h3>
      </div>

      <div className="space-y-3">
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <span className="font-semibold">Stored Activities:</span> {activityCount}
          </p>
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Data is stored locally in your browser
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleExport}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              darkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <Download className="h-4 w-4" />
            Export
          </button>

          <button
            onClick={handleImport}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              darkMode 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            <Upload className="h-4 w-4" />
            Import
          </button>

          <button
            onClick={handleClear}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              darkMode 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}
