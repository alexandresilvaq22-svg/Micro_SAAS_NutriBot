import { UserProfile, MealLog, LeaderboardEntry } from './types';

export const CURRENT_USER: UserProfile = {
  id: 'user-1',
  name: 'Alex Silva',
  age: 28,
  weight: 74.5,
  height: 178,
  goalCalories: 2500,
  goalProtein: 180,
  avatarUrl: 'https://picsum.photos/seed/alex/200/200',
};

export const RECENT_MEALS: MealLog[] = [
  {
    id: 'm1',
    time: '08:30',
    name: 'Oatmeal with Berries',
    calories: 350,
    protein: 12,
    carbs: 55,
    fats: 6,
  },
  {
    id: 'm2',
    time: '10:45',
    name: 'Whey Protein Shake',
    calories: 120,
    protein: 24,
    carbs: 3,
    fats: 1,
  },
  {
    id: 'm3',
    time: '13:15',
    name: 'Grilled Chicken Salad',
    calories: 450,
    protein: 45,
    carbs: 15,
    fats: 20,
  },
  {
    id: 'm4',
    time: '16:30',
    name: 'Greek Yogurt & Honey',
    calories: 180,
    protein: 15,
    carbs: 20,
    fats: 0,
  },
  {
    id: 'm5',
    time: '19:45',
    name: 'Salmon & Asparagus',
    calories: 520,
    protein: 40,
    carbs: 10,
    fats: 32,
  },
];

export const LEADERBOARD_DATA: LeaderboardEntry[] = [
  { rank: 1, name: 'Maria G.', score: 2450, avatarUrl: 'https://picsum.photos/seed/maria/100/100' },
  { rank: 2, name: 'João P.', score: 2380, avatarUrl: 'https://picsum.photos/seed/joao/100/100' },
  { rank: 3, name: 'Sofia L.', score: 2310, avatarUrl: 'https://picsum.photos/seed/sofia/100/100' },
  { rank: 15, name: 'Alex S. (You)', score: 1890, isUser: true, avatarUrl: 'https://picsum.photos/seed/alex/100/100' },
];