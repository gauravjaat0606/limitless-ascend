import { useState, useEffect } from 'react';
import { Quote } from 'lucide-react';

interface MotivationalQuoteProps {
  darkMode: boolean;
}

const quotes = [
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "1% better every day = 37x better in a year. Small gains compound.", author: "James Clear" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Believe it. Build it.", author: "Unknown" },
  { text: "Consistency beats intensity. Show up every day.", author: "Gaurav's Dashboard" },
  { text: "The wolf on the hill is never as hungry as the wolf climbing the hill.", author: "Arnold Schwarzenegger" },
  { text: "Make your bed every morning. Small wins create momentum.", author: "Admiral McRaven" },
  { text: "Discipline equals freedom. Do the hard things now.", author: "Jocko Willink" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" }
];

export default function MotivationalQuote({ darkMode }: MotivationalQuoteProps) {
  const [quote, setQuote] = useState(quotes[0]);

  useEffect(() => {
    // Get a random quote on mount
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
  }, []);

  const getNewQuote = () => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
  };

  return (
    <div className={`rounded-xl p-6 transition-all duration-300 relative overflow-hidden ${
      darkMode 
        ? 'bg-gradient-to-r from-purple-900 to-blue-900 border border-purple-700' 
        : 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg'
    }`}>
      <div className="absolute top-0 right-0 opacity-10">
        <Quote className="h-32 w-32 text-white" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Quote className="h-6 w-6 text-white" />
            </div>
          </div>
          
          <div className="flex-1">
            <p className="text-white text-lg font-semibold italic mb-2">
              "{quote.text}"
            </p>
            <p className="text-purple-200 text-sm">
              — {quote.author}
            </p>
          </div>

          <button
            onClick={getNewQuote}
            className="flex-shrink-0 px-3 py-1 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors text-white text-sm font-medium"
          >
            New Quote
          </button>
        </div>
      </div>
    </div>
  );
}
