import { useEffect, useState } from 'react';
import { Trophy, Sparkles, Star } from 'lucide-react';
import { getRankTitle } from '../utils/levelSystem';

interface LevelUpNotificationProps {
  newLevel: number;
  show: boolean;
  onClose: () => void;
}

export default function LevelUpNotification({ newLevel, show, onClose }: LevelUpNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const rankInfo = getRankTitle(newLevel);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      
      // Play celebration
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 500);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show && !isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center pointer-events-none transition-opacity duration-500 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Overlay flash */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-purple-500/20 to-pink-500/20 animate-pulse" />
      
      {/* Notification card */}
      <div className={`relative transform transition-all duration-700 ${
        isVisible ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
      }`}>
        <div className="relative">
          {/* Sparkle effects */}
          <div className="absolute -top-8 -left-8 animate-bounce">
            <Sparkles className="h-12 w-12 text-yellow-400" style={{ animationDelay: '0ms' }} />
          </div>
          <div className="absolute -top-8 -right-8 animate-bounce">
            <Star className="h-10 w-10 text-pink-400" style={{ animationDelay: '200ms' }} />
          </div>
          <div className="absolute -bottom-8 -left-8 animate-bounce">
            <Star className="h-10 w-10 text-blue-400" style={{ animationDelay: '400ms' }} />
          </div>
          <div className="absolute -bottom-8 -right-8 animate-bounce">
            <Sparkles className="h-12 w-12 text-purple-400" style={{ animationDelay: '600ms' }} />
          </div>

          {/* Main card */}
          <div className={`relative bg-gradient-to-br ${rankInfo.color} p-1 rounded-3xl shadow-2xl`}>
            <div className="bg-gray-900 rounded-3xl p-8 text-center">
              {/* Trophy icon */}
              <div className="mb-4 relative">
                <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-50 animate-pulse" />
                <Trophy className="h-24 w-24 text-yellow-400 mx-auto relative animate-bounce" />
              </div>

              {/* Level up text */}
              <div className="mb-4">
                <div className="text-white text-2xl font-bold mb-2 tracking-wider animate-pulse">
                  LEVEL UP!
                </div>
                <div className={`text-6xl font-black mb-2 bg-gradient-to-r ${rankInfo.color} bg-clip-text text-transparent animate-pulse`}>
                  {newLevel}
                </div>
                <div className="text-white text-xl font-semibold">
                  {rankInfo.title}
                </div>
              </div>

              {/* Rank badge */}
              <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r ${rankInfo.color} shadow-lg`}>
                <span className="text-white font-black text-2xl tracking-widest">
                  RANK {rankInfo.rank}
                </span>
              </div>

              {/* Motivational message */}
              <div className="mt-6 text-gray-300 text-sm">
                Keep pushing forward! 💪
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confetti effect (simple version with stars) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-fall"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-20px',
              animationDelay: `${Math.random() * 2000}ms`,
              animationDuration: `${2000 + Math.random() * 3000}ms`
            }}
          >
            {i % 3 === 0 ? '⭐' : i % 3 === 1 ? '✨' : '🌟'}
          </div>
        ))}
      </div>
    </div>
  );
}
