import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';

const FLAME_WIDTH = 160;
const FLAME_HEIGHT = 160;

// Flame SVG path — viewBox "0 0 168 168"
// Wide body at bottom, tapers to a point at top
const FLAME_PATH =
  'M84 165 C58 148 10 124 10 88 C10 58 28 44 42 32 C40 50 50 62 60 58 ' +
  'C56 42 68 18 84 4 C100 18 112 42 108 58 C118 62 128 50 126 32 ' +
  'C140 44 158 58 158 88 C158 124 110 148 84 165 Z';

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
        <Svg width={FLAME_WIDTH} height={FLAME_HEIGHT} viewBox="0 0 168 168">
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
