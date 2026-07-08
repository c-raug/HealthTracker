import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WeightEntry } from '../types';
import { useColors, LightColors, Spacing, Typography, Radius } from '../constants/theme';
import { formatDisplayDate } from '../utils/dateUtils';
import { useApp } from '../context/AppContext';

interface Props {
  entry: WeightEntry;
}

const makeStyles = (colors: typeof LightColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  info: {
    flex: 1,
  },
  date: {
    ...Typography.small,
    color: colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  weight: {
    ...Typography.h2,
    color: colors.text,
  },
  unit: {
    ...Typography.small,
    color: colors.textSecondary,
  },
  deleteBtn: {
    padding: Spacing.xs,
    borderRadius: Radius.sm,
    backgroundColor: colors.dangerLight,
  },
});

export default function WeightEntryItem({ entry }: Props) {
  const { dispatch } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);

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
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );
}
