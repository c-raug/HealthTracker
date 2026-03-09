import * as FileSystem from 'expo-file-system';
import {
  WeightEntry,
  UserPreferences,
  DayNutrition,
  CustomFood,
  SavedMeal,
  DayActivity,
} from '../types';

const BACKUP_PATH = FileSystem.documentDirectory + 'healthtracker-backup.json';

export interface BackupData {
  entries: WeightEntry[];
  preferences: UserPreferences;
  nutritionLog: DayNutrition[];
  customFoods: CustomFood[];
  savedMeals: SavedMeal[];
  activityLog: DayActivity[];
  exportedAt: string;
}

export async function saveBackup(
  data: Omit<BackupData, 'exportedAt'>,
): Promise<void> {
  const payload: BackupData = { ...data, exportedAt: new Date().toISOString() };
  await FileSystem.writeAsStringAsync(BACKUP_PATH, JSON.stringify(payload));
}

export async function loadBackup(): Promise<BackupData | null> {
  const info = await FileSystem.getInfoAsync(BACKUP_PATH);
  if (!info.exists) return null;
  const raw = await FileSystem.readAsStringAsync(BACKUP_PATH);
  return JSON.parse(raw) as BackupData;
}

export async function backupExists(): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(BACKUP_PATH);
  return info.exists;
}
