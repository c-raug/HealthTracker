import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp } from '../../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';

const makeStyles = (colors: typeof LightColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: Spacing.md,
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
  const { preferences, dispatch } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);

  const setUnit = (unit: 'lbs' | 'kg') => dispatch({ type: 'SET_UNIT', unit });

  return (
    <View style={styles.container}>
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
          Track your weight daily and visualize your progress over time.
        </Text>
      </View>
    </View>
  );
}
