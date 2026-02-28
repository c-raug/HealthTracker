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
import { MacroPreset, MacroSplit } from '../../types';

const PRESETS: { value: MacroPreset; label: string; split: MacroSplit }[] = [
  { value: 'balanced', label: 'Balanced', split: { protein: 30, carbs: 40, fat: 30 } },
  { value: 'high_protein', label: 'High Protein', split: { protein: 40, carbs: 30, fat: 30 } },
  { value: 'keto', label: 'Keto', split: { protein: 25, carbs: 5, fat: 70 } },
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
    presetRow: {
      flexDirection: 'row',
      gap: Spacing.xs,
      marginBottom: Spacing.md,
    },
    presetBtn: {
      flex: 1,
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
    customInput: {
      backgroundColor: colors.background,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm,
      ...Typography.body,
      color: colors.text,
      textAlign: 'center',
      width: '100%',
    },
    validation: {
      ...Typography.small,
      color: colors.danger,
      textAlign: 'center',
      marginTop: Spacing.xs,
    },
    splitPreview: {
      ...Typography.small,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: Spacing.xs,
    },
  });

export default function MacroSection() {
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

  const customSum = (parseInt(customProtein) || 0) + (parseInt(customCarbs) || 0) + (parseInt(customFat) || 0);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Macro Split</Text>
      <Text style={styles.description}>
        Choose how your daily calories are divided between protein, carbs, and fat.
      </Text>

      <View style={styles.presetRow}>
        {PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.value}
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
              <TextInput
                style={styles.customInput}
                value={customProtein}
                onChangeText={(v) => handleCustomChange('protein', v, setCustomProtein)}
                keyboardType="number-pad"
                placeholder="30"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.customGroup}>
              <Text style={styles.customLabel}>Carbs %</Text>
              <TextInput
                style={styles.customInput}
                value={customCarbs}
                onChangeText={(v) => handleCustomChange('carbs', v, setCustomCarbs)}
                keyboardType="number-pad"
                placeholder="40"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.customGroup}>
              <Text style={styles.customLabel}>Fat %</Text>
              <TextInput
                style={styles.customInput}
                value={customFat}
                onChangeText={(v) => handleCustomChange('fat', v, setCustomFat)}
                keyboardType="number-pad"
                placeholder="30"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
          {customSum !== 100 && (
            <Text style={styles.validation}>
              Total must equal 100% (currently {customSum}%)
            </Text>
          )}
        </>
      )}

      <Text style={styles.splitPreview}>
        P: {currentSplit.protein}% / C: {currentSplit.carbs}% / F: {currentSplit.fat}%
      </Text>
    </View>
  );
}
