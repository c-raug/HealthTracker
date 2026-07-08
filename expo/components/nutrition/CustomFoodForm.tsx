import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  type TextInput as TextInputType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { generateId } from '../../utils/generateId';
import { CustomFood } from '../../types';

const PORTION_UNITS = ['g', 'oz', 'cup', 'qty'] as const;

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      padding: Spacing.md,
    },
    title: {
      ...Typography.h3,
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    // Tab switcher
    tabRow: {
      flexDirection: 'row',
      marginBottom: Spacing.md,
      backgroundColor: colors.background,
      borderRadius: Radius.md,
      padding: 2,
    },
    tab: {
      flex: 1,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
      borderRadius: Radius.md - 2,
    },
    tabActive: {
      backgroundColor: colors.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    tabText: {
      ...Typography.body,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    tabTextActive: {
      color: colors.text,
      fontWeight: '600',
    },
    label: {
      ...Typography.small,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    input: {
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
    row: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    halfInput: {
      flex: 1,
    },
    saveBtn: {
      backgroundColor: colors.primary,
      borderRadius: Radius.md,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    saveBtnText: {
      ...Typography.body,
      color: colors.white,
      fontWeight: '600',
    },
    cancelBtn: {
      paddingVertical: Spacing.md,
      alignItems: 'center',
      marginTop: Spacing.xs,
    },
    cancelText: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    // Portion selector styles
    portionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    portionQtyInput: {
      width: 72,
      marginBottom: 0,
      textAlign: 'center',
    },
    unitScroll: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
      flex: 1,
    },
    unitChip: {
      backgroundColor: colors.background,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    unitChipActive: {
      backgroundColor: colors.primary,
    },
    unitChipText: {
      ...Typography.small,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    unitChipTextActive: {
      color: colors.white,
    },
    // Calorie auto-compute styles
    caloriesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    caloriesInput: {
      flex: 1,
      marginBottom: 0,
    },
    caloriesReadOnly: {
      backgroundColor: colors.background,
      color: colors.textSecondary,
    },
    caloriesReadOnlyTouchable: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      marginBottom: 0,
      justifyContent: 'center',
    },
    caloriesReadOnlyText: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    autoLabel: {
      ...Typography.small,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    overrideBtn: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm,
      backgroundColor: colors.background,
      borderRadius: Radius.sm,
    },
    overrideBtnText: {
      ...Typography.small,
      color: colors.primary,
      fontWeight: '600',
    },
    // Food type styles
    foodTypeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    foodTypeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.sm,
      backgroundColor: colors.border,
      gap: Spacing.xs,
    },
    foodTypeChipActive: {
      backgroundColor: colors.primary,
    },
    foodTypeChipText: {
      ...Typography.small,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    foodTypeChipTextActive: {
      color: colors.white,
    },
    removeTypeBtn: {
      padding: 2,
    },
    addTypeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.sm,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    addTypeBtnText: {
      ...Typography.small,
      color: colors.primary,
      fontWeight: '600',
    },
    addTypeInputRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    addTypeInput: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      ...Typography.body,
      color: colors.text,
    },
    addTypeConfirmBtn: {
      backgroundColor: colors.primary,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

interface Props {
  onDone: (createdFood?: CustomFood) => void;
  initialFood?: CustomFood;
  mode?: 'create' | 'edit';
  initialName?: string;
}

type FormTab = 'required' | 'optional';

export default function CustomFoodForm({ onDone, initialFood, mode = 'create', initialName }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { preferences, dispatch } = useApp();

  // Parse serving size from initialFood (format: "qty unit")
  const parsedQty = initialFood ? (initialFood.servingSize.split(' ')[0] ?? '1') : '1';
  const parsedRawUnit = initialFood ? (initialFood.servingSize.split(' ')[1] ?? 'g') : 'g';
  const parsedUnit = (PORTION_UNITS as readonly string[]).includes(parsedRawUnit) ? parsedRawUnit : 'g';

  const proteinRef = useRef<TextInputType>(null);
  const carbsRef = useRef<TextInputType>(null);
  const fatRef = useRef<TextInputType>(null);

  const [activeTab, setActiveTab] = useState<FormTab>('required');
  const [name, setName] = useState(initialFood?.name ?? initialName ?? '');
  const [calories, setCalories] = useState(initialFood ? initialFood.calories.toString() : '');
  const [protein, setProtein] = useState(initialFood ? initialFood.protein.toString() : '');
  const [carbs, setCarbs] = useState(initialFood ? initialFood.carbs.toString() : '');
  const [fat, setFat] = useState(initialFood ? initialFood.fat.toString() : '');
  const [portionQty, setPortionQty] = useState(parsedQty);
  const [portionUnit, setPortionUnit] = useState<string>(parsedUnit);
  // In edit mode, only start in manual if stored calories differ from what macros would compute
  const initialIsManual = mode === 'edit' && initialFood
    ? Math.round((initialFood.protein * 4) + (initialFood.carbs * 4) + (initialFood.fat * 9)) !== initialFood.calories
    : false;
  const [isCaloriesManual, setIsCaloriesManual] = useState(initialIsManual);

  // Optional tab state
  const [foodTypes, setFoodTypes] = useState<string[]>(initialFood?.foodTypes ?? []);
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const addTypeInputRef = useRef<TextInputType>(null);

  const foodTypeCategories = preferences.foodTypeCategories ?? [];

  // Auto-compute calories from macros when not in manual mode
  useEffect(() => {
    if (!isCaloriesManual) {
      const p = parseFloat(protein) || 0;
      const c = parseFloat(carbs) || 0;
      const f = parseFloat(fat) || 0;
      const computed = Math.round(p * 4 + c * 4 + f * 9);
      setCalories(computed === 0 ? '' : computed.toString());
    }
  }, [protein, carbs, fat, isCaloriesManual]);

  const handleOverrideTap = () => {
    Alert.alert(
      'Override Calories?',
      'Manually entered calories may not match your macro tracking. Macros and calories could become inconsistent.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Override',
          onPress: () => {
            setIsCaloriesManual(true);
            setCalories('');
          },
        },
      ],
    );
  };

  const toggleFoodType = (type: string) => {
    setFoodTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleAddFoodType = () => {
    setShowAddType(true);
    setNewTypeName('');
    setTimeout(() => addTypeInputRef.current?.focus(), 100);
  };

  const handleConfirmAddType = () => {
    const trimmed = newTypeName.trim();
    if (!trimmed) {
      setShowAddType(false);
      return;
    }
    if (foodTypeCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Duplicate', 'This food type already exists.');
      return;
    }
    dispatch({
      type: 'SET_FOOD_TYPE_CATEGORIES',
      categories: [...foodTypeCategories, trimmed],
    });
    setShowAddType(false);
    setNewTypeName('');
  };

  const handleRemoveFoodType = (type: string) => {
    Alert.alert(
      'Remove Food Type',
      `Remove "${type}"? Foods using this type will have it cleared.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            dispatch({
              type: 'SET_FOOD_TYPE_CATEGORIES',
              categories: foodTypeCategories.filter((c) => c !== type),
            });
            setFoodTypes((prev) => prev.filter((t) => t !== type));
          },
        },
      ],
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a food name.');
      return;
    }
    const cal = parseFloat(calories);
    if (isNaN(cal) || cal < 0) {
      Alert.alert('Required', 'Please enter valid calories (or fill in macros to auto-compute).');
      return;
    }

    const servingSize = `${portionQty.trim() || '1'} ${portionUnit}`;

    if (mode === 'edit' && initialFood) {
      dispatch({
        type: 'UPDATE_CUSTOM_FOOD',
        food: {
          ...initialFood,
          name: name.trim(),
          calories: cal,
          protein: parseFloat(protein) || 0,
          carbs: parseFloat(carbs) || 0,
          fat: parseFloat(fat) || 0,
          servingSize,
          foodTypes: foodTypes.length > 0 ? foodTypes : undefined,
        },
      });
      onDone();
    } else {
      const newFood: CustomFood = {
        id: generateId(),
        name: name.trim(),
        calories: cal,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        servingSize,
        createdAt: new Date().toISOString(),
        foodTypes: foodTypes.length > 0 ? foodTypes : undefined,
      };
      dispatch({ type: 'ADD_CUSTOM_FOOD', food: newFood });
      onDone(newFood);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>
        {mode === 'edit' ? 'Edit Custom Food' : 'Create Custom Food'}
      </Text>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'required' && styles.tabActive]}
          onPress={() => setActiveTab('required')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'required' && styles.tabTextActive]}>
            Required
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'optional' && styles.tabActive]}
          onPress={() => setActiveTab('optional')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'optional' && styles.tabTextActive]}>
            Optional
          </Text>
        </TouchableOpacity>
      </View>

      {/* Required tab */}
      {activeTab === 'required' && (
        <>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Homemade Granola"
            placeholderTextColor={colors.textSecondary}
            autoFocus={mode === 'create'}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => proteinRef.current?.focus()}
          />

          <Text style={styles.label}>Serving Size</Text>
          <View style={styles.portionRow}>
            <TextInput
              style={[styles.input, styles.portionQtyInput]}
              value={portionQty}
              onChangeText={setPortionQty}
              keyboardType="decimal-pad"
              placeholder="1"
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.unitScroll}>
              {PORTION_UNITS.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitChip, portionUnit === u && styles.unitChipActive]}
                  onPress={() => setPortionUnit(u)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.unitChipText, portionUnit === u && styles.unitChipTextActive]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.label}>
            Calories *{'  '}
            {!isCaloriesManual && <Text style={styles.autoLabel}>(auto-computed)</Text>}
          </Text>
          <View style={styles.caloriesRow}>
            {isCaloriesManual ? (
              <TextInput
                style={[styles.input, styles.caloriesInput]}
                value={calories}
                onChangeText={setCalories}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
            ) : (
              <TouchableOpacity
                style={styles.caloriesReadOnlyTouchable}
                onPress={handleOverrideTap}
                activeOpacity={0.7}
              >
                <Text style={styles.caloriesReadOnlyText}>
                  {calories || '0'}
                </Text>
              </TouchableOpacity>
            )}
            {isCaloriesManual ? (
              <TouchableOpacity
                style={styles.overrideBtn}
                onPress={() => setIsCaloriesManual(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.overrideBtnText}>Auto</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.overrideBtn}
                onPress={handleOverrideTap}
                activeOpacity={0.8}
              >
                <Text style={styles.overrideBtnText}>Override</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Protein (g)</Text>
              <TextInput
                ref={proteinRef}
                style={styles.input}
                value={protein}
                onChangeText={setProtein}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => carbsRef.current?.focus()}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Carbs (g)</Text>
              <TextInput
                ref={carbsRef}
                style={styles.input}
                value={carbs}
                onChangeText={setCarbs}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => fatRef.current?.focus()}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Fat (g)</Text>
              <TextInput
                ref={fatRef}
                style={styles.input}
                value={fat}
                onChangeText={setFat}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                returnKeyType="done"
              />
            </View>
          </View>
        </>
      )}

      {/* Optional tab */}
      {activeTab === 'optional' && (
        <>
          <Text style={styles.label}>Food Type</Text>
          <View style={styles.foodTypeRow}>
            {foodTypeCategories.map((type) => {
              const active = foodTypes.includes(type);
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.foodTypeChip, active && styles.foodTypeChipActive]}
                  onPress={() => toggleFoodType(type)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.foodTypeChipText, active && styles.foodTypeChipTextActive]}>
                    {type}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeTypeBtn}
                    onPress={() => handleRemoveFoodType(type)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={14}
                      color={active ? colors.white : colors.textSecondary}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.addTypeBtn}
              onPress={handleAddFoodType}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={styles.addTypeBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          {showAddType && (
            <View style={styles.addTypeInputRow}>
              <TextInput
                ref={addTypeInputRef}
                style={styles.addTypeInput}
                value={newTypeName}
                onChangeText={setNewTypeName}
                placeholder="New food type..."
                placeholderTextColor={colors.textSecondary}
                returnKeyType="done"
                onSubmitEditing={handleConfirmAddType}
              />
              <TouchableOpacity
                style={styles.addTypeConfirmBtn}
                onPress={handleConfirmAddType}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
        <Text style={styles.saveBtnText}>
          {mode === 'edit' ? 'Save Changes' : 'Save Custom Food'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelBtn} onPress={() => onDone()} activeOpacity={0.8}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
