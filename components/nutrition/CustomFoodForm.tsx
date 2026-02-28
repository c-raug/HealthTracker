import { useState } from 'react';
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
  const [servingSize, setServingSize] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a food name.');
      return;
    }
    const cal = parseFloat(calories);
    if (isNaN(cal) || cal < 0) {
      Alert.alert('Required', 'Please enter valid calories.');
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
        servingSize: servingSize.trim() || '1 serving',
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
      <TextInput
        style={styles.input}
        value={servingSize}
        onChangeText={setServingSize}
        placeholder="e.g. 1 cup (100g)"
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={styles.label}>Calories *</Text>
      <TextInput
        style={styles.input}
        value={calories}
        onChangeText={setCalories}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={colors.textSecondary}
      />

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
