import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import {
  WeightEntry,
  UserPreferences,
  DayNutrition,
  CustomFood,
  SavedMeal,
  DayActivity,
  DayWater,
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
  waterLog: DayWater[];
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
  // Write to cache dir first, then share via the OS share sheet so the user
  // can save to Files, iCloud Drive, AirDrop, etc. — accessible across
  // Codespace sessions and reinstalls.
  const tempPath = FileSystem.cacheDirectory + BACKUP_FILENAME;
  await FileSystem.writeAsStringAsync(tempPath, JSON.stringify(payload, null, 2));
  await Sharing.shareAsync(tempPath, {
    mimeType: 'application/json',
    dialogTitle: 'Save HealthTracker Backup',
    UTI: 'public.json',
  });
}

async function loadBackupNative(): Promise<BackupData | null> {
  // Use the OS document picker so the user can select the backup from Files,
  // iCloud Drive, or any other accessible location — works across Codespace
  // sessions and after reinstalls.
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const uri = result.assets[0].uri;
  const raw = await FileSystem.readAsStringAsync(uri);
  const parsed = JSON.parse(raw);
  if (!validateBackupData(parsed)) {
    throw new Error('The selected file is not a valid HealthTracker backup.');
  }
  return parsed;
}

async function backupExistsNative(): Promise<boolean> {
  // Loading uses the OS document picker, so the button is always relevant
  // on native regardless of whether a local backup file exists.
  return true;
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

// Silent auto-backup: writes directly to documentDirectory with no share sheet.
// Used by AppContext to keep a local backup in sync after every state change.
// On web this is a no-op (no persistent FS access from the browser).
export async function writeAutoBackup(
  data: Omit<BackupData, 'exportedAt'>,
): Promise<void> {
  if (isWeb) return;
  const payload: BackupData = { ...data, exportedAt: new Date().toISOString() };
  await FileSystem.writeAsStringAsync(BACKUP_PATH, JSON.stringify(payload));
}

export async function loadBackup(): Promise<BackupData | null> {
  return isWeb ? loadBackupWeb() : loadBackupNative();
}

export async function backupExists(): Promise<boolean> {
  return isWeb ? backupExistsWeb() : backupExistsNative();
}
