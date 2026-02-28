import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { NutritionFoodItem, MealCategory } from '../../types';
import { searchFoods } from '../../api/openFoodFacts';
import { useApp } from '../../context/AppContext';
import { generateId } from '../../utils/generateId';
import CustomFoodForm from './CustomFoodForm';

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
    },
    resultSelected: {
      backgroundColor: colors.primaryLight,
    },
    resultName: {
      ...Typography.body,
      color: colors.text,
      marginBottom: 2,
    },
    resultInfo: {
      ...Typography.small,
      color: colors.textSecondary,
    },
    customBadge: {
      ...Typography.small,
      color: colors.primary,
      fontWeight: '600',
    },
    loading: {
      padding: Spacing.lg,
      alignItems: 'center',
    },
    empty: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      padding: Spacing.lg,
    },
    servingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.md,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    servingLabel: {
      ...Typography.body,
      color: colors.text,
    },
    servingBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    servingCount: {
      ...Typography.h3,
      color: colors.text,
      minWidth: 30,
      textAlign: 'center',
    },
    confirmBtn: {
      backgroundColor: colors.primary,
      borderRadius: Radius.md,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
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
  const [offResults, setOffResults] = useState<NutritionFoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedItem, setSelectedItem] = useState<NutritionFoodItem | null>(null);
  const [servings, setServings] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter custom foods by query
  const filteredCustomFoods = query.trim().length >= 2
    ? customFoods.filter((f) =>
        f.name.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : [];

  // Convert custom foods to NutritionFoodItem format for display
  const customResults: NutritionFoodItem[] = filteredCustomFoods.map((f) => ({
    id: f.id,
    name: f.name,
    calories: f.calories,
    protein: f.protein,
    carbs: f.carbs,
    fat: f.fat,
    servingSize: f.servingSize,
    servings: 1,
  }));

  const allResults = [...customResults, ...offResults];

  const handleSearch = useCallback(
    (text: string) => {
      setQuery(text);
      setSelectedItem(null);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (text.trim().length < 2) {
        setOffResults([]);
        setSearched(false);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const { items } = await searchFoods(text.trim());
          setOffResults(items);
        } catch {
          setOffResults([]);
        }
        setSearched(true);
        setLoading(false);
      }, 300);
    },
    [customFoods],
  );

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

    dispatch({ type: 'ADD_FOOD_TO_MEAL', date, category, food });
    onDone();
  };

  if (showCreateForm) {
    return <CustomFoodForm onDone={() => setShowCreateForm(false)} />;
  }

  const isCustom = (id: string) => customFoods.some((f) => f.id === id);

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={handleSearch}
          placeholder="Search foods..."
          placeholderTextColor={colors.textSecondary}
          autoFocus
          returnKeyType="search"
        />
      </View>

      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => setShowCreateForm(true)}
      >
        <Ionicons name="add-circle" size={20} color={colors.primary} />
        <Text style={styles.createText}>Create Custom Food</Text>
      </TouchableOpacity>

      {selectedItem && (
        <View style={styles.servingRow}>
          <Text style={styles.servingLabel}>Servings:</Text>
          <TouchableOpacity
            style={styles.servingBtn}
            onPress={() => setServings(Math.max(1, servings - 1))}
          >
            <Ionicons name="remove" size={20} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.servingCount}>{servings}</Text>
          <TouchableOpacity
            style={styles.servingBtn}
            onPress={() => setServings(servings + 1)}
          >
            <Ionicons name="add" size={20} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmAdd}>
            <Text style={styles.confirmText}>Add</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={allResults}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.resultItem,
                selectedItem?.id === item.id && styles.resultSelected,
              ]}
              onPress={() => {
                setSelectedItem(item);
                setServings(1);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                <Text style={styles.resultName} numberOfLines={1}>
                  {item.name}
                </Text>
                {isCustom(item.id) && (
                  <Text style={styles.customBadge}>Custom</Text>
                )}
              </View>
              <Text style={styles.resultInfo}>
                {item.calories} cal
                {item.servingSize ? ` · ${item.servingSize}` : ''}
                {item.protein != null ? ` · P: ${item.protein}g` : ''}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            searched && !loading ? (
              <Text style={styles.empty}>No results found</Text>
            ) : null
          }
        />
      )}
    </View>
  );
}
