import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { useApp } from '../../context/AppContext';

export interface FoodFilters {
  mealTags: string[];
  foodType: string | null;
}

const MEAL_TAG_OPTIONS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: Radius.lg,
      borderTopRightRadius: Radius.lg,
      maxHeight: '85%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    headerTitle: {
      ...Typography.h2,
      color: colors.text,
    },
    content: {
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.lg,
    },
    sectionLabel: {
      ...Typography.small,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: Spacing.sm,
      marginTop: Spacing.md,
    },
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    pill: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.md,
      backgroundColor: colors.border,
    },
    pillActive: {
      backgroundColor: colors.primary,
    },
    pillText: {
      ...Typography.body,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    pillTextActive: {
      color: colors.white,
    },
    foodTypeChip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.md,
      backgroundColor: colors.border,
    },
    foodTypeChipActive: {
      backgroundColor: colors.primary,
    },
    foodTypeChipText: {
      ...Typography.body,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    foodTypeChipTextActive: {
      color: colors.white,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.lg,
    },
    clearBtn: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: Radius.md,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    clearBtnText: {
      ...Typography.body,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    applyBtn: {
      flex: 2,
      backgroundColor: colors.primary,
      borderRadius: Radius.md,
      paddingVertical: Spacing.md,
      alignItems: 'center',
    },
    applyBtnText: {
      ...Typography.body,
      color: colors.white,
      fontWeight: '600',
    },
  });

interface Props {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FoodFilters) => void;
  currentFilters: FoodFilters;
}

export default function FoodFilterModal({ visible, onClose, onApply, currentFilters }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { preferences } = useApp();

  const [mealTags, setMealTags] = useState<string[]>(currentFilters.mealTags);
  const [foodType, setFoodType] = useState<string | null>(currentFilters.foodType);

  const foodTypeCategories = preferences.foodTypeCategories ?? [];

  const toggleMealTag = (tag: string) => {
    setMealTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSelectFoodType = (type: string) => {
    setFoodType((prev) => (prev === type ? null : type));
  };

  const handleClear = () => {
    setMealTags([]);
    setFoodType(null);
  };

  const handleApply = () => {
    onApply({ mealTags, foodType });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filter Foods</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.sectionLabel}>Meal Tags</Text>
            <View style={styles.pillRow}>
              {MEAL_TAG_OPTIONS.map((tag) => {
                const active = mealTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() => toggleMealTag(tag)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>Food Type</Text>
            <View style={styles.pillRow}>
              {foodTypeCategories.map((type) => {
                const active = foodType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.foodTypeChip, active && styles.foodTypeChipActive]}
                    onPress={() => handleSelectFoodType(type)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.foodTypeChipText, active && styles.foodTypeChipTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.clearBtn} onPress={handleClear} activeOpacity={0.8}>
                <Text style={styles.clearBtnText}>Clear Filters</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.8}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
