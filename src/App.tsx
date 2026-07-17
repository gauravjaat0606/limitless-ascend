import { useState, useMemo, useEffect } from 'react';
import { Moon, Sun, BookOpen, Dumbbell, TrendingUp, Clock } from 'lucide-react';
import KPICard from './components/KPICard';
import LineChartCard from './components/LineChartCard';
import BarChartCard from './components/BarChartCard';
import DonutChartCard from './components/DonutChartCard';
import ImprovementChart from './components/ImprovementChart';
import DataTable from './components/DataTable';
import FilterControls from './components/FilterControls';
import { calculateKPIs, aggregateDailyDataFromLogs, ActivityLog } from './utils/dataGenerator';
import AddActivityModal from './components/AddActivityModal';
import DataManagementPanel from './components/DataManagementPanel';
import WelcomeBanner from './components/WelcomeBanner';
import LevelDisplay from './components/LevelDisplay';
import LevelModal from './components/LevelModal';
import LevelUpNotification from './components/LevelUpNotification';
import StreakTracker from './components/StreakTracker';
import ActivityHeatmap from './components/ActivityHeatmap';
import AchievementBadges from './components/AchievementBadges';
import MotivationalQuote from './components/MotivationalQuote';
import LifeOSEngine from './components/LifeOSEngine';
import { loadActivities, addActivity as saveActivity } from './utils/storage';
import { loadXP, addXP, checkLevelUp, getLevelData } from './utils/levelSystem';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [dateRange, setDateRange] = useState(30);
  const [segment, setSegment] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userActivities, setUserActivities] = useState<ActivityLog[]>([]);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ show: boolean; level: number }>({ show: false, level: 1 });

  // Load user's real data from localStorage
  useEffect(() => {
    const stored = loadActivities();
    setUserActivities(stored);
    
    // Load XP
    const xp = loadXP();
    setTotalXP(xp);
  }, [dataRefreshKey]);

  // Always use real data only (no demo data)
  const allDailyData = useMemo(() => {
    if (userActivities.length > 0) {
      return aggregateDailyDataFromLogs(userActivities, 90);
    }
    // Return empty data if no activities
    return [];
  }, [userActivities]);

  const activityLogs = useMemo(() => {
    return userActivities;
  }, [userActivities]);

  // Calculate current streak for Life OS
  const currentStreak = useMemo(() => {
    if (userActivities.length === 0) return 0;
    
    const uniqueDates = Array.from(new Set(userActivities.map(a => a.date))).sort().reverse();
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      if (uniqueDates.includes(dateStr)) {
        streak++;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
    }
    
    return streak;
  }, [userActivities]);

  const handleAddActivity = (activity: Omit<ActivityLog, 'id' | 'improvement'>) => {
    const result = saveActivity(activity);
    
    // Add XP and check for level up
    const oldXP = totalXP;
    const newXP = oldXP + result.xpGained;
    const levelCheck = checkLevelUp(oldXP, newXP);
    
    addXP(result.xpGained);
    setTotalXP(newXP);
    
    // Show level up notification
    if (levelCheck.leveledUp) {
      setLevelUpData({ show: true, level: levelCheck.newLevel });
    }
    
    setUserActivities([result.activity, ...userActivities]);
    setDataRefreshKey(prev => prev + 1);
  };

  const handleDataChange = () => {
    setDataRefreshKey(prev => prev + 1);
  };

  // Filter data based on date range and segment
  const filteredData = useMemo(() => {
    let data = allDailyData.slice(-dateRange);
    
    if (segment !== 'All') {
      data = data.filter(d => {
        if (segment === 'Weekday' || segment === 'Weekend') {
          return d.category === segment;
        } else {
          return d.activity === segment;
        }
      });
    }
    
    return data;
  }, [allDailyData, dateRange, segment]);

  // Calculate previous period data for comparison
  const previousPeriodData = useMemo(() => {
    const startIndex = Math.max(0, allDailyData.length - dateRange * 2);
    const endIndex = allDailyData.length - dateRange;
    return allDailyData.slice(startIndex, endIndex);
  }, [allDailyData, dateRange]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    return calculateKPIs(filteredData, previousPeriodData);
  }, [filteredData, previousPeriodData]);

  // Prepare donut chart data
  const categoryData = useMemo(() => {
    const studyTotal = filteredData.reduce((sum, d) => sum + d.study, 0);
    const fitnessTotal = filteredData.reduce((sum, d) => sum + d.fitness, 0);
    
    return [
      { name: 'Study', value: studyTotal },
      { name: 'Fitness', value: fitnessTotal },
    ];
  }, [filteredData]);

  // Prepare activity breakdown data
  const activityBreakdown = useMemo(() => {
    const breakdown: { [key: string]: number } = {};
    
    activityLogs.forEach(log => {
      if (!breakdown[log.activity]) {
        breakdown[log.activity] = 0;
      }
      breakdown[log.activity] += log.duration;
    });

    return Object.entries(breakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [activityLogs]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      } shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-2 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Gaurav's Analytics Dashboard
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Track your 1% daily improvement journey
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Level Display */}
              <LevelDisplay
                totalXP={totalXP}
                darkMode={darkMode}
                onClick={() => setIsLevelModalOpen(true)}
              />
              
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Log Activity
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-3 rounded-lg transition-all hover:scale-110 ${
                  darkMode 
                    ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Motivational Quote */}
          <MotivationalQuote darkMode={darkMode} />
          
          {/* Welcome Banner */}
          <WelcomeBanner darkMode={darkMode} hasUserData={userActivities.length > 0} />

          {/* Data Management Only */}
          <DataManagementPanel
            darkMode={darkMode}
            onDataChange={handleDataChange}
            activityCount={userActivities.length}
          />

          {/* Limitless AI Life Engine (Flagship Preview) */}
          <LifeOSEngine
            darkMode={darkMode}
            totalXP={totalXP}
            activities={activityLogs}
            streak={currentStreak}
          />

          {/* Filter Controls */}
          <FilterControls
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            segment={segment}
            onSegmentChange={setSegment}
            darkMode={darkMode}
          />

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Avg Study Time"
              value={kpis.avgStudy.value}
              unit="min/day"
              trend={kpis.avgStudy.trend}
              isPositive={kpis.avgStudy.isPositive}
              icon={BookOpen}
              iconColor="bg-purple-600"
              darkMode={darkMode}
            />
            <KPICard
              title="Avg Fitness Time"
              value={kpis.avgFitness.value}
              unit="min/day"
              trend={kpis.avgFitness.trend}
              isPositive={kpis.avgFitness.isPositive}
              icon={Dumbbell}
              iconColor="bg-green-600"
              darkMode={darkMode}
            />
            <KPICard
              title="Total Improvement"
              value={kpis.totalImprovement.value}
              unit="%"
              trend={kpis.totalImprovement.trend}
              isPositive={kpis.totalImprovement.isPositive}
              icon={TrendingUp}
              iconColor="bg-blue-600"
              darkMode={darkMode}
            />
            <KPICard
              title="Total Active Time"
              value={Math.round(kpis.totalMinutes.value / 60)}
              unit="hours"
              trend={kpis.totalMinutes.trend}
              isPositive={kpis.totalMinutes.isPositive}
              icon={Clock}
              iconColor="bg-orange-600"
              darkMode={darkMode}
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineChartCard
              data={filteredData}
              title="Daily Progress vs Goals"
              darkMode={darkMode}
            />
            <BarChartCard
              data={filteredData.slice(-14)}
              title="Last 14 Days Activity"
              darkMode={darkMode}
            />
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ImprovementChart
                data={filteredData}
                darkMode={darkMode}
              />
            </div>
            <DonutChartCard
              data={categoryData}
              title="Time Distribution"
              darkMode={darkMode}
            />
          </div>

          {/* Streak Tracker & Achievement Badges */}
          <div className="grid grid-cols-1 gap-6">
            <StreakTracker
              activities={activityLogs}
              darkMode={darkMode}
            />
            <AchievementBadges
              activities={activityLogs}
              totalXP={totalXP}
              currentLevel={getLevelData(totalXP).currentLevel}
              darkMode={darkMode}
            />
          </div>

          {/* Activity Heatmap */}
          <ActivityHeatmap
            activities={activityLogs}
            darkMode={darkMode}
          />

          {/* Activity Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DonutChartCard
              data={activityBreakdown}
              title="Top 5 Activities"
              darkMode={darkMode}
            />
            <div className={`rounded-xl p-6 transition-all duration-300 ${
              darkMode 
                ? 'bg-gray-800 border border-gray-700' 
                : 'bg-white border border-gray-200 shadow-lg'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    Total Activities Logged
                  </span>
                  <span className={`font-bold text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {activityLogs.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    Average Session Length
                  </span>
                  <span className={`font-bold text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {Math.round(activityLogs.reduce((sum, log) => sum + log.duration, 0) / activityLogs.length)} min
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    Longest Streak
                  </span>
                  <span className={`font-bold text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {Math.floor(dateRange / 7)} weeks
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    Current Momentum
                  </span>
                  <span className="font-bold text-xl text-green-500">
                    🔥 Strong
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <DataTable
            data={activityLogs}
            darkMode={darkMode}
          />

          {/* Motivational Footer */}
          <div className={`rounded-xl p-8 text-center transition-all duration-300 ${
            darkMode 
              ? 'bg-gradient-to-r from-purple-900 to-blue-900 border border-purple-700' 
              : 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg'
          }`}>
            <h3 className="text-2xl font-bold text-white mb-2">
              1.01^365 = 37.8
            </h3>
            <p className="text-purple-100">
              Just 1% better every day leads to 37x improvement in a year. Keep going, Gaurav! 💪
            </p>
          </div>
        </div>
      </main>

      {/* Add Activity Modal */}
      <AddActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddActivity}
        darkMode={darkMode}
      />

      {/* Level Modal */}
      <LevelModal
        isOpen={isLevelModalOpen}
        onClose={() => setIsLevelModalOpen(false)}
        totalXP={totalXP}
        darkMode={darkMode}
      />

      {/* Level Up Notification */}
      <LevelUpNotification
        show={levelUpData.show}
        newLevel={levelUpData.level}
        onClose={() => setLevelUpData({ show: false, level: 1 })}
      />
    </div>
  );
}
