import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useColors, LightColors, Spacing, Typography } from '../../constants/theme';

const FLAME_WIDTH = 192;
const FLAME_HEIGHT = 192;

// Ionicons `flame-outline` path (viewBox 0 0 512 512) — same vector glyph used by
// the Activities tab-bar icon, scaled up and stroked with the user's accent color.
const FLAME_OUTLINE_PATH =
  'M112,320c0-93,124-165,96-272c66,0,192,96,192,272a144,144,0,0,1-288,0Z';
const FLAME_INNER_SWIRL_PATH = 'M320,368c0,57.71-32,80-64,80';

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: 'transparent',
      marginBottom: Spacing.md,
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
      top: '45%',
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
}

export default function CalorieFlame({ totalBurned }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <View style={styles.wrapper}>
      <View style={styles.flameWrapper}>
        <Svg width={FLAME_WIDTH} height={FLAME_HEIGHT} viewBox="0 0 512 512">
          <Path
            d={FLAME_OUTLINE_PATH}
            stroke={colors.primary}
            fill="none"
            strokeWidth={3.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <Path
            d={FLAME_INNER_SWIRL_PATH}
            stroke={colors.primary}
            fill="none"
            strokeWidth={3.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </Svg>
        <View style={styles.overlay}>
          <Text style={styles.calories}>{totalBurned.toLocaleString()}</Text>
          <Text style={styles.label}>calories burned</Text>
        </View>
      </View>
    </View>
  );
}
