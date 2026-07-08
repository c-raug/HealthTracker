import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightColors, Typography, Spacing, Radius } from '@/constants/theme';
import { captureCrash, CRASH_LOG_KEY } from '@/utils/crashReporting';

// Functional fallback component — lives outside the class so it can use hooks
// if needed in the future. Uses LightColors directly because the error boundary
// is a last-resort UI that renders before ThemeContext is available.
function ErrorFallback({
  error,
  onRetry,
}: {
  error: Error | null;
  onRetry: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>
          The app hit an unexpected error. Your data is safe.
        </Text>
        {error?.message ? (
          <ScrollView style={styles.errorBox} showsVerticalScrollIndicator={false}>
            <Text style={styles.errorText}>{error.message}</Text>
          </ScrollView>
        ) : null}
        <TouchableOpacity style={styles.button} onPress={onRetry} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: LightColors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  title: {
    ...Typography.h2,
    color: LightColors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: LightColors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  errorBox: {
    backgroundColor: LightColors.dangerLight,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    maxHeight: 120,
    width: '100%',
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.small,
    color: LightColors.danger,
    fontFamily: 'monospace' as const,
  },
  button: {
    backgroundColor: LightColors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  buttonText: {
    ...Typography.body,
    color: LightColors.white,
    fontWeight: '600' as const,
  },
});

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const log = {
      message: error.message,
      stack: error.stack ?? '',
      componentStack: errorInfo.componentStack ?? '',
      timestamp: new Date().toISOString(),
    };
    try {
      await AsyncStorage.setItem(CRASH_LOG_KEY, JSON.stringify(log));
    } catch {
      // AsyncStorage write failed — continue silently.
    }
    captureCrash(error, { componentStack: errorInfo.componentStack ?? '' });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}
