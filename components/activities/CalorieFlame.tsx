import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';

const FLAME_WIDTH = 192;
const FLAME_HEIGHT = 192;

// Outer flame silhouette — curvy pointed tip, wider body, rounded narrower base.
// viewBox "0 0 200 200" — rendered at 192x192 to keep the card's outer height
// (~208px with Spacing.sm vertical padding) identical to the previous design.
const FLAME_PATH_OUTER =
  'M 100 8 ' +
  'C 88 30 72 45 68 62 ' +
  'C 66 82 78 90 82 100 ' +
  'C 58 108 32 130 32 162 ' +
  'C 32 185 58 195 100 195 ' +
  'C 142 195 168 185 168 162 ' +
  'C 168 130 142 108 118 100 ' +
  'C 122 90 134 82 132 62 ' +
  'C 128 45 112 30 100 8 Z';

// Inner flame fill — same silhouette inset ~15 units so the outer stroke
// and inner fill read as two nested flame shapes.
const FLAME_PATH_INNER =
  'M 100 38 ' +
  'C 92 55 82 65 80 78 ' +
  'C 78 90 85 97 88 105 ' +
  'C 70 112 52 135 52 162 ' +
  'C 52 180 72 190 100 190 ' +
  'C 128 190 148 180 148 162 ' +
  'C 148 135 130 112 112 105 ' +
  'C 115 97 122 90 120 78 ' +
  'C 118 65 108 55 100 38 Z';

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
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
      paddingVertical: Spacing.sm,
    },
    flameWrapper: {
      width: FLAME_WIDTH,
      height: FLAME_HEIGHT,
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
      paddingHorizontal: Spacing.md,
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
        <Svg width={FLAME_WIDTH} height={FLAME_HEIGHT} viewBox="0 0 200 200">
          <Path d={FLAME_PATH_INNER} fill={colors.primaryLight} />
          <Path d={FLAME_PATH_OUTER} fill="none" stroke={colors.primary} strokeWidth={3} />
        </Svg>
        <View style={styles.overlay}>
          <Text style={[styles.calories, { color: colors.primary }]}>{totalBurned.toLocaleString()}</Text>
          <Text style={[styles.label, { color: colors.primary }]}>calories burned</Text>
        </View>
      </View>
    </View>
  );
}
