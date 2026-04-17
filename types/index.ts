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
  | 'lose_2'
  | 'lose_1.5'
  | 'lose_1'
  | 'lose_0.5'
  | 'maintain'
  | 'gain_0.5'
  | 'gain_1'
  | 'gain_1.5'
  | 'gain_2';

export type ActivityMode = 'auto' | 'manual' | 'smartwatch';

export interface UserProfile {
  name?: string;
  age?: number; // kept for backward compat; prefer dob when present
  dob?: string; // "YYYY-MM-DD" — age computed from this at runtime
  fitnessGoal?: string;
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
  mealGroupId?: string;
  mealGroupName?: string;
  quickAdd?: boolean;
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
  pinnedCategories?: MealCategory[];
  pinnedOrder?: Record<string, number>;
  foodTypes?: string[];
}

export interface SavedMeal {
  id: string;
  name: string;
  foods: NutritionFoodItem[];
  createdAt: string;
  pinnedCategories?: MealCategory[];
  pinnedOrder?: Record<string, number>;
}

export interface XpDayLog {
  food: number;          // total food XP earned today (0–25)
  calorieGoal: boolean;
  waterGoal: boolean;
  weight: boolean;
  activity: boolean;
}

export interface UserPreferences {
  unit: 'lbs' | 'kg';
  profile?: UserProfile;
  macroPreset?: MacroPreset;
  macroSplit?: MacroSplit;
  activityMode?: ActivityMode;
  onboardingComplete?: boolean;
  themeColor?: string;
  defaultTab?: 'weight' | 'nutrition' | 'activity' | 'profile';
  waterGoalOverride?: number;
  waterGoalMode?: 'auto' | 'manual';
  waterCreatineAdjustment?: boolean;
  waterPresets?: [number, number, number];
  sectionsExpanded?: boolean;
  appearanceMode?: 'light' | 'dark' | 'system';
  avatarUri?: string;
  // Gamification
  unlockedAchievements?: string[];
  totalXp?: number;
  prestige?: number;
  xpLog?: Record<string, XpDayLog>;
  // Weekly Recap
  lastRecapShownWeek?: string; // ISO week string e.g. "2026-W15"
  // Food categorization
  foodTypeCategories?: string[];
}

export type ExerciseType = 'weight_lifting';

export interface ActivityEntry {
  id: string;
  type: 'exercise' | 'steps' | 'smartwatch';
  exerciseType?: ExerciseType;
  durationMinutes?: number;
  steps?: number;
  caloriesBurned: number;
  loggedWithMode?: ActivityMode;
  warningDismissed?: boolean;
}

export interface DayActivity {
  date: string; // "YYYY-MM-DD"
  activities: ActivityEntry[];
}

export interface WaterEntry {
  id: string;
  amount: number; // oz (if unit=lbs) or mL (if unit=kg)
  loggedAt?: string; // ISO timestamp
}

export interface DayWater {
  date: string; // "YYYY-MM-DD"
  entries: WaterEntry[];
}
