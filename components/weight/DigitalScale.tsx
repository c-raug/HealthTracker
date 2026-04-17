import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';

const SCALE_HEIGHT = 220;
const ANIMATION_DURATION = 1500;

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    scaleOuter: {
      width: '100%',
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
      width: '100%',
      height: SCALE_HEIGHT,
      borderRadius: Radius.lg,
      borderWidth: 3,
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.lg,
    },
    platformBase: {
      position: 'absolute',
      left: Spacing.md,
      right: Spacing.md,
      bottom: Spacing.md,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
      opacity: 0.25,
    },
    lcdRecess: {
      backgroundColor: colors.background,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: Spacing.xs,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 3,
      elevation: 2,
      minWidth: '70%',
      justifyContent: 'center',
    },
    lcdValue: {
      fontSize: 48,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
      letterSpacing: 1,
    },
    lcdUnit: {
      ...Typography.h3,
      fontWeight: '600',
    },
  });

interface Props {
  weight: string;
  unit: string;
  animateToValue: number | null;
}

export default function DigitalScale({ weight, unit, animateToValue }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);

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

  const hasSavedValue = weight.length > 0 && weight !== '0';
  const showAnimated = displayNumber !== null;
  const displayValue = showAnimated ? displayNumber : (hasSavedValue ? weight : (unit === 'lbs' ? '175.5' : '80.0'));
  const valueColor = (showAnimated || hasSavedValue) ? colors.text : colors.textSecondary;

  const showGlow = animationDone || (hasSavedValue && !showAnimated);

  return (
    <View style={[styles.scaleOuter, showGlow && styles.scaleOuterGlow]}>
      <View style={styles.scaleBody}>
        <View style={styles.lcdRecess}>
          <Text style={[styles.lcdValue, { color: valueColor }]}>
            {displayValue}
          </Text>
          <Text style={[styles.lcdUnit, { color: valueColor }]}>
            {unit}
          </Text>
        </View>
        <View style={styles.platformBase} />
      </View>
    </View>
  );
}
