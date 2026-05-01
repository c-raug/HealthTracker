import { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Clipboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../constants/theme';
import { saveBackup } from '../storage/backupStorage';
import { CRASH_LOG_KEY } from '../utils/crashReporting';

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
    paddingVertical: Spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...Typography.h2,
    color: colors.text,
    marginLeft: Spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  toggleOptionActive: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  toggleText: {
    ...Typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: colors.primary,
  },
});

export default function AppSettingsModal() {
  const { preferences, entries, nutritionLog, customFoods, savedMeals, activityLog, waterLog, dispatch } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);
  const isDark = colors.card === '#2C2C2E';
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [crashLog, setCrashLog] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(CRASH_LOG_KEY).then((val) => setCrashLog(val));
  }, []);

  const setUnit = (unit: 'lbs' | 'kg') => dispatch({ type: 'SET_UNIT', unit });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Settings</Text>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollContent} ref={scrollRef} keyboardShouldPersistTaps="handled">
          {/* Weight Unit */}
          <View style={styles.card}>
            <LinearGradient colors={isDark ? ['#3A3A3C', '#2C2C2E'] : ['#FFFFFF', '#F4F4F8']} style={StyleSheet.absoluteFill} />
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
            <LinearGradient colors={isDark ? ['#3A3A3C', '#2C2C2E'] : ['#FFFFFF', '#F4F4F8']} style={StyleSheet.absoluteFill} />
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
            <LinearGradient colors={isDark ? ['#3A3A3C', '#2C2C2E'] : ['#FFFFFF', '#F4F4F8']} style={StyleSheet.absoluteFill} />
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

          {/* Debug Info */}
          <View style={styles.card}>
            <LinearGradient colors={isDark ? ['#3A3A3C', '#2C2C2E'] : ['#FFFFFF', '#F4F4F8']} style={StyleSheet.absoluteFill} />
            <Text style={styles.settingLabel}>Debug Info</Text>
            <Text style={styles.settingDescription}>
              Last recorded crash log. Share this when reporting a bug.
            </Text>
            {crashLog ? (
              <>
                <ScrollView
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: Radius.sm,
                    padding: Spacing.sm,
                    maxHeight: 140,
                    marginBottom: Spacing.sm,
                  }}
                  showsVerticalScrollIndicator
                >
                  <Text style={{ ...Typography.small, color: colors.textSecondary, fontFamily: 'monospace' }}>
                    {crashLog}
                  </Text>
                </ScrollView>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  <TouchableOpacity
                    style={[styles.toggleOption, styles.toggleOptionActive, { flex: 1, paddingVertical: Spacing.sm }]}
                    onPress={() => {
                      Clipboard.setString(crashLog);
                      Alert.alert('Copied', 'Crash log copied to clipboard.');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.toggleText, styles.toggleTextActive]}>Copy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleOption, { flex: 1, paddingVertical: Spacing.sm, backgroundColor: colors.dangerLight }]}
                    onPress={() => {
                      Alert.alert('Clear Log', 'Delete the stored crash log?', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Clear',
                          style: 'destructive',
                          onPress: async () => {
                            await AsyncStorage.removeItem(CRASH_LOG_KEY);
                            setCrashLog(null);
                          },
                        },
                      ]);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.toggleText, { color: colors.danger }]}>Clear</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={{ ...Typography.small, color: colors.textSecondary }}>No crash log on record.</Text>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
