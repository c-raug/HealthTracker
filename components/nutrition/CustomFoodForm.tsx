import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { generateId } from '../../utils/generateId';

const PORTION_UNITS = ['g', 'oz', 'qty'] as const;

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
  onDone: () => void;
}

export default function CustomFoodForm({ onDone }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { dispatch } = useApp();

  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [portionQty, setPortionQty] = useState('1');
  const [portionUnit, setPortionUnit] = useState<string>('g');
  const [isCaloriesManual, setIsCaloriesManual] = useState(false);

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

    dispatch({
      type: 'ADD_CUSTOM_FOOD',
      food: {
        id: generateId(),
        name: name.trim(),
        calories: cal,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        servingSize: `${portionQty.trim() || '1'} ${portionUnit}`,
        createdAt: new Date().toISOString(),
      },
    });

    onDone();
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Create Custom Food</Text>

      <Text style={styles.label}>Name *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Homemade Granola"
        placeholderTextColor={colors.textSecondary}
        autoFocus
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
            autoFocus
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
            style={styles.input}
            value={protein}
            onChangeText={setProtein}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Carbs (g)</Text>
          <TextInput
            style={styles.input}
            value={carbs}
            onChangeText={setCarbs}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Fat (g)</Text>
          <TextInput
            style={styles.input}
            value={fat}
            onChangeText={setFat}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
        <Text style={styles.saveBtnText}>Save Custom Food</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelBtn} onPress={onDone} activeOpacity={0.8}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
