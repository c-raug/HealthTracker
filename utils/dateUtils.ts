/** Returns today's date as "YYYY-MM-DD" in the device's local timezone. */
export function getToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Formats "YYYY-MM-DD" to a long human-readable string, e.g. "Monday, February 27, 2026". */
export function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Formats "YYYY-MM-DD" to a short label, e.g. "Feb 27". Used for chart x-axis. */
export function formatShortDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Returns the ISO week string for a given "YYYY-MM-DD" date, e.g. "2026-W15".
 * ISO week 1 is the week containing the first Thursday of the year.
 */
export function getISOWeekString(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  // Set to the nearest Thursday (ISO week is defined by Thursday)
  const thursday = new Date(date);
  thursday.setDate(date.getDate() + (4 - (date.getDay() || 7)));
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${thursday.getFullYear()}-W${weekNum}`;
}

/**
 * Returns the Monday of the ISO week for a given "YYYY-MM-DD" date.
 */
export function getISOWeekMonday(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay() || 7; // Convert Sunday (0) to 7
  const monday = new Date(date);
  monday.setDate(date.getDate() - (dayOfWeek - 1));
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Adds (or subtracts) a number of days from "YYYY-MM-DD" and returns the new "YYYY-MM-DD". */
export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
