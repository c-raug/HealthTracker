import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    navRow: {
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      marginBottom: Spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
    },
    navRowText: {
      ...Typography.h3,
      color: colors.text,
    },
  });

export default function BadgesSection() {
  const router = useRouter();
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <TouchableOpacity
      style={styles.navRow}
      onPress={() => router.push('/stats-achievements-modal')}
      activeOpacity={0.7}
    >
      <Text style={styles.navRowText}>Stats & Achievements</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}
