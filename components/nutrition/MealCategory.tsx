import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Swipeable, TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import type { NutritionFoodItem, MealCategory as MealCategoryType } from '../../types';
import { useApp } from '../../context/AppContext';
import { generateId } from '../../utils/generateId';
import FoodItem from './FoodItem';

const SAVE_AS_MEAL_BLUE = '#2196F3';

const CATEGORY_LABELS: Record<MealCategoryType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

type MealGroup = {
  mealGroupId: string;
  mealGroupName: string;
  foods: NutritionFoodItem[];
};

type TopLevelItem =
  | { kind: 'food'; food: NutritionFoodItem }
  | { kind: 'group'; group: MealGroup };

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      marginBottom: Spacing.sm,
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    contentArea: {
      overflow: 'hidden',
      borderBottomLeftRadius: Radius.lg,
      borderBottomRightRadius: Radius.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: colors.card,
      borderTopLeftRadius: Radius.lg,
      borderTopRightRadius: Radius.lg,
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
    saveAsAction: {
      backgroundColor: SAVE_AS_MEAL_BLUE,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      borderTopRightRadius: Radius.lg,
      borderBottomRightRadius: Radius.lg,
    },
    emptyText: {
      ...Typography.small,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: Spacing.md,
    },
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: colors.card,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    groupHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      flex: 1,
    },
    groupDragHandle: {
      paddingRight: Spacing.xs,
      paddingVertical: Spacing.xs,
      justifyContent: 'center',
    },
    groupName: {
      ...Typography.body,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    groupInfo: {
      ...Typography.small,
      color: colors.textSecondary,
    },
    removeMealAction: {
      backgroundColor: colors.danger,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
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
  const { dispatch, nutritionLog, preferences } = useApp();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(!(preferences.sectionsExpanded ?? false));
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const swipeableRef = useRef<Swipeable>(null);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (!preferences.sectionsExpanded) setCollapsed(true);
      };
    }, [preferences.sectionsExpanded]),
  );
  const groupSwipeableRefs = useRef<Record<string, Swipeable | null>>({});

  // Split foods into ungrouped and grouped, preserving original order
  const mealGroupsMap = new Map<string, MealGroup>();
  const seenGroupIds = new Set<string>();
  const topLevelItems: TopLevelItem[] = [];

  foods.forEach((f) => {
    if (!f.mealGroupId) {
      topLevelItems.push({ kind: 'food', food: f });
    } else {
      const gid = f.mealGroupId;
      if (!mealGroupsMap.has(gid)) {
        mealGroupsMap.set(gid, { mealGroupId: gid, mealGroupName: f.mealGroupName ?? 'Saved Meal', foods: [] });
      }
      mealGroupsMap.get(gid)!.foods.push(f);
      // Insert group item at first occurrence position
      if (!seenGroupIds.has(gid)) {
        seenGroupIds.add(gid);
        topLevelItems.push({ kind: 'group', group: mealGroupsMap.get(gid)! });
      }
    }
  });

  const totalCal = foods.reduce((sum, f) => sum + (f.calories ?? 0), 0);

  const handleDelete = (foodId: string) => {
    dispatch({ type: 'DELETE_FOOD_FROM_MEAL', date, category, foodId });
  };

  const handleAdd = () => {
    router.push({
      pathname: '/add-food-modal',
      params: { date, category },
    });
  };

  const handleSaveAsMeal = () => {
    swipeableRef.current?.close();
    if (foods.length === 0) return;

    Alert.alert(
      `Save ${CATEGORY_LABELS[category]} as a Custom Meal?`,
      'You can review and edit the foods before saving.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: () => {
            const freshFoods = foods.map((f) => ({ ...f, id: generateId() }));
            router.push({
              pathname: '/create-meal-modal',
              params: {
                initialFoodsJson: JSON.stringify(freshFoods),
                initialMealName: CATEGORY_LABELS[category],
              },
            });
          },
        },
      ],
    );
  };

  const renderSaveAsAction = () => (
    <TouchableOpacity style={styles.saveAsAction} onPress={handleSaveAsMeal}>
      <Ionicons name="bookmark-outline" size={22} color={colors.white} />
    </TouchableOpacity>
  );

  const handleCopy = () => {
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

  const handleRemoveGroup = (group: MealGroup) => {
    groupSwipeableRefs.current[group.mealGroupId]?.close();
    Alert.alert(
      `Remove ${group.mealGroupName}?`,
      `Remove all ${group.foods.length} food${group.foods.length === 1 ? '' : 's'} from this meal group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            group.foods.forEach((food) => {
              dispatch({ type: 'DELETE_FOOD_FROM_MEAL', date, category, foodId: food.id });
            });
          },
        },
      ],
    );
  };

  const handleDragEnd = ({ data }: { data: TopLevelItem[] }) => {
    const newFoods: NutritionFoodItem[] = [];
    data.forEach((item) => {
      if (item.kind === 'food') {
        newFoods.push(item.food);
      } else {
        item.group.foods.forEach((f) => newFoods.push(f));
      }
    });
    dispatch({ type: 'REORDER_MEAL_FOODS', date, category, foods: newFoods });
  };

  const renderTopLevelItem = ({ item, drag, isActive }: RenderItemParams<TopLevelItem>) => {
    if (item.kind === 'food') {
      return (
        <ScaleDecorator>
          <FoodItem
            item={item.food}
            onDelete={() => handleDelete(item.food.id)}
            drag={drag}
            isActive={isActive}
            date={date}
            category={category}
          />
        </ScaleDecorator>
      );
    }

    // Group item
    const { group } = item;
    const isGroupCollapsed = collapsedGroups[group.mealGroupId] ?? true;
    const groupCal = group.foods.reduce((sum, f) => sum + (f.calories ?? 0), 0);

    return (
      <ScaleDecorator>
        <View style={isActive ? { opacity: 0.8 } : undefined}>
          <Swipeable
            ref={(ref) => { groupSwipeableRefs.current[group.mealGroupId] = ref; }}
            renderRightActions={() => (
              <TouchableOpacity
                style={styles.removeMealAction}
                onPress={() => handleRemoveGroup(group)}
              >
                <Ionicons name="trash-outline" size={20} color={colors.white} />
              </TouchableOpacity>
            )}
            overshootRight={false}
          >
            <View style={styles.groupHeader}>
              <TouchableOpacity
                style={styles.groupDragHandle}
                onLongPress={drag}
                delayLongPress={100}
                activeOpacity={0.4}
              >
                <Ionicons name="reorder-three" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <GHTouchableOpacity
                style={styles.groupHeaderLeft}
                onPress={() =>
                  setCollapsedGroups((prev) => ({
                    ...prev,
                    [group.mealGroupId]: !isGroupCollapsed,
                  }))
                }
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isGroupCollapsed ? 'chevron-forward' : 'chevron-down'}
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.groupName} numberOfLines={1}>{group.mealGroupName}</Text>
                <Text style={styles.groupInfo}>· {groupCal} cal</Text>
              </GHTouchableOpacity>
            </View>
          </Swipeable>
          {!isGroupCollapsed && group.foods.map((food) => (
            <FoodItem
              key={food.id}
              item={food}
              onDelete={() => handleDelete(food.id)}
              date={date}
              category={category}
            />
          ))}
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <View style={styles.container}>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderSaveAsAction}
        overshootRight={false}
      >
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
      </Swipeable>

      {!collapsed && (
        <View style={styles.contentArea}>
          {foods.length === 0 && (
            <Text style={styles.emptyText}>No foods logged</Text>
          )}

          {topLevelItems.length > 0 && (
            <DraggableFlatList
              data={topLevelItems}
              keyExtractor={(item) =>
                item.kind === 'food' ? item.food.id : item.group.mealGroupId
              }
              scrollEnabled={false}
              onDragEnd={handleDragEnd}
              renderItem={renderTopLevelItem}
            />
          )}
        </View>
      )}
    </View>
  );
}
