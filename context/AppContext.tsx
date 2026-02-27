import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';
import { WeightEntry, UserPreferences } from '../types';
import {
  loadEntries,
  saveEntries,
  loadPreferences,
  savePreferences,
} from '../storage/storage';

// ─── State & Actions ─────────────────────────────────────────────────────────

type State = {
  entries: WeightEntry[];
  preferences: UserPreferences;
  isLoading: boolean;
};

type Action =
  | { type: 'LOAD_DATA'; entries: WeightEntry[]; preferences: UserPreferences }
  | { type: 'UPSERT_ENTRY'; entry: WeightEntry }
  | { type: 'DELETE_ENTRY'; id: string }
  | { type: 'SET_UNIT'; unit: 'lbs' | 'kg' };

const initialState: State = {
  entries: [],
  preferences: { unit: 'lbs' },
  isLoading: true,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_DATA':
      return {
        ...state,
        entries: action.entries,
        preferences: action.preferences,
        isLoading: false,
      };
    case 'UPSERT_ENTRY': {
      // Replace any existing entry for the same date, then prepend the new one.
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
      const [entries, preferences] = await Promise.all([
        loadEntries(),
        loadPreferences(),
      ]);
      dispatch({ type: 'LOAD_DATA', entries, preferences });
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
