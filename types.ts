

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

// Interfaces do Banco de Dados (Supabase)

export interface LoginUserDB {
  id: number;
  email: string;
  senha: string;
  data_cadastro: string;
  user_id?: string; // Referência opcional para linkar com o NutriBot_User
}

export interface NutriBotUserDB {
  User_ID: string | number; // Permite ambos para flexibilidade no frontend
  Nome: string;
  Peso_kg: number;
  Altura_cm: number;
  Idade: number;
  Sexo: string;
  Objetivo: string;
  Calorias_alvo: number;
  Proteína_alvo: number;
  Alergias: string;
  Data_registro: string;
  behavior_flags: string;
  Avatar_URL?: string; // Novo campo para persistir foto (Base64 ou Link)
}

export interface RefeicaoDB {
  id: number;
  User_ID: string | number;
  Data: string;
  Nome: string;
  "Descrição_da_refeição": string;
  Meta_Calorias: number;
  Meta_Proteinas: number;
  Calorias: number;
  Proteinas: number;
  Carboidratos: number;
  Gorduras: number;
  // Permite acesso dinâmico para resolver problemas de case sensitivity
  [key: string]: any;
}