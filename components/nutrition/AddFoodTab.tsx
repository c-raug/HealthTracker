import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Keyboard,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { NutritionFoodItem, MealCategory, CustomFood } from '../../types';
import { useApp } from '../../context/AppContext';
import { generateId } from '../../utils/generateId';
import CustomFoodForm from './CustomFoodForm';
import PortionSelector from './PortionSelector';
import FoodFilterModal, { FoodFilters } from './FoodFilterModal';
import FloatingPillBar from './FloatingPillBar';
import FavoritePillRow from './FavoritePillRow';

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
    resultItem: {
      backgroundColor: colors.card,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    resultSelected: {
      backgroundColor: colors.primaryLight,
    },
    dragHandle: {
      paddingRight: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    foodInfo: {
      flex: 1,
    },
    resultName: {
      ...Typography.body,
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    resultInfo: {
      ...Typography.small,
      color: colors.textSecondary,
    },
    actionBtns: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    actionBtn: {
      padding: Spacing.xs,
    },
    empty: {
      ...Typography.small,
      color: colors.textSecondary,
      textAlign: 'center',
      padding: Spacing.lg,
    },
    sectionHeader: {
      ...Typography.small,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
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
    portionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
      gap: Spacing.sm,
    },
    backBtn: {
      padding: Spacing.xs,
    },
    portionTitle: {
      ...Typography.h3,
      color: colors.text,
      flex: 1,
    },
    portionActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
      padding: Spacing.md,
    },
    cancelSelectBtn: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: Radius.md,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelSelectText: {
      ...Typography.body,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    confirmBtn: {
      flex: 2,
      backgroundColor: colors.primary,
      borderRadius: Radius.md,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
    },
    confirmText: {
      ...Typography.body,
      color: colors.white,
      fontWeight: '600',
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

interface Props {
  date: string;
  category: MealCategory;
  onDone: () => void;
}

export default function AddFoodTab({ date, category, onDone }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { customFoods, nutritionLog, preferences, dispatch } = useApp();

  const [query, setQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [selectedItem, setSelectedItem] = useState<NutritionFoodItem | null>(null);
  const [servings, setServings] = useState<number>(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFood, setEditingFood] = useState<CustomFood | null>(null);
  const [editingPinned, setEditingPinned] = useState(false);

  // Pin modal state
  const [pinning, setPinning] = useState<CustomFood | null>(null);
  const [selectedPins, setSelectedPins] = useState<MealCategory[]>([]);

  // Filter state
  const [foodFilters, setFoodFilters] = useState<FoodFilters>({ foodTypes: [] });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const filtersActive = hasActiveFilters(foodFilters);

  const handleToggleFavoriteFilter = (type: string) => {
    setFoodFilters((prev) => ({
      foodTypes: prev.foodTypes.includes(type)
        ? prev.foodTypes.filter((t) => t !== type)
        : [...prev.foodTypes, type],
    }));
  };

  // Compute food frequency map from all logged entries (by name)
  const foodFrequencyMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const day of nutritionLog) {
      for (const foods of Object.values(day.meals)) {
        for (const food of foods) {
          const key = food.name.toLowerCase().trim();
          map[key] = (map[key] ?? 0) + 1;
        }
      }
    }
    return map;
  }, [nutritionLog]);

  const trimmed = query.trim().toLowerCase();
  const isSearching = trimmed.length > 0;
  // When search is expanded but nothing typed yet, keep the list blank until the user types
  const showList = !searchExpanded || isSearching;

  const textFiltered = isSearching
    ? customFoods.filter((f) => f.name.toLowerCase().includes(trimmed))
    : customFoods;

  const filtered = filtersActive ? applyFoodFilters(textFiltered, foodFilters) : textFiltered;

  const sortedPinned = filtered
    .filter((f) => f.pinnedCategories?.includes(category))
    .sort((a, b) => (a.pinnedOrder?.[category] ?? Infinity) - (b.pinnedOrder?.[category] ?? Infinity));

  const recentFoods = useMemo(() => {
    if (isSearching) return [];
    const base = filtersActive ? applyFoodFilters(customFoods, foodFilters) : customFoods;
    return base
      .filter((f) => !f.pinnedCategories?.includes(category) && (foodFrequencyMap[f.name.toLowerCase().trim()] ?? 0) > 0)
      .sort((a, b) =>
        (foodFrequencyMap[b.name.toLowerCase().trim()] ?? 0) -
        (foodFrequencyMap[a.name.toLowerCase().trim()] ?? 0)
      )
      .slice(0, 7);
  }, [isSearching, customFoods, foodFrequencyMap, filtersActive, foodFilters, category]);

  const unpinned = isSearching ? filtered.filter((f) => !f.pinnedCategories?.includes(category)) : [];

  const isEmpty = isSearching
    ? sortedPinned.length === 0 && unpinned.length === 0
    : sortedPinned.length === 0 && recentFoods.length === 0;

  const toNutritionItem = useCallback((f: CustomFood): NutritionFoodItem => ({
    id: f.id,
    name: f.name,
    calories: f.calories,
    protein: f.protein,
    carbs: f.carbs,
    fat: f.fat,
    servingSize: f.servingSize,
    servings: 1,
  }), []);

  const handleOpenPin = (food: CustomFood) => {
    setPinning(food);
    setSelectedPins(food.pinnedCategories ?? []);
  };

  const handleTogglePinCategory = (cat: MealCategory) => {
    setSelectedPins((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const handleSavePin = () => {
    if (!pinning) return;
    dispatch({
      type: 'UPDATE_CUSTOM_FOOD',
      food: { ...pinning, pinnedCategories: selectedPins },
    });
    setPinning(null);
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_CUSTOM_FOOD', id });
    if (selectedItem?.id === id) setSelectedItem(null);
  };

  const handleSelectFood = (food: CustomFood) => {
    Keyboard.dismiss();
    setSelectedItem(toNutritionItem(food));
    setServings(1);
  };

  const handleConfirmAdd = () => {
    if (!selectedItem) return;

    const food: NutritionFoodItem = {
      ...selectedItem,
      id: generateId(),
      calories: Math.round((selectedItem.calories ?? 0) * servings),
      protein: Math.round(((selectedItem.protein ?? 0) * servings) * 10) / 10,
      carbs: Math.round(((selectedItem.carbs ?? 0) * servings) * 10) / 10,
      fat: Math.round(((selectedItem.fat ?? 0) * servings) * 10) / 10,
      servings,
    };

    dispatch({ type: 'ADD_FOOD_TO_MEAL', date, category, food });
    onDone();
  };

  const isPinnedHere = (food: CustomFood) => food.pinnedCategories?.includes(category) ?? false;

  if (showCreateForm) {
    return (
      <CustomFoodForm
        onDone={(createdFood) => {
          setShowCreateForm(false);
          if (createdFood) {
            setSelectedItem(toNutritionItem(createdFood));
            setServings(1);
          }
        }}
        initialName={query.trim()}
      />
    );
  }

  if (editingFood) {
    return (
      <CustomFoodForm
        initialFood={editingFood}
        mode="edit"
        onDone={() => setEditingFood(null)}
      />
    );
  }

  if (selectedItem) {
    return (
      <View style={styles.container}>
        <View style={styles.portionHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setSelectedItem(null)}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.portionTitle} numberOfLines={1}>{selectedItem.name}</Text>
        </View>
        <PortionSelector
          value={servings}
          onChange={setServings}
          baseCalories={selectedItem.calories ?? 0}
          baseProtein={selectedItem.protein ?? 0}
          baseCarbs={selectedItem.carbs ?? 0}
          baseFat={selectedItem.fat ?? 0}
          servingSize={selectedItem.servingSize ?? '1 serving'}
          baseServings={1}
          foodName={selectedItem.name}
        />
        <View style={styles.portionActions}>
          <TouchableOpacity
            style={styles.cancelSelectBtn}
            onPress={() => setSelectedItem(null)}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelSelectText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmAdd} activeOpacity={0.8}>
            <Text style={styles.confirmText}>Add to {category}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderPinnedItem = ({ item, drag, isActive }: RenderItemParams<CustomFood>) => (
    <ScaleDecorator>
      <TouchableOpacity
        style={[styles.resultItem, isActive && styles.resultSelected]}
        onPress={() => !editingPinned && handleSelectFood(item)}
        activeOpacity={0.7}
      >
        {editingPinned && (
          <TouchableOpacity style={styles.dragHandle} onLongPress={drag} delayLongPress={100} activeOpacity={0.4}>
            <Ionicons name="reorder-three-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        <View style={styles.foodInfo}>
          <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.resultInfo}>
            {item.calories} cal
            {item.servingSize ? ` · ${item.servingSize}` : ''}
            {item.protein != null ? ` · P: ${item.protein}g` : ''}
          </Text>
        </View>
        {!editingPinned && (
          <View style={styles.actionBtns}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleOpenPin(item)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isPinnedHere(item) ? 'pin' : 'pin-outline'}
                size={18}
                color={isPinnedHere(item) ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => { setSelectedItem(null); setEditingFood(item); }}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleDelete(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </ScaleDecorator>
  );

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
              renderItem={renderPinnedItem}
              onDragEnd={({ data }) =>
                dispatch({ type: 'REORDER_PINNED_FOODS', category, ids: data.map((f) => f.id) })
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
                  onPress={() => handleTogglePinCategory(cat)}
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
      {!(searchExpanded && !isSearching) && (
        <FavoritePillRow
          favorites={preferences.favoriteFilterTypes ?? []}
          activeFilters={foodFilters.foodTypes}
          onToggle={handleToggleFavoriteFilter}
        />
      )}
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
            {sortedPinned.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.resultItem}
                onPress={() => handleSelectFood(item)}
                activeOpacity={0.7}
              >
                <View style={styles.foodInfo}>
                  <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.resultInfo}>
                    {item.calories} cal
                    {item.servingSize ? ` · ${item.servingSize}` : ''}
                    {item.protein != null ? ` · P: ${item.protein}g` : ''}
                  </Text>
                </View>
                <View style={styles.actionBtns}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleOpenPin(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isPinnedHere(item) ? 'pin' : 'pin-outline'}
                      size={18}
                      color={isPinnedHere(item) ? colors.primary : colors.textSecondary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => { setSelectedItem(null); setEditingFood(item); }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDelete(item.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* When not searching: show Recent section (top 7 by frequency) */}
        {showList && !isSearching && recentFoods.length > 0 && (
          <>
            <Text style={[styles.sectionHeader, { marginTop: Spacing.sm }]}>Recent</Text>
            {recentFoods.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.resultItem}
                onPress={() => handleSelectFood(item)}
                activeOpacity={0.7}
              >
                <View style={styles.foodInfo}>
                  <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.resultInfo}>
                    {item.calories} cal
                    {item.servingSize ? ` · ${item.servingSize}` : ''}
                    {item.protein != null ? ` · P: ${item.protein}g` : ''}
                  </Text>
                </View>
                <View style={styles.actionBtns}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleOpenPin(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isPinnedHere(item) ? 'pin' : 'pin-outline'}
                      size={18}
                      color={isPinnedHere(item) ? colors.primary : colors.textSecondary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => { setSelectedItem(null); setEditingFood(item); }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDelete(item.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* When searching: show My Foods (all matching unpinned) */}
        {showList && isSearching && unpinned.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>My Foods</Text>
            {unpinned.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.resultItem}
                onPress={() => handleSelectFood(item)}
                activeOpacity={0.7}
              >
                <View style={styles.foodInfo}>
                  <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.resultInfo}>
                    {item.calories} cal
                    {item.servingSize ? ` · ${item.servingSize}` : ''}
                    {item.protein != null ? ` · P: ${item.protein}g` : ''}
                  </Text>
                </View>
                <View style={styles.actionBtns}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleOpenPin(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isPinnedHere(item) ? 'pin' : 'pin-outline'}
                      size={18}
                      color={isPinnedHere(item) ? colors.primary : colors.textSecondary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => { setSelectedItem(null); setEditingFood(item); }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDelete(item.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Empty state: search expanded with no text yet, or searching with no results */}
        {searchExpanded && !isSearching && (
          <Text style={styles.empty}>No results found</Text>
        )}

        {showList && isEmpty && (
          <Text style={styles.empty}>
            {isSearching || filtersActive
              ? 'No results found'
              : 'No custom foods yet. Tap "Create Custom Food" to add one.'}
          </Text>
        )}
      </ScrollView>

      <FloatingPillBar
        onCreate={() => setShowCreateForm(true)}
        searchExpanded={searchExpanded}
        searchValue={query}
        onSearchChange={setQuery}
        onSearchToggle={setSearchExpanded}
        onFilterPress={() => setShowFilterModal(true)}
        hasActiveFilter={filtersActive}
        onCreateSearch={() => setShowCreateForm(true)}
      />

      {/* Filter modal */}
      <FoodFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={setFoodFilters}
        currentFilters={foodFilters}
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
                onPress={() => handleTogglePinCategory(cat)}
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
