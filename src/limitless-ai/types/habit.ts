// Core habit types for Limitless AI

export interface HabitGenome {
  cue: number; // 0-100
  motivation: number; // 0-100
  difficulty: number; // 0-100 (lower is easier)
  reward: number; // 0-100
  consistency: number; // 0-100
  identityAlignment: number; // 0-100
}

export interface HabitMRI {
  cue: string;
  craving: string;
  response: string;
  reward: string;
  currentLoop: string[];
  recommendedLoop: string[];
}

export interface BehavioralSignal {
  timestamp: Date;
  mood: number; // 1-5
  energy: number; // 1-5
  sleep: number; // hours
  location: string;
  weather?: string;
  distractions: string[];
  phoneUsage: number; // minutes
  productivity: number; // 1-5
}

export interface FailurePattern {
  dayOfWeek?: string;
  timeOfDay?: string;
  triggers: string[];
  confidence: number; // 0-100
  recommendation: string;
}

export interface Habit {
  id: string;
  name: string;
  category: 'Mind' | 'Body' | 'Career' | 'Spirit';
  icon: string;
  color: string;
  
  // Genome data
  genome: HabitGenome;
  
  // MRI data
  mri: HabitMRI;
  
  // Tracking
  completions: CompletionRecord[];
  skips: SkipRecord[];
  
  // AI insights
  failurePatterns: FailurePattern[];
  successPatterns: SuccessPattern[];
  
  // Metadata
  createdAt: Date;
  streak: number;
  longestStreak: number;
  completionRate: number;
}

export interface CompletionRecord {
  timestamp: Date;
  signals: BehavioralSignal;
  notes?: string;
  difficulty: number; // How hard was it? 1-5
  satisfaction: number; // How satisfying? 1-5
}

export interface SkipRecord {
  timestamp: Date;
  reason: SkipReason;
  signals: BehavioralSignal;
  notes?: string;
}

export type SkipReason = 
  | 'too_tired'
  | 'no_motivation'
  | 'no_time'
  | 'forgot'
  | 'distracted'
  | 'unclear'
  | 'other';

export interface SuccessPattern {
  conditions: string[];
  confidence: number;
  recommendation: string;
}

export interface Identity {
  level: number;
  title: string;
  xp: number;
  xpForNext: number;
  traits: string[];
  evolution: IdentityStage[];
}

export type IdentityStage = 
  | 'Beginner'
  | 'Student'
  | 'Disciplined Learner'
  | 'Elite Performer'
  | 'Builder'
  | 'Leader'
  | 'Visionary'
  | 'Master';

export interface FutureSimulation {
  timeframe: number; // days
  withHabits: FutureOutcome;
  withoutHabits: FutureOutcome;
}

export interface FutureOutcome {
  metrics: {
    weight?: number;
    booksRead?: number;
    codingHours?: number;
    income?: number;
    focus?: number;
    stress?: string;
    sleep?: string;
  };
  confidence: number;
}

export interface WeeklyBoss {
  name: string;
  hp: number;
  maxHp: number;
  icon: string;
  defeated: boolean;
}

export interface DopamineWallet {
  focusEnergy: number;
  disciplineCoins: number;
  purposeXP: number;
  wisdom: number;
  momentum: number;
}

export interface BehavioralHeatmap {
  dayOfWeek: string;
  intensity: number; // 0-100
  mood: number;
  energy: number;
  sleep: number;
  phoneUsage: number;
  productivity: number;
}
