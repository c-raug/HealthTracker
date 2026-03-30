import { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../constants/theme';
import { saveBackup } from '../storage/backupStorage';

const makeStyles = (colors: typeof LightColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...Typography.h3,
    color: colors.text,
    marginLeft: Spacing.sm,
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
});

export default function AppSettingsModal() {
  const { preferences, entries, nutritionLog, customFoods, savedMeals, activityLog, waterLog, dispatch } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const setUnit = (unit: 'lbs' | 'kg') => dispatch({ type: 'SET_UNIT', unit });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Settings</Text>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollContent} ref={scrollRef} keyboardShouldPersistTaps="handled">
          {/* Default Tab */}
          <View style={styles.card}>
            <Text style={styles.settingLabel}>Default Tab</Text>
            <Text style={[styles.settingDescription, { marginBottom: Spacing.sm }]}>
              Choose which tab opens when you launch the app.
            </Text>
            <View style={styles.toggle}>
              {(['weight', 'nutrition', 'activity'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.toggleOption, (preferences.defaultTab ?? 'nutrition') === tab && styles.toggleOptionActive]}
                  onPress={() => dispatch({ type: 'SET_DEFAULT_TAB', tab })}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.toggleText, (preferences.defaultTab ?? 'nutrition') === tab && styles.toggleTextActive]}>
                    {tab === 'weight' ? 'Weight' : tab === 'nutrition' ? 'Nutrition' : 'Activity'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Weight Unit */}
          <View style={styles.card}>
            <Text style={styles.settingLabel}>Weight Unit</Text>
            <Text style={[styles.settingDescription, { marginBottom: Spacing.sm }]}>
              Applies to new entries and the history chart. Existing entries keep their original unit.
            </Text>
            <View style={styles.toggle}>
              <TouchableOpacity
                style={[styles.toggleOption, preferences.unit === 'lbs' && styles.toggleOptionActive]}
                onPress={() => setUnit('lbs')}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, preferences.unit === 'lbs' && styles.toggleTextActive]}>lbs</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleOption, preferences.unit === 'kg' && styles.toggleOptionActive]}
                onPress={() => setUnit('kg')}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, preferences.unit === 'kg' && styles.toggleTextActive]}>kg</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Expand sections by default */}
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: Spacing.md }}>
                <Text style={[styles.settingLabel, { marginBottom: Spacing.xs }]}>Expand sections by default</Text>
                <Text style={[styles.settingDescription, { marginBottom: 0 }]}>
                  When on, meal categories start expanded on the Nutrition tab.
                </Text>
              </View>
              <View style={[styles.toggle, { width: 100 }]}>
                {([false, true] as const).map((val) => (
                  <TouchableOpacity
                    key={String(val)}
                    style={[styles.toggleOption, (preferences.sectionsExpanded ?? false) === val && styles.toggleOptionActive]}
                    onPress={() => dispatch({ type: 'SET_SECTIONS_EXPANDED', enabled: val })}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.toggleText, (preferences.sectionsExpanded ?? false) === val && styles.toggleTextActive]}>
                      {val ? 'On' : 'Off'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Data Backup */}
          <View style={styles.card}>
            <Text style={styles.settingLabel}>Data Backup</Text>
            <Text style={styles.settingDescription}>
              Save all app data to a file that persists across reinstalls.
            </Text>
            <TouchableOpacity
              style={[styles.toggleOption, styles.toggleOptionActive, { paddingVertical: Spacing.sm }]}
              onPress={async () => {
                try {
                  await saveBackup({ entries, preferences, nutritionLog, customFoods, savedMeals, activityLog, waterLog });
                  Alert.alert('Success', 'Data saved successfully.');
                } catch {
                  Alert.alert('Error', 'Failed to save data.');
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, styles.toggleTextActive]}>Save Data</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
