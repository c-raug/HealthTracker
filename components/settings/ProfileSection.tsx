import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import {
  useColors,
  LightColors,
  Spacing,
  Typography,
  Radius,
} from '../../constants/theme';
import {
  UserProfile,
  Sex,
  ActivityLevel,
  WeightGoal,
  ActivityMode,
} from '../../types';
import InfoModal from '../InfoModal';

const ACTIVITY_LABELS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'lightly_active', label: 'Lightly Active' },
  { value: 'moderately_active', label: 'Moderately Active' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very Active' },
];

const ACTIVITY_INFO: Record<ActivityLevel, string> = {
  sedentary: 'Little or no exercise; mostly desk work or minimal daily movement. Calorie multiplier: ×1.2',
  lightly_active: 'Light exercise 1–3 days/week, e.g. walking, light gym sessions. Calorie multiplier: ×1.375',
  moderately_active: 'Moderate exercise 3–5 days/week, e.g. jogging, cycling, gym. Calorie multiplier: ×1.55',
  active: 'Hard exercise 6–7 days/week or a physically demanding job. Calorie multiplier: ×1.725',
  very_active: 'Very hard exercise daily or twice a day; athlete-level training. Calorie multiplier: ×1.9',
};

const GOAL_LABELS: { value: WeightGoal; label: string }[] = [
  { value: 'lose_1', label: 'Lose 1 lb/wk' },
  { value: 'lose_0.5', label: 'Lose 0.5 lb/wk' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'gain_0.5', label: 'Gain 0.5 lb/wk' },
  { value: 'gain_1', label: 'Gain 1 lb/wk' },
];

interface ProfileSectionProps {
  activityMode?: ActivityMode;
}

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    card: {
      padding: Spacing.md,
    },
    label: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    description: {
      ...Typography.small,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: Spacing.md,
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
    inputLabel: {
      ...Typography.small,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
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
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 3,
    },
    toggleText: {
      ...Typography.small,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    toggleTextActive: {
      color: colors.white,
    },
    optionGrid: {
      gap: Spacing.xs,
      marginBottom: Spacing.md,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    optionBtn: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: Radius.sm,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      alignItems: 'center',
    },
    optionBtnActive: {
      backgroundColor: colors.primary,
    },
    optionText: {
      ...Typography.small,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    optionTextActive: {
      color: colors.white,
    },
    infoIcon: {
      padding: Spacing.xs,
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
    disabledNote: {
      ...Typography.small,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginTop: -Spacing.xs,
      marginBottom: Spacing.md,
    },
    pickerOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.3)',
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

export default function ProfileSection({ activityMode }: ProfileSectionProps) {
  const { preferences, dispatch } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);
  const profile = preferences.profile;

  const effectiveMode = activityMode ?? 'manual';
  const activityLevelActive = effectiveMode === 'auto';

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
  const [weightGoal, setWeightGoal] = useState<WeightGoal>(
    profile?.weightGoal ?? 'maintain',
  );
  const [fitnessGoal, setFitnessGoal] = useState(profile?.fitnessGoal ?? '');

  const [infoModal, setInfoModal] = useState<{ title: string; description: string } | null>(null);

  const isImperial = preferences.unit === 'lbs';

  useEffect(() => {
    if (profile) {
      if (profile.heightUnit === 'in') {
        const totalIn = profile.heightValue;
        setHeightFt(Math.floor(totalIn / 12).toString());
        setHeightIn((totalIn % 12).toString());
        setHeightCm('');
      } else {
        setHeightCm(profile.heightValue.toString());
        setHeightFt('');
        setHeightIn('');
      }
    }
  }, []);

  const buildAndSave = (overrides: {
    name?: string;
    dob?: string | null;
    sex?: Sex;
    heightFt?: string;
    heightIn?: string;
    heightCm?: string;
    activityLevel?: ActivityLevel;
    weightGoal?: WeightGoal;
    fitnessGoal?: string;
  } = {}) => {
    const resolvedDob = overrides.dob !== undefined ? overrides.dob : dob;

    let heightValue: number;
    let heightUnit: 'in' | 'cm';
    const ftVal = overrides.heightFt ?? heightFt;
    const inVal = overrides.heightIn ?? heightIn;
    const cmVal = overrides.heightCm ?? heightCm;

    if (isImperial) {
      const ft = parseInt(ftVal, 10) || 0;
      const inches = parseInt(inVal, 10) || 0;
      heightValue = ft * 12 + inches;
      heightUnit = 'in';
      if (heightValue < 1) return;
    } else {
      heightValue = parseFloat(cmVal) || 0;
      heightUnit = 'cm';
      if (heightValue < 1) return;
    }

    const updated: UserProfile = {
      name: (overrides.name ?? name) || undefined,
      dob: resolvedDob ?? undefined,
      sex: overrides.sex ?? sex,
      heightValue,
      heightUnit,
      activityLevel: overrides.activityLevel ?? activityLevel,
      weightGoal: overrides.weightGoal ?? weightGoal,
      fitnessGoal: (overrides.fitnessGoal ?? fitnessGoal) || undefined,
    };

    dispatch({ type: 'SET_PROFILE', profile: updated });
  };

  const handleNameChange = (val: string) => {
    setName(val);
    buildAndSave({ name: val });
  };

  const handleDobChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDobPicker(false);
    if (event.type === 'set' && date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const newDob = `${y}-${m}-${d}`;
      setDob(newDob);
      buildAndSave({ dob: newDob });
    }
  };

  const handleSexChange = (val: Sex) => {
    setSex(val);
    buildAndSave({ sex: val });
  };

  const handleHeightFtChange = (val: string) => {
    setHeightFt(val);
    if (val) buildAndSave({ heightFt: val });
  };

  const handleHeightInChange = (val: string) => {
    setHeightIn(val);
    buildAndSave({ heightIn: val });
  };

  const handleHeightCmChange = (val: string) => {
    setHeightCm(val);
    if (val) buildAndSave({ heightCm: val });
  };

  const handleActivityChange = (val: ActivityLevel) => {
    if (!activityLevelActive) return;
    setActivityLevel(val);
    buildAndSave({ activityLevel: val });
  };

  const handleGoalChange = (val: WeightGoal) => {
    setWeightGoal(val);
    buildAndSave({ weightGoal: val });
  };

  const handleFitnessGoalChange = (val: string) => {
    setFitnessGoal(val);
    buildAndSave({ fitnessGoal: val });
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
    // Default to 30 years ago
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
    <View style={styles.card}>
      <Text style={styles.label}>Profile</Text>
      <Text style={styles.description}>
        Used to calculate your daily calorie target (TDEE).
      </Text>

      {/* Name */}
      <Text style={styles.inputLabel}>Name (optional)</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={handleNameChange}
          placeholder="Your name"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="words"
          returnKeyType="done"
        />
      </View>

      {/* Date of Birth */}
      <Text style={styles.inputLabel}>Date of Birth</Text>
      <View style={styles.row}>
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
      <Text style={styles.inputLabel}>Sex</Text>
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleOption, sex === 'male' && styles.toggleOptionActive]}
          onPress={() => handleSexChange('male')}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, sex === 'male' && styles.toggleTextActive]}>
            Male
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleOption, sex === 'female' && styles.toggleOptionActive]}
          onPress={() => handleSexChange('female')}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, sex === 'female' && styles.toggleTextActive]}>
            Female
          </Text>
        </TouchableOpacity>
      </View>

      {/* Height */}
      <Text style={styles.inputLabel}>Height</Text>
      {isImperial ? (
        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              value={heightFt}
              onChangeText={handleHeightFtChange}
              keyboardType="number-pad"
              placeholder="ft"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              value={heightIn}
              onChangeText={handleHeightInChange}
              keyboardType="number-pad"
              placeholder="in"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>
      ) : (
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            value={heightCm}
            onChangeText={handleHeightCmChange}
            keyboardType="decimal-pad"
            placeholder="cm"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      )}

      {/* Activity Level */}
      <Text style={styles.inputLabel}>Activity Level</Text>
      <View style={[styles.optionGrid, !activityLevelActive && { opacity: 0.4 }]}>
        {ACTIVITY_LABELS.map((item) => (
          <View key={item.value} style={styles.optionRow}>
            <TouchableOpacity
              style={[
                styles.optionBtn,
                activityLevel === item.value && styles.optionBtnActive,
              ]}
              onPress={() => handleActivityChange(item.value)}
              activeOpacity={activityLevelActive ? 0.8 : 1}
            >
              <Text
                style={[
                  styles.optionText,
                  activityLevel === item.value && styles.optionTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setInfoModal({ title: item.label, description: ACTIVITY_INFO[item.value] })}
              style={styles.infoIcon}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              activeOpacity={0.6}
            >
              <Ionicons name="information-circle-outline" size={17} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
      {!activityLevelActive && (
        <Text style={styles.disabledNote}>
          Activity level has no effect in Manual or Smart Watch mode.
        </Text>
      )}

      {/* Weight Goal */}
      <Text style={styles.inputLabel}>Weight Goal</Text>
      <View style={styles.optionGrid}>
        {GOAL_LABELS.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[
              styles.optionBtn,
              weightGoal === item.value && styles.optionBtnActive,
            ]}
            onPress={() => handleGoalChange(item.value)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.optionText,
                weightGoal === item.value && styles.optionTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Fitness Goal */}
      <Text style={styles.inputLabel}>Fitness Goal (optional)</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={fitnessGoal}
          onChangeText={handleFitnessGoalChange}
          placeholder="e.g. Run a 5K, lose 20 lbs by summer"
          placeholderTextColor={colors.textSecondary}
          returnKeyType="done"
        />
      </View>

      {/* DOB Picker — Android inline, iOS modal */}
      {Platform.OS === 'android' && showDobPicker && (
        <DateTimePicker
          value={dobPickerValue}
          mode="date"
          display="default"
          maximumDate={maxDob}
          onChange={handleDobChange}
        />
      )}
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
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Info modal */}
      <InfoModal
        visible={infoModal !== null}
        title={infoModal?.title ?? ''}
        description={infoModal?.description ?? ''}
        onClose={() => setInfoModal(null)}
      />
    </View>
  );
}
