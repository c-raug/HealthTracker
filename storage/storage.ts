import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeightEntry, UserPreferences, DayNutrition, CustomFood, SavedMeal } from '../types';

const ENTRIES_KEY = 'weight_entries';
const PREFS_KEY = 'user_preferences';
const NUTRITION_KEY = 'nutrition_log';
const CUSTOM_FOODS_KEY = 'custom_foods';
const SAVED_MEALS_KEY = 'saved_meals';

export async function loadEntries(): Promise<WeightEntry[]> {
  const raw = await AsyncStorage.getItem(ENTRIES_KEY);
  return raw ? (JSON.parse(raw) as WeightEntry[]) : [];
}

export async function saveEntries(entries: WeightEntry[]): Promise<void> {
  await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export async function loadPreferences(): Promise<UserPreferences> {
  const raw = await AsyncStorage.getItem(PREFS_KEY);
  return raw ? (JSON.parse(raw) as UserPreferences) : { unit: 'lbs' };
}

export async function savePreferences(prefs: UserPreferences): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export async function loadNutritionLog(): Promise<DayNutrition[]> {
  const raw = await AsyncStorage.getItem(NUTRITION_KEY);
  return raw ? (JSON.parse(raw) as DayNutrition[]) : [];
}

export async function saveNutritionLog(log: DayNutrition[]): Promise<void> {
  await AsyncStorage.setItem(NUTRITION_KEY, JSON.stringify(log));
}

export async function loadCustomFoods(): Promise<CustomFood[]> {
  const raw = await AsyncStorage.getItem(CUSTOM_FOODS_KEY);
  return raw ? (JSON.parse(raw) as CustomFood[]) : [];
}

export async function saveCustomFoods(foods: CustomFood[]): Promise<void> {
  await AsyncStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(foods));
}

export async function loadSavedMeals(): Promise<SavedMeal[]> {
  const raw = await AsyncStorage.getItem(SAVED_MEALS_KEY);
  return raw ? (JSON.parse(raw) as SavedMeal[]) : [];
}

export async function saveSavedMeals(meals: SavedMeal[]): Promise<void> {
  await AsyncStorage.setItem(SAVED_MEALS_KEY, JSON.stringify(meals));
}
