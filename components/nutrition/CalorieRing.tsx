import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useColors, LightColors, Spacing, Typography } from '../../constants/theme';
import { ringColorForProximity } from '../../utils/calorieColor';

const SIZE = 160;
const STROKE_WIDTH = 14;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    svgContainer: {
      position: 'relative',
      width: SIZE,
      height: SIZE,
    },
    centerText: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    consumed: {
      ...Typography.h2,
      color: colors.text,
    },
    label: {
      ...Typography.small,
      color: colors.textSecondary,
    },
    remaining: {
      ...Typography.small,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
  });

interface Props {
  consumed: number;
  target: number;
}

export default function CalorieRing({ consumed, target }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);

  const ratio = target > 0 ? Math.min(consumed / target, 1.2) : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - Math.min(ratio, 1));
  const remaining = target - consumed;

  return (
    <View style={styles.container}>
      <View style={styles.svgContainer}>
        <Svg width={SIZE} height={SIZE}>
          {/* Background ring */}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={colors.border}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Progress ring */}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={ringColorForProximity(consumed, target, colors.primary)}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <View style={styles.centerText}>
          <Text style={styles.consumed}>{consumed.toLocaleString()}</Text>
          <Text style={styles.label}>of {target.toLocaleString()} cal</Text>
        </View>
      </View>
      <Text style={styles.remaining}>
        {remaining >= 0
          ? `${remaining.toLocaleString()} remaining`
          : `${Math.abs(remaining).toLocaleString()} over`}
      </Text>
    </View>
  );
}
