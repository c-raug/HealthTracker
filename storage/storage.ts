import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeightEntry, UserPreferences } from '../types';

const ENTRIES_KEY = 'weight_entries';
const PREFS_KEY = 'user_preferences';

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
