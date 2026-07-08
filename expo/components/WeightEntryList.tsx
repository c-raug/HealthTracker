import { FlatList, View, Text, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { Colors, Spacing, Typography } from '../constants/theme';
import WeightEntryItem from './WeightEntryItem';

export default function WeightEntryList() {
  const { entries } = useApp();

  // Sort newest first for the list view.
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <FlatList
      data={sorted}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <WeightEntryItem entry={item} />}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <Text style={styles.header}>All Entries ({sorted.length})</Text>
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  header: {
    ...Typography.small,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
});
