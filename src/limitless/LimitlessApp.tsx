import { useState, useEffect } from 'react';
import { Brain, Sparkles, Target, Heart, Globe, DollarSign, ArrowRight, Play } from 'lucide-react';
import NeuralBackground from './components/NeuralBackground';
import IkigaiDiagram from './components/IkigaiDiagram';
import HeroSection from './components/HeroSection';
import AIDiscovery from './components/AIDiscovery';
import PurposeDashboard from './components/PurposeDashboard';
import FeatureShowcase from './components/FeatureShowcase';

export default function LimitlessApp() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Neural Network Background */}
      <NeuralBackground />

      {/* Hero Section */}
      <HeroSection />

      {/* Ikigai Section */}
      <section className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 animate-reveal">
            <h2 className="text-6xl font-bold mb-6 text-shimmer">
              What is Ikigai?
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Your reason for being. The intersection of what you love, what you're good at,
              what the world needs, and what you can be paid for.
            </p>
          </div>

          <IkigaiDiagram />
        </div>
      </section>

      {/* AI Discovery Section */}
      <AIDiscovery />

      {/* Purpose Dashboard Preview */}
      <PurposeDashboard />

      {/* Feature Showcase */}
      <FeatureShowcase />

      {/* Final CTA */}
      <section className="relative py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-dark rounded-3xl p-16 animate-pulse-glow">
            <h2 className="text-5xl font-bold mb-6">
              Ready to Discover Your Limitless Potential?
            </h2>
            <p className="text-xl text-gray-400 mb-10">
              Join thousands of people who've found their purpose with AI
            </p>
            <button className="group relative px-12 py-6 bg-gradient-limitless rounded-full font-semibold text-lg hover-lift">
              <span className="relative z-10 flex items-center gap-3">
                Start Your Journey
                <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-full transition-opacity" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
