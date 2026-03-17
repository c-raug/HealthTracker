import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  RenderItemParams,
  NestableDraggableFlatList,
} from 'react-native-draggable-flatlist';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { NutritionFoodItem, MealCategory as MealCategoryType } from '../../types';
import { useApp } from '../../context/AppContext';
import { generateId } from '../../utils/generateId';
import FoodItem from './FoodItem';

const CATEGORY_LABELS: Record<MealCategoryType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      marginBottom: Spacing.sm,
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: colors.card,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    headerTitle: {
      ...Typography.h3,
      color: colors.text,
    },
    headerInfo: {
      ...Typography.small,
      color: colors.textSecondary,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    actionBtn: {
      padding: Spacing.xs,
    },
    emptyText: {
      ...Typography.small,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: Spacing.md,
    },
  });

interface Props {
  category: MealCategoryType;
  foods: NutritionFoodItem[];
  date: string;
}

export default function MealCategoryComponent({ category, foods, date }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { dispatch, nutritionLog } = useApp();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(true);

  const totalCal = foods.reduce((sum, f) => sum + (f.calories ?? 0), 0);

  const handleDelete = (foodId: string) => {
    dispatch({ type: 'DELETE_FOOD_FROM_MEAL', date, category, foodId });
  };

  const handleReorder = (data: NutritionFoodItem[]) => {
    dispatch({ type: 'REORDER_MEAL_FOODS', date, category, foods: data });
  };

  const handleAdd = () => {
    router.push({
      pathname: '/add-food-modal',
      params: { date, category },
    });
  };

  const handleCopy = () => {
    // Compute yesterday relative to the current date
    const [y, mo, d] = date.split('-').map(Number);
    const prev = new Date(y, mo - 1, d - 1);
    const yesterdayStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`;

    const sourceDay = nutritionLog.find((day) => day.date === yesterdayStr);
    const sourceFoods: NutritionFoodItem[] = sourceDay?.meals[category] ?? [];

    if (sourceFoods.length === 0) {
      Alert.alert(
        'Nothing to Copy',
        `No foods logged in ${CATEGORY_LABELS[category]} yesterday.`,
      );
      return;
    }

    Alert.alert(
      `Copy ${CATEGORY_LABELS[category]} from yesterday?`,
      `This will add ${sourceFoods.length} food${sourceFoods.length === 1 ? '' : 's'} to your log.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Copy',
          onPress: () => {
            sourceFoods.forEach((food) => {
              dispatch({
                type: 'ADD_FOOD_TO_MEAL',
                date,
                category,
                food: { ...food, id: generateId() },
              });
            });
          },
        },
      ],
    );
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<NutritionFoodItem>) => (
    <FoodItem
      item={item}
      onDelete={() => handleDelete(item.id)}
      drag={drag}
      isActive={isActive}
      date={date}
      category={category}
    />
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setCollapsed(!collapsed)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Ionicons
            name={collapsed ? 'chevron-forward' : 'chevron-down'}
            size={18}
            color={colors.textSecondary}
          />
          <Text style={styles.headerTitle}>{CATEGORY_LABELS[category]}</Text>
          {foods.length > 0 && (
            <Text style={styles.headerInfo}>
              ({foods.length}) · {totalCal} cal
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleCopy}
          >
            <Ionicons name="copy-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleAdd}
          >
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {!collapsed && (
        <>
          {foods.length === 0 && (
            <Text style={styles.emptyText}>No foods logged</Text>
          )}

          {foods.length > 0 && (
            <View>
              <NestableDraggableFlatList
                data={foods}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                onDragEnd={({ data }) => handleReorder(data)}
              />
            </View>
          )}
        </>
      )}

    </View>
  );
}
