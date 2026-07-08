import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { WeeklyRatingResult } from '../../utils/weeklyRatingCalculation';

interface Props {
  result: WeeklyRatingResult;
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
      marginBottom: Spacing.md,
    },
    starsRow: {
      flexDirection: 'row',
      gap: Spacing.xs,
      marginBottom: Spacing.xl,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      width: '100%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    cardTitle: {
      ...Typography.h3,
      color: colors.text,
      marginBottom: Spacing.md,
    },
    factorRow: {
      marginBottom: Spacing.sm,
    },
    factorHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.xs,
    },
    factorLabel: {
      ...Typography.body,
      color: colors.text,
    },
    factorPct: {
      ...Typography.body,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    barTrack: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    barFill: {
      height: 8,
      borderRadius: 4,
    },
  });

const STAR_SIZE = 36;
const STAR_COLOR_FILLED = '#F59E0B';
const STAR_COLOR_EMPTY = '#D1D5DB';

const FACTOR_LABELS: Record<string, string> = {
  calories: 'Calorie Goal',
  water: 'Water Goal',
  weight: 'Weight Logged',
  food: 'Food Logged',
};

export default function RecapRatingPage({ result }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);

  const factors = [
    { key: 'calories', value: result.factors.calories },
    { key: 'water', value: result.factors.water },
    { key: 'weight', value: result.factors.weight },
    { key: 'food', value: result.factors.food },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.iconRow}>
        <Ionicons name="trophy-outline" size={52} color={colors.primary} />
      </View>
      <Text style={styles.title}>Week Rating</Text>

      <View style={styles.starsRow}>
        {Array.from({ length: 5 }, (_, i) => (
          <Ionicons
            key={i}
            name={i < result.stars ? 'star' : 'star-outline'}
            size={STAR_SIZE}
            color={i < result.stars ? STAR_COLOR_FILLED : STAR_COLOR_EMPTY}
          />
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Factor Breakdown</Text>
        {factors.map(({ key, value }) => (
          <View key={key} style={styles.factorRow}>
            <View style={styles.factorHeader}>
              <Text style={styles.factorLabel}>{FACTOR_LABELS[key]}</Text>
              <Text style={styles.factorPct}>{Math.round(value * 100)}%</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.round(value * 100)}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
