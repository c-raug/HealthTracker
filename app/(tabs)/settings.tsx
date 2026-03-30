import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import ProfileCard from '../../components/profile/ProfileCard';
import BadgesSection from '../../components/profile/BadgesSection';
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
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  collapsibleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.h3,
    color: colors.text,
  },
  settingLabel: {
    ...Typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  settingDescription: {
    ...Typography.small,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: Radius.sm,
    padding: 3,
    gap: 3,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.sm - 2,
  },
  toggleOptionActive: {
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    ...Typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: colors.white,
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
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: Spacing.md,
    marginHorizontal: Spacing.md,
  },
  footer: {
    ...Typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
});

export default function SettingsScreen() {
  const { dispatch } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);

  const { focusActivityMode, focusFeedback } = useLocalSearchParams<{ focusActivityMode?: string; focusFeedback?: string }>();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const feedbackRef = useRef<FeedbackSectionHandle>(null);
  const [feedbackSectionY, setFeedbackSectionY] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (focusActivityMode) {
        router.setParams({ focusActivityMode: undefined });
        router.push('/nutrition-goals-modal');
      } else {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focusActivityMode]),
  );

  // When deep-linked with focusFeedback, scroll to and focus the feedback section inline
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
        {/* 1. Profile Card — always visible, tappable to edit */}
        <ProfileCard />

        {/* 2. Badges — collapsible */}
        <BadgesSection />

        {/* 3. Nutrition Goals → tappable row → nutrition-goals-modal */}
        <TouchableOpacity
          style={styles.navRow}
          onPress={() => router.push('/nutrition-goals-modal')}
          activeOpacity={0.7}
        >
          <Text style={styles.navRowText}>Nutrition Goals</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* 4. Appearance → tappable row → appearance-modal */}
        <TouchableOpacity
          style={styles.navRow}
          onPress={() => router.push('/appearance-modal')}
          activeOpacity={0.7}
        >
          <Text style={styles.navRowText}>Appearance</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* 5. App Settings → sub-screen */}
        <TouchableOpacity
          style={styles.navRow}
          onPress={() => router.push('/app-settings-modal')}
          activeOpacity={0.7}
        >
          <Text style={styles.navRowText}>App Settings</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* 6. Send Feedback */}
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
