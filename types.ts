
export type EnglishLevel = 'beginner' | 'basic' | 'intermediate' | 'advanced';
export type StudyGoal = 'travel' | 'work' | 'study' | 'general';

export interface UserContext {
  name: string;
  level: EnglishLevel;
  goal: StudyGoal;
  profession?: string;
  avatarUrl: string;
}

export interface WordEntry {
  term: string;
  mastered: boolean;
}

export interface PracticeCycle {
  id: string;
  title: string;
  words: WordEntry[];
  currentDay: number;
  isActive: boolean;
  startDate: string;
}

export interface AIContent {
  phrases?: string[];
  finalText?: string;
  contextNote?: string;
}

// Added missing interfaces for NutriBot components to fix compilation errors

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

export interface MacroData {
  name: string;
  target: number;
  current: number;
  color: string;
  unit: string;
}

export interface MealLog {
  id: string;
  time: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  avatarUrl: string;
  isUser?: boolean;
}
