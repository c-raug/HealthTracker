import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';

const SCALE_HEIGHT = 100;
const ANIMATION_DURATION = 900;

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    scaleBody: {
      height: SCALE_HEIGHT,
      borderRadius: Radius.lg,
      backgroundColor: colors.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    platform: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: Radius.lg,
      borderBottomWidth: 3,
      borderBottomColor: colors.border,
    },
    lcdRecess: {
      backgroundColor: colors.background,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: Spacing.xs,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 1,
    },
    lcdValue: {
      fontSize: 32,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
      letterSpacing: 1,
    },
    lcdUnit: {
      ...Typography.body,
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
  const animRef = useRef<number | null>(null);
  const prevAnimValue = useRef<number | null>(null);

  useEffect(() => {
    if (animateToValue !== null && animateToValue !== prevAnimValue.current) {
      prevAnimValue.current = animateToValue;
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
        }
      };
      if (animRef.current) cancelAnimationFrame(animRef.current);
      setDisplayNumber('0');
      animRef.current = requestAnimationFrame(step);
    } else if (animateToValue === null) {
      prevAnimValue.current = null;
      setDisplayNumber(null);
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [animateToValue]);

  const hasValue = weight.length > 0 && weight !== '0';
  const showAnimated = displayNumber !== null;
  const displayValue = showAnimated ? displayNumber : (hasValue ? weight : (unit === 'lbs' ? '175.5' : '80.0'));
  const valueColor = (showAnimated || hasValue) ? colors.text : colors.textSecondary;

  return (
    <View style={styles.scaleBody}>
      <View style={styles.platform} />
      <View style={styles.lcdRecess}>
        <Text style={[styles.lcdValue, { color: valueColor }]}>
          {displayValue}
        </Text>
        <Text style={[styles.lcdUnit, { color: valueColor }]}>
          {unit}
        </Text>
      </View>
    </View>
  );
}
