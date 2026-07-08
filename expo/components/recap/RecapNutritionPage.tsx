import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { DayNutrition } from '../../types';
import { addDays } from '../../utils/dateUtils';

// Fixed macro colors per style guide
const PROTEIN_COLOR = '#3B82F6';
const CARBS_COLOR = '#F59E0B';
const FAT_COLOR = '#EF4444';

interface Props {
  weekStart: string;
  nutritionLog: DayNutrition[];
  calorieTarget: number | null;
}

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    iconRow: {
      marginBottom: Spacing.lg,
    },
    title: {
      ...Typography.h1,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Spacing.xl,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      width: '100%',
      marginBottom: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    cardTitle: {
      ...Typography.h3,
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    label: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    value: {
      ...Typography.h3,
      color: colors.text,
    },
    goalText: {
      ...Typography.small,
      color: colors.textSecondary,
      textAlign: 'right',
      marginTop: Spacing.xs,
    },
    macroRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    macroPill: {
      flex: 1,
      borderRadius: Radius.md,
      padding: Spacing.sm,
      alignItems: 'center',
    },
    macroLabel: {
      ...Typography.small,
      color: colors.white,
      fontWeight: '600',
      opacity: 0.9,
    },
    macroValue: {
      ...Typography.h3,
      color: colors.white,
      fontWeight: '700',
    },
    noDataText: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: Spacing.md,
    },
  });

export default function RecapNutritionPage({ weekStart, nutritionLog, calorieTarget }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const daysWithData = weekDays
    .map((date) => nutritionLog.find((d) => d.date === date))
    .filter((d): d is DayNutrition => {
      if (!d) return false;
      return Object.values(d.meals).some((foods) => foods.length > 0);
    });

  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  for (const day of daysWithData) {
    for (const foods of Object.values(day.meals)) {
      for (const food of foods) {
        totalCalories += food.calories ?? 0;
        totalProtein += food.protein ?? 0;
        totalCarbs += food.carbs ?? 0;
        totalFat += food.fat ?? 0;
      }
    }
  }

  const loggingDays = daysWithData.length;
  const avgCalories = loggingDays > 0 ? Math.round(totalCalories / loggingDays) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.iconRow}>
        <Ionicons name="restaurant-outline" size={52} color={colors.primary} />
      </View>
      <Text style={styles.title}>Weekly Nutrition</Text>

      {loggingDays === 0 ? (
        <Text style={styles.noDataText}>No nutrition data logged this week</Text>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Avg Daily Calories</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Consumed</Text>
              <Text style={styles.value}>{avgCalories.toLocaleString()} cal</Text>
            </View>
            {calorieTarget && calorieTarget > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Goal</Text>
                <Text style={styles.value}>{calorieTarget.toLocaleString()} cal</Text>
              </View>
            )}
            <Text style={styles.goalText}>
              Based on {loggingDays} of 7 days logged
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Weekly Macros</Text>
            <View style={styles.macroRow}>
              <View style={[styles.macroPill, { backgroundColor: PROTEIN_COLOR }]}>
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroValue}>{Math.round(totalProtein)}g</Text>
              </View>
              <View style={[styles.macroPill, { backgroundColor: CARBS_COLOR }]}>
                <Text style={styles.macroLabel}>Carbs</Text>
                <Text style={styles.macroValue}>{Math.round(totalCarbs)}g</Text>
              </View>
              <View style={[styles.macroPill, { backgroundColor: FAT_COLOR }]}>
                <Text style={styles.macroLabel}>Fat</Text>
                <Text style={styles.macroValue}>{Math.round(totalFat)}g</Text>
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  );
}
