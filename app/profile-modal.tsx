import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Modal,
  TextInput,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useApp } from '../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../constants/theme';
import { UserProfile, Sex, ActivityMode, ActivityLevel } from '../types';
import InfoModal from '../components/InfoModal';

const ACTIVITY_LEVEL_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'lightly_active', label: 'Lightly Active' },
  { value: 'moderately_active', label: 'Moderately Active' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very Active' },
];

const ACTIVITY_MODE_LABELS: Record<ActivityMode, string> = {
  auto: 'Auto',
  manual: 'Manual',
  smartwatch: 'Smart Watch',
};

const ACTIVITY_MODE_INFO: Record<ActivityMode, { title: string; description: string }> = {
  auto: {
    title: 'Auto Mode',
    description:
      "Your activity level multiplier is built into your daily calorie target. Exercise you log on the Activity tab is tracked for reference only — it won't increase your calorie target. Best for people with a consistent activity routine.",
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

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
    scrollContent: {
      padding: Spacing.md,
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
    inputLabel: {
      ...Typography.small,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    row: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    input: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      ...Typography.body,
      color: colors.text,
    },
    inputGroup: {
      flex: 1,
    },
    toggle: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: Radius.sm,
      padding: 3,
      gap: 3,
      marginBottom: Spacing.md,
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
      ...Typography.small,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    toggleTextActive: {
      color: colors.white,
    },
    dobBtn: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      justifyContent: 'center',
    },
    dobBtnText: {
      ...Typography.body,
      color: colors.text,
    },
    dobPlaceholder: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    activityGrid: {
      gap: Spacing.xs,
      marginBottom: Spacing.md,
    },
    activityBtn: {
      backgroundColor: colors.background,
      borderRadius: Radius.sm,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      alignItems: 'center',
    },
    activityBtnActive: {
      backgroundColor: colors.primary,
    },
    activityBtnText: {
      ...Typography.small,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    activityBtnTextActive: {
      color: colors.white,
    },
    modeRow: {
      gap: Spacing.xs,
      marginBottom: Spacing.md,
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
    saveRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    cancelBtn: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: Radius.sm,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
    },
    cancelBtnText: {
      ...Typography.body,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    saveBtn: {
      flex: 2,
      backgroundColor: colors.primary,
      borderRadius: Radius.sm,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
    },
    saveBtnText: {
      ...Typography.body,
      color: colors.white,
      fontWeight: '600',
    },
    pickerOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    pickerSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: Radius.lg,
      borderTopRightRadius: Radius.lg,
      paddingBottom: Spacing.xl,
    },
    pickerHeader: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerDone: {
      ...Typography.body,
      color: colors.primary,
      fontWeight: '600',
    },
    iosPicker: {
      height: 200,
    },
  });

export default function ProfileModal() {
  const { preferences, dispatch } = useApp();
  const router = useRouter();
  const colors = useColors();
  const styles = makeStyles(colors);
  const systemScheme = useColorScheme();

  const resolvedScheme =
    preferences.appearanceMode === 'light'
      ? 'light'
      : preferences.appearanceMode === 'dark'
        ? 'dark'
        : (systemScheme ?? 'light');

  const profile = preferences.profile;
  const isImperial = preferences.unit === 'lbs';

  const [name, setName] = useState(profile?.name ?? '');
  const [dob, setDob] = useState<string | null>(profile?.dob ?? null);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [sex, setSex] = useState<Sex>(profile?.sex ?? 'male');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    profile?.activityLevel ?? 'moderately_active',
  );
  const [activityMode, setActivityModeState] = useState<ActivityMode>(
    preferences.activityMode ?? 'auto',
  );
  const [modeInfoModal, setModeInfoModal] = useState<{ title: string; description: string } | null>(
    null,
  );

  // Initialize height fields from profile
  useEffect(() => {
    if (profile) {
      if (profile.heightUnit === 'in') {
        setHeightFt(Math.floor(profile.heightValue / 12).toString());
        setHeightIn((profile.heightValue % 12).toString());
        setHeightCm('');
      } else {
        setHeightCm(profile.heightValue.toString());
        setHeightFt('');
        setHeightIn('');
      }
    }
  }, []);

  const handleActivityModeChange = (mode: ActivityMode) => {
    setActivityModeState(mode);
    dispatch({ type: 'SET_ACTIVITY_MODE', mode });
  };

  const handleSave = () => {
    let heightValue: number;
    let heightUnit: 'in' | 'cm';

    if (isImperial) {
      const ft = parseInt(heightFt, 10) || 0;
      const inches = parseInt(heightIn, 10) || 0;
      heightValue = ft * 12 + inches;
      heightUnit = 'in';
      if (heightValue < 1) {
        Alert.alert('Invalid Height', 'Please enter a valid height.');
        return;
      }
    } else {
      heightValue = parseFloat(heightCm) || 0;
      heightUnit = 'cm';
      if (heightValue < 1) {
        Alert.alert('Invalid Height', 'Please enter a valid height.');
        return;
      }
    }

    const updated: UserProfile = {
      name: name || undefined,
      dob: dob ?? undefined,
      sex,
      heightValue,
      heightUnit,
      activityLevel,
      weightGoal: profile?.weightGoal ?? 'maintain',
      fitnessGoal: profile?.fitnessGoal,
    };

    dispatch({ type: 'SET_PROFILE', profile: updated });
    router.back();
  };

  const handleDobChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDobPicker(false);
    if (event.type === 'set' && date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      setDob(`${y}-${m}-${d}`);
    }
  };

  const formatDob = (dobStr: string) => {
    const [y, m, d] = dobStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const dobPickerValue = (() => {
    if (dob) {
      const [y, m, d] = dob.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    const d = new Date();
    d.setFullYear(d.getFullYear() - 30);
    return d;
  })();

  const maxDob = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 10);
    return d;
  })();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      <ScrollView
        style={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: Spacing.xl }}
      >
        {/* Name */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Name (optional)</Text>
          <View style={[styles.row, { marginBottom: 0 }]}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Date of Birth */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Date of Birth</Text>
          <TouchableOpacity
            style={styles.dobBtn}
            onPress={() => setShowDobPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={dob ? styles.dobBtnText : styles.dobPlaceholder}>
              {dob ? formatDob(dob) : 'Select date of birth'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sex */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Sex</Text>
          <View style={[styles.toggle, { marginBottom: 0 }]}>
            <TouchableOpacity
              style={[styles.toggleOption, sex === 'male' && styles.toggleOptionActive]}
              onPress={() => setSex('male')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, sex === 'male' && styles.toggleTextActive]}>
                Male
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleOption, sex === 'female' && styles.toggleOptionActive]}
              onPress={() => setSex('female')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, sex === 'female' && styles.toggleTextActive]}>
                Female
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Height */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Height</Text>
          {isImperial ? (
            <View style={[styles.row, { marginBottom: 0 }]}>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  value={heightFt}
                  onChangeText={setHeightFt}
                  keyboardType="number-pad"
                  placeholder="ft"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  value={heightIn}
                  onChangeText={setHeightIn}
                  keyboardType="number-pad"
                  placeholder="in"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
          ) : (
            <View style={[styles.row, { marginBottom: 0 }]}>
              <TextInput
                style={styles.input}
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="decimal-pad"
                placeholder="cm"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          )}
        </View>

        {/* Activity Tracking Mode */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Activity Tracking Mode</Text>
          <View style={[styles.modeRow, { marginBottom: 0 }]}>
            {(['auto', 'manual', 'smartwatch'] as ActivityMode[]).map((mode) => (
              <View key={mode} style={styles.modePillRow}>
                <TouchableOpacity
                  style={[styles.modePill, activityMode === mode && styles.modePillActive]}
                  onPress={() => handleActivityModeChange(mode)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.modePillText,
                      activityMode === mode && styles.modePillTextActive,
                    ]}
                  >
                    {ACTIVITY_MODE_LABELS[mode]}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setModeInfoModal(ACTIVITY_MODE_INFO[mode])}
                  style={styles.modeInfoIcon}
                  hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                  activeOpacity={0.6}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Activity Level — only shown in Auto mode */}
        {activityMode === 'auto' && (
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Activity Level</Text>
            <View style={[styles.activityGrid, { marginBottom: 0 }]}>
              {ACTIVITY_LEVEL_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.activityBtn,
                    activityLevel === opt.value && styles.activityBtnActive,
                  ]}
                  onPress={() => setActivityLevel(opt.value)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.activityBtnText,
                      activityLevel === opt.value && styles.activityBtnTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Save / Cancel */}
        <View style={styles.card}>
          <View style={styles.saveRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* DOB Picker — Android */}
      {Platform.OS === 'android' && showDobPicker && (
        <DateTimePicker
          value={dobPickerValue}
          mode="date"
          display="default"
          maximumDate={maxDob}
          onChange={handleDobChange}
        />
      )}

      {/* DOB Picker — iOS */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showDobPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDobPicker(false)}
        >
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerSheet}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowDobPicker(false)}>
                  <Text style={styles.pickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={dobPickerValue}
                mode="date"
                display="spinner"
                maximumDate={maxDob}
                onChange={handleDobChange}
                style={styles.iosPicker}
                themeVariant={resolvedScheme}
              />
            </View>
          </View>
        </Modal>
      )}

      <InfoModal
        visible={modeInfoModal !== null}
        title={modeInfoModal?.title ?? ''}
        description={modeInfoModal?.description ?? ''}
        onClose={() => setModeInfoModal(null)}
      />
    </SafeAreaView>
  );
}
