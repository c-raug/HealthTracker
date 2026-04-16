import { View, Text, StyleSheet } from 'react-native';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';

const SCALE_HEIGHT = 100;

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    scaleContainer: {
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
    },
    lcdArea: {
      backgroundColor: colors.background,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: Spacing.xs,
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
}

export default function DigitalScale({ weight, unit }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);

  const hasValue = weight.length > 0 && weight !== '0';
  const displayValue = hasValue ? weight : (unit === 'lbs' ? '175.5' : '80.0');
  const valueColor = hasValue ? colors.text : colors.textSecondary;

  return (
    <View style={styles.scaleContainer}>
      <View style={styles.lcdArea}>
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
