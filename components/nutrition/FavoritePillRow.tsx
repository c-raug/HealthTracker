import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useColors, LightColors, Spacing } from '../../constants/theme';

interface Props {
  favorites: string[];
  activeFilters: string[];
  onToggle: (type: string) => void;
}

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    pill: {
      flex: 1,
      height: 32,
      borderRadius: 16,
      marginHorizontal: 2,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pillActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    pillText: {
      fontSize: 13,
      fontWeight: '500' as const,
      color: colors.text,
    },
    pillTextActive: {
      color: colors.white,
    },
  });

export default function FavoritePillRow({ favorites, activeFilters, onToggle }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);

  if (favorites.length === 0) return null;

  return (
    <View style={styles.row}>
      {favorites.slice(0, 4).map((type) => {
        const active = activeFilters.includes(type);
        return (
          <TouchableOpacity
            key={type}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => onToggle(type)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.pillText, active && styles.pillTextActive]}
              numberOfLines={1}
            >
              {type}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
