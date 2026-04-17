import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import FeedbackSection, { FeedbackSectionHandle } from '../../components/settings/FeedbackSection';

const makeStyles = (colors: typeof LightColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: Spacing.md,
  },
  collapsibleCard: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  navRow: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  navRowText: {
    ...Typography.h3,
    color: colors.text,
  },
  footer: {
    ...Typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
});

export default function SettingsScreen() {
  const colors = useColors();
  const styles = makeStyles(colors);

  const { focusFeedback } = useLocalSearchParams<{ focusFeedback?: string }>();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const feedbackRef = useRef<FeedbackSectionHandle>(null);
  const [feedbackSectionY, setFeedbackSectionY] = useState(0);

  useEffect(() => {
    if (focusFeedback) {
      router.setParams({ focusFeedback: undefined });
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: feedbackSectionY, animated: true });
      }, 150);
      setTimeout(() => {
        feedbackRef.current?.focus();
      }, 350);
    }
  }, [focusFeedback]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} ref={scrollRef} keyboardShouldPersistTaps="handled">
        {/* Appearance → tappable row → appearance-modal */}
        <TouchableOpacity
          style={styles.navRow}
          onPress={() => router.push('/appearance-modal')}
          activeOpacity={0.7}
        >
          <Text style={styles.navRowText}>Appearance</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* 6. App Settings → sub-screen */}
        <TouchableOpacity
          style={styles.navRow}
          onPress={() => router.push('/app-settings-modal')}
          activeOpacity={0.7}
        >
          <Text style={styles.navRowText}>App Settings</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* 7. Send Feedback */}
        <View
          style={styles.collapsibleCard}
          onLayout={(e) => setFeedbackSectionY(e.nativeEvent.layout.y)}
        >
          <View style={{ padding: Spacing.md }}>
            <FeedbackSection ref={feedbackRef} onFocusInput={() => {
              setTimeout(() => {
                scrollRef.current?.scrollTo({ y: feedbackSectionY, animated: true });
              }, 150);
            }} />
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>HealthTracker v{(require('../../app.json') as { expo: { version: string } }).expo.version}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
