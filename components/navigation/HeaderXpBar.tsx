import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Spacing, Typography } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { getLevelProgress } from '../../utils/xpCalculation';

export default function HeaderXpBar() {
  const colors = useColors();
  const router = useRouter();
  const { preferences } = useApp();
  const totalXp = preferences.totalXp ?? 0;
  const { level, currentLevelXp, nextLevelXp, isMax } = getLevelProgress(totalXp);
  const progressPct = isMax ? 1 : (totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp);
  const styles = makeStyles(colors);

  return (
    <TouchableOpacity
      onPress={() => router.push('/stats-achievements-modal')}
      style={styles.container}
      activeOpacity={0.7}
    >
      <Ionicons name="star" size={18} color={colors.primary} style={{ marginRight: Spacing.xs }} />
      <View style={styles.pill}>
        <View style={[styles.fill, { width: `${Math.round(progressPct * 100)}%` as any }]} />
        <Text style={styles.pillText}>{isMax ? 'MAX' : `Level ${level}`}</Text>
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    pill: {
      height: 22,
      borderRadius: 11,
      minWidth: 72,
      backgroundColor: colors.primaryLight,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    },
    fill: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: colors.primary,
    },
    pillText: {
      ...Typography.small,
      fontWeight: '600',
      color: colors.text,
    },
  });
}
