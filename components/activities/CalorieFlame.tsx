import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { useColors, LightColors, Spacing, Typography } from '../../constants/theme';
import { useApp } from '../../context/AppContext';

const FLAME_WIDTH = 192;
const FLAME_HEIGHT = 192;

// Full Ionicons `flame-outline` path (viewBox 0 0 512 512) — single smooth path
// matching the tab-bar icon glyph exactly.
const FLAME_OUTLINE_PATH =
  'M261.56,101.28a8,8,0,0,0-11.06,1.62C229.2,130,176.93,196,162.89,257.79a166.09,166.09,0,0,0-8.69-19.32,8,8,0,0,0-13.45-.43c-35.49,48.27-54,101.41-54,153a168,168,0,0,0,336,0C423,265.59,374.41,180.59,261.56,101.28Z';

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
  const { preferences } = useApp();
  const calUnit = preferences.unit === 'kg' ? 'kcal' : 'cal';

  return (
    <View style={styles.wrapper}>
      <View style={styles.flameWrapper}>
        <Svg width={FLAME_WIDTH} height={FLAME_HEIGHT} viewBox="0 0 512 512">
          {/* Main flame with primaryLight fill */}
          <Path
            d={FLAME_OUTLINE_PATH}
            stroke={colors.primary}
            fill={colors.primaryLight}
            strokeWidth={3.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          {/* Inner flame — scaled-down centered copy for depth */}
          <G transform="translate(128, 128) scale(0.5)">
            <Path
              d={FLAME_OUTLINE_PATH}
              fill={colors.primary}
              fillOpacity={0.3}
              stroke="none"
            />
          </G>
        </Svg>
        <View style={styles.overlay}>
          <Text style={styles.calories}>{totalBurned.toLocaleString()}</Text>
          <Text style={styles.label}>{calUnit}</Text>
        </View>
      </View>
    </View>
  );
}
