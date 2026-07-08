import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { LEVEL_THRESHOLDS, LEVEL_NAMES, getLevelFromXp } from '../../utils/xpCalculation';

interface Props {
  totalXp: number;
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    lastRow: {
      borderBottomWidth: 0,
    },
    currentRow: {
      backgroundColor: colors.primaryLight,
      borderRadius: Radius.sm,
      marginHorizontal: -Spacing.sm,
      paddingHorizontal: Spacing.sm,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      flex: 1,
    },
    levelNumber: {
      ...Typography.body,
      color: colors.textSecondary,
      fontWeight: '600',
      width: 24,
    },
    levelNumberCurrent: {
      color: colors.primary,
    },
    levelName: {
      ...Typography.body,
      color: colors.text,
    },
    levelNameCurrent: {
      color: colors.primary,
      fontWeight: '600',
    },
    xpText: {
      ...Typography.small,
      color: colors.textSecondary,
    },
    xpTextCurrent: {
      color: colors.primary,
      fontWeight: '600',
    },
    currentIndicator: {
      marginLeft: Spacing.xs,
    },
  });

export default function TutorialLevelsPage({ totalXp }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const currentLevel = getLevelFromXp(totalXp);

  return (
    <View style={styles.container}>
      <View style={styles.iconRow}>
        <Ionicons name="trophy-outline" size={52} color={colors.primary} />
      </View>
      <Text style={styles.title}>The Levels</Text>

      <View style={styles.card}>
        {LEVEL_NAMES.map((name, index) => {
          const levelNum = index + 1;
          const isCurrent = levelNum === currentLevel;
          const isLast = index === LEVEL_NAMES.length - 1;

          return (
            <View
              key={levelNum}
              style={[
                styles.row,
                isLast && styles.lastRow,
                isCurrent && styles.currentRow,
              ]}
            >
              <View style={styles.rowLeft}>
                <Text style={[styles.levelNumber, isCurrent && styles.levelNumberCurrent]}>
                  {levelNum}
                </Text>
                <Text style={[styles.levelName, isCurrent && styles.levelNameCurrent]}>
                  {name}
                </Text>
                {isCurrent && (
                  <Ionicons
                    name="arrow-back"
                    size={14}
                    color={colors.primary}
                    style={styles.currentIndicator}
                  />
                )}
              </View>
              <Text style={[styles.xpText, isCurrent && styles.xpTextCurrent]}>
                {LEVEL_THRESHOLDS[index].toLocaleString()} XP
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
