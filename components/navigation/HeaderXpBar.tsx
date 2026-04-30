import { Animated, TouchableOpacity, View, Text, StyleSheet, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useColors, Spacing, Typography } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { getLevelProgress } from '../../utils/xpCalculation';

export default function HeaderXpBar() {
  const colors = useColors();
  const router = useRouter();
  const { preferences } = useApp();
  const deviceScheme = useColorScheme();
  const appearanceMode = preferences.appearanceMode ?? 'system';
  const resolvedScheme =
    appearanceMode === 'light' ? 'light' : appearanceMode === 'dark' ? 'dark' : (deviceScheme ?? 'light');
  const isDark = resolvedScheme === 'dark';

  const totalXp = preferences.totalXp ?? 0;
  const { level, currentLevelXp, nextLevelXp, isMax } = getLevelProgress(totalXp);
  const progressPct = isMax ? 1 : (totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp);
  const styles = makeStyles(colors, isDark);

  const pillTextOpacity = useRef(new Animated.Value(1)).current;
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
      Animated.timing(pillTextOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(labelOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(labelOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.spring(progressAnim, { toValue: newProgress, useNativeDriver: false }),
      ]),
      Animated.timing(pillTextOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }, [totalXp]);

  return (
    <TouchableOpacity
      onPress={() => router.push('/stats-achievements-modal')}
      style={styles.container}
      activeOpacity={0.8}
    >
      <View style={styles.pillOuter}>
        {/* Frosted glass base */}
        <BlurView
          intensity={isDark ? 35 : 55}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        {/* Progress fill — semi-transparent primary */}
        <Animated.View
          style={[
            styles.fill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }) as any,
            },
          ]}
        />
        {/* Top-half highlight for the glass sheen */}
        <View style={styles.glassHighlight} />
        {/* Centered text — "Level N" fades out, "+N xp" fades in */}
        <View style={styles.textRow}>
          <Animated.Text style={[styles.pillText, { opacity: pillTextOpacity }]} numberOfLines={1}>
            {isMax ? 'MAX' : `Level ${level}`}
          </Animated.Text>
          <Animated.Text style={[styles.xpLabel, { opacity: labelOpacity }]} numberOfLines={1}>
            +{xpDelta} xp
          </Animated.Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, isDark: boolean) {
  return StyleSheet.create({
    container: {
      marginRight: Spacing.md,
    },
    pillOuter: {
      height: 26,
      borderRadius: 13,
      minWidth: 88,
      overflow: 'hidden',
      borderWidth: 0.5,
      borderColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.65)',
    },
    fill: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: colors.primary + '55',
    },
    glassHighlight: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '45%',
      borderTopLeftRadius: 13,
      borderTopRightRadius: 13,
      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.40)',
    },
    textRow: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pillText: {
      ...Typography.small,
      fontWeight: '600',
      color: isDark ? 'rgba(255,255,255,0.90)' : colors.text,
      position: 'absolute',
    },
    xpLabel: {
      ...Typography.small,
      fontWeight: '700',
      color: isDark ? colors.primary : colors.primary,
      position: 'absolute',
    },
  });
}
