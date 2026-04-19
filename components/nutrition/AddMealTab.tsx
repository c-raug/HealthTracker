import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { MealCategory, NutritionFoodItem, SavedMeal } from '../../types';
import { useApp } from '../../context/AppContext';
import { generateId } from '../../utils/generateId';
import CreateMealFlow from './CreateMealFlow';
import EditMealFlow from './EditMealFlow';
import FloatingPillBar from './FloatingPillBar';
import FoodFilterModal, { FoodFilters } from './FoodFilterModal';

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
    listContent: {
      paddingBottom: 80,
    },
    sectionHeader: {
      ...Typography.small,
      color: colors.textSecondary,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      backgroundColor: colors.background,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingRight: Spacing.md,
      backgroundColor: colors.background,
    },
    editModeBtn: {
      ...Typography.small,
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
      marginBottom: Spacing.xs,
    },
    mealInfo: {
      ...Typography.small,
      color: colors.textSecondary,
    },
    empty: {
      ...Typography.small,
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
    dragHandle: {
      paddingRight: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    // Pin modal styles
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.35)',
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
  const { savedMeals, customFoods, dispatch } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [editingMeal, setEditingMeal] = useState<SavedMeal | null>(null);
  const [pinning, setPinning] = useState<SavedMeal | null>(null);
  const [selectedPins, setSelectedPins] = useState<MealCategory[]>([]);
  const [editingPinned, setEditingPinned] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [mealFilters, setMealFilters] = useState<FoodFilters>({ foodTypes: [] });
  const [showFilterModal, setShowFilterModal] = useState(false);

  const handleAddMeal = (mealId: string) => {
    const meal = savedMeals.find((m) => m.id === mealId);
    if (!meal) return;

    const groupId = generateId();
    meal.foods.forEach((food) => {
      const newFood: NutritionFoodItem = {
        ...food,
        id: generateId(),
        mealGroupId: groupId,
        mealGroupName: meal.name,
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

  const trimmed = searchQuery.trim().toLowerCase();
  const filtersActive = mealFilters.foodTypes.length > 0;
  // When search is expanded but nothing typed yet, keep the list blank until the user types
  const showList = !searchExpanded || trimmed.length > 0;

  const customFoodTypesByName: Record<string, string[]> = {};
  customFoods.forEach((f) => {
    if (f.foodTypes && f.foodTypes.length > 0) {
      customFoodTypesByName[f.name.toLowerCase().trim()] = f.foodTypes;
    }
  });

  const mealMatchesFilters = (meal: SavedMeal): boolean => {
    if (!filtersActive) return true;
    return meal.foods.some((f) => {
      const types = customFoodTypesByName[f.name.toLowerCase().trim()];
      return types && types.some((t) => mealFilters.foodTypes.includes(t));
    });
  };

  const mealMatchesQuery = (meal: SavedMeal): boolean =>
    trimmed.length === 0 || meal.name.toLowerCase().includes(trimmed);

  const visibleMeals = savedMeals.filter((m) => mealMatchesQuery(m) && mealMatchesFilters(m));

  const sortedPinned = visibleMeals
    .filter((m) => m.pinnedCategories?.includes(category))
    .sort((a, b) => {
      const aOrder = a.pinnedOrder?.[category] ?? Infinity;
      const bOrder = b.pinnedOrder?.[category] ?? Infinity;
      return aOrder - bOrder;
    });
  const otherMeals = visibleMeals.filter((m) => !m.pinnedCategories?.includes(category));

  const isEmpty = sortedPinned.length === 0 && otherMeals.length === 0;

  const renderPinnedMealItem = ({ item, drag, isActive }: RenderItemParams<SavedMeal>) => {
    const isPinnedHere = item.pinnedCategories?.includes(category) ?? false;
    return (
      <ScaleDecorator>
        <TouchableOpacity
          style={[styles.mealItem, isActive && { opacity: 0.8 }]}
          onPress={() => !editingPinned && handleAddMeal(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.mealRow}>
            {editingPinned && (
              <TouchableOpacity style={styles.dragHandle} onLongPress={drag} delayLongPress={100} activeOpacity={0.4}>
                <Ionicons name="reorder-three-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.mealName}>{item.name}</Text>
              <Text style={styles.mealInfo}>
                {item.foods.length} food{item.foods.length !== 1 ? 's' : ''} · {totalCalories(item.foods)} cal
              </Text>
            </View>
            {!editingPinned && (
              <View style={styles.actionBtns}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleOpenPin(item)}
                >
                  <Ionicons
                    name={isPinnedHere ? 'pin' : 'pin-outline'}
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
            )}
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  if (editingPinned) {
    return (
      <View style={styles.container}>
        {sortedPinned.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Pinned</Text>
              <TouchableOpacity onPress={() => setEditingPinned(false)}>
                <Text style={styles.editModeBtn}>Done</Text>
              </TouchableOpacity>
            </View>
            <DraggableFlatList
              data={sortedPinned}
              keyExtractor={(item) => item.id}
              renderItem={renderPinnedMealItem}
              onDragEnd={({ data }) =>
                dispatch({
                  type: 'REORDER_PINNED_MEALS',
                  category,
                  ids: data.map((m) => m.id),
                })
              }
            />
          </>
        )}

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

  return (
    <View style={styles.container}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
      >
        {showList && sortedPinned.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Pinned</Text>
              <TouchableOpacity onPress={() => setEditingPinned(true)}>
                <Text style={styles.editModeBtn}>Edit</Text>
              </TouchableOpacity>
            </View>
            {sortedPinned.map((item) => {
              const isPinnedHere = item.pinnedCategories?.includes(category) ?? false;
              return (
                <TouchableOpacity
                  key={item.id}
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
                          name={isPinnedHere ? 'pin' : 'pin-outline'}
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
            })}
          </>
        )}

        {showList && otherMeals.length > 0 && (
          <>
            {sortedPinned.length > 0 && (
              <Text style={styles.sectionHeader}>All Meals</Text>
            )}
            {otherMeals.map((item) => {
              const isPinnedHere = item.pinnedCategories?.includes(category) ?? false;
              return (
                <TouchableOpacity
                  key={item.id}
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
                          name={isPinnedHere ? 'pin' : 'pin-outline'}
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
            })}
          </>
        )}

        {showList && isEmpty && (
          <Text style={styles.empty}>
            {searchQuery.trim() || filtersActive ? 'No meals match your search' : 'No saved meals yet'}
          </Text>
        )}
      </ScrollView>

      <FloatingPillBar
        onCreate={() => setShowCreate(true)}
        searchExpanded={searchExpanded}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchToggle={setSearchExpanded}
        onFilterPress={() => setShowFilterModal(true)}
        hasActiveFilter={filtersActive}
      />

      <FoodFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={setMealFilters}
        currentFilters={mealFilters}
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
