import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  type TextInput as TextInputType,
} from 'react-native';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { generateId } from '../../utils/generateId';
import { CustomFood } from '../../types';

const PORTION_UNITS = ['g', 'oz', 'cup', 'qty'] as const;

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      padding: Spacing.md,
    },
    title: {
      ...Typography.h3,
      color: colors.text,
      marginBottom: Spacing.md,
    },
    label: {
      ...Typography.small,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      ...Typography.body,
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    row: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    halfInput: {
      flex: 1,
    },
    saveBtn: {
      backgroundColor: colors.primary,
      borderRadius: Radius.md,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    saveBtnText: {
      ...Typography.body,
      color: colors.white,
      fontWeight: '600',
    },
    cancelBtn: {
      paddingVertical: Spacing.md,
      alignItems: 'center',
      marginTop: Spacing.xs,
    },
    cancelText: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    // Portion selector styles
    portionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    portionQtyInput: {
      width: 72,
      marginBottom: 0,
      textAlign: 'center',
    },
    unitScroll: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
      flex: 1,
    },
    unitChip: {
      backgroundColor: colors.background,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    unitChipActive: {
      backgroundColor: colors.primary,
    },
    unitChipText: {
      ...Typography.small,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    unitChipTextActive: {
      color: colors.white,
    },
    // Calorie auto-compute styles
    caloriesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    caloriesInput: {
      flex: 1,
      marginBottom: 0,
    },
    caloriesReadOnly: {
      backgroundColor: colors.background,
      color: colors.textSecondary,
    },
    caloriesReadOnlyTouchable: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      marginBottom: 0,
      justifyContent: 'center',
    },
    caloriesReadOnlyText: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    autoLabel: {
      ...Typography.small,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    overrideBtn: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm,
      backgroundColor: colors.background,
      borderRadius: Radius.sm,
    },
    overrideBtnText: {
      ...Typography.small,
      color: colors.primary,
      fontWeight: '600',
    },
  });

interface Props {
  onDone: (createdFood?: CustomFood) => void;
  initialFood?: CustomFood;
  mode?: 'create' | 'edit';
  initialName?: string;
}

export default function CustomFoodForm({ onDone, initialFood, mode = 'create', initialName }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { dispatch } = useApp();

  // Parse serving size from initialFood (format: "qty unit")
  const parsedQty = initialFood ? (initialFood.servingSize.split(' ')[0] ?? '1') : '1';
  const parsedRawUnit = initialFood ? (initialFood.servingSize.split(' ')[1] ?? 'g') : 'g';
  const parsedUnit = (PORTION_UNITS as readonly string[]).includes(parsedRawUnit) ? parsedRawUnit : 'g';

  const proteinRef = useRef<TextInputType>(null);
  const carbsRef = useRef<TextInputType>(null);
  const fatRef = useRef<TextInputType>(null);

  const [name, setName] = useState(initialFood?.name ?? initialName ?? '');
  const [calories, setCalories] = useState(initialFood ? initialFood.calories.toString() : '');
  const [protein, setProtein] = useState(initialFood ? initialFood.protein.toString() : '');
  const [carbs, setCarbs] = useState(initialFood ? initialFood.carbs.toString() : '');
  const [fat, setFat] = useState(initialFood ? initialFood.fat.toString() : '');
  const [portionQty, setPortionQty] = useState(parsedQty);
  const [portionUnit, setPortionUnit] = useState<string>(parsedUnit);
  // In edit mode, only start in manual if stored calories differ from what macros would compute
  const initialIsManual = mode === 'edit' && initialFood
    ? Math.round((initialFood.protein * 4) + (initialFood.carbs * 4) + (initialFood.fat * 9)) !== initialFood.calories
    : false;
  const [isCaloriesManual, setIsCaloriesManual] = useState(initialIsManual);

  // Auto-compute calories from macros when not in manual mode
  useEffect(() => {
    if (!isCaloriesManual) {
      const p = parseFloat(protein) || 0;
      const c = parseFloat(carbs) || 0;
      const f = parseFloat(fat) || 0;
      const computed = Math.round(p * 4 + c * 4 + f * 9);
      setCalories(computed === 0 ? '' : computed.toString());
    }
  }, [protein, carbs, fat, isCaloriesManual]);

  const handleOverrideTap = () => {
    Alert.alert(
      'Override Calories?',
      'Manually entered calories may not match your macro tracking. Macros and calories could become inconsistent.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Override',
          onPress: () => {
            setIsCaloriesManual(true);
            setCalories('');
          },
        },
      ],
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a food name.');
      return;
    }
    const cal = parseFloat(calories);
    if (isNaN(cal) || cal < 0) {
      Alert.alert('Required', 'Please enter valid calories (or fill in macros to auto-compute).');
      return;
    }

    const servingSize = `${portionQty.trim() || '1'} ${portionUnit}`;

    if (mode === 'edit' && initialFood) {
      dispatch({
        type: 'UPDATE_CUSTOM_FOOD',
        food: {
          ...initialFood,
          name: name.trim(),
          calories: cal,
          protein: parseFloat(protein) || 0,
          carbs: parseFloat(carbs) || 0,
          fat: parseFloat(fat) || 0,
          servingSize,
        },
      });
      onDone();
    } else {
      const newFood: CustomFood = {
        id: generateId(),
        name: name.trim(),
        calories: cal,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        servingSize,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_CUSTOM_FOOD', food: newFood });
      onDone(newFood);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>
        {mode === 'edit' ? 'Edit Custom Food' : 'Create Custom Food'}
      </Text>

      <Text style={styles.label}>Name *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Homemade Granola"
        placeholderTextColor={colors.textSecondary}
        autoFocus={mode === 'create'}
      />

      <Text style={styles.label}>Serving Size</Text>
      <View style={styles.portionRow}>
        <TextInput
          style={[styles.input, styles.portionQtyInput]}
          value={portionQty}
          onChangeText={setPortionQty}
          keyboardType="decimal-pad"
          placeholder="1"
          placeholderTextColor={colors.textSecondary}
        />
        <View style={styles.unitScroll}>
          {PORTION_UNITS.map((u) => (
            <TouchableOpacity
              key={u}
              style={[styles.unitChip, portionUnit === u && styles.unitChipActive]}
              onPress={() => setPortionUnit(u)}
              activeOpacity={0.8}
            >
              <Text style={[styles.unitChipText, portionUnit === u && styles.unitChipTextActive]}>
                {u}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={styles.label}>
        Calories *{'  '}
        {!isCaloriesManual && <Text style={styles.autoLabel}>(auto-computed)</Text>}
      </Text>
      <View style={styles.caloriesRow}>
        {isCaloriesManual ? (
          <TextInput
            style={[styles.input, styles.caloriesInput]}
            value={calories}
            onChangeText={setCalories}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
          />
        ) : (
          <TouchableOpacity
            style={styles.caloriesReadOnlyTouchable}
            onPress={handleOverrideTap}
            activeOpacity={0.7}
          >
            <Text style={styles.caloriesReadOnlyText}>
              {calories || '0'}
            </Text>
          </TouchableOpacity>
        )}
        {isCaloriesManual ? (
          <TouchableOpacity
            style={styles.overrideBtn}
            onPress={() => setIsCaloriesManual(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.overrideBtnText}>Auto</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.overrideBtn}
            onPress={handleOverrideTap}
            activeOpacity={0.8}
          >
            <Text style={styles.overrideBtnText}>Override</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Protein (g)</Text>
          <TextInput
            ref={proteinRef}
            style={styles.input}
            value={protein}
            onChangeText={setProtein}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => carbsRef.current?.focus()}
          />
        </View>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Carbs (g)</Text>
          <TextInput
            ref={carbsRef}
            style={styles.input}
            value={carbs}
            onChangeText={setCarbs}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => fatRef.current?.focus()}
          />
        </View>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Fat (g)</Text>
          <TextInput
            ref={fatRef}
            style={styles.input}
            value={fat}
            onChangeText={setFat}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            returnKeyType="done"
          />
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
        <Text style={styles.saveBtnText}>
          {mode === 'edit' ? 'Save Changes' : 'Save Custom Food'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelBtn} onPress={onDone} activeOpacity={0.8}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
