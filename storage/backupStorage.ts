import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import {
  WeightEntry,
  UserPreferences,
  DayNutrition,
  CustomFood,
  SavedMeal,
  DayActivity,
} from '../types';

const BACKUP_FILENAME = 'healthtracker-backup.json';
const BACKUP_PATH = FileSystem.documentDirectory + BACKUP_FILENAME;

export interface BackupData {
  entries: WeightEntry[];
  preferences: UserPreferences;
  nutritionLog: DayNutrition[];
  customFoods: CustomFood[];
  savedMeals: SavedMeal[];
  activityLog: DayActivity[];
  exportedAt: string;
}

const REQUIRED_KEYS: (keyof Omit<BackupData, 'exportedAt'>)[] = [
  'entries',
  'preferences',
  'nutritionLog',
  'customFoods',
  'savedMeals',
  'activityLog',
];

function validateBackupData(data: unknown): data is BackupData {
  if (typeof data !== 'object' || data === null) return false;
  return REQUIRED_KEYS.every((key) => key in data);
}

// --- Native (iOS/Android): expo-file-system ---

async function saveBackupNative(
  data: Omit<BackupData, 'exportedAt'>,
): Promise<void> {
  const payload: BackupData = { ...data, exportedAt: new Date().toISOString() };
  await FileSystem.writeAsStringAsync(BACKUP_PATH, JSON.stringify(payload));
}

async function loadBackupNative(): Promise<BackupData | null> {
  const info = await FileSystem.getInfoAsync(BACKUP_PATH);
  if (!info.exists) return null;
  const raw = await FileSystem.readAsStringAsync(BACKUP_PATH);
  const parsed = JSON.parse(raw);
  if (!validateBackupData(parsed)) {
    throw new Error('Invalid backup file format.');
  }
  return parsed;
}

async function backupExistsNative(): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(BACKUP_PATH);
  return info.exists;
}

// --- Web: browser download / file picker ---

async function saveBackupWeb(
  data: Omit<BackupData, 'exportedAt'>,
): Promise<void> {
  const payload: BackupData = { ...data, exportedAt: new Date().toISOString() };
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = BACKUP_FILENAME;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function loadBackupWeb(): Promise<BackupData | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';

    let picked = false;

    input.addEventListener('change', () => {
      picked = true;
      const file = input.files?.[0];
      document.body.removeChild(input);
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string);
          if (!validateBackupData(parsed)) {
            reject(new Error('The selected file is not a valid HealthTracker backup.'));
            return;
          }
          resolve(parsed);
        } catch {
          reject(new Error('The selected file is not a valid HealthTracker backup.'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read the selected file.'));
      reader.readAsText(file);
    });

    // Handle cancel: focus returns to window without a change event
    window.addEventListener(
      'focus',
      () => {
        setTimeout(() => {
          if (!picked) {
            document.body.removeChild(input);
            resolve(null);
          }
        }, 500);
      },
      { once: true },
    );

    document.body.appendChild(input);
    input.click();
  });
}

async function backupExistsWeb(): Promise<boolean> {
  // Can't check the user's filesystem from the browser — always show the button
  return true;
}

// --- Public API (platform-dispatched) ---

const isWeb = Platform.OS === 'web';

export async function saveBackup(
  data: Omit<BackupData, 'exportedAt'>,
): Promise<void> {
  return isWeb ? saveBackupWeb(data) : saveBackupNative(data);
}

export async function loadBackup(): Promise<BackupData | null> {
  return isWeb ? loadBackupWeb() : loadBackupNative();
}

export async function backupExists(): Promise<boolean> {
  return isWeb ? backupExistsWeb() : backupExistsNative();
}
