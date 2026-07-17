import { useState } from 'react';
import { X, Plus, Zap } from 'lucide-react';
import { format } from 'date-fns';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (activity: {
    date: string;
    time: string;
    category: 'Study' | 'Fitness' | 'Mindfulness';
    activity: string;
    duration: number;
    notes: string;
  }) => void;
  darkMode: boolean;
}

export default function AddActivityModal({ isOpen, onClose, onAdd, darkMode }: AddActivityModalProps) {
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    category: 'Study' as 'Study' | 'Fitness' | 'Mindfulness',
    activity: '',
    duration: 30,
    notes: ''
  });

  // Psychology-based colors
  // Blue = Trust, Focus, Productivity (Study)
  // Green = Growth, Health, Energy (Fitness)  
  // Purple = Creativity, Calm, Mindfulness (Mindfulness)
  const categoryColors = {
    Study: {
      gradient: 'from-blue-500 to-indigo-600',
      button: 'bg-blue-600 hover:bg-blue-700',
      ring: 'focus:ring-blue-500',
      text: 'text-blue-600',
      light: 'bg-blue-50',
      dark: 'bg-blue-900/20',
      icon: '📚'
    },
    Fitness: {
      gradient: 'from-green-500 to-emerald-600',
      button: 'bg-green-600 hover:bg-green-700',
      ring: 'focus:ring-green-500',
      text: 'text-green-600',
      light: 'bg-green-50',
      dark: 'bg-green-900/20',
      icon: '💪'
    },
    Mindfulness: {
      gradient: 'from-purple-500 to-pink-600',
      button: 'bg-purple-600 hover:bg-purple-700',
      ring: 'focus:ring-purple-500',
      text: 'text-purple-600',
      light: 'bg-purple-50',
      dark: 'bg-purple-900/20',
      icon: '🧘'
    }
  };

  const currentColor = categoryColors[formData.category];

  const activityPresets: { [key: string]: string[] } = {
    Study: ['Deep Work Session', 'Reading', 'Online Course', 'Practice Problems', 'Research', 'Writing', 'Custom'],
    Fitness: ['Running', 'Gym Workout', 'Yoga', 'Swimming', 'Cycling', 'HIIT', 'Walking', 'Custom'],
    Mindfulness: ['Meditation', 'Journaling', 'Breathing Exercise', 'Mindful Walking', 'Stretching', 'Custom']
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.activity && formData.duration > 0) {
      onAdd(formData);
      // Reset form
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm'),
        category: 'Study',
        activity: '',
        duration: 30,
        notes: ''
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl transition-all max-h-[90vh] overflow-y-auto ${
        darkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        {/* Colored Header */}
        <div className={`relative overflow-hidden bg-gradient-to-br ${currentColor.gradient} p-8`}>
          <div className="absolute inset-0 bg-white/5"></div>
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{currentColor.icon}</span>
                <h2 className="text-3xl font-bold text-white">
                  Log Activity
                </h2>
              </div>
              <p className="text-white/90 text-sm">
                Track your progress • Earn XP • Build your streak 🔥
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Category Selection - Large Buttons */}
          <div>
            <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              Choose Category
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['Study', 'Fitness', 'Mindfulness'] as const).map((cat) => {
                const color = categoryColors[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat, activity: '' })}
                    className={`relative p-4 rounded-xl font-semibold transition-all transform ${
                      formData.category === cat
                        ? `bg-gradient-to-br ${color.gradient} text-white shadow-xl scale-105`
                        : darkMode
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                    }`}
                  >
                    <div className="text-2xl mb-1">{color.icon}</div>
                    {cat}
                    {formData.category === cat && (
                      <div className="absolute top-2 right-2 w-3 h-3 bg-white rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                📅 Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white focus:border-gray-600' 
                    : 'bg-white border-gray-200 text-gray-900 focus:border-gray-400'
                } focus:outline-none focus:ring-2 ${currentColor.ring}`}
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                ⏰ Time
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white focus:border-gray-600' 
                    : 'bg-white border-gray-200 text-gray-900 focus:border-gray-400'
                } focus:outline-none focus:ring-2 ${currentColor.ring}`}
                required
              />
            </div>
          </div>

          {/* Activity Presets */}
          <div>
            <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              What did you do?
            </label>
            <div className="flex flex-wrap gap-2">
              {activityPresets[formData.category].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setFormData({ ...formData, activity: preset === 'Custom' ? '' : preset })}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    formData.activity === preset || (preset === 'Custom' && !activityPresets[formData.category].includes(formData.activity))
                      ? `${currentColor.button} text-white shadow-lg scale-105`
                      : darkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Activity Input */}
          {(!activityPresets[formData.category].includes(formData.activity) || formData.activity === '') && (
            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Activity Name
              </label>
              <input
                type="text"
                value={formData.activity}
                onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                placeholder="What did you work on?"
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 ${currentColor.ring}`}
                required
              />
            </div>
          )}

          {/* Duration Slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                ⏱️ Duration
              </label>
              <div className={`text-2xl font-bold ${currentColor.text}`}>
                {formData.duration} min
              </div>
            </div>
            <input
              type="range"
              min="5"
              max="240"
              step="5"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className={`w-full h-3 rounded-lg appearance-none cursor-pointer ${
                darkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}
              style={{
                background: `linear-gradient(to right, 
                  ${formData.category === 'Study' ? '#3b82f6' : formData.category === 'Fitness' ? '#10b981' : '#a855f7'} 0%, 
                  ${formData.category === 'Study' ? '#3b82f6' : formData.category === 'Fitness' ? '#10b981' : '#a855f7'} ${(formData.duration / 240) * 100}%, 
                  ${darkMode ? '#374151' : '#e5e7eb'} ${(formData.duration / 240) * 100}%, 
                  ${darkMode ? '#374151' : '#e5e7eb'} 100%)`
              }}
            />
            <div className={`flex justify-between text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <span>5 min</span>
              <span>1 hour</span>
              <span>2 hours</span>
              <span>4 hours</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              📝 Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="How did it go? Any reflections or wins?"
              rows={3}
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all resize-none ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 ${currentColor.ring}`}
            />
          </div>

          {/* Submit Button - LARGE AND VISIBLE */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={!formData.activity || formData.duration === 0}
              className={`w-full ${currentColor.button} disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 text-lg shadow-2xl`}
            >
              <Zap className="h-6 w-6" />
              <span>Log Activity & Earn XP</span>
              <Plus className="h-6 w-6" />
            </button>
            
            {/* XP Preview */}
            {formData.activity && (
              <div className={`mt-3 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                ⚡ You'll earn{' '}
                <span className={`font-bold ${currentColor.text}`}>
                  {Math.floor(formData.duration * (formData.category === 'Study' ? 1.5 : formData.category === 'Fitness' ? 1.3 : 1.2))} XP
                </span>
                {' '}from this activity!
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
