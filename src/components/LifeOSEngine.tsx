import { useState } from 'react';
import { Brain, Target, TrendingUp, AlertTriangle, CheckCircle, ArrowRight, Sparkles, Activity, Heart, Briefcase, Dumbbell, GraduationCap, Users } from 'lucide-react';

interface LifeOSEngineProps {
  darkMode: boolean;
  totalXP: number;
  activities: any[];
  streak: number;
}

export default function LifeOSEngine({ darkMode, totalXP, activities, streak }: LifeOSEngineProps) {
  const [butterflyEffect, setButterflyEffect] = useState<'skip' | 'complete' | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Calculate life scores based on real data
  const calculateScores = () => {
    const hasActivities = activities.length > 0;
    
    // Discipline based on streak and total activities
    const discipline = Math.min(100, hasActivities ? Math.max(20, 30 + (streak * 5) + Math.min(activities.length / 2, 40)) : 20);
    
    // Focus score based on study activities
    const studyActivities = activities.filter(a => a.category === 'Study');
    const focus = Math.min(100, studyActivities.length > 0 
      ? Math.max(30, 40 + (studyActivities.length * 3)) 
      : 30);
    
    // Purpose score based on variety of activities
    const categories = new Set(activities.map(a => a.category));
    const purpose = Math.min(100, categories.size * 18 + (totalXP / 100));
    
    // Health based on fitness activities
    const fitnessActivities = activities.filter(a => a.category === 'Fitness');
    const health = Math.min(100, fitnessActivities.length > 0 
      ? Math.max(25, 35 + (fitnessActivities.length * 4)) 
      : 25);
    
    // Knowledge based on total study time
    const totalStudy = studyActivities.reduce((sum, a) => sum + a.duration, 0);
    const knowledge = Math.min(100, Math.max(30, 40 + (totalStudy / 60) * 2));
    
    // Relationships (placeholder until social tracking)
    const relationships = 65;
    
    // Finance (placeholder until income tracking)
    const finance = 41;

    const overall = Math.round((discipline + focus + purpose + health + knowledge + relationships + finance) / 7);

    return {
      discipline: Math.round(discipline),
      focus: Math.round(focus),
      purpose: Math.round(purpose),
      health: Math.round(health),
      knowledge: Math.round(knowledge),
      relationships: Math.round(relationships),
      finance: Math.round(finance),
      overall
    };
  };

  const scores = calculateScores();
  const missionProgress = Math.min(100, Math.round((scores.overall - 60) * 2.5 + 10));
  const successProbability = Math.min(95, 60 + Math.round(streak * 1.5) + Math.round(activities.length / 4));

  // Butterfly effect calculations
  const completeEffect = [
    { label: "Energy Tomorrow", value: "+5%", positive: true },
    { label: "Study Focus", value: "+8%", positive: true },
    { label: "Concept Retention", value: "+6%", positive: true },
    { label: "Next Mock Test", value: "+4 marks", positive: true },
    { label: "JEE AIR Probability", value: `81% → ${Math.min(95, 84)}%`, positive: true },
  ];

  const skipEffect = [
    { label: "Energy Tomorrow", value: "-4%", positive: false },
    { label: "Study Efficiency", value: "-6%", positive: false },
    { label: "Concept Retention", value: "-3%", positive: false },
    { label: "Next Mock Test", value: "-5 marks", positive: false },
    { label: "JEE AIR Probability", value: `81% → ${Math.max(70, 79)}%`, positive: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header Badge */}
      <div className={`rounded-2xl p-4 text-center relative overflow-hidden ${
        darkMode 
          ? 'bg-gradient-to-r from-purple-900 via-violet-900 to-blue-900 border border-purple-700' 
          : 'bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 shadow-lg'
      }`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
        <div className="relative flex items-center justify-center gap-3">
          <Sparkles className="h-8 w-8 text-yellow-300 animate-pulse" />
          <div>
            <h2 className="text-2xl font-bold text-white">
              Limitless AI Life Engine
            </h2>
            <p className="text-purple-100 text-sm">
              Preview: Your unified Life OS - Strategist, not just tracker
            </p>
          </div>
          <Sparkles className="h-8 w-8 text-yellow-300 animate-pulse" />
        </div>
      </div>

      {/* AI Life Engine Briefing */}
      <div className={`rounded-xl p-6 ${
        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-lg'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <Brain className="h-6 w-6 text-purple-500" />
              Good Morning. ☀️
            </h3>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Your AI strategist analyzing your patterns
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
            successProbability >= 70 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
          }`}>
            {successProbability}% Success Probability
          </div>
        </div>

        {/* Mission */}
        <div className={`rounded-xl p-4 mb-4 ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 to-blue-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-purple-500" />
            <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Current Mission: AIR {'<'} 100
            </span>
          </div>
          
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Progress</span>
              <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{missionProgress}%</span>
            </div>
            <div className={`h-4 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div 
                className="h-full bg-gradient-to-r from-purple-500 via-violet-500 to-blue-500 transition-all duration-1000"
                style={{ width: `${missionProgress}%` }}
              >
                <div className="h-full w-full bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>

          {streak < 3 && activities.length < 5 ? (
            <div className={`flex items-start gap-2 p-3 rounded-lg ${
              darkMode ? 'bg-yellow-900/20 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className={`font-semibold text-sm ${darkMode ? 'text-yellow-400' : 'text-yellow-800'}`}>
                  Risk Detected: Consistency Building
                </p>
                <p className={`text-sm mt-1 ${darkMode ? 'text-yellow-200' : 'text-yellow-700'}`}>
                  Start with daily study sessions to build momentum. Your patterns show morning study has highest retention.
                </p>
              </div>
            </div>
          ) : (
            <div className={`flex items-start gap-2 p-3 rounded-lg ${
              darkMode ? 'bg-green-900/20 border border-green-700' : 'bg-green-50 border border-green-200'
            }`}>
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className={`font-semibold text-sm ${darkMode ? 'text-green-400' : 'text-green-800'}`}>
                  Strong momentum!
                </p>
                <p className={`text-sm mt-1 ${darkMode ? 'text-green-200' : 'text-green-700'}`}>
                  Your {streak}-day streak is putting you in the top 15% of consistent performers.
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`w-full mt-3 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              darkMode 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            <Sparkles className="h-5 w-5" />
            View Full Life Score Breakdown
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Life Scores (Expandable) */}
      {showDetails && (
        <div className={`rounded-xl p-6 ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-lg'
        } animate-slideUp`}>
          <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <TrendingUp className="h-6 w-6 text-purple-500" />
            AI Life Scores
            <span className={`ml-auto text-2xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent`}>
              {scores.overall}/100
            </span>
          </h3>

          <div className="space-y-4">
            {[
              { key: 'discipline', label: 'Discipline', icon: Activity, color: 'from-purple-500 to-violet-500', value: scores.discipline },
              { key: 'focus', label: 'Focus', icon: Brain, color: 'from-blue-500 to-cyan-500', value: scores.focus },
              { key: 'purpose', label: 'Purpose', icon: Heart, color: 'from-pink-500 to-rose-500', value: scores.purpose },
              { key: 'health', label: 'Health', icon: Dumbbell, color: 'from-green-500 to-emerald-500', value: scores.health },
              { key: 'knowledge', label: 'Knowledge', icon: GraduationCap, color: 'from-indigo-500 to-purple-500', value: scores.knowledge },
              { key: 'relationships', label: 'Relationships', icon: Users, color: 'from-orange-500 to-amber-500', value: scores.relationships },
              { key: 'finance', label: 'Finance', icon: Briefcase, color: 'from-yellow-500 to-orange-500', value: scores.finance },
            ].map(score => (
              <div key={score.key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <score.icon className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {score.label}
                    </span>
                  </div>
                  <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {score.value}
                  </span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div
                    className={`h-full bg-gradient-to-r ${score.color} transition-all duration-1000`}
                    style={{ width: `${score.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Butterfly Effect Demo */}
      <div className={`rounded-xl p-6 ${
        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-lg'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🦋</span>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            The Butterfly Effect
          </h3>
        </div>
        <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          See how one decision ripples into your future. Click to simulate:
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setButterflyEffect('complete')}
            className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
              butterflyEffect === 'complete'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg shadow-green-500/20'
                : darkMode
                ? 'border-gray-700 hover:border-green-500/50'
                : 'border-gray-200 hover:border-green-500/50'
            }`}
          >
            <CheckCircle className={`h-10 w-10 mx-auto mb-2 ${
              butterflyEffect === 'complete' ? 'text-green-500' : darkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <div className={`font-bold text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Complete Workout
            </div>
            <div className={`text-xs text-center mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              See positive ripple effects
            </div>
          </button>

          <button
            onClick={() => setButterflyEffect('skip')}
            className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
              butterflyEffect === 'skip'
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-lg shadow-red-500/20'
                : darkMode
                ? 'border-gray-700 hover:border-red-500/50'
                : 'border-gray-200 hover:border-red-500/50'
            }`}
          >
            <AlertTriangle className={`h-10 w-10 mx-auto mb-2 ${
              butterflyEffect === 'skip' ? 'text-red-500' : darkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <div className={`font-bold text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Skip Workout
            </div>
            <div className={`text-xs text-center mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              See the consequences
            </div>
          </button>
        </div>

        {butterflyEffect && (
          <div className={`mt-4 rounded-xl p-4 animate-slideUp ${
            butterflyEffect === 'complete'
              ? darkMode ? 'bg-green-900/20 border border-green-700' : 'bg-green-50 border border-green-200'
              : darkMode ? 'bg-red-900/20 border border-red-700' : 'bg-red-50 border border-red-200'
          }`}>
            <h4 className={`font-bold mb-3 flex items-center gap-2 ${
              butterflyEffect === 'complete'
                ? darkMode ? 'text-green-400' : 'text-green-800'
                : darkMode ? 'text-red-400' : 'text-red-800'
            }`}>
              {butterflyEffect === 'complete' ? '✨ Positive Ripple Effect' : '⚠️ Negative Ripple Effect'}
            </h4>
            
            <div className="space-y-2">
              {(butterflyEffect === 'complete' ? completeEffect : skipEffect).map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm">{index === 0 ? '  Workout' : '↓'}</span>
                  <span className={`text-sm ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>{item.label}:</span>
                  <span className={`text-sm font-bold ${
                    item.positive
                      ? darkMode ? 'text-green-400' : 'text-green-700'
                      : darkMode ? 'text-red-400' : 'text-red-700'
                  }`}>{item.value}</span>
                </div>
              ))}
            </div>

            <p className={`text-xs mt-3 italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              * Estimates based on behavioral research and your historical patterns
            </p>
          </div>
        )}
      </div>

      {/* AI Evening Mentor Preview */}
      <div className={`rounded-xl p-6 ${
        darkMode 
          ? 'bg-gradient-to-br from-indigo-900 to-purple-900 border border-indigo-700' 
          : 'bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200'
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🌙</span>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            AI Evening Mentor Preview
          </h3>
        </div>
        
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-900/50' : 'bg-white/70'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <span className="font-semibold">Today you spent 2 hours on Physics.</span> Great consistency. 
            Your biggest distraction was social media between 7:15–7:45 PM.
          </p>
          <p className={`text-sm mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            💡 <span className="font-semibold">Tomorrow's recommendation:</span> If you start Chemistry before 8:00 AM, 
            your recent pattern suggests you'll finish it 20% faster with 15% higher retention.
          </p>
          <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Put your phone in another room after 7 PM - this removes 89% of social distractions.
          </p>
        </div>
      </div>
    </div>
  );
}
