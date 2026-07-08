import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { WeightEntry } from '../../types';
import { addDays } from '../../utils/dateUtils';

interface Props {
  weekStart: string;
  weightEntries: WeightEntry[];
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
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    label: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    value: {
      ...Typography.h3,
      color: colors.text,
    },
    changeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      marginTop: Spacing.sm,
    },
    changePositive: {
      ...Typography.h2,
      color: colors.danger,
    },
    changeNegative: {
      ...Typography.h2,
      color: colors.primary,
    },
    changeNeutral: {
      ...Typography.h2,
      color: colors.textSecondary,
    },
    noDataText: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: Spacing.md,
    },
  });

export default function RecapWeightPage({ weekStart, weightEntries }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);

  const weekEnd = addDays(weekStart, 6);

  // Entries within the week, sorted ascending
  const weekEntries = [...weightEntries]
    .filter((e) => e.date >= weekStart && e.date <= weekEnd)
    .sort((a, b) => a.date.localeCompare(b.date));

  const startEntry = weekEntries[0];
  const endEntry = weekEntries[weekEntries.length - 1];

  const unit = startEntry?.unit ?? endEntry?.unit ?? 'lbs';
  const unitLabel = unit === 'lbs' ? 'lbs' : 'kg';

  const formatWeight = (entry: WeightEntry | undefined) => {
    if (!entry) return '—';
    return `${entry.weight.toFixed(1)} ${unitLabel}`;
  };

  let changeValue: number | null = null;
  if (startEntry && endEntry && startEntry.id !== endEntry.id) {
    changeValue = endEntry.weight - startEntry.weight;
  }

  const changeIcon =
    changeValue === null ? null :
    changeValue < 0 ? 'arrow-down' :
    changeValue > 0 ? 'arrow-up' : null;

  const changeStyle =
    changeValue === null ? styles.changeNeutral :
    changeValue < 0 ? styles.changeNegative :
    changeValue > 0 ? styles.changePositive :
    styles.changeNeutral;

  return (
    <View style={styles.container}>
      <View style={styles.iconRow}>
        <Ionicons name="scale-outline" size={52} color={colors.primary} />
      </View>
      <Text style={styles.title}>Weekly Weight</Text>

      {weekEntries.length === 0 ? (
        <Text style={styles.noDataText}>No weight entries this week</Text>
      ) : (
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Start of week</Text>
            <Text style={styles.value}>{formatWeight(startEntry)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>End of week</Text>
            <Text style={styles.value}>{formatWeight(endEntry)}</Text>
          </View>
          {changeValue !== null && (
            <View style={styles.changeRow}>
              {changeIcon && (
                <Ionicons
                  name={changeIcon as any}
                  size={22}
                  color={changeValue < 0 ? colors.primary : colors.danger}
                />
              )}
              <Text style={changeStyle}>
                {changeValue === 0
                  ? 'No change'
                  : `${changeValue > 0 ? '+' : ''}${changeValue.toFixed(1)} ${unitLabel}`}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
