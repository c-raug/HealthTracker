import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WeightEntry } from '../types';
import { Colors, Spacing, Typography, Radius } from '../constants/theme';
import { formatDisplayDate } from '../utils/dateUtils';
import { useApp } from '../context/AppContext';

interface Props {
  entry: WeightEntry;
}

export default function WeightEntryItem({ entry }: Props) {
  const { dispatch } = useApp();

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      `Delete the entry for ${formatDisplayDate(entry.date)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch({ type: 'DELETE_ENTRY', id: entry.id }),
        },
      ],
    );
  };

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.date}>{formatDisplayDate(entry.date)}</Text>
        <Text style={styles.weight}>
          {entry.weight}{' '}
          <Text style={styles.unit}>{entry.unit}</Text>
        </Text>
      </View>
      <TouchableOpacity
        onPress={handleDelete}
        style={styles.deleteBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={18} color={Colors.danger} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    marginBottom: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  info: {
    flex: 1,
  },
  date: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  weight: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  unit: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  deleteBtn: {
    padding: Spacing.xs,
    borderRadius: Radius.sm,
    backgroundColor: Colors.dangerLight,
  },
});
