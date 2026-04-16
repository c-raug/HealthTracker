import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';

const FLAME_WIDTH = 114;
const FLAME_HEIGHT = 160;

// Flame SVG path — viewBox "0 0 120 168"
// Wide body at bottom, tapers to a point at top
const FLAME_PATH =
  'M60 165 C40 150 8 128 8 96 C8 68 22 56 32 46 C30 60 38 70 46 66 ' +
  'C43 53 51 32 60 14 C67 34 80 54 77 72 C84 68 87 58 85 48 ' +
  'C96 62 112 82 112 102 C112 138 82 155 60 165 Z';

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    card: {
      borderRadius: Radius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.lg,
    },
    flameWrapper: {
      width: FLAME_WIDTH,
      height: FLAME_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 28,
    },
    calories: {
      ...Typography.h1,
      fontWeight: '700',
    },
    label: {
      ...Typography.small,
      marginTop: Spacing.xs,
    },
  });

interface Props {
  totalBurned: number;
}

export default function CalorieFlame({ totalBurned }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <View style={styles.card}>
      <View style={styles.flameWrapper}>
        <Svg width={FLAME_WIDTH} height={FLAME_HEIGHT} viewBox="0 0 120 168">
          <Path d={FLAME_PATH} fill="none" stroke={colors.primary} strokeWidth={3} />
        </Svg>
        <View style={styles.overlay}>
          <Text style={[styles.calories, { color: colors.primary }]}>{totalBurned.toLocaleString()}</Text>
          <Text style={[styles.label, { color: colors.primary }]}>calories burned</Text>
        </View>
      </View>
    </View>
  );
}
