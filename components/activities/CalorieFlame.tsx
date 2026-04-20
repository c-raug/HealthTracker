import { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { useColors, LightColors, Spacing, Typography } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { flameColorForBurn, glowIntensityForBurn } from '../../utils/flameColor';
import AndroidGlowBackdrop from '../glow/AndroidGlowBackdrop';

const FLAME_WIDTH = 192;
const FLAME_HEIGHT = 192;

const FLAME_OUTLINE_PATH =
  'M261.56,101.28a8,8,0,0,0-11.06,1.62C229.2,130,176.93,196,162.89,257.79a166.09,166.09,0,0,0-8.69-19.32,8,8,0,0,0-13.45-.43c-35.49,48.27-54,101.41-54,153a168,168,0,0,0,336,0C423,265.59,374.41,180.59,261.56,101.28Z';

const makeStyles = (colors: typeof LightColors, compact: boolean) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: 'transparent',
      marginBottom: compact ? 0 : Spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: compact ? 0 : Spacing.sm,
    },
    flameWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    overlay: {
      position: 'absolute',
      top: '40%',
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    calories: {
      ...Typography.h1,
      fontWeight: '700',
      color: colors.text,
    },
    label: {
      ...Typography.small,
      color: colors.text,
      marginTop: Spacing.xs,
    },
  });

interface Props {
  totalBurned: number;
  size?: number;
}

export default function CalorieFlame({ totalBurned, size }: Props) {
  const colors = useColors();
  const dim = size ?? FLAME_WIDTH;
  const compact = dim < FLAME_WIDTH;
  const styles = makeStyles(colors, compact);
  const { preferences } = useApp();
  const calUnit = preferences.unit === 'kg' ? 'kcal' : 'cal';

  const color = useMemo(() => flameColorForBurn(totalBurned), [totalBurned]);
  const intensity = useMemo(() => glowIntensityForBurn(totalBurned), [totalBurned]);

  const calFontSize = compact ? Math.max(16, Math.round(28 * dim / FLAME_WIDTH)) : 28;
  const labelFontSize = compact ? Math.max(9, Math.round(13 * dim / FLAME_WIDTH)) : 13;

  const glowStyle = Platform.OS === 'ios' ? {
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: intensity === 0 ? 0 : 0.25 + intensity * 0.65,
    shadowRadius: intensity === 0 ? 0 : 6 + intensity * 18,
    elevation: intensity === 0 ? 0 : Math.round(4 + intensity * 12),
  } : {};

  return (
    <View style={styles.wrapper}>
      <View style={[styles.flameWrapper, { width: dim, height: dim }, glowStyle]}>
        <AndroidGlowBackdrop
          color={color}
          intensity={intensity}
          shape="circle"
          size={{ width: dim, height: dim }}
        />
        <Svg width={dim} height={dim} viewBox="0 0 512 600">
          <Path
            d={FLAME_OUTLINE_PATH}
            stroke={color}
            fill={color + '33'}
            strokeWidth={3.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <G transform="translate(128, 128) scale(0.5)">
            <Path
              d={FLAME_OUTLINE_PATH}
              fill={color}
              fillOpacity={0.3}
              stroke="none"
            />
          </G>
        </Svg>
        <View style={styles.overlay}>
          <Text style={[styles.calories, { fontSize: calFontSize }]}>{totalBurned.toLocaleString()}</Text>
          <Text style={[styles.label, { fontSize: labelFontSize }]}>{calUnit}</Text>
        </View>
      </View>
    </View>
  );
}
