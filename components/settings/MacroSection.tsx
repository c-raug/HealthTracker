import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import {
  useColors,
  LightColors,
  Spacing,
  Typography,
  Radius,
} from '../../constants/theme';
import { MacroPreset, MacroSplit } from '../../types';

const PRESETS: { value: MacroPreset; label: string; split: MacroSplit }[] = [
  { value: 'balanced', label: 'Balanced', split: { protein: 30, carbs: 40, fat: 30 } },
  { value: 'high_protein', label: 'High Protein', split: { protein: 40, carbs: 30, fat: 30 } },
  { value: 'keto', label: 'Keto', split: { protein: 25, carbs: 5, fat: 70 } },
];

// Reuse the same formula as MacroProgressBars.tsx lines 64-68
function gramsFor(pct: number, goalCalories: number | null | undefined, calPerGram: number): string {
  if (!goalCalories) return '—g';
  return `${Math.round((pct / 100) * goalCalories / calPerGram)}g`;
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
    presetRow: {
      flexDirection: 'row',
      gap: Spacing.xs,
      marginBottom: Spacing.md,
    },
    presetGroup: {
      flex: 1,
      alignItems: 'center',
    },
    presetBtn: {
      width: '100%',
      backgroundColor: colors.background,
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
    customBtn: {
      backgroundColor: colors.background,
      borderRadius: Radius.sm,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    customBtnActive: {
      backgroundColor: colors.primary,
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
      backgroundColor: colors.background,
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
      backgroundColor: colors.background,
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
    },
    splitPreviewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      marginTop: Spacing.xs,
    },
    splitPreview: {
      ...Typography.small,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

interface Props {
  goalCalories: number | null;
  activityAdjusted?: boolean;
}

export default function MacroSection({ goalCalories, activityAdjusted }: Props) {
  const { preferences, dispatch } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);

  const currentPreset = preferences.macroPreset ?? 'balanced';
  const currentSplit = preferences.macroSplit ?? { protein: 30, carbs: 40, fat: 30 };

  const [customProtein, setCustomProtein] = useState(currentSplit.protein.toString());
  const [customCarbs, setCustomCarbs] = useState(currentSplit.carbs.toString());
  const [customFat, setCustomFat] = useState(currentSplit.fat.toString());

  const isCustom = currentPreset === 'custom';

  const handlePresetSelect = (preset: MacroPreset, split: MacroSplit) => {
    dispatch({ type: 'SET_MACRO_PRESET', preset, split });
  };

  const handleCustomToggle = () => {
    if (!isCustom) {
      dispatch({
        type: 'SET_MACRO_PRESET',
        preset: 'custom',
        split: { protein: parseInt(customProtein) || 0, carbs: parseInt(customCarbs) || 0, fat: parseInt(customFat) || 0 },
      });
    }
  };

  const handleCustomChange = (field: keyof MacroSplit, val: string, setter: (v: string) => void) => {
    setter(val);
    const p = field === 'protein' ? (parseInt(val) || 0) : (parseInt(customProtein) || 0);
    const c = field === 'carbs' ? (parseInt(val) || 0) : (parseInt(customCarbs) || 0);
    const f = field === 'fat' ? (parseInt(val) || 0) : (parseInt(customFat) || 0);
    if (p + c + f === 100) {
      dispatch({ type: 'SET_MACRO_PRESET', preset: 'custom', split: { protein: p, carbs: c, fat: f } });
    }
  };

  const clamp = (v: number) => Math.max(0, Math.min(100, v));

  const stepProtein = (delta: number) => {
    const newVal = clamp((parseInt(customProtein) || 0) + delta).toString();
    handleCustomChange('protein', newVal, setCustomProtein);
  };

  const stepCarbs = (delta: number) => {
    const newVal = clamp((parseInt(customCarbs) || 0) + delta).toString();
    handleCustomChange('carbs', newVal, setCustomCarbs);
  };

  const stepFat = (delta: number) => {
    const newVal = clamp((parseInt(customFat) || 0) + delta).toString();
    handleCustomChange('fat', newVal, setCustomFat);
  };

  const customSum = (parseInt(customProtein) || 0) + (parseInt(customCarbs) || 0) + (parseInt(customFat) || 0);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Macro Split</Text>
      <Text style={styles.description}>
        Choose how your daily calories are divided between protein, carbs, and fat.
      </Text>

      <View style={styles.presetRow}>
        {PRESETS.map((preset) => (
          <View key={preset.value} style={styles.presetGroup}>
            <TouchableOpacity
              style={[
                styles.presetBtn,
                currentPreset === preset.value && styles.presetBtnActive,
              ]}
              onPress={() => handlePresetSelect(preset.value, preset.split)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.presetText,
                  currentPreset === preset.value && styles.presetTextActive,
                ]}
              >
                {preset.label}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.customBtn, isCustom && styles.customBtnActive]}
        onPress={handleCustomToggle}
        activeOpacity={0.8}
      >
        <Text style={[styles.presetText, isCustom && styles.presetTextActive]}>
          Custom
        </Text>
      </TouchableOpacity>

      {isCustom && (
        <>
          <View style={styles.customRow}>
            <View style={styles.customGroup}>
              <Text style={styles.customLabel}>Protein %</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => stepProtein(-1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepperBtnText}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.stepperInput}
                  value={customProtein}
                  onChangeText={(v) => handleCustomChange('protein', v, setCustomProtein)}
                  keyboardType="number-pad"
                  placeholder="30"
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => stepProtein(1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.customGroup}>
              <Text style={styles.customLabel}>Carbs %</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => stepCarbs(-1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepperBtnText}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.stepperInput}
                  value={customCarbs}
                  onChangeText={(v) => handleCustomChange('carbs', v, setCustomCarbs)}
                  keyboardType="number-pad"
                  placeholder="40"
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => stepCarbs(1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.customGroup}>
              <Text style={styles.customLabel}>Fat %</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => stepFat(-1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepperBtnText}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.stepperInput}
                  value={customFat}
                  onChangeText={(v) => handleCustomChange('fat', v, setCustomFat)}
                  keyboardType="number-pad"
                  placeholder="30"
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => stepFat(1)}
                  activeOpacity={0.7}
                >
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

      <View style={styles.splitPreviewRow}>
        <Text style={styles.splitPreview}>
          P: {currentSplit.protein}% ({gramsFor(currentSplit.protein, goalCalories, 4)}) · C: {currentSplit.carbs}% ({gramsFor(currentSplit.carbs, goalCalories, 4)}) · F: {currentSplit.fat}% ({gramsFor(currentSplit.fat, goalCalories, 9)})
        </Text>
        {goalCalories !== null && (
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'How are these calculated?',
                activityAdjusted
                  ? 'Gram targets are based on your profile, latest weight, and your average calories burned over the last 7 days.'
                  : 'Gram targets are based on your profile and latest weight. Log activity to include exercise calories.',
              )
            }
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.6}
          >
            <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
