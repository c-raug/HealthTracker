import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { NutritionFoodItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { generateId } from '../../utils/generateId';
import { searchFoods } from '../../api/usdaFoodData';
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
    loading: {
      padding: Spacing.md,
      alignItems: 'center',
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
}

export default function CreateMealFlow({ onDone }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { customFoods, dispatch } = useApp();

  const [mealName, setMealName] = useState('');
  const [foods, setFoods] = useState<NutritionFoodItem[]>([]);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NutritionFoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedItem, setSelectedItem] = useState<NutritionFoodItem | null>(null);
  const [servings, setServings] = useState<number>(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Show all custom foods on initial mount (query is empty)
  useEffect(() => {
    const allCustom: NutritionFoodItem[] = customFoods.map((f) => ({
      id: f.id,
      name: f.name,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      servingSize: f.servingSize,
      servings: 1,
    }));
    setSearchResults(allCustom);
  }, []);

  const handleSearch = useCallback(
    (text: string) => {
      setQuery(text);
      setSelectedItem(null);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      const trimmedText = text.trim();

      // When empty: show all custom foods immediately, no USDA call
      if (trimmedText.length === 0) {
        const allCustom: NutritionFoodItem[] = customFoods.map((f) => ({
          id: f.id,
          name: f.name,
          calories: f.calories,
          protein: f.protein,
          carbs: f.carbs,
          fat: f.fat,
          servingSize: f.servingSize,
          servings: 1,
        }));
        setSearchResults(allCustom);
        return;
      }

      // When 1 char: filter custom foods only, no USDA call
      if (trimmedText.length === 1) {
        const matchingCustom: NutritionFoodItem[] = customFoods
          .filter((f) => f.name.toLowerCase().includes(trimmedText.toLowerCase()))
          .map((f) => ({
            id: f.id,
            name: f.name,
            calories: f.calories,
            protein: f.protein,
            carbs: f.carbs,
            fat: f.fat,
            servingSize: f.servingSize,
            servings: 1,
          }));
        setSearchResults(matchingCustom);
        return;
      }

      // 2+ chars: filter custom + USDA
      debounceRef.current = setTimeout(async () => {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        try {
          const matchingCustom: NutritionFoodItem[] = customFoods
            .filter((f) => f.name.toLowerCase().includes(trimmedText.toLowerCase()))
            .map((f) => ({
              id: f.id,
              name: f.name,
              calories: f.calories,
              protein: f.protein,
              carbs: f.carbs,
              fat: f.fat,
              servingSize: f.servingSize,
              servings: 1,
            }));

          const { items } = await searchFoods(trimmedText, 1, controller.signal);
          setSearchResults([...matchingCustom, ...items]);
        } catch (e: unknown) {
          if (e instanceof Error && e.name === 'AbortError') return;
          setSearchResults([]);
        }
        setLoading(false);
      }, 300);
    },
    [customFoods],
  );

  const handleSelectItem = (item: NutritionFoodItem) => {
    setSelectedItem(item);
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
    handleSearch('');
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

  const isSearchMode = searchFocused || query.length > 0;

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
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </View>

      {isSearchMode ? (
        <>
          {loading && (
            <View style={styles.loading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
          <Text style={styles.sectionLabel}>
            {query.trim().length === 0 ? 'My Foods' : 'Search Results'}
          </Text>
          <FlatList
            data={searchResults.slice(0, 10)}
            keyExtractor={(item, i) => `${item.id}-${i}`}
            keyboardShouldPersistTaps="handled"
            style={{ flex: 1 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.resultItem,
                  selectedItem?.id === item.id && { backgroundColor: colors.primaryLight },
                ]}
                onPress={() => handleSelectItem(item)}
              >
                <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.resultInfo}>
                  {item.calories} cal{item.servingSize ? ` · ${item.servingSize}` : ''}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              !loading ? (
                <Text style={styles.empty}>
                  {query.trim().length === 0
                    ? 'No custom foods saved yet'
                    : 'No results found'}
                </Text>
              ) : null
            }
          />
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
              />
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmAdd}>
                <Text style={styles.confirmText}>Add to Meal</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        <>
          <Text style={styles.sectionLabel}>
            Foods in Meal ({foods.length})
          </Text>
          {foods.length === 0 ? (
            <Text style={styles.empty}>Tap the search box above to find foods to add</Text>
          ) : (
            <FlatList
              data={foods}
              keyExtractor={(item) => item.id}
              style={{ flex: 1 }}
              renderItem={({ item }) => (
                <View style={styles.foodRow}>
                  <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.foodCal}>{item.calories} cal</Text>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemoveFromMeal(item.id)}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </>
      )}

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
