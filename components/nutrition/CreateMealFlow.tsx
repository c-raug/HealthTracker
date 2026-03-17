import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SectionList,
  StyleSheet,
  Alert,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { NutritionFoodItem, CustomFood } from '../../types';
import { useApp } from '../../context/AppContext';
import { generateId } from '../../utils/generateId';
import PortionSelector from './PortionSelector';

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      padding: Spacing.md,
    },
    title: {
      ...Typography.h3,
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    nameInput: {
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
    searchInput: {
      backgroundColor: colors.card,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      ...Typography.body,
      color: colors.text,
    },
    sectionLabel: {
      ...Typography.small,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.xs,
      backgroundColor: colors.background,
    },
    foodRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    foodName: {
      ...Typography.body,
      color: colors.text,
      flex: 1,
    },
    foodCal: {
      ...Typography.small,
      color: colors.textSecondary,
      marginRight: Spacing.sm,
    },
    removeBtn: {
      padding: Spacing.xs,
    },
    resultItem: {
      backgroundColor: colors.card,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    resultName: {
      ...Typography.body,
      color: colors.text,
    },
    resultInfo: {
      ...Typography.small,
      color: colors.textSecondary,
    },
    btnRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      padding: Spacing.md,
    },
    saveBtn: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: Radius.md,
      paddingVertical: Spacing.md,
      alignItems: 'center',
    },
    saveBtnText: {
      ...Typography.body,
      color: colors.white,
      fontWeight: '600',
    },
    cancelBtn: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: Radius.md,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelText: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    empty: {
      ...Typography.small,
      color: colors.textSecondary,
      textAlign: 'center',
      padding: Spacing.md,
    },
    portionPanel: {
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    confirmBtn: {
      backgroundColor: colors.primary,
      borderRadius: Radius.md,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.md,
      alignItems: 'center',
    },
    confirmText: {
      ...Typography.body,
      color: colors.white,
      fontWeight: '600',
    },
  });

interface Props {
  onDone: () => void;
  initialFoods?: NutritionFoodItem[];
  initialName?: string;
}

// Discriminated union so SectionList can render both meal foods and custom foods
type SectionItem =
  | { kind: 'meal'; food: NutritionFoodItem }
  | { kind: 'custom'; food: CustomFood };

export default function CreateMealFlow({ onDone, initialFoods, initialName }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { customFoods, dispatch } = useApp();

  const [mealName, setMealName] = useState(initialName ?? '');
  const [foods, setFoods] = useState<NutritionFoodItem[]>(initialFoods ?? []);
  const [query, setQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<NutritionFoodItem | null>(null);
  const [servings, setServings] = useState<number>(1);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    setSelectedItem(null);
  }, []);

  // Build sections: "In Meal" only when not searching; Pinned/My Foods always
  const trimmed = query.trim().toLowerCase();
  const filtered =
    trimmed.length === 0
      ? customFoods
      : customFoods.filter((f) => f.name.toLowerCase().includes(trimmed));
  const pinnedCustom = filtered.filter((f) => f.pinned);
  const unpinnedCustom = filtered.filter((f) => !f.pinned);

  const sections: { title: string; data: SectionItem[] }[] = [];
  if (trimmed.length === 0 && foods.length > 0) {
    sections.push({
      title: `In Meal (${foods.length})`,
      data: foods.map((f) => ({ kind: 'meal', food: f })),
    });
  }
  if (pinnedCustom.length > 0) {
    sections.push({ title: 'Pinned', data: pinnedCustom.map((f) => ({ kind: 'custom', food: f })) });
  }
  if (unpinnedCustom.length > 0) {
    sections.push({ title: 'My Foods', data: unpinnedCustom.map((f) => ({ kind: 'custom', food: f })) });
  }

  const handleSelectItem = (customFood: CustomFood) => {
    Keyboard.dismiss();
    setSelectedItem({
      id: customFood.id,
      name: customFood.name,
      calories: customFood.calories,
      protein: customFood.protein,
      carbs: customFood.carbs,
      fat: customFood.fat,
      servingSize: customFood.servingSize,
      servings: 1,
    });
    setServings(1);
  };

  const handleConfirmAdd = () => {
    if (!selectedItem) return;
    const baseServings = selectedItem.servings ?? 1;
    const food: NutritionFoodItem = {
      ...selectedItem,
      id: generateId(),
      calories: Math.round((selectedItem.calories ?? 0) * servings / baseServings),
      protein: Math.round(((selectedItem.protein ?? 0) * servings / baseServings) * 10) / 10,
      carbs: Math.round(((selectedItem.carbs ?? 0) * servings / baseServings) * 10) / 10,
      fat: Math.round(((selectedItem.fat ?? 0) * servings / baseServings) * 10) / 10,
      servings,
    };
    setFoods((prev) => [...prev, food]);
    setSelectedItem(null);
    setServings(1);
    setQuery('');
  };

  const handleRemoveFromMeal = (id: string) => {
    setFoods((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSave = () => {
    if (!mealName.trim()) {
      Alert.alert('Required', 'Please enter a meal name.');
      return;
    }
    if (foods.length === 0) {
      Alert.alert('Required', 'Please add at least one food.');
      return;
    }

    dispatch({
      type: 'ADD_SAVED_MEAL',
      meal: {
        id: generateId(),
        name: mealName.trim(),
        foods,
        createdAt: new Date().toISOString(),
      },
    });

    onDone();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Meal</Text>
        <TextInput
          style={styles.nameInput}
          value={mealName}
          onChangeText={setMealName}
          placeholder="Meal name (e.g. Post-Workout Shake)"
          placeholderTextColor={colors.textSecondary}
          autoFocus
        />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={handleSearch}
          placeholder="Search foods to add..."
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {selectedItem && (
        <View style={styles.portionPanel}>
          <PortionSelector
            value={servings}
            onChange={setServings}
            baseCalories={selectedItem.calories ?? 0}
            baseProtein={selectedItem.protein ?? 0}
            baseCarbs={selectedItem.carbs ?? 0}
            baseFat={selectedItem.fat ?? 0}
            servingSize={selectedItem.servingSize ?? '1 serving'}
            baseServings={selectedItem.servings ?? 1}
            foodName={selectedItem.name}
          />
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmAdd}>
            <Text style={styles.confirmText}>Add to Meal</Text>
          </TouchableOpacity>
        </View>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item, i) =>
          item.kind === 'meal' ? `meal-${item.food.id}-${i}` : `custom-${item.food.id}-${i}`
        }
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled={false}
        style={{ flex: 1 }}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionLabel}>{section.title}</Text>
        )}
        renderItem={({ item }) => {
          if (item.kind === 'meal') {
            return (
              <View style={styles.foodRow}>
                <Text style={styles.foodName} numberOfLines={1}>{item.food.name}</Text>
                <Text style={styles.foodCal}>{item.food.calories} cal</Text>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemoveFromMeal(item.food.id)}
                >
                  <Ionicons name="close-circle" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            );
          }
          return (
            <TouchableOpacity
              style={[
                styles.resultItem,
                selectedItem?.id === item.food.id && { backgroundColor: colors.primaryLight },
              ]}
              onPress={() => handleSelectItem(item.food)}
            >
              <Text style={styles.resultName} numberOfLines={1}>{item.food.name}</Text>
              <Text style={styles.resultInfo}>
                {item.food.calories} cal{item.food.servingSize ? ` · ${item.food.servingSize}` : ''}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {trimmed.length > 0
              ? 'No results found'
              : 'No custom foods saved yet'}
          </Text>
        }
      />

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onDone} activeOpacity={0.8}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>Save Meal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
