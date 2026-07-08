// Crash reporting utility — wraps Sentry with a graceful fallback.
//
// SETUP: Replace SENTRY_DSN with your project's DSN from sentry.io, then run:
//   npm install @sentry/react-native --legacy-peer-deps
//
// Until SENTRY_DSN is set, the app captures errors locally (AsyncStorage only)
// and Sentry calls are silently no-ops — no package needed at compile time.

export const SENTRY_DSN = 'https://94fe48e74add1c8ad27e2d9e440552e3@o4511175437647872.ingest.us.sentry.io/4511175443480576';

export const CRASH_LOG_KEY = '@crash_log';

let _initialized = false;

/**
 * Call once at app startup (before rendering). Safe to call when SENTRY_DSN is
 * empty — does nothing.
 */
export function initCrashReporting(): void {
  if (!SENTRY_DSN) return;
  try {
    // Dynamic require so the app compiles without @sentry/react-native installed.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Sentry = require('@sentry/react-native');
    Sentry.init({
      dsn: SENTRY_DSN,
      enableNative: true,
      enableNativeCrashHandling: true,
      tracesSampleRate: 0.2,
    });
    _initialized = true;
  } catch {
    // Sentry not installed — local AsyncStorage logging only.
  }
}

/**
 * Report a JS exception to Sentry. No-op when Sentry is not configured.
 */
export function captureCrash(error: Error, extras?: Record<string, unknown>): void {
  if (!_initialized || !SENTRY_DSN) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Sentry = require('@sentry/react-native');
    Sentry.captureException(error, { extra: extras });
  } catch {
    // Never throw from a crash reporter.
  }
}
