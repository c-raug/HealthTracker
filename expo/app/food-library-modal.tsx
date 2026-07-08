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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, LightColors, Spacing, Typography } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { CustomFood, SavedMeal } from '../types';
import CustomFoodForm from '../components/nutrition/CustomFoodForm';
import CreateMealFlow from '../components/nutrition/CreateMealFlow';
import EditMealFlow from '../components/nutrition/EditMealFlow';
import FoodFilterModal, { FoodFilters } from '../components/nutrition/FoodFilterModal';
import FloatingPillBar from '../components/nutrition/FloatingPillBar';
import FavoritePillRow from '../components/nutrition/FavoritePillRow';

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      backgroundColor: colors.card,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      ...Typography.h2,
      color: colors.text,
      marginLeft: Spacing.sm,
    },
    tabRow: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    tabText: {
      ...Typography.body,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    tabTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    listContent: {
      flex: 1,
    },
    flatListContent: {
      paddingBottom: 80,
    },
    foodRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    foodInfo: {
      flex: 1,
    },
    foodName: {
      ...Typography.body,
      color: colors.text,
    },
    foodMeta: {
      ...Typography.small,
      color: colors.textSecondary,
    },
    actionBtn: {
      padding: Spacing.xs,
      marginLeft: Spacing.xs,
    },
    emptyText: {
      ...Typography.small,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: Spacing.lg,
    },
    panelContainer: {
      flex: 1,
    },
  });

function applyFoodFilters(foods: CustomFood[], filters: FoodFilters): CustomFood[] {
  return foods.filter((food) => {
    if (filters.foodTypes.length > 0) {
      if (!food.foodTypes || !food.foodTypes.some((t) => filters.foodTypes.includes(t))) {
        return false;
      }
    }
    return true;
  });
}

function hasActiveFilters(filters: FoodFilters): boolean {
  return filters.foodTypes.length > 0;
}

type Tab = 'foods' | 'meals';
type FoodsView = 'list' | 'create' | 'edit';
type MealsView = 'list' | 'create' | 'edit';

export default function FoodLibraryModal() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { customFoods, savedMeals, preferences, dispatch } = useApp();

  const [activeTab, setActiveTab] = useState<Tab>('foods');
  const [foodQuery, setFoodQuery] = useState('');
  const [mealQuery, setMealQuery] = useState('');

  // Filter state
  const [foodFilters, setFoodFilters] = useState<FoodFilters>({ foodTypes: [] });
  const [mealFilters, setMealFilters] = useState<FoodFilters>({ foodTypes: [] });
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Search expansion state
  const [foodsSearchExpanded, setFoodsSearchExpanded] = useState(false);
  const [mealsSearchExpanded, setMealsSearchExpanded] = useState(false);

  // Foods sub-view state
  const [foodsView, setFoodsView] = useState<FoodsView>('list');
  const [editingFood, setEditingFood] = useState<CustomFood | null>(null);

  // Meals sub-view state
  const [mealsView, setMealsView] = useState<MealsView>('list');
  const [editingMeal, setEditingMeal] = useState<SavedMeal | null>(null);

  // Filtered & sorted lists
  const sortedFoods = [...customFoods]
    .sort((a, b) => a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()));

  // Apply text search
  const textFilteredFoods = foodQuery.trim()
    ? sortedFoods.filter((f) => f.name.toLocaleLowerCase().includes(foodQuery.trim().toLocaleLowerCase()))
    : sortedFoods;

  // Apply category filters
  const filteredFoods = hasActiveFilters(foodFilters)
    ? applyFoodFilters(textFilteredFoods, foodFilters)
    : textFilteredFoods;

  const sortedMeals = [...savedMeals]
    .sort((a, b) => a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()));

  // Build a lookup of food types by custom food name for meal filtering
  const customFoodTypesByName: Record<string, string[]> = {};
  customFoods.forEach((f) => {
    if (f.foodTypes && f.foodTypes.length > 0) {
      customFoodTypesByName[f.name.toLocaleLowerCase().trim()] = f.foodTypes;
    }
  });

  const mealFiltersActive = hasActiveFilters(mealFilters);
  const mealMatchesFilters = (meal: SavedMeal): boolean => {
    if (!mealFiltersActive) return true;
    return meal.foods.some((f) => {
      const types = customFoodTypesByName[f.name.toLocaleLowerCase().trim()];
      return types && types.some((t) => mealFilters.foodTypes.includes(t));
    });
  };

  const textFilteredMeals = mealQuery.trim()
    ? sortedMeals.filter((m) => m.name.toLocaleLowerCase().includes(mealQuery.trim().toLocaleLowerCase()))
    : sortedMeals;
  const filteredMeals = textFilteredMeals.filter(mealMatchesFilters);

  // Delete food
  const handleDeleteFood = (food: CustomFood) => {
    Alert.alert(
      'Delete Food',
      `Delete "${food.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch({ type: 'DELETE_CUSTOM_FOOD', id: food.id }),
        },
      ],
    );
  };

  // Delete meal
  const handleDeleteMeal = (meal: SavedMeal) => {
    Alert.alert(
      'Delete Meal',
      `Delete "${meal.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch({ type: 'DELETE_SAVED_MEAL', id: meal.id }),
        },
      ],
    );
  };

  const handleBack = () => {
    if (activeTab === 'foods' && foodsView !== 'list') {
      setFoodsView('list');
      setEditingFood(null);
    } else if (activeTab === 'meals' && mealsView !== 'list') {
      setMealsView('list');
      setEditingMeal(null);
    } else {
      router.back();
    }
  };

  const showingSubPanel =
    (activeTab === 'foods' && foodsView !== 'list') ||
    (activeTab === 'meals' && mealsView !== 'list');

  const filtersActive = hasActiveFilters(foodFilters);

  const handleToggleFoodFavoriteFilter = (type: string) => {
    setFoodFilters((prev) => ({
      foodTypes: prev.foodTypes.includes(type)
        ? prev.foodTypes.filter((t) => t !== type)
        : [...prev.foodTypes, type],
    }));
  };

  const handleToggleMealFavoriteFilter = (type: string) => {
    setMealFilters((prev) => ({
      foodTypes: prev.foodTypes.includes(type)
        ? prev.foodTypes.filter((t) => t !== type)
        : [...prev.foodTypes, type],
    }));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food Library</Text>
      </View>

      {/* Tab switcher — hidden while in a sub-panel */}
      {!showingSubPanel && (
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'foods' && styles.tabActive]}
            onPress={() => setActiveTab('foods')}
          >
            <Text style={[styles.tabText, activeTab === 'foods' && styles.tabTextActive]}>
              Foods
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'meals' && styles.tabActive]}
            onPress={() => setActiveTab('meals')}
          >
            <Text style={[styles.tabText, activeTab === 'meals' && styles.tabTextActive]}>
              Meals
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Favorite filter pills — hidden while in sub-panels */}
      {!showingSubPanel && activeTab === 'foods' && (
        <FavoritePillRow
          favorites={preferences.favoriteFilterTypes ?? []}
          activeFilters={foodFilters.foodTypes}
          onToggle={handleToggleFoodFavoriteFilter}
        />
      )}
      {!showingSubPanel && activeTab === 'meals' && (
        <FavoritePillRow
          favorites={preferences.favoriteFilterTypes ?? []}
          activeFilters={mealFilters.foodTypes}
          onToggle={handleToggleMealFavoriteFilter}
        />
      )}

      {/* Foods tab */}
      {activeTab === 'foods' && foodsView === 'list' && (
        <View style={styles.listContent}>
          <FlatList
            data={filteredFoods}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.flatListContent}
            renderItem={({ item }) => (
              <View style={styles.foodRow}>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.foodMeta}>
                    {item.calories} cal · {item.servingSize}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => { setEditingFood(item); setFoodsView('edit'); }}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="pencil-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleDeleteFood(item)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {foodQuery.trim() || filtersActive
                  ? 'No foods match your search or filters.'
                  : 'No custom foods yet. Create one!'}
              </Text>
            }
          />
          <FloatingPillBar
            onCreate={() => { setEditingFood(null); setFoodsView('create'); }}
            searchExpanded={foodsSearchExpanded}
            searchValue={foodQuery}
            onSearchChange={setFoodQuery}
            onSearchToggle={setFoodsSearchExpanded}
            onFilterPress={() => setShowFilterModal(true)}
            hasActiveFilter={filtersActive}
          />
        </View>
      )}

      {/* Foods: Create sub-panel */}
      {activeTab === 'foods' && foodsView === 'create' && (
        <View style={styles.panelContainer}>
          <CustomFoodForm
            mode="create"
            onDone={() => { setFoodsView('list'); }}
          />
        </View>
      )}

      {/* Foods: Edit sub-panel */}
      {activeTab === 'foods' && foodsView === 'edit' && editingFood && (
        <View style={styles.panelContainer}>
          <CustomFoodForm
            mode="edit"
            initialFood={editingFood}
            onDone={() => { setFoodsView('list'); setEditingFood(null); }}
          />
        </View>
      )}

      {/* Meals tab */}
      {activeTab === 'meals' && mealsView === 'list' && (
        <View style={styles.listContent}>
          <FlatList
            data={filteredMeals}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.flatListContent}
            renderItem={({ item }) => {
              const totalCal = item.foods.reduce((sum, f) => sum + (f.calories ?? 0), 0);
              return (
                <View style={styles.foodRow}>
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.foodMeta}>
                      {item.foods.length} food{item.foods.length !== 1 ? 's' : ''} · {totalCal} cal
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => { setEditingMeal(item); setMealsView('edit'); }}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons name="pencil-outline" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDeleteMeal(item)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {mealQuery.trim() || mealFiltersActive
                  ? 'No meals match your search or filters.'
                  : 'No saved meals yet. Create one!'}
              </Text>
            }
          />
          <FloatingPillBar
            onCreate={() => { setEditingMeal(null); setMealsView('create'); }}
            searchExpanded={mealsSearchExpanded}
            searchValue={mealQuery}
            onSearchChange={setMealQuery}
            onSearchToggle={setMealsSearchExpanded}
            onFilterPress={() => setShowFilterModal(true)}
            hasActiveFilter={mealFiltersActive}
          />
        </View>
      )}

      {/* Meals: Create sub-panel */}
      {activeTab === 'meals' && mealsView === 'create' && (
        <View style={styles.panelContainer}>
          <CreateMealFlow
            onDone={() => { setMealsView('list'); }}
          />
        </View>
      )}

      {/* Meals: Edit sub-panel */}
      {activeTab === 'meals' && mealsView === 'edit' && editingMeal && (
        <View style={styles.panelContainer}>
          <EditMealFlow
            meal={editingMeal}
            onDone={() => { setMealsView('list'); setEditingMeal(null); }}
          />
        </View>
      )}

      {/* Filter modal */}
      <FoodFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={activeTab === 'foods' ? setFoodFilters : setMealFilters}
        currentFilters={activeTab === 'foods' ? foodFilters : mealFilters}
      />
    </SafeAreaView>
  );
}
