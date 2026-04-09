import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { NutritionFoodItem, MealCategory } from '../../types';
import { useApp } from '../../context/AppContext';
import PortionSelector from './PortionSelector';

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    bullet: {
      paddingRight: Spacing.sm,
      justifyContent: 'center',
    },
    bulletText: {
      ...Typography.body,
      color: colors.textSecondary,
      lineHeight: Typography.body.fontSize,
    },
    info: {
      flex: 1,
    },
    name: {
      ...Typography.body,
      color: colors.text,
    },
    details: {
      ...Typography.small,
      color: colors.textSecondary,
      marginTop: 1,
    },
    calories: {
      ...Typography.body,
      color: colors.textSecondary,
      fontWeight: '500',
      marginLeft: Spacing.sm,
    },
    deleteBtn: {
      backgroundColor: colors.danger,
      justifyContent: 'center',
      alignItems: 'center',
      width: 80,
    },
    deleteText: {
      ...Typography.body,
      color: colors.white,
      fontWeight: '600',
    },
    // Edit modal styles
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    editSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: Radius.lg,
      borderTopRightRadius: Radius.lg,
      maxHeight: '85%',
    },
    editHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    editTitle: {
      ...Typography.h3,
      color: colors.text,
      flex: 1,
      marginRight: Spacing.sm,
    },
    confirmEditBtn: {
      backgroundColor: colors.primary,
      borderRadius: Radius.md,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      marginHorizontal: Spacing.md,
      marginTop: Spacing.sm,
    },
    confirmEditText: {
      ...Typography.body,
      color: colors.white,
      fontWeight: '600',
    },
    quickBadge: {
      backgroundColor: colors.textSecondary,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
      alignSelf: 'center',
    },
    quickBadgeText: {
      ...Typography.small,
      color: colors.white,
      fontSize: 10,
      lineHeight: 14,
    },
    quickEditContainer: {
      padding: Spacing.md,
      paddingBottom: Spacing.xl,
    },
    quickEditLabel: {
      ...Typography.small,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
      marginTop: Spacing.md,
    },
    quickEditInput: {
      backgroundColor: colors.background,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      ...Typography.body,
      color: colors.text,
    },
  });

interface Props {
  item: NutritionFoodItem;
  onDelete: () => void;
  date: string;
  category: MealCategory;
}

export default function FoodItem({ item, onDelete, date, category }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { dispatch } = useApp();

  const [editVisible, setEditVisible] = useState(false);
  const [editServings, setEditServings] = useState<number>(item.servings ?? 1);
  const [quickEditCalories, setQuickEditCalories] = useState('');
  const [quickEditName, setQuickEditName] = useState('');

  const hasNutrition = item.calories != null;

  const baseServings = item.servings ?? 1;

  const handleOpenEdit = () => {
    if (item.quickAdd) {
      setQuickEditCalories(String(item.calories ?? 0));
      setQuickEditName(item.name);
    } else {
      setEditServings(item.servings ?? 1);
    }
    setEditVisible(true);
  };

  const handleConfirmEdit = () => {
    if (item.quickAdd) {
      const cal = parseInt(quickEditCalories, 10) || 0;
      const updated: NutritionFoodItem = {
        ...item,
        name: quickEditName.trim() || 'Quick Add',
        calories: cal,
      };
      dispatch({ type: 'UPDATE_FOOD_IN_MEAL', date, category, food: updated });
    } else {
      const ratio = editServings / baseServings;
      const updated: NutritionFoodItem = {
        ...item,
        servings: editServings,
        calories: Math.round((item.calories ?? 0) * ratio),
        protein: Math.round(((item.protein ?? 0) * ratio) * 10) / 10,
        carbs: Math.round(((item.carbs ?? 0) * ratio) * 10) / 10,
        fat: Math.round(((item.fat ?? 0) * ratio) * 10) / 10,
      };
      dispatch({ type: 'UPDATE_FOOD_IN_MEAL', date, category, food: updated });
    }
    setEditVisible(false);
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>,
  ) => (
    <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  // Reconstruct base-per-serving values for PortionSelector
  // The stored calories/macros are already scaled by servings, so divide by baseServings to get per-serving base
  const baseCalories = baseServings > 0 ? (item.calories ?? 0) / baseServings : (item.calories ?? 0);
  const baseProtein = baseServings > 0 ? (item.protein ?? 0) / baseServings : (item.protein ?? 0);
  const baseCarbs = baseServings > 0 ? (item.carbs ?? 0) / baseServings : (item.carbs ?? 0);
  const baseFat = baseServings > 0 ? (item.fat ?? 0) / baseServings : (item.fat ?? 0);

  return (
    <>
      <Swipeable renderRightActions={renderRightActions}>
        <View style={styles.container}>
          <View style={styles.bullet}>
            <Text style={styles.bulletText}>{'\u2022'}</Text>
          </View>
          <TouchableOpacity style={styles.info} onPress={handleOpenEdit} activeOpacity={0.7}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
              <Text style={[styles.name, item.quickAdd && { fontStyle: 'italic' }]} numberOfLines={1}>{item.name}</Text>
              {item.quickAdd && (
                <View style={styles.quickBadge}>
                  <Text style={styles.quickBadgeText}>Quick</Text>
                </View>
              )}
            </View>
            {hasNutrition && item.servingSize && (
              <Text style={styles.details}>
                {item.servingSize}
                {(item.servings ?? 1) > 1 ? ` x${item.servings}` : ''}
              </Text>
            )}
          </TouchableOpacity>
          {hasNutrition && (
            <Text style={styles.calories}>{item.calories} cal</Text>
          )}
        </View>
      </Swipeable>

      <Modal
        visible={editVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editSheet}>
            <View style={styles.editHeader}>
              <Text style={styles.editTitle} numberOfLines={1}>{item.name}</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)} activeOpacity={0.8}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {item.quickAdd ? (
              <View style={styles.quickEditContainer}>
                <Text style={styles.quickEditLabel}>Calories</Text>
                <TextInput
                  style={styles.quickEditInput}
                  value={quickEditCalories}
                  onChangeText={setQuickEditCalories}
                  keyboardType="numeric"
                  returnKeyType="next"
                  autoFocus
                />
                <Text style={styles.quickEditLabel}>Name</Text>
                <TextInput
                  style={styles.quickEditInput}
                  value={quickEditName}
                  onChangeText={setQuickEditName}
                  returnKeyType="done"
                  onSubmitEditing={handleConfirmEdit}
                />
                <TouchableOpacity
                  style={styles.confirmEditBtn}
                  onPress={handleConfirmEdit}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmEditText}>Update</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: Spacing.xl }}
              >
                <PortionSelector
                  value={editServings}
                  onChange={setEditServings}
                  baseCalories={baseCalories}
                  baseProtein={baseProtein}
                  baseCarbs={baseCarbs}
                  baseFat={baseFat}
                  servingSize={item.servingSize ?? '1 serving'}
                  baseServings={1}
                  foodName={item.name}
                />

                <TouchableOpacity
                  style={styles.confirmEditBtn}
                  onPress={handleConfirmEdit}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmEditText}>Update Portion</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
