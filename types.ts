
export type EnglishLevel = 'beginner' | 'basic' | 'intermediate' | 'advanced';
export type StudyGoal = 'travel' | 'work' | 'study' | 'general';

export interface UserContext {
  id: string;
  name: string;
  level: EnglishLevel;
  goal: StudyGoal;
  profession?: string;
  dailyVocabKnowledge: boolean;
  daysPerWeek: number;
  avatarUrl: string;
}

export interface WordEntry {
  term: string;
  definition?: string;
  mastered: boolean;
}

export interface PracticeCycle {
  id: string;
  title: string;
  words: WordEntry[];
  currentDay: number; // 1 a 4
  isActive: boolean;
  startDate: string;
}

export interface AIContent {
  phrases?: string[];
  finalText?: string;
  contextNote?: string;
}

/**
 * Interface representing a user profile for the nutrition tracker.
 */
export interface UserProfile {
  id: string;
  name: string;
  age: number;
  weight: number;
  height: number;
  goalCalories: number;
  goalProtein: number;
  avatarUrl: string;
}

/**
 * Interface representing a single meal entry.
 */
export interface MealLog {
  id: string;
  time: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

/**
 * Interface representing an entry on the leaderboard.
 */
export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  avatarUrl: string;
  isUser?: boolean;
}

/**
 * Interface representing macronutrient data for visualization.
 */
export interface MacroData {
  name: string;
  target: number;
  current: number;
  unit: string;
  color: string;
}
