import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { calculateDailyCalories, ageFromDob } from '../../utils/tdeeCalculation';
import { ActivityMode } from '../../types';
import ProfileSection from '../../components/settings/ProfileSection';
import MacroSection from '../../components/settings/MacroSection';
import InfoModal from '../../components/InfoModal';

const ACTIVITY_MODE_INFO: Record<ActivityMode, { title: string; description: string }> = {
  auto: {
    title: 'Auto Mode',
    description:
      'Your activity level multiplier is built into your daily calorie target. Exercise you log on the Activity tab is tracked for reference only — it won\'t increase your calorie target. Best for people with a consistent activity routine.',
  },
  manual: {
    title: 'Manual Mode',
    description:
      'Your base calorie target assumes a sedentary lifestyle. Every workout and step count you log on the Activity tab is added directly to your daily calorie target. Best for people with variable activity day to day.',
  },
  smartwatch: {
    title: 'Smart Watch Mode',
    description:
      'Your base calorie target assumes a sedentary lifestyle. Enter the total calories burned from your smart watch each day on the Activity tab, and that amount is added to your calorie target.',
  },
};

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
    ...Typography.small,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  sectionHeader: {
    ...Typography.small,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
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
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleText: {
    ...Typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: colors.white,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  versionText: {
    ...Typography.small,
    color: colors.textSecondary,
  },
  // Activity mode styles
  activityModeBody: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  modeDescription: {
    ...Typography.small,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  modeRow: {
    gap: Spacing.xs,
  },
  modePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  modePill: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  modePillActive: {
    backgroundColor: colors.primary,
  },
  modePillText: {
    ...Typography.small,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modePillTextActive: {
    color: colors.white,
  },
  modeInfoIcon: {
    padding: Spacing.xs,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: colors.dangerLight,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  warningText: {
    ...Typography.small,
    color: colors.danger,
    flex: 1,
    lineHeight: 17,
  },
  infoBanner: {
    backgroundColor: colors.primaryLight,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  infoText: {
    ...Typography.small,
    color: colors.primary,
    lineHeight: 17,
  },
});

export default function SettingsScreen() {
  const { preferences, entries, dispatch } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);

  const [profileExpanded, setProfileExpanded] = useState(true);
  const [activityModeExpanded, setActivityModeExpanded] = useState(true);
  const [macroExpanded, setMacroExpanded] = useState(true);
  const [modeInfoModal, setModeInfoModal] = useState<{ title: string; description: string } | null>(null);

  const setUnit = (unit: 'lbs' | 'kg') => dispatch({ type: 'SET_UNIT', unit });

  const activityMode: ActivityMode = preferences.activityMode ?? 'manual';

  const setActivityMode = (mode: ActivityMode) => {
    dispatch({ type: 'SET_ACTIVITY_MODE', mode });
  };

  // Compute goalCalories (same pattern as nutrition.tsx)
  const profile = preferences.profile;
  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const latestWeight = sortedEntries[0];

  const resolvedAge = profile?.dob
    ? ageFromDob(profile.dob)
    : (profile?.age ?? null);

  const goalCalories: number | null =
    profile && latestWeight && resolvedAge !== null
      ? calculateDailyCalories(
          latestWeight.weight,
          latestWeight.unit,
          profile.heightValue,
          profile.heightUnit,
          resolvedAge,
          profile.sex,
          profile.activityLevel,
          profile.weightGoal,
          activityMode,
        )
      : null;

  return (
    <ScrollView style={styles.container}>
      {/* Profile — collapsible */}
      <View style={styles.collapsibleCard}>
        <TouchableOpacity
          style={styles.collapsibleHeader}
          onPress={() => setProfileExpanded((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={styles.collapsibleHeaderLeft}>
            <Ionicons
              name={profileExpanded ? 'chevron-down' : 'chevron-forward'}
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.sectionTitle}>Profile</Text>
          </View>
        </TouchableOpacity>
        {profileExpanded && <ProfileSection activityMode={activityMode} />}
      </View>

      {/* Activity Tracking Mode — collapsible */}
      <View style={styles.collapsibleCard}>
        <TouchableOpacity
          style={styles.collapsibleHeader}
          onPress={() => setActivityModeExpanded((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={styles.collapsibleHeaderLeft}>
            <Ionicons
              name={activityModeExpanded ? 'chevron-down' : 'chevron-forward'}
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.sectionTitle}>Activity Tracking</Text>
          </View>
        </TouchableOpacity>
        {activityModeExpanded && (
          <View style={styles.activityModeBody}>
            <Text style={styles.modeDescription}>
              Choose how your activity is factored into your calorie target.
            </Text>
            <View style={styles.modeRow}>
              {(['auto', 'manual', 'smartwatch'] as ActivityMode[]).map((mode) => {
                const labels: Record<ActivityMode, string> = {
                  auto: 'Auto',
                  manual: 'Manual',
                  smartwatch: 'Smart Watch',
                };
                return (
                  <View key={mode} style={styles.modePillRow}>
                    <TouchableOpacity
                      style={[styles.modePill, activityMode === mode && styles.modePillActive]}
                      onPress={() => setActivityMode(mode)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.modePillText, activityMode === mode && styles.modePillTextActive]}>
                        {labels[mode]}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setModeInfoModal(ACTIVITY_MODE_INFO[mode])}
                      style={styles.modeInfoIcon}
                      hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                      activeOpacity={0.6}
                    >
                      <Ionicons name="information-circle-outline" size={17} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            {activityMode === 'auto' && (
              <View style={styles.warningBanner}>
                <Ionicons name="warning-outline" size={14} color={colors.danger} />
                <Text style={styles.warningText}>
                  In Auto mode, activities logged on the Activity tab are for reference only and do not count toward your calorie target.
                </Text>
              </View>
            )}
            {activityMode === 'manual' && (
              <View style={styles.infoBanner}>
                <Text style={styles.infoText}>
                  Log all your workouts on the Activity tab for an accurate calorie target. No activity is assumed in your base calculation.
                </Text>
              </View>
            )}
            {activityMode === 'smartwatch' && (
              <View style={styles.infoBanner}>
                <Text style={styles.infoText}>
                  Enter your smart watch's daily calorie burn on the Activity tab. No activity is assumed in your base calculation.
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Macro settings — collapsible */}
      <View style={styles.collapsibleCard}>
        <TouchableOpacity
          style={styles.collapsibleHeader}
          onPress={() => setMacroExpanded((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={styles.collapsibleHeaderLeft}>
            <Ionicons
              name={macroExpanded ? 'chevron-down' : 'chevron-forward'}
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.sectionTitle}>Macros</Text>
          </View>
        </TouchableOpacity>
        {macroExpanded && <MacroSection goalCalories={goalCalories} />}
      </View>

      {/* Unit preference */}
      <Text style={styles.sectionHeader}>Units</Text>
      <View style={styles.card}>
        <Text style={styles.settingLabel}>Weight Unit</Text>
        <Text style={styles.settingDescription}>
          Applies to new entries and the history chart. Existing entries keep
          their original unit.
        </Text>
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[
              styles.toggleOption,
              preferences.unit === 'lbs' && styles.toggleOptionActive,
            ]}
            onPress={() => setUnit('lbs')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleText,
                preferences.unit === 'lbs' && styles.toggleTextActive,
              ]}
            >
              lbs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleOption,
              preferences.unit === 'kg' && styles.toggleOptionActive,
            ]}
            onPress={() => setUnit('kg')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleText,
                preferences.unit === 'kg' && styles.toggleTextActive,
              ]}
            >
              kg
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* About section */}
      <Text style={styles.sectionHeader}>About</Text>
      <View style={styles.card}>
        <View style={styles.aboutRow}>
          <Text style={styles.settingLabel}>HealthTracker</Text>
          <Text style={styles.versionText}>v1.0.0</Text>
        </View>
        <Text style={styles.settingDescription}>
          Track your weight and nutrition daily and visualize your progress over time.
        </Text>
      </View>

      {/* Activity mode info modal */}
      <InfoModal
        visible={modeInfoModal !== null}
        title={modeInfoModal?.title ?? ''}
        description={modeInfoModal?.description ?? ''}
        onClose={() => setModeInfoModal(null)}
      />
    </ScrollView>
  );
}
