export interface WeightEntry {
  id: string;
  date: string; // ISO date "YYYY-MM-DD"
  weight: number;
  unit: 'lbs' | 'kg';
  createdAt: string; // ISO timestamp
}

export type Sex = 'male' | 'female';

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'active'
  | 'very_active';

export type WeightGoal =
  | 'lose_1'
  | 'lose_0.5'
  | 'maintain'
  | 'gain_0.5'
  | 'gain_1';

export interface UserProfile {
  age: number;
  sex: Sex;
  heightValue: number;
  heightUnit: 'in' | 'cm';
  activityLevel: ActivityLevel;
  weightGoal: WeightGoal;
}

export interface NutritionFoodItem {
  id: string;
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  servingSize?: string;
  servings?: number;
}

export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface DayNutrition {
  date: string; // "YYYY-MM-DD"
  meals: Record<MealCategory, NutritionFoodItem[]>;
}

export type MacroPreset = 'balanced' | 'high_protein' | 'keto' | 'custom';

export interface MacroSplit {
  protein: number; // percentage
  carbs: number;
  fat: number;
}

export interface CustomFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  createdAt: string;
}

export interface SavedMeal {
  id: string;
  name: string;
  foods: NutritionFoodItem[];
  createdAt: string;
}

export interface UserPreferences {
  unit: 'lbs' | 'kg';
  profile?: UserProfile;
  macroPreset?: MacroPreset;
  macroSplit?: MacroSplit;
}
