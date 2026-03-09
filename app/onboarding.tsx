import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useApp } from '../context/AppContext';
import { useColors, LightColors, Typography, Spacing, Radius } from '../constants/theme';
import {
  Sex,
  ActivityLevel,
  WeightGoal,
  MacroPreset,
  MacroSplit,
  UserProfile,
  WeightEntry,
} from '../types';
import { generateId } from '../utils/generateId';
import { getToday } from '../utils/dateUtils';

const TOTAL_STEPS = 5;

const ACTIVITY_LABELS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'lightly_active', label: 'Lightly Active' },
  { value: 'moderately_active', label: 'Moderately Active' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very Active' },
];

const GOAL_LABELS_LBS: { value: WeightGoal; label: string }[] = [
  { value: 'lose_2', label: 'Lose 2 lb/wk' },
  { value: 'lose_1.5', label: 'Lose 1.5 lb/wk' },
  { value: 'lose_1', label: 'Lose 1 lb/wk' },
  { value: 'lose_0.5', label: 'Lose 0.5 lb/wk' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'gain_0.5', label: 'Gain 0.5 lb/wk' },
  { value: 'gain_1', label: 'Gain 1 lb/wk' },
  { value: 'gain_1.5', label: 'Gain 1.5 lb/wk' },
  { value: 'gain_2', label: 'Gain 2 lb/wk' },
];

const GOAL_LABELS_KG: { value: WeightGoal; label: string }[] = [
  { value: 'lose_2', label: 'Lose 0.9 kg/wk' },
  { value: 'lose_1.5', label: 'Lose 0.7 kg/wk' },
  { value: 'lose_1', label: 'Lose 0.5 kg/wk' },
  { value: 'lose_0.5', label: 'Lose 0.25 kg/wk' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'gain_0.5', label: 'Gain 0.25 kg/wk' },
  { value: 'gain_1', label: 'Gain 0.5 kg/wk' },
  { value: 'gain_1.5', label: 'Gain 0.7 kg/wk' },
  { value: 'gain_2', label: 'Gain 0.9 kg/wk' },
];

const MACRO_PRESETS: { value: MacroPreset; label: string; split: MacroSplit }[] = [
  { value: 'balanced', label: 'Balanced', split: { protein: 30, carbs: 40, fat: 30 } },
  { value: 'high_protein', label: 'High Protein', split: { protein: 40, carbs: 30, fat: 30 } },
  { value: 'keto', label: 'Keto', split: { protein: 25, carbs: 5, fat: 70 } },
];

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: Spacing.lg,
      paddingTop: 60,
    },
    progressRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.xl,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.border,
    },
    dotActive: {
      backgroundColor: colors.primary,
    },
    dotCompleted: {
      backgroundColor: colors.primary,
    },
    stepTitle: {
      ...Typography.h2,
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    stepSubtitle: {
      ...Typography.body,
      color: colors.textSecondary,
      marginBottom: Spacing.lg,
      lineHeight: 22,
    },
    inputLabel: {
      ...Typography.small,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      ...Typography.body,
      color: colors.text,
      marginBottom: Spacing.md,
    },
    row: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    inputGroup: {
      flex: 1,
    },
    toggle: {
      flexDirection: 'row',
      backgroundColor: colors.card,
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
      ...Typography.body,
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
      backgroundColor: colors.card,
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
    presetRow: {
      flexDirection: 'row',
      gap: Spacing.xs,
      marginBottom: Spacing.md,
    },
    presetBtn: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: Radius.sm,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
    },
    presetBtnActive: {
      backgroundColor: colors.primary,
    },
    presetText: {
      ...Typography.small,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    presetTextActive: {
      color: colors.white,
    },
    presetDescription: {
      ...Typography.small,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.md,
    },
    customRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    customGroup: {
      flex: 1,
      alignItems: 'center',
    },
    customLabel: {
      ...Typography.small,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      gap: 4,
    },
    stepperBtn: {
      width: 32,
      height: 36,
      backgroundColor: colors.card,
      borderRadius: Radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperBtnText: {
      ...Typography.h3,
      color: colors.primary,
      lineHeight: 20,
    },
    stepperInput: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.xs,
      paddingVertical: Spacing.sm,
      ...Typography.body,
      color: colors.text,
      textAlign: 'center',
    },
    validation: {
      ...Typography.small,
      color: colors.danger,
      textAlign: 'center',
      marginTop: Spacing.xs,
      marginBottom: Spacing.md,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: Spacing.lg,
      paddingBottom: 40,
    },
    backBtn: {
      paddingVertical: 12,
      paddingHorizontal: Spacing.lg,
      borderRadius: Radius.md,
      backgroundColor: colors.card,
    },
    backBtnText: {
      ...Typography.body,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    nextBtn: {
      paddingVertical: 12,
      paddingHorizontal: Spacing.xl,
      borderRadius: Radius.md,
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 3,
    },
    nextBtnDisabled: {
      opacity: 0.5,
    },
    nextBtnText: {
      ...Typography.body,
      color: colors.white,
      fontWeight: '600',
    },
    skipBtn: {
      alignSelf: 'center',
      paddingVertical: Spacing.sm,
      marginBottom: Spacing.md,
    },
    skipText: {
      ...Typography.small,
      color: colors.textSecondary,
      textDecorationLine: 'underline',
    },
    dobBtn: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      justifyContent: 'center',
      marginBottom: Spacing.md,
    },
    dobBtnText: {
      ...Typography.body,
      color: colors.text,
    },
    dobPlaceholder: {
      ...Typography.body,
      color: colors.textSecondary,
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
    weightInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    weightInput: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      ...Typography.h2,
      color: colors.text,
      textAlign: 'center',
    },
    weightUnit: {
      ...Typography.h3,
      color: colors.textSecondary,
    },
  });

export default function OnboardingScreen() {
  const { dispatch } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);

  const [step, setStep] = useState(1);

  // Step 1
  const [unit, setUnit] = useState<'lbs' | 'kg'>('lbs');
  const [name, setName] = useState('');

  // Step 2
  const [dob, setDob] = useState<string | null>(null);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [sex, setSex] = useState<Sex>('male');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [heightCm, setHeightCm] = useState('');

  // Step 3
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderately_active');
  const [weightGoal, setWeightGoal] = useState<WeightGoal>('maintain');

  // Step 4
  const [macroPreset, setMacroPreset] = useState<MacroPreset>('balanced');
  const [macroSplit, setMacroSplit] = useState<MacroSplit>({ protein: 30, carbs: 40, fat: 30 });
  const [customProtein, setCustomProtein] = useState('30');
  const [customCarbs, setCustomCarbs] = useState('40');
  const [customFat, setCustomFat] = useState('30');

  // Step 5
  const [weight, setWeight] = useState('');

  const isImperial = unit === 'lbs';
  const goalLabels = isImperial ? GOAL_LABELS_LBS : GOAL_LABELS_KG;

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

  const handleDobChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDobPicker(false);
    if (event.type === 'set' && date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      setDob(`${y}-${m}-${d}`);
    }
  };

  const canProceedStep2 = () => {
    if (!dob) return false;
    if (isImperial) {
      const ft = parseInt(heightFt, 10) || 0;
      const inches = parseInt(heightIn, 10) || 0;
      return ft * 12 + inches > 0;
    }
    return (parseFloat(heightCm) || 0) > 0;
  };

  const canProceedStep5 = () => {
    const w = parseFloat(weight);
    if (!w || w <= 0) return false;
    if (isImperial) return w >= 50 && w <= 1000;
    return w >= 20 && w <= 500;
  };

  const handleComplete = () => {
    const w = parseFloat(weight);
    if (!canProceedStep5()) {
      const range = isImperial ? '50–1000 lbs' : '20–500 kg';
      Alert.alert('Invalid Weight', `Please enter a weight between ${range}.`);
      return;
    }

    let heightValue: number;
    let heightUnit: 'in' | 'cm';
    if (isImperial) {
      const ft = parseInt(heightFt, 10) || 0;
      const inches = parseInt(heightIn, 10) || 0;
      heightValue = ft * 12 + inches;
      heightUnit = 'in';
    } else {
      heightValue = parseFloat(heightCm) || 0;
      heightUnit = 'cm';
    }

    const profile: UserProfile = {
      name: name || undefined,
      dob: dob ?? undefined,
      sex,
      heightValue,
      heightUnit,
      activityLevel,
      weightGoal,
    };

    const entry: WeightEntry = {
      id: generateId(),
      date: getToday(),
      weight: w,
      unit,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'SET_UNIT', unit });
    dispatch({ type: 'SET_PROFILE', profile });
    dispatch({ type: 'SET_MACRO_PRESET', preset: macroPreset, split: macroSplit });
    dispatch({ type: 'UPSERT_ENTRY', entry });
    dispatch({ type: 'SET_ONBOARDING_COMPLETE' });
  };

  const handleNext = () => {
    if (step === 2 && !canProceedStep2()) {
      Alert.alert('Missing Information', 'Please fill in your date of birth and height.');
      return;
    }
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleMacroPresetSelect = (preset: MacroPreset, split: MacroSplit) => {
    setMacroPreset(preset);
    setMacroSplit(split);
  };

  const handleCustomToggle = () => {
    setMacroPreset('custom');
    setMacroSplit({
      protein: parseInt(customProtein) || 0,
      carbs: parseInt(customCarbs) || 0,
      fat: parseInt(customFat) || 0,
    });
  };

  const handleCustomChange = (field: keyof MacroSplit, val: string, setter: (v: string) => void) => {
    setter(val);
    const p = field === 'protein' ? (parseInt(val) || 0) : (parseInt(customProtein) || 0);
    const c = field === 'carbs' ? (parseInt(val) || 0) : (parseInt(customCarbs) || 0);
    const f = field === 'fat' ? (parseInt(val) || 0) : (parseInt(customFat) || 0);
    setMacroSplit({ protein: p, carbs: c, fat: f });
    if (p + c + f === 100) {
      setMacroPreset('custom');
    }
  };

  const clamp = (v: number) => Math.max(0, Math.min(100, v));

  const stepCustom = (field: keyof MacroSplit, delta: number) => {
    const setters = { protein: setCustomProtein, carbs: setCustomCarbs, fat: setCustomFat };
    const vals = { protein: customProtein, carbs: customCarbs, fat: customFat };
    const newVal = clamp((parseInt(vals[field]) || 0) + delta).toString();
    handleCustomChange(field, newVal, setters[field]);
  };

  const customSum = (parseInt(customProtein) || 0) + (parseInt(customCarbs) || 0) + (parseInt(customFat) || 0);

  const getSplitDescription = () => {
    const p = macroPreset === 'custom' ? macroSplit : MACRO_PRESETS.find(p => p.value === macroPreset)?.split ?? macroSplit;
    return `P: ${p.protein}% · C: ${p.carbs}% · F: ${p.fat}%`;
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.stepTitle}>Welcome</Text>
            <Text style={styles.stepSubtitle}>
              Let's get you set up. First, choose your preferred unit and optionally enter your name.
            </Text>

            <Text style={styles.inputLabel}>Weight Unit</Text>
            <View style={styles.toggle}>
              <TouchableOpacity
                style={[styles.toggleOption, unit === 'lbs' && styles.toggleOptionActive]}
                onPress={() => setUnit('lbs')}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, unit === 'lbs' && styles.toggleTextActive]}>lbs</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleOption, unit === 'kg' && styles.toggleOptionActive]}
                onPress={() => setUnit('kg')}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, unit === 'kg' && styles.toggleTextActive]}>kg</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Name (optional)</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </>
        );

      case 2:
        return (
          <>
            <Text style={styles.stepTitle}>About You</Text>
            <Text style={styles.stepSubtitle}>
              We need some basic information to calculate your daily calorie target.
            </Text>

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

            <Text style={styles.inputLabel}>Sex</Text>
            <View style={styles.toggle}>
              <TouchableOpacity
                style={[styles.toggleOption, sex === 'male' && styles.toggleOptionActive]}
                onPress={() => setSex('male')}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, sex === 'male' && styles.toggleTextActive]}>Male</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleOption, sex === 'female' && styles.toggleOptionActive]}
                onPress={() => setSex('female')}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, sex === 'female' && styles.toggleTextActive]}>Female</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Height</Text>
            {isImperial ? (
              <View style={styles.row}>
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
              <TextInput
                style={styles.input}
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="decimal-pad"
                placeholder="cm"
                placeholderTextColor={colors.textSecondary}
              />
            )}

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
          </>
        );

      case 3:
        return (
          <>
            <Text style={styles.stepTitle}>Your Goals</Text>
            <Text style={styles.stepSubtitle}>
              Set your activity level and weight goal to personalize your calorie target.
            </Text>

            <Text style={styles.inputLabel}>Activity Level</Text>
            <View style={styles.optionGrid}>
              {ACTIVITY_LABELS.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.optionBtn, activityLevel === item.value && styles.optionBtnActive]}
                  onPress={() => setActivityLevel(item.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.optionText, activityLevel === item.value && styles.optionTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Weight Goal</Text>
            <View style={styles.optionGrid}>
              {goalLabels.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.optionBtn, weightGoal === item.value && styles.optionBtnActive]}
                  onPress={() => setWeightGoal(item.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.optionText, weightGoal === item.value && styles.optionTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        );

      case 4:
        return (
          <>
            <Text style={styles.stepTitle}>Nutrition</Text>
            <Text style={styles.stepSubtitle}>
              Choose how your daily calories are divided between protein, carbs, and fat.
            </Text>

            <View style={styles.presetRow}>
              {MACRO_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.value}
                  style={[styles.presetBtn, macroPreset === preset.value && styles.presetBtnActive]}
                  onPress={() => handleMacroPresetSelect(preset.value, preset.split)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.presetText, macroPreset === preset.value && styles.presetTextActive]}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.optionBtn, macroPreset === 'custom' && styles.optionBtnActive, { marginBottom: Spacing.md }]}
              onPress={handleCustomToggle}
              activeOpacity={0.8}
            >
              <Text style={[styles.optionText, macroPreset === 'custom' && styles.optionTextActive]}>Custom</Text>
            </TouchableOpacity>

            {macroPreset === 'custom' && (
              <>
                <View style={styles.customRow}>
                  <View style={styles.customGroup}>
                    <Text style={styles.customLabel}>Protein %</Text>
                    <View style={styles.stepperRow}>
                      <TouchableOpacity style={styles.stepperBtn} onPress={() => stepCustom('protein', -1)} activeOpacity={0.7}>
                        <Text style={styles.stepperBtnText}>-</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.stepperInput}
                        value={customProtein}
                        onChangeText={(v) => handleCustomChange('protein', v, setCustomProtein)}
                        keyboardType="number-pad"
                      />
                      <TouchableOpacity style={styles.stepperBtn} onPress={() => stepCustom('protein', 1)} activeOpacity={0.7}>
                        <Text style={styles.stepperBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.customGroup}>
                    <Text style={styles.customLabel}>Carbs %</Text>
                    <View style={styles.stepperRow}>
                      <TouchableOpacity style={styles.stepperBtn} onPress={() => stepCustom('carbs', -1)} activeOpacity={0.7}>
                        <Text style={styles.stepperBtnText}>-</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.stepperInput}
                        value={customCarbs}
                        onChangeText={(v) => handleCustomChange('carbs', v, setCustomCarbs)}
                        keyboardType="number-pad"
                      />
                      <TouchableOpacity style={styles.stepperBtn} onPress={() => stepCustom('carbs', 1)} activeOpacity={0.7}>
                        <Text style={styles.stepperBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.customGroup}>
                    <Text style={styles.customLabel}>Fat %</Text>
                    <View style={styles.stepperRow}>
                      <TouchableOpacity style={styles.stepperBtn} onPress={() => stepCustom('fat', -1)} activeOpacity={0.7}>
                        <Text style={styles.stepperBtnText}>-</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.stepperInput}
                        value={customFat}
                        onChangeText={(v) => handleCustomChange('fat', v, setCustomFat)}
                        keyboardType="number-pad"
                      />
                      <TouchableOpacity style={styles.stepperBtn} onPress={() => stepCustom('fat', 1)} activeOpacity={0.7}>
                        <Text style={styles.stepperBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                {customSum !== 100 && (
                  <Text style={styles.validation}>
                    Total must equal 100% (currently {customSum}%)
                  </Text>
                )}
              </>
            )}

            <Text style={styles.presetDescription}>{getSplitDescription()}</Text>

            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => {
                setMacroPreset('balanced');
                setMacroSplit({ protein: 30, carbs: 40, fat: 30 });
                setStep(5);
              }}
            >
              <Text style={styles.skipText}>Skip — use Balanced defaults</Text>
            </TouchableOpacity>
          </>
        );

      case 5:
        return (
          <>
            <Text style={styles.stepTitle}>Starting Weight</Text>
            <Text style={styles.stepSubtitle}>
              Enter your current weight to complete your profile setup.
            </Text>

            <View style={styles.weightInputRow}>
              <TextInput
                style={styles.weightInput}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder={isImperial ? '150' : '70'}
                placeholderTextColor={colors.textSecondary}
                returnKeyType="done"
              />
              <Text style={styles.weightUnit}>{unit}</Text>
            </View>
          </>
        );

      default:
        return null;
    }
  };

  const isNextDisabled = () => {
    if (step === 2) return !canProceedStep2();
    if (step === 4 && macroPreset === 'custom') return customSum !== 100;
    if (step === 5) return !canProceedStep5();
    return false;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Progress dots */}
        <View style={styles.progressRow}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i + 1 < step && styles.dotCompleted,
                i + 1 === step && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {renderStep()}
      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.footer}>
        {step > 1 ? (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.8}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <TouchableOpacity
          style={[styles.nextBtn, isNextDisabled() && styles.nextBtnDisabled]}
          onPress={step === TOTAL_STEPS ? handleComplete : handleNext}
          activeOpacity={0.8}
          disabled={isNextDisabled()}
        >
          <Text style={styles.nextBtnText}>
            {step === TOTAL_STEPS ? 'Complete Setup' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
