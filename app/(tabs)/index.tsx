import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme';
import { getToday, formatDisplayDate } from '../../utils/dateUtils';
import { convertWeight } from '../../utils/unitConversion';

export default function HomeScreen() {
  const router = useRouter();
  const { entries, preferences, isLoading } = useApp();

  const today = getToday();
  const todayEntry = entries.find((e) => e.date === today);
  const displayWeight = todayEntry
    ? convertWeight(todayEntry.weight, todayEntry.unit, preferences.unit)
    : null;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.dateText}>{formatDisplayDate(today)}</Text>

      {/* Today's weight card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Today's Weight</Text>
        {displayWeight !== null ? (
          <View style={styles.weightRow}>
            <Text style={styles.weightValue}>{displayWeight}</Text>
            <Text style={styles.weightUnit}>{preferences.unit}</Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>No entry logged yet today</Text>
        )}
      </View>

      {/* Log weight button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/log-weight')}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {todayEntry ? 'Update Today\'s Weight' : '+ Log Weight'}
        </Text>
      </TouchableOpacity>

      {/* Recent summary */}
      {entries.length > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total Entries</Text>
          <Text style={styles.summaryValue}>{entries.length}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  dateText: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLabel: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  weightValue: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.primary,
    lineHeight: 56,
  },
  weightUnit: {
    ...Typography.h3,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    ...Typography.h3,
    color: Colors.white,
  },
  summaryCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  summaryValue: {
    ...Typography.h2,
    color: Colors.primary,
  },
});
