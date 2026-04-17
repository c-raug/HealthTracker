import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useColors, LightColors, Spacing, Typography } from '../../constants/theme';

const FLAME_WIDTH = 192;
const FLAME_HEIGHT = 192;

// Fixed warm flame colors — always the same regardless of user's accent theme.
const FLAME_OUTER_COLOR = '#F44336';
const FLAME_INNER_COLOR = '#FFC107';

// Main center tongue — tallest, classic flame silhouette with pointed tip.
const FLAME_PATH_CENTER =
  'M 100 8 ' +
  'C 78 32 52 62 48 105 ' +
  'C 44 140 48 160 68 182 ' +
  'L 132 182 ' +
  'C 152 160 156 140 152 105 ' +
  'C 148 62 122 32 100 8 Z';

// Left side tongue — shorter, flanks the main tongue.
const FLAME_PATH_LEFT =
  'M 38 82 ' +
  'C 20 112 12 148 30 176 ' +
  'C 35 182 44 184 56 182 ' +
  'L 64 182 ' +
  'C 58 164 56 142 54 122 ' +
  'C 52 104 46 86 38 82 Z';

// Right side tongue — mirror of left.
const FLAME_PATH_RIGHT =
  'M 162 82 ' +
  'C 180 112 188 148 170 176 ' +
  'C 165 182 156 184 144 182 ' +
  'L 136 182 ' +
  'C 142 164 144 142 146 122 ' +
  'C 148 104 154 86 162 82 Z';

// Nested inner teardrop — wide lower-middle to host calorie number + label.
const FLAME_PATH_INNER =
  'M 100 55 ' +
  'C 82 75 65 105 62 140 ' +
  'C 58 160 60 175 74 182 ' +
  'L 126 182 ' +
  'C 140 175 142 160 138 140 ' +
  'C 135 105 118 75 100 55 Z';

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
        <Svg width={FLAME_WIDTH} height={FLAME_HEIGHT} viewBox="0 0 200 200">
          <Path d={FLAME_PATH_LEFT} fill={FLAME_OUTER_COLOR} />
          <Path d={FLAME_PATH_RIGHT} fill={FLAME_OUTER_COLOR} />
          <Path d={FLAME_PATH_CENTER} fill={FLAME_OUTER_COLOR} />
          <Path d={FLAME_PATH_INNER} fill={FLAME_INNER_COLOR} />
        </Svg>
        <View style={styles.overlay}>
          <Text style={styles.calories}>{totalBurned.toLocaleString()}</Text>
          <Text style={styles.label}>calories burned</Text>
        </View>
      </View>
    </View>
  );
}
