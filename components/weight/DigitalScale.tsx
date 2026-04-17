import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors, LightColors, Spacing, Radius } from '../../constants/theme';

const ANIMATION_DURATION = 1500;

const makeStyles = (colors: typeof LightColors, size: number) =>
  StyleSheet.create({
    scaleOuter: {
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scaleOuterGlow: {
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 10,
      elevation: 10,
    },
    scaleBody: {
      width: size,
      height: size,
      borderRadius: Radius.lg,
      borderWidth: 3,
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
      overflow: 'hidden',
    },
    platformBorder: {
      position: 'absolute',
      top: 8,
      left: 8,
      right: 8,
      bottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: Radius.md,
    },
    lcdRecess: {
      position: 'absolute',
      top: size * 0.18,
      left: size * 0.225,
      width: size * 0.55,
      height: size * 0.22,
      backgroundColor: colors.background,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 3,
      elevation: 2,
    },
    lcdValue: {
      fontSize: Math.round(size * 0.13),
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
      letterSpacing: 1,
    },
    lcdUnit: {
      fontSize: Math.round(size * 0.065),
      fontWeight: '600',
    },
  });

interface Props {
  weight: string;
  unit: string;
  animateToValue: number | null;
  size?: number;
}

export default function DigitalScale({ weight, unit, animateToValue, size = 280 }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors, size);

  const [displayNumber, setDisplayNumber] = useState<string | null>(null);
  const [animationDone, setAnimationDone] = useState<boolean>(false);
  const animRef = useRef<number | null>(null);
  const prevAnimValue = useRef<number | null>(null);

  useEffect(() => {
    if (animateToValue !== null && animateToValue !== prevAnimValue.current) {
      prevAnimValue.current = animateToValue;
      setAnimationDone(false);
      const target = animateToValue;
      const startTime = Date.now();
      const step = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * target;
        const decimals = target % 1 !== 0 ? 1 : 0;
        setDisplayNumber(current.toFixed(decimals));
        if (progress < 1) {
          animRef.current = requestAnimationFrame(step);
        } else {
          setDisplayNumber(target.toFixed(decimals));
          setAnimationDone(true);
        }
      };
      if (animRef.current) cancelAnimationFrame(animRef.current);
      setDisplayNumber('0');
      animRef.current = requestAnimationFrame(step);
    } else if (animateToValue === null) {
      prevAnimValue.current = null;
      setDisplayNumber(null);
      setAnimationDone(false);
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [animateToValue]);

  // weight is the committed saved value (never the live TextInput value).
  // The LCD shows: animated count-up (during/after Save) → saved entry value → placeholder.
  const hasSavedValue = weight.length > 0 && weight !== '0';
  const showAnimated = displayNumber !== null;
  const displayValue = showAnimated ? displayNumber : (hasSavedValue ? weight : (unit === 'lbs' ? '175.5' : '80.0'));
  const valueColor = (showAnimated || hasSavedValue) ? colors.text : colors.textSecondary;

  const showGlow = animationDone || (hasSavedValue && !showAnimated);

  return (
    <View style={[styles.scaleOuter, showGlow && styles.scaleOuterGlow]}>
      <View style={styles.scaleBody}>
        <View style={styles.platformBorder} />
        <View style={styles.lcdRecess}>
          <Text style={[styles.lcdValue, { color: valueColor }]}>
            {displayValue}
          </Text>
          <Text style={[styles.lcdUnit, { color: valueColor }]}>
            {unit}
          </Text>
        </View>
      </View>
    </View>
  );
}
