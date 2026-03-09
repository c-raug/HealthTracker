import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SectionList,
  StyleSheet,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { MealCategory, NutritionFoodItem, SavedMeal } from '../../types';
import { useApp } from '../../context/AppContext';
import { generateId } from '../../utils/generateId';
import CreateMealFlow from './CreateMealFlow';
import EditMealFlow from './EditMealFlow';

const CATEGORY_LABELS: Record<MealCategory, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

const ALL_CATEGORIES: MealCategory[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

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
    sectionHeader: {
      ...Typography.small,
      color: colors.textSecondary,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      backgroundColor: colors.background,
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
    actionBtn: {
      padding: Spacing.xs,
    },
    mealRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    actionBtns: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    // Pin modal styles
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: Radius.lg,
      borderTopRightRadius: Radius.lg,
      paddingBottom: Spacing.xl,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      ...Typography.h3,
      color: colors.text,
    },
    modalCancelText: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    categoryLabel: {
      ...Typography.body,
      color: colors.text,
    },
    saveBtn: {
      backgroundColor: colors.primary,
      borderRadius: Radius.md,
      marginHorizontal: Spacing.md,
      marginTop: Spacing.md,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
    },
    saveBtnText: {
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

export default function AddMealTab({ date, category, onDone }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { savedMeals, dispatch } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [editingMeal, setEditingMeal] = useState<SavedMeal | null>(null);
  const [pinning, setPinning] = useState<SavedMeal | null>(null);
  const [selectedPins, setSelectedPins] = useState<MealCategory[]>([]);

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

  const handleOpenPin = (meal: SavedMeal) => {
    setPinning(meal);
    setSelectedPins(meal.pinnedCategories ?? []);
  };

  const handleToggleCategory = (cat: MealCategory) => {
    setSelectedPins((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const handleSavePin = () => {
    if (!pinning) return;
    dispatch({
      type: 'UPDATE_SAVED_MEAL',
      meal: { ...pinning, pinnedCategories: selectedPins },
    });
    setPinning(null);
  };

  if (showCreate) {
    return <CreateMealFlow onDone={() => setShowCreate(false)} />;
  }

  if (editingMeal) {
    return <EditMealFlow meal={editingMeal} onDone={() => setEditingMeal(null)} />;
  }

  const totalCalories = (foods: NutritionFoodItem[]) =>
    foods.reduce((sum, f) => sum + (f.calories ?? 0), 0);

  const pinnedMeals = savedMeals.filter((m) => m.pinnedCategories?.includes(category));
  const otherMeals = savedMeals.filter((m) => !m.pinnedCategories?.includes(category));

  const hasPinned = pinnedMeals.length > 0;

  const sections = [
    ...(hasPinned ? [{ title: 'Pinned', data: pinnedMeals }] : []),
    { title: hasPinned ? 'All Meals' : '', data: otherMeals },
  ];

  const renderMealItem = ({ item }: { item: SavedMeal }) => {
    const isPinnedHere = item.pinnedCategories?.includes(category) ?? false;
    return (
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
          <View style={styles.actionBtns}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleOpenPin(item)}
            >
              <Ionicons
                name={isPinnedHere ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={isPinnedHere ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setEditingMeal(item)}
            >
              <Ionicons name="pencil-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleDeleteMeal(item.id)}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => setShowCreate(true)}
      >
        <Ionicons name="add-circle" size={20} color={colors.primary} />
        <Text style={styles.createText}>Create New Meal</Text>
      </TouchableOpacity>

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item.id + index}
        renderItem={renderMealItem}
        renderSectionHeader={({ section }) =>
          section.title ? (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          ) : null
        }
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <Text style={styles.empty}>No saved meals yet</Text>
        }
      />

      {/* Pin category modal */}
      <Modal
        visible={pinning !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPinning(null)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setPinning(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Pin to meal categories</Text>
              <View style={{ width: 50 }} />
            </View>

            {ALL_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.categoryRow}
                onPress={() => handleToggleCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryLabel}>{CATEGORY_LABELS[cat]}</Text>
                <Ionicons
                  name={selectedPins.includes(cat) ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={selectedPins.includes(cat) ? colors.primary : colors.textSecondary}
                />
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSavePin} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}
