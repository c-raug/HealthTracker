import { Animated, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
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

  const badgeOpacity = useRef(new Animated.Value(1)).current;
  const labelOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(progressPct)).current;
  const prevXpRef = useRef(totalXp);
  const [xpDelta, setXpDelta] = useState(0);

  useEffect(() => {
    const prev = prevXpRef.current;
    if (totalXp <= prev) {
      prevXpRef.current = totalXp;
      const { currentLevelXp: clx, nextLevelXp: nlx, isMax: im } = getLevelProgress(totalXp);
      progressAnim.setValue(im ? 1 : (totalXp - clx) / (nlx - clx));
      return;
    }
    const delta = totalXp - prev;
    prevXpRef.current = totalXp;
    setXpDelta(delta);

    const { currentLevelXp: clx, nextLevelXp: nlx, isMax: im } = getLevelProgress(totalXp);
    const newProgress = im ? 1 : (totalXp - clx) / (nlx - clx);

    Animated.sequence([
      Animated.timing(badgeOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(labelOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(labelOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.spring(progressAnim, { toValue: newProgress, useNativeDriver: false }),
      ]),
      Animated.timing(badgeOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [totalXp]);

  return (
    <TouchableOpacity
      onPress={() => router.push('/stats-achievements-modal')}
      style={styles.container}
      activeOpacity={0.7}
    >
      <View style={styles.badgeWrapper}>
        <Animated.View style={[styles.xpBadge, { opacity: badgeOpacity }]}>
          <Text style={styles.xpBadgeText}>XP</Text>
        </Animated.View>
        <Animated.Text style={[styles.xpLabel, { opacity: labelOpacity }]}>
          +{xpDelta} xp
        </Animated.Text>
      </View>
      <View style={styles.pill}>
        <Animated.View style={[styles.fill, {
          width: progressAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          }) as any,
        }]} />
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
    badgeWrapper: {
      width: 22,
      height: 22,
      marginRight: Spacing.xs,
      alignItems: 'center',
      justifyContent: 'center',
    },
    xpBadge: {
      width: 22,
      height: 22,
      borderRadius: 6,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    xpBadgeText: {
      ...Typography.small,
      fontWeight: '700',
      color: colors.white,
    },
    xpLabel: {
      position: 'absolute',
      ...Typography.small,
      fontWeight: '700',
      color: colors.primary,
      textAlign: 'center',
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
