import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { MealCategory, NutritionFoodItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { generateId } from '../../utils/generateId';

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: Spacing.md,
    },
    label: {
      ...Typography.small,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
      marginTop: Spacing.md,
    },
    labelFirst: {
      ...Typography.small,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
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
    },
    addBtn: {
      backgroundColor: colors.primary,
      borderRadius: Radius.md,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      marginTop: Spacing.lg,
    },
    addBtnDisabled: {
      opacity: 0.5,
    },
    addBtnText: {
      ...Typography.body,
      color: colors.white,
      fontWeight: '600',
    },
  });

interface Props {
  date: string;
  category: MealCategory;
  onDone: () => void;
}

export default function QuickAddTab({ date, category, onDone }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { dispatch } = useApp();

  const [calories, setCalories] = useState('');
  const [name, setName] = useState('');

  const caloriesRef = useRef<TextInput>(null);

  useEffect(() => {
    const t = setTimeout(() => caloriesRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const calValue = parseInt(calories, 10);
  const isValid = !isNaN(calValue) && calValue > 0;

  const handleAdd = () => {
    if (!isValid) return;
    Keyboard.dismiss();
    const food: NutritionFoodItem = {
      id: generateId(),
      name: name.trim() || 'Quick Add',
      calories: calValue,
      protein: 0,
      carbs: 0,
      fat: 0,
      quickAdd: true,
    };
    dispatch({ type: 'ADD_FOOD_TO_MEAL', date, category, food });
    onDone();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.labelFirst}>Name (optional)</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Restaurant lunch"
        placeholderTextColor={colors.textSecondary}
        returnKeyType="next"
        onSubmitEditing={() => caloriesRef.current?.focus()}
      />
      <Text style={styles.label}>Calories *</Text>
      <TextInput
        ref={caloriesRef}
        style={styles.input}
        value={calories}
        onChangeText={setCalories}
        placeholder="e.g. 500"
        placeholderTextColor={colors.textSecondary}
        keyboardType="numeric"
        returnKeyType="done"
        onSubmitEditing={handleAdd}
      />
      <TouchableOpacity
        style={[styles.addBtn, !isValid && styles.addBtnDisabled]}
        onPress={handleAdd}
        disabled={!isValid}
        activeOpacity={0.8}
      >
        <Text style={styles.addBtnText}>Add</Text>
      </TouchableOpacity>
    </View>
  );
}
