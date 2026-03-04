import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
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
    dragHandle: {
      paddingRight: Spacing.sm,
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
      paddingBottom: Spacing.xl,
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
  });

interface Props {
  item: NutritionFoodItem;
  onDelete: () => void;
  drag?: () => void;
  isActive?: boolean;
  date: string;
  category: MealCategory;
}

export default function FoodItem({ item, onDelete, drag, isActive, date, category }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { dispatch } = useApp();

  const [editVisible, setEditVisible] = useState(false);
  const [editServings, setEditServings] = useState<number>(item.servings ?? 1);

  const hasNutrition = item.calories != null;

  const baseServings = item.servings ?? 1;

  const handleOpenEdit = () => {
    setEditServings(item.servings ?? 1);
    setEditVisible(true);
  };

  const handleConfirmEdit = () => {
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
        <View
          style={[
            styles.container,
            isActive && { backgroundColor: colors.primaryLight, elevation: 5 },
          ]}
        >
          <TouchableOpacity
            onLongPress={drag}
            style={styles.dragHandle}
            delayLongPress={150}
          >
            <Ionicons name="reorder-three" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.info} onPress={handleOpenEdit} activeOpacity={0.7}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
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

            <PortionSelector
              value={editServings}
              onChange={setEditServings}
              baseCalories={baseCalories}
              baseProtein={baseProtein}
              baseCarbs={baseCarbs}
              baseFat={baseFat}
              servingSize={item.servingSize ?? '1 serving'}
              baseServings={1}
            />

            <TouchableOpacity
              style={styles.confirmEditBtn}
              onPress={handleConfirmEdit}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmEditText}>Update Portion</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
