import React, { createContext, useContext, useRef, useState, ReactNode } from 'react';

export interface ToastMessage {
  id: number;
  text: string;
  emoji?: string;
}

interface ToastContextValue {
  showToast: (text: string, emoji?: string) => void;
  current: ToastMessage | null;
  dismiss: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ToastMessage | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(text: string, emoji?: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    const id = nextId++;
    setCurrent({ id, text, emoji });
    timerRef.current = setTimeout(() => {
      setCurrent(null);
    }, 3000);
  }

  function dismiss() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrent(null);
  }

  return (
    <ToastContext.Provider value={{ showToast, current, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
