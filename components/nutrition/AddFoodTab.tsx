import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  NestableScrollContainer,
  NestableDraggableFlatList,
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { NutritionFoodItem, MealCategory, CustomFood } from '../../types';
import { useApp } from '../../context/AppContext';
import { generateId } from '../../utils/generateId';
import CustomFoodForm from './CustomFoodForm';
import PortionSelector from './PortionSelector';

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    searchInput: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      ...Typography.body,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
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
  });

interface Props {
  date: string;
  category: MealCategory;
  onDone: () => void;
}

export default function AddFoodTab({ date, category, onDone }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { customFoods, dispatch } = useApp();

  const [query, setQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<NutritionFoodItem | null>(null);
  const [servings, setServings] = useState<number>(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFood, setEditingFood] = useState<CustomFood | null>(null);

  // Filter custom foods by query
  const trimmed = query.trim().toLowerCase();
  const filtered = trimmed.length === 0
    ? customFoods
    : customFoods.filter((f) => f.name.toLowerCase().includes(trimmed));

  const sortedPinned = filtered
    .filter((f) => f.pinned)
    .sort((a, b) => (a.pinnedOrder ?? Infinity) - (b.pinnedOrder ?? Infinity));
  const unpinned = filtered.filter((f) => !f.pinned);

  const isEmpty = sortedPinned.length === 0 && unpinned.length === 0;

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

  const handleTogglePin = (food: CustomFood) => {
    dispatch({ type: 'UPDATE_CUSTOM_FOOD', food: { ...food, pinned: !food.pinned } });
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
        onPress={() => handleSelectFood(item)}
        activeOpacity={0.7}
      >
        <TouchableOpacity style={styles.dragHandle} onPressIn={drag} activeOpacity={0.4}>
          <Ionicons name="reorder-three-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
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
            onPress={() => handleTogglePin(item)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={item.pinned ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={item.pinned ? colors.primary : colors.textSecondary}
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
    </ScaleDecorator>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search foods..."
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
        />
      </View>

      <NestableScrollContainer keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setShowCreateForm(true)}
        >
          <Ionicons name="add-circle" size={20} color={colors.primary} />
          <Text style={styles.createText}>Create Custom Food</Text>
        </TouchableOpacity>

        {sortedPinned.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Pinned</Text>
            <NestableDraggableFlatList
              data={sortedPinned}
              keyExtractor={(item) => item.id}
              renderItem={renderPinnedItem}
              onDragEnd={({ data }) =>
                dispatch({ type: 'REORDER_PINNED_FOODS', ids: data.map((f) => f.id) })
              }
            />
          </>
        )}

        {unpinned.length > 0 && (
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
                    onPress={() => handleTogglePin(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.pinned ? 'bookmark' : 'bookmark-outline'}
                      size={18}
                      color={item.pinned ? colors.primary : colors.textSecondary}
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

        {isEmpty && (
          <Text style={styles.empty}>
            {trimmed.length > 0
              ? 'No matching foods found'
              : 'No custom foods yet. Tap "Create Custom Food" to add one.'}
          </Text>
        )}
      </NestableScrollContainer>
    </View>
  );
}
