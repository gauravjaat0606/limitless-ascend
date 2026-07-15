import { X, Rocket } from 'lucide-react';
import { useState, useEffect } from 'react';

interface WelcomeBannerProps {
  darkMode: boolean;
  hasUserData: boolean;
}

export default function WelcomeBanner({ darkMode, hasUserData }: WelcomeBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('welcome_banner_dismissed');
    if (!dismissed && !hasUserData) {
      setIsVisible(true);
    }
  }, [hasUserData]);

  const handleDismiss = () => {
    localStorage.setItem('welcome_banner_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className={`rounded-xl p-6 transition-all duration-300 relative ${
      darkMode 
        ? 'bg-gradient-to-r from-purple-900 to-blue-900 border border-purple-700' 
        : 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg'
    }`}>
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
      >
        <X className="h-5 w-5 text-white" />
      </button>
      
      <div className="flex items-start gap-4">
        <div className="bg-white bg-opacity-20 p-3 rounded-lg">
          <Rocket className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2">
            Welcome to Your 1% Journey, Gaurav! 🎉
          </h3>
          <p className="text-purple-100 mb-4">
            You're currently viewing <strong>demo data</strong> to show you how the dashboard works. 
            Ready to start tracking YOUR actual progress?
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
              <p className="text-white text-sm">
                <strong>Step 1:</strong> Click "Log Activity" button (top right)
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
              <p className="text-white text-sm">
                <strong>Step 2:</strong> Record your study/fitness activities
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
              <p className="text-white text-sm">
                <strong>Step 3:</strong> Switch to "My Data" mode to see your progress!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
