import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { MealCategory, NutritionFoodItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { generateId } from '../../utils/generateId';
import CreateMealFlow from './CreateMealFlow';

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    createBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      padding: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
    },
    createText: {
      ...Typography.body,
      color: colors.primary,
      fontWeight: '600',
    },
    mealItem: {
      backgroundColor: colors.card,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    mealName: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '600',
      marginBottom: 2,
    },
    mealInfo: {
      ...Typography.small,
      color: colors.textSecondary,
    },
    empty: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      padding: Spacing.xl,
    },
    deleteBtn: {
      padding: Spacing.xs,
    },
    mealRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  });

interface Props {
  date: string;
  category: MealCategory;
  onDone: () => void;
}

export default function AddMealTab({ date, category, onDone }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { savedMeals, dispatch } = useApp();
  const [showCreate, setShowCreate] = useState(false);

  const handleAddMeal = (mealId: string) => {
    const meal = savedMeals.find((m) => m.id === mealId);
    if (!meal) return;

    meal.foods.forEach((food) => {
      const newFood: NutritionFoodItem = {
        ...food,
        id: generateId(),
      };
      dispatch({ type: 'ADD_FOOD_TO_MEAL', date, category, food: newFood });
    });

    onDone();
  };

  const handleDeleteMeal = (mealId: string) => {
    Alert.alert('Delete Meal', 'Are you sure you want to delete this saved meal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => dispatch({ type: 'DELETE_SAVED_MEAL', id: mealId }),
      },
    ]);
  };

  if (showCreate) {
    return <CreateMealFlow onDone={() => setShowCreate(false)} />;
  }

  const totalCalories = (foods: NutritionFoodItem[]) =>
    foods.reduce((sum, f) => sum + (f.calories ?? 0), 0);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => setShowCreate(true)}
      >
        <Ionicons name="add-circle" size={20} color={colors.primary} />
        <Text style={styles.createText}>Create New Meal</Text>
      </TouchableOpacity>

      <FlatList
        data={savedMeals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.mealItem}
            onPress={() => handleAddMeal(item.id)}
          >
            <View style={styles.mealRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mealName}>{item.name}</Text>
                <Text style={styles.mealInfo}>
                  {item.foods.length} food{item.foods.length !== 1 ? 's' : ''} · {totalCalories(item.foods)} cal
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteMeal(item.id)}
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No saved meals yet</Text>
        }
      />
    </View>
  );
}
