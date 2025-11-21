export interface UserProfile {
  id: string;
  name: string;
  age: number;
  weight: number; // kg
  height: number; // cm
  goalCalories: number;
  goalProtein: number; // g
  avatarUrl: string;
}

export interface MacroData {
  name: string;
  current: number;
  target: number;
  unit: string;
  color: string;
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
  isUser?: boolean;
  avatarUrl: string;
}