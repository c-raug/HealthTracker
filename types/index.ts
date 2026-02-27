export interface WeightEntry {
  id: string;
  date: string; // ISO date "YYYY-MM-DD"
  weight: number;
  unit: 'lbs' | 'kg';
  createdAt: string; // ISO timestamp
}

export interface UserPreferences {
  unit: 'lbs' | 'kg';
}
