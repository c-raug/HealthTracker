import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { calculateDailyCalories } from '../../utils/tdeeCalculation';
import ProfileSection from '../../components/settings/ProfileSection';
import MacroSection from '../../components/settings/MacroSection';

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
});

export default function SettingsScreen() {
  const { preferences, entries, dispatch } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);

  const [profileExpanded, setProfileExpanded] = useState(true);
  const [macroExpanded, setMacroExpanded] = useState(true);

  const setUnit = (unit: 'lbs' | 'kg') => dispatch({ type: 'SET_UNIT', unit });

  // Compute goalCalories (same pattern as nutrition.tsx)
  const profile = preferences.profile;
  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const latestWeight = sortedEntries[0];
  const goalCalories: number | null =
    profile && latestWeight
      ? calculateDailyCalories(
          latestWeight.weight,
          latestWeight.unit,
          profile.heightValue,
          profile.heightUnit,
          profile.age,
          profile.sex,
          profile.activityLevel,
          profile.weightGoal,
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
        {profileExpanded && <ProfileSection />}
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
    </ScrollView>
  );
}
