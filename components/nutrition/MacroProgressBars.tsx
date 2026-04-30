import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { MacroSplit } from '../../types';

const PROTEIN_COLOR = '#3B82F6';
const CARBS_COLOR = '#F59E0B';
const FAT_COLOR = '#EF4444';

const CAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 };

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 5,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionLabel: {
      ...Typography.small,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: Spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    label: {
      ...Typography.small,
      fontWeight: '600',
      width: 60,
    },
    barContainer: {
      flex: 1,
      height: 10,
      backgroundColor: colors.border,
      borderRadius: 4,
      marginHorizontal: Spacing.sm,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 4,
    },
    values: {
      ...Typography.small,
      color: colors.textSecondary,
      width: 90,
      textAlign: 'right',
      flexShrink: 0,
    },
  });

interface Props {
  consumed: { protein: number; carbs: number; fat: number };
  goalCalories: number;
  macroSplit: MacroSplit;
}

export default function MacroProgressBars({ consumed, goalCalories, macroSplit }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);

  const targets = {
    protein: Math.round((macroSplit.protein / 100) * goalCalories / CAL_PER_GRAM.protein),
    carbs: Math.round((macroSplit.carbs / 100) * goalCalories / CAL_PER_GRAM.carbs),
    fat: Math.round((macroSplit.fat / 100) * goalCalories / CAL_PER_GRAM.fat),
  };

  const macros: { key: 'protein' | 'carbs' | 'fat'; label: string; color: string }[] = [
    { key: 'protein', label: 'Protein', color: PROTEIN_COLOR },
    { key: 'carbs', label: 'Carbs', color: CARBS_COLOR },
    { key: 'fat', label: 'Fat', color: FAT_COLOR },
  ];

  const isDark = colors.card === '#2C2C2E';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#3A3A3C', '#2C2C2E'] : ['#FFFFFF', '#F4F4F8']}
        style={StyleSheet.absoluteFill}
      />
      <Text style={styles.sectionLabel}>Macros</Text>
      {macros.map(({ key, label, color }) => {
        const target = targets[key];
        const current = Math.round(consumed[key]);
        const pct = target > 0 ? Math.min(current / target, 1) * 100 : 0;
        return (
          <View key={key} style={[styles.row, key === 'fat' && { marginBottom: 0 }]}>
            <Text style={[styles.label, { color }]}>{label}</Text>
            <View style={styles.barContainer}>
              <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
            </View>
            <Text style={styles.values} numberOfLines={1}>
              {current}g / {target}g
            </Text>
          </View>
        );
      })}
    </View>
  );
}
