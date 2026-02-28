import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
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
} from '../../types';

const ACTIVITY_LABELS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'lightly_active', label: 'Lightly Active' },
  { value: 'moderately_active', label: 'Moderately Active' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very Active' },
];

const GOAL_LABELS: { value: WeightGoal; label: string }[] = [
  { value: 'lose_1', label: 'Lose 1 lb/wk' },
  { value: 'lose_0.5', label: 'Lose 0.5 lb/wk' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'gain_0.5', label: 'Gain 0.5 lb/wk' },
  { value: 'gain_1', label: 'Gain 1 lb/wk' },
];

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
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
    optionBtn: {
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
  });

export default function ProfileSection() {
  const { preferences, dispatch } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);
  const profile = preferences.profile;

  const [age, setAge] = useState(profile?.age?.toString() ?? '');
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

  const isImperial = preferences.unit === 'lbs';

  // Initialize height fields from profile
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

  const buildAndSave = (
    ageOverride: string,
    sexOverride: Sex,
    ftOverride: string,
    inOverride: string,
    cmOverride: string,
    actOverride: ActivityLevel,
    goalOverride: WeightGoal,
  ) => {
    const ageNum = parseInt(ageOverride, 10);
    if (!ageNum || ageNum < 1 || ageNum > 120) return;

    let heightValue: number;
    let heightUnit: 'in' | 'cm';

    if (isImperial) {
      const ft = parseInt(ftOverride, 10) || 0;
      const inches = parseInt(inOverride, 10) || 0;
      heightValue = ft * 12 + inches;
      heightUnit = 'in';
      if (heightValue < 1) return;
    } else {
      heightValue = parseFloat(cmOverride) || 0;
      heightUnit = 'cm';
      if (heightValue < 1) return;
    }

    const updated: UserProfile = {
      age: ageNum,
      sex: sexOverride,
      heightValue,
      heightUnit,
      activityLevel: actOverride,
      weightGoal: goalOverride,
    };

    dispatch({ type: 'SET_PROFILE', profile: updated });
  };

  const save = (overrides: {
    age?: string;
    sex?: Sex;
    heightFt?: string;
    heightIn?: string;
    heightCm?: string;
    activityLevel?: ActivityLevel;
    weightGoal?: WeightGoal;
  } = {}) => {
    buildAndSave(
      overrides.age ?? age,
      overrides.sex ?? sex,
      overrides.heightFt ?? heightFt,
      overrides.heightIn ?? heightIn,
      overrides.heightCm ?? heightCm,
      overrides.activityLevel ?? activityLevel,
      overrides.weightGoal ?? weightGoal,
    );
  };

  const handleAgeChange = (val: string) => {
    setAge(val);
    if (val) save({ age: val });
  };

  const handleSexChange = (val: Sex) => {
    setSex(val);
    save({ sex: val });
  };

  const handleHeightFtChange = (val: string) => {
    setHeightFt(val);
    if (val) save({ heightFt: val });
  };

  const handleHeightInChange = (val: string) => {
    setHeightIn(val);
    save({ heightIn: val });
  };

  const handleHeightCmChange = (val: string) => {
    setHeightCm(val);
    if (val) save({ heightCm: val });
  };

  const handleActivityChange = (val: ActivityLevel) => {
    setActivityLevel(val);
    save({ activityLevel: val });
  };

  const handleGoalChange = (val: WeightGoal) => {
    setWeightGoal(val);
    save({ weightGoal: val });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Profile</Text>
      <Text style={styles.description}>
        Used to calculate your daily calorie target (TDEE).
      </Text>

      {/* Age */}
      <Text style={styles.inputLabel}>Age</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={handleAgeChange}
          keyboardType="number-pad"
          placeholder="25"
          placeholderTextColor={colors.textSecondary}
        />
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
      <View style={styles.optionGrid}>
        {ACTIVITY_LABELS.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[
              styles.optionBtn,
              activityLevel === item.value && styles.optionBtnActive,
            ]}
            onPress={() => handleActivityChange(item.value)}
            activeOpacity={0.8}
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
        ))}
      </View>

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
    </View>
  );
}
