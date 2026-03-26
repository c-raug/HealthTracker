import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';
import {
  WeightEntry,
  UserPreferences,
  UserProfile,
  DayNutrition,
  MealCategory,
  NutritionFoodItem,
  MacroPreset,
  MacroSplit,
  CustomFood,
  SavedMeal,
  ActivityEntry,
  DayActivity,
  ActivityMode,
  WaterEntry,
  DayWater,
} from '../types';
import {
  loadEntries,
  saveEntries,
  loadPreferences,
  savePreferences,
  loadNutritionLog,
  saveNutritionLog,
  loadCustomFoods,
  saveCustomFoods,
  loadSavedMeals,
  saveSavedMeals,
  loadActivityLog,
  saveActivityLog,
  loadWaterLog,
  saveWaterLog,
} from '../storage/storage';
import { writeAutoBackup } from '../storage/backupStorage';
import { getToday } from '../utils/dateUtils';

// ─── State & Actions ─────────────────────────────────────────────────────────

type State = {
  entries: WeightEntry[];
  preferences: UserPreferences;
  nutritionLog: DayNutrition[];
  customFoods: CustomFood[];
  savedMeals: SavedMeal[];
  activityLog: DayActivity[];
  waterLog: DayWater[];
  selectedDate: string;
  isLoading: boolean;
};

type Action =
  | { type: 'LOAD_DATA'; entries: WeightEntry[]; preferences: UserPreferences; nutritionLog: DayNutrition[]; customFoods: CustomFood[]; savedMeals: SavedMeal[]; activityLog: DayActivity[]; waterLog: DayWater[] }
  | { type: 'UPSERT_ENTRY'; entry: WeightEntry }
  | { type: 'SET_SELECTED_DATE'; date: string }
  | { type: 'DELETE_ENTRY'; id: string }
  | { type: 'SET_UNIT'; unit: 'lbs' | 'kg' }
  | { type: 'SET_PROFILE'; profile: UserProfile }
  | { type: 'ADD_FOOD_TO_MEAL'; date: string; category: MealCategory; food: NutritionFoodItem }
  | { type: 'DELETE_FOOD_FROM_MEAL'; date: string; category: MealCategory; foodId: string }
  | { type: 'UPDATE_FOOD_IN_MEAL'; date: string; category: MealCategory; food: NutritionFoodItem }
  | { type: 'REORDER_MEAL_FOODS'; date: string; category: MealCategory; foods: NutritionFoodItem[] }
  | { type: 'SET_MACRO_PRESET'; preset: MacroPreset; split: MacroSplit }
  | { type: 'ADD_CUSTOM_FOOD'; food: CustomFood }
  | { type: 'UPDATE_CUSTOM_FOOD'; food: CustomFood }
  | { type: 'DELETE_CUSTOM_FOOD'; id: string }
  | { type: 'ADD_SAVED_MEAL'; meal: SavedMeal }
  | { type: 'UPDATE_SAVED_MEAL'; meal: SavedMeal }
  | { type: 'DELETE_SAVED_MEAL'; id: string }
  | { type: 'ADD_ACTIVITY'; date: string; activity: ActivityEntry }
  | { type: 'DELETE_ACTIVITY'; date: string; activityId: string }
  | { type: 'DISMISS_ACTIVITY_WARNING'; date: string; activityId: string }
  | { type: 'SET_ACTIVITY_MODE'; mode: ActivityMode }
  | { type: 'SET_ONBOARDING_COMPLETE' }
  | { type: 'SET_THEME_COLOR'; color: string }
  | { type: 'SET_DEFAULT_TAB'; tab: 'weight' | 'nutrition' | 'activity' }
  | { type: 'ADD_WATER_ENTRY'; date: string; entry: WaterEntry }
  | { type: 'DELETE_WATER_ENTRY'; date: string; entryId: string }
  | { type: 'SET_WATER_GOAL_OVERRIDE'; amount: number | undefined }
  | { type: 'SET_WATER_GOAL_MODE'; mode: 'auto' | 'manual' }
  | { type: 'SET_WATER_CREATINE'; enabled: boolean }
  | { type: 'SET_WATER_PRESETS'; presets: [number, number, number] }
  | { type: 'SET_SECTIONS_EXPANDED'; enabled: boolean }
  | { type: 'REORDER_PINNED_FOODS'; ids: string[] }
  | { type: 'REORDER_PINNED_MEALS'; category: MealCategory; ids: string[] }
  | { type: 'SET_APPEARANCE_MODE'; mode: 'light' | 'dark' | 'system' };

const EMPTY_MEALS = (): DayNutrition['meals'] => ({
  breakfast: [],
  lunch: [],
  dinner: [],
  snacks: [],
});

function getOrCreateDay(log: DayNutrition[], date: string): DayNutrition {
  return log.find((d) => d.date === date) ?? { date, meals: EMPTY_MEALS() };
}

function upsertDay(log: DayNutrition[], day: DayNutrition): DayNutrition[] {
  const filtered = log.filter((d) => d.date !== day.date);
  return [day, ...filtered];
}

function getOrCreateActivityDay(log: DayActivity[], date: string): DayActivity {
  return log.find((d) => d.date === date) ?? { date, activities: [] };
}

function upsertActivityDay(log: DayActivity[], day: DayActivity): DayActivity[] {
  const filtered = log.filter((d) => d.date !== day.date);
  return [day, ...filtered];
}

const initialState: State = {
  entries: [],
  preferences: { unit: 'lbs' },
  nutritionLog: [],
  customFoods: [],
  savedMeals: [],
  activityLog: [],
  waterLog: [],
  selectedDate: getToday(),
  isLoading: true,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_DATA': {
      // Auto-migrate existing users: if they have a profile and weight entries
      // but onboardingComplete is not set, mark it as complete so they skip onboarding.
      const prefs = action.preferences;
      const migratedPrefs =
        prefs.profile && action.entries.length > 0 && !prefs.onboardingComplete
          ? { ...prefs, onboardingComplete: true }
          : prefs;
      return {
        ...state,
        entries: action.entries,
        preferences: migratedPrefs,
        nutritionLog: action.nutritionLog,
        customFoods: action.customFoods,
        savedMeals: action.savedMeals,
        activityLog: action.activityLog,
        waterLog: action.waterLog ?? [],
        isLoading: false,
      };
    }
    case 'UPSERT_ENTRY': {
      const filtered = state.entries.filter(
        (e) => e.date !== action.entry.date,
      );
      return { ...state, entries: [action.entry, ...filtered] };
    }
    case 'DELETE_ENTRY':
      return {
        ...state,
        entries: state.entries.filter((e) => e.id !== action.id),
      };
    case 'SET_UNIT':
      return {
        ...state,
        preferences: { ...state.preferences, unit: action.unit },
      };
    case 'SET_PROFILE':
      return {
        ...state,
        preferences: { ...state.preferences, profile: action.profile },
      };
    case 'SET_MACRO_PRESET':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          macroPreset: action.preset,
          macroSplit: action.split,
        },
      };
    case 'ADD_FOOD_TO_MEAL': {
      const day = getOrCreateDay(state.nutritionLog, action.date);
      const updatedDay: DayNutrition = {
        ...day,
        meals: {
          ...day.meals,
          [action.category]: [...day.meals[action.category], action.food],
        },
      };
      return { ...state, nutritionLog: upsertDay(state.nutritionLog, updatedDay) };
    }
    case 'DELETE_FOOD_FROM_MEAL': {
      const day = getOrCreateDay(state.nutritionLog, action.date);
      const updatedDay: DayNutrition = {
        ...day,
        meals: {
          ...day.meals,
          [action.category]: day.meals[action.category].filter(
            (f) => f.id !== action.foodId,
          ),
        },
      };
      return { ...state, nutritionLog: upsertDay(state.nutritionLog, updatedDay) };
    }
    case 'UPDATE_FOOD_IN_MEAL': {
      const day = getOrCreateDay(state.nutritionLog, action.date);
      const updatedDay: DayNutrition = {
        ...day,
        meals: {
          ...day.meals,
          [action.category]: day.meals[action.category].map((f) =>
            f.id === action.food.id ? action.food : f,
          ),
        },
      };
      return { ...state, nutritionLog: upsertDay(state.nutritionLog, updatedDay) };
    }
    case 'REORDER_MEAL_FOODS': {
      const day = getOrCreateDay(state.nutritionLog, action.date);
      const updatedDay: DayNutrition = {
        ...day,
        meals: {
          ...day.meals,
          [action.category]: action.foods,
        },
      };
      return { ...state, nutritionLog: upsertDay(state.nutritionLog, updatedDay) };
    }
    case 'ADD_CUSTOM_FOOD':
      return { ...state, customFoods: [action.food, ...state.customFoods] };
    case 'UPDATE_CUSTOM_FOOD':
      return { ...state, customFoods: state.customFoods.map((f) => f.id === action.food.id ? action.food : f) };
    case 'DELETE_CUSTOM_FOOD':
      return {
        ...state,
        customFoods: state.customFoods.filter((f) => f.id !== action.id),
      };
    case 'ADD_SAVED_MEAL':
      return { ...state, savedMeals: [action.meal, ...state.savedMeals] };
    case 'UPDATE_SAVED_MEAL':
      return {
        ...state,
        savedMeals: state.savedMeals.map((m) =>
          m.id === action.meal.id ? action.meal : m,
        ),
      };
    case 'DELETE_SAVED_MEAL':
      return {
        ...state,
        savedMeals: state.savedMeals.filter((m) => m.id !== action.id),
      };
    case 'ADD_ACTIVITY': {
      const day = getOrCreateActivityDay(state.activityLog, action.date);
      const activityWithMode: ActivityEntry = {
        ...action.activity,
        loggedWithMode: state.preferences.activityMode ?? 'auto',
      };
      const updatedDay: DayActivity = {
        ...day,
        activities: [...day.activities, activityWithMode],
      };
      return { ...state, activityLog: upsertActivityDay(state.activityLog, updatedDay) };
    }
    case 'DELETE_ACTIVITY': {
      const day = getOrCreateActivityDay(state.activityLog, action.date);
      const updatedDay: DayActivity = {
        ...day,
        activities: day.activities.filter((a) => a.id !== action.activityId),
      };
      return { ...state, activityLog: upsertActivityDay(state.activityLog, updatedDay) };
    }
    case 'DISMISS_ACTIVITY_WARNING': {
      const day = getOrCreateActivityDay(state.activityLog, action.date);
      const updatedDay: DayActivity = {
        ...day,
        activities: day.activities.map((a) =>
          a.id === action.activityId ? { ...a, warningDismissed: true } : a,
        ),
      };
      return { ...state, activityLog: upsertActivityDay(state.activityLog, updatedDay) };
    }
    case 'SET_ACTIVITY_MODE':
      return {
        ...state,
        preferences: { ...state.preferences, activityMode: action.mode },
      };
    case 'SET_ONBOARDING_COMPLETE':
      return {
        ...state,
        preferences: { ...state.preferences, onboardingComplete: true },
      };
    case 'SET_THEME_COLOR':
      return {
        ...state,
        preferences: { ...state.preferences, themeColor: action.color },
      };
    case 'SET_DEFAULT_TAB':
      return {
        ...state,
        preferences: { ...state.preferences, defaultTab: action.tab },
      };
    case 'ADD_WATER_ENTRY': {
      const existing = state.waterLog.find((d) => d.date === action.date);
      const day: DayWater = existing
        ? { ...existing, entries: [...existing.entries, action.entry] }
        : { date: action.date, entries: [action.entry] };
      const filtered = state.waterLog.filter((d) => d.date !== action.date);
      return { ...state, waterLog: [day, ...filtered] };
    }
    case 'DELETE_WATER_ENTRY': {
      const existing = state.waterLog.find((d) => d.date === action.date);
      if (!existing) return state;
      const day: DayWater = { ...existing, entries: existing.entries.filter((e) => e.id !== action.entryId) };
      const filtered = state.waterLog.filter((d) => d.date !== action.date);
      return { ...state, waterLog: [day, ...filtered] };
    }
    case 'SET_WATER_GOAL_OVERRIDE':
      return {
        ...state,
        preferences: { ...state.preferences, waterGoalOverride: action.amount },
      };
    case 'SET_WATER_GOAL_MODE':
      return {
        ...state,
        preferences: { ...state.preferences, waterGoalMode: action.mode },
      };
    case 'SET_WATER_CREATINE':
      return {
        ...state,
        preferences: { ...state.preferences, waterCreatineAdjustment: action.enabled },
      };
    case 'SET_WATER_PRESETS':
      return {
        ...state,
        preferences: { ...state.preferences, waterPresets: action.presets },
      };
    case 'SET_SECTIONS_EXPANDED':
      return {
        ...state,
        preferences: { ...state.preferences, sectionsExpanded: action.enabled },
      };
    case 'SET_APPEARANCE_MODE':
      return {
        ...state,
        preferences: { ...state.preferences, appearanceMode: action.mode },
      };
    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.date };
    case 'REORDER_PINNED_FOODS':
      return {
        ...state,
        customFoods: state.customFoods.map((f) => {
          const idx = action.ids.indexOf(f.id);
          return idx !== -1 ? { ...f, pinnedOrder: idx } : f;
        }),
      };
    case 'REORDER_PINNED_MEALS':
      return {
        ...state,
        savedMeals: state.savedMeals.map((m) => {
          const idx = action.ids.indexOf(m.id);
          if (idx === -1) return m;
          return {
            ...m,
            pinnedOrder: { ...(m.pinnedOrder ?? {}), [action.category]: idx },
          };
        }),
      };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

type AppContextValue = State & { dispatch: React.Dispatch<Action> };

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load persisted data on mount.
  useEffect(() => {
    (async () => {
      const [entries, preferences, nutritionLog, customFoods, savedMeals, activityLog, waterLog] = await Promise.all([
        loadEntries(),
        loadPreferences(),
        loadNutritionLog(),
        loadCustomFoods(),
        loadSavedMeals(),
        loadActivityLog(),
        loadWaterLog(),
      ]);
      dispatch({ type: 'LOAD_DATA', entries, preferences, nutritionLog, customFoods, savedMeals, activityLog, waterLog });
    })();
  }, []);

  // Persist entries whenever they change (skip initial loading state).
  useEffect(() => {
    if (!state.isLoading) {
      saveEntries(state.entries);
    }
  }, [state.entries, state.isLoading]);

  // Persist preferences whenever they change.
  useEffect(() => {
    if (!state.isLoading) {
      savePreferences(state.preferences);
    }
  }, [state.preferences, state.isLoading]);

  // Persist nutrition log whenever it changes.
  useEffect(() => {
    if (!state.isLoading) {
      saveNutritionLog(state.nutritionLog);
    }
  }, [state.nutritionLog, state.isLoading]);

  // Persist custom foods whenever they change.
  useEffect(() => {
    if (!state.isLoading) {
      saveCustomFoods(state.customFoods);
    }
  }, [state.customFoods, state.isLoading]);

  // Persist saved meals whenever they change.
  useEffect(() => {
    if (!state.isLoading) {
      saveSavedMeals(state.savedMeals);
    }
  }, [state.savedMeals, state.isLoading]);

  // Persist activity log whenever it changes.
  useEffect(() => {
    if (!state.isLoading) {
      saveActivityLog(state.activityLog);
    }
  }, [state.activityLog, state.isLoading]);

  // Persist water log whenever it changes.
  useEffect(() => {
    if (!state.isLoading) {
      saveWaterLog(state.waterLog);
    }
  }, [state.waterLog, state.isLoading]);

  // Auto-backup: silently keep a local backup file in sync after every state
  // change (debounced). Used for same-session/same-Codespace quick recovery.
  // Errors are swallowed — auto-backup is best-effort and must never crash.
  useEffect(() => {
    if (state.isLoading) return;
    const timer = setTimeout(() => {
      writeAutoBackup({
        entries: state.entries,
        preferences: state.preferences,
        nutritionLog: state.nutritionLog,
        customFoods: state.customFoods,
        savedMeals: state.savedMeals,
        activityLog: state.activityLog,
        waterLog: state.waterLog,
      }).catch(() => {});
    }, 3000);
    return () => clearTimeout(timer);
  }, [
    state.isLoading,
    state.entries,
    state.preferences,
    state.nutritionLog,
    state.customFoods,
    state.savedMeals,
    state.activityLog,
    state.waterLog,
  ]);

  return (
    <AppContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
