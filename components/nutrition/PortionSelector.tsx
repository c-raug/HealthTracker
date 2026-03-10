import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import {
  useColors,
  LightColors,
  Spacing,
  Typography,
  Radius,
} from '../../constants/theme';

// Fraction steps in eighths
const FRACTIONS = [0, 1 / 8, 2 / 8, 3 / 8, 4 / 8, 5 / 8, 6 / 8, 7 / 8];
const FRACTION_LABELS = ['0', '⅛', '¼', '⅜', '½', '⅝', '¾', '⅞'];
const WHOLE_MAX = 250;

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 3;
const DRUM_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS; // 220
const PAD_COUNT = Math.floor(VISIBLE_ITEMS / 2); // 2

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    servingLabel: {
      ...Typography.small,
      color: colors.textSecondary,
    },
    totalText: {
      ...Typography.h3,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    previewRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: colors.primaryLight,
      borderRadius: Radius.md,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.xs,
      marginTop: Spacing.sm,
    },
    previewItem: {
      alignItems: 'center',
    },
    previewValue: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '600',
    },
    previewLabel: {
      ...Typography.small,
      color: colors.textSecondary,
    },
    drumWrapper: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.sm,
    },
    drumContainer: {
      width: 110,
      height: DRUM_HEIGHT,
      overflow: 'hidden',
      borderRadius: Radius.md,
      backgroundColor: colors.background,
    },
    drumScroll: {
      flex: 1,
    },
    drumItem: {
      height: ITEM_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    drumItemText: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    drumItemTextSelected: {
      ...Typography.h3,
      color: colors.text,
      fontWeight: '700',
    },
    drumHighlight: {
      position: 'absolute',
      top: ITEM_HEIGHT * PAD_COUNT,
      left: 0,
      right: 0,
      height: ITEM_HEIGHT,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
      borderRadius: Radius.sm,
    },
    drumLabel: {
      ...Typography.small,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.xs,
    },
  });

export interface PortionSelectorProps {
  value: number;
  onChange: (value: number) => void;
  baseCalories: number;
  baseProtein: number;
  baseCarbs: number;
  baseFat: number;
  servingSize: string;
  baseServings: number;
}

export default function PortionSelector({
  value,
  onChange,
  baseCalories,
  baseProtein,
  baseCarbs,
  baseFat,
  servingSize,
  baseServings,
}: PortionSelectorProps) {
  const colors = useColors();
  const styles = makeStyles(colors);

  const initialWhole = Math.floor(value);
  const initialFracIndex = Math.round((value - initialWhole) * 8);

  const [wholeValue, setWholeValue] = useState(initialWhole);
  const [fractionIndex, setFractionIndex] = useState(initialFracIndex);

  const wholeScrollRef = useRef<ScrollView>(null);
  const fracScrollRef = useRef<ScrollView>(null);

  // Notify parent whenever drums change
  useEffect(() => {
    const total = wholeValue + FRACTIONS[fractionIndex];
    onChange(total);
  }, [wholeValue, fractionIndex]);

  // Position drums to initial value on mount
  useEffect(() => {
    const t = setTimeout(() => {
      wholeScrollRef.current?.scrollTo({ y: initialWhole * ITEM_HEIGHT, animated: false });
      fracScrollRef.current?.scrollTo({ y: initialFracIndex * ITEM_HEIGHT, animated: false });
    }, 50);
    return () => clearTimeout(t);
  }, []);

  const handleWholeScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(WHOLE_MAX, index));
    if (clamped !== wholeValue) setWholeValue(clamped);
  };

  const handleFracScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(FRACTIONS.length - 1, index));
    if (clamped !== fractionIndex) setFractionIndex(clamped);
  };

  const currentTotal = wholeValue + FRACTIONS[fractionIndex];

  const scale = baseServings > 0 ? currentTotal / baseServings : currentTotal;
  const previewCal = Math.round(baseCalories * scale);
  const previewProtein = Math.round(baseProtein * scale * 10) / 10;
  const previewCarbs = Math.round(baseCarbs * scale * 10) / 10;
  const previewFat = Math.round(baseFat * scale * 10) / 10;

  const fractionLabel = FRACTION_LABELS[fractionIndex];
  const totalDisplay =
    wholeValue === 0 && fractionIndex === 0
      ? '0'
      : fractionIndex === 0
      ? `${wholeValue}`
      : wholeValue === 0
      ? fractionLabel
      : `${wholeValue} ${fractionLabel}`;

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.servingLabel}>
          {currentTotal.toFixed(3).replace(/\.?0+$/, '') || '0'} × {servingSize}
        </Text>
      </View>

      <View style={styles.drumWrapper}>
        {/* Whole number drum */}
        <View>
          <Text style={styles.drumLabel}>Whole</Text>
          <View style={styles.drumContainer}>
            <View style={styles.drumHighlight} pointerEvents="none" />
            <ScrollView
              ref={wholeScrollRef}
              style={styles.drumScroll}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              scrollEventThrottle={16}
              onMomentumScrollEnd={handleWholeScroll}
              onScrollEndDrag={handleWholeScroll}
              contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * PAD_COUNT }}
            >
              {Array.from({ length: WHOLE_MAX + 1 }, (_, i) => (
                <View key={i} style={styles.drumItem}>
                  <Text
                    style={
                      i === wholeValue
                        ? styles.drumItemTextSelected
                        : styles.drumItemText
                    }
                  >
                    {i}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Fraction drum */}
        <View>
          <Text style={styles.drumLabel}>Fraction</Text>
          <View style={styles.drumContainer}>
            <View style={styles.drumHighlight} pointerEvents="none" />
            <ScrollView
              ref={fracScrollRef}
              style={styles.drumScroll}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              scrollEventThrottle={16}
              onMomentumScrollEnd={handleFracScroll}
              onScrollEndDrag={handleFracScroll}
              contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * PAD_COUNT }}
            >
              {FRACTION_LABELS.map((label, i) => (
                <View key={i} style={styles.drumItem}>
                  <Text
                    style={
                      i === fractionIndex
                        ? styles.drumItemTextSelected
                        : styles.drumItemText
                    }
                  >
                    {label}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>

      {/* Total display */}
      <Text style={styles.totalText}>
        {totalDisplay} serving{currentTotal !== 1 ? 's' : ''}
      </Text>

      {/* Live macro preview */}
      <View style={styles.previewRow}>
        <View style={styles.previewItem}>
          <Text style={styles.previewValue}>{previewCal}</Text>
          <Text style={styles.previewLabel}>cal</Text>
        </View>
        <View style={styles.previewItem}>
          <Text style={styles.previewValue}>{previewProtein}g</Text>
          <Text style={styles.previewLabel}>protein</Text>
        </View>
        <View style={styles.previewItem}>
          <Text style={styles.previewValue}>{previewCarbs}g</Text>
          <Text style={styles.previewLabel}>carbs</Text>
        </View>
        <View style={styles.previewItem}>
          <Text style={styles.previewValue}>{previewFat}g</Text>
          <Text style={styles.previewLabel}>fat</Text>
        </View>
      </View>
    </View>
  );
}
