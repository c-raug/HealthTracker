import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { NutritionFoodItem } from '../../types';

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
  });

interface Props {
  item: NutritionFoodItem;
  onDelete: () => void;
  drag?: () => void;
  isActive?: boolean;
}

export default function FoodItem({ item, onDelete, drag, isActive }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);

  const hasNutrition = item.calories != null;

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>,
  ) => (
    <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  return (
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
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          {hasNutrition && item.servingSize && (
            <Text style={styles.details}>
              {item.servingSize}
              {(item.servings ?? 1) > 1 ? ` x${item.servings}` : ''}
            </Text>
          )}
        </View>
        {hasNutrition && (
          <Text style={styles.calories}>{item.calories} cal</Text>
        )}
      </View>
    </Swipeable>
  );
}
