import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    toggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      backgroundColor: colors.background,
      borderRadius: Radius.sm,
    },
    toggleBtnText: {
      ...Typography.small,
      color: colors.primary,
      fontWeight: '600',
    },
    totalText: {
      ...Typography.h3,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    sliderSection: {
      marginBottom: Spacing.sm,
    },
    sliderLabel: {
      ...Typography.small,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    sliderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    sliderTrack: {
      flex: 1,
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      justifyContent: 'center',
    },
    sliderFill: {
      position: 'absolute',
      left: 0,
      top: 0,
      height: 6,
      backgroundColor: colors.primary,
      borderRadius: 3,
    },
    sliderThumb: {
      position: 'absolute',
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.primary,
      marginTop: -8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },
    sliderValue: {
      ...Typography.small,
      color: colors.text,
      fontWeight: '600',
      minWidth: 32,
      textAlign: 'right',
    },
    fractionRow: {
      flexDirection: 'row',
      gap: 4,
      flexWrap: 'wrap',
    },
    fractionChip: {
      flex: 1,
      minWidth: 36,
      paddingVertical: Spacing.xs,
      backgroundColor: colors.background,
      borderRadius: Radius.sm,
      alignItems: 'center',
    },
    fractionChipActive: {
      backgroundColor: colors.primary,
    },
    fractionText: {
      ...Typography.small,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    fractionTextActive: {
      color: colors.white,
    },
    keypadInput: {
      backgroundColor: colors.card,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
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

  const [keypadMode, setKeypadMode] = useState(false);
  const [wholeValue, setWholeValue] = useState(initialWhole);
  const [fractionIndex, setFractionIndex] = useState(initialFracIndex);
  const [keypadInput, setKeypadInput] = useState(value.toString());

  const wholeTrackWidth = useRef(0);

  // Notify parent whenever sliders change
  useEffect(() => {
    if (!keypadMode) {
      const total = wholeValue + FRACTIONS[fractionIndex];
      onChange(total);
    }
  }, [wholeValue, fractionIndex, keypadMode]);

  const wholePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gs) => {
        const pct = Math.min(1, Math.max(0, gs.x0 / (wholeTrackWidth.current || 1)));
        setWholeValue(Math.round(pct * WHOLE_MAX));
      },
      onPanResponderMove: (_, gs) => {
        const pct = Math.min(1, Math.max(0, gs.moveX / (wholeTrackWidth.current || 1)));
        setWholeValue(Math.round(pct * WHOLE_MAX));
      },
    }),
  ).current;

  const handleWholeTrackLayout = (e: LayoutChangeEvent) => {
    wholeTrackWidth.current = e.nativeEvent.layout.width;
  };

  const handleKeypadChange = (text: string) => {
    setKeypadInput(text);
    const n = parseFloat(text);
    if (!isNaN(n) && n >= 0) {
      onChange(n);
    }
  };

  const toggleMode = () => {
    if (keypadMode) {
      // Switching back to sliders — sync slider state from keypad value
      const n = parseFloat(keypadInput) || 0;
      const whole = Math.min(WHOLE_MAX, Math.floor(n));
      const fracIdx = Math.min(7, Math.round((n - whole) * 8));
      setWholeValue(whole);
      setFractionIndex(fracIdx);
      setKeypadMode(false);
    } else {
      // Switching to keypad — show current slider value
      const total = wholeValue + FRACTIONS[fractionIndex];
      setKeypadInput(total % 1 === 0 ? total.toString() : total.toFixed(4).replace(/0+$/, ''));
      setKeypadMode(true);
    }
  };

  const currentTotal = keypadMode
    ? parseFloat(keypadInput) || 0
    : wholeValue + FRACTIONS[fractionIndex];

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

  const thumbPct = WHOLE_MAX > 0 ? wholeValue / WHOLE_MAX : 0;

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.servingLabel}>
          {currentTotal.toFixed(3).replace(/\.?0+$/, '') || '0'} × {servingSize}
        </Text>
        <TouchableOpacity style={styles.toggleBtn} onPress={toggleMode} activeOpacity={0.8}>
          <Ionicons
            name={keypadMode ? 'options-outline' : 'keypad-outline'}
            size={16}
            color={colors.primary}
          />
          <Text style={styles.toggleBtnText}>{keypadMode ? 'Sliders' : 'Keypad'}</Text>
        </TouchableOpacity>
      </View>

      {keypadMode ? (
        <TextInput
          style={styles.keypadInput}
          value={keypadInput}
          onChangeText={handleKeypadChange}
          keyboardType="decimal-pad"
          placeholder="e.g. 1.5"
          placeholderTextColor={colors.textSecondary}
          autoFocus
          selectTextOnFocus
        />
      ) : (
        <>
          {/* Whole number slider */}
          <View style={styles.sliderSection}>
            <Text style={styles.sliderLabel}>Whole servings</Text>
            <View style={styles.sliderRow}>
              <View
                style={styles.sliderTrack}
                onLayout={handleWholeTrackLayout}
                {...wholePan.panHandlers}
              >
                <View style={[styles.sliderFill, { width: `${thumbPct * 100}%` }]} />
                <View
                  style={[
                    styles.sliderThumb,
                    { left: `${thumbPct * 100}%`, marginLeft: -11 },
                  ]}
                />
              </View>
              <Text style={styles.sliderValue}>{wholeValue}</Text>
            </View>
          </View>

          {/* Fraction selector */}
          <View style={styles.sliderSection}>
            <Text style={styles.sliderLabel}>Fraction (⅛ increments)</Text>
            <View style={styles.fractionRow}>
              {FRACTION_LABELS.map((label, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.fractionChip,
                    fractionIndex === i && styles.fractionChipActive,
                  ]}
                  onPress={() => setFractionIndex(i)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.fractionText,
                      fractionIndex === i && styles.fractionTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Total display */}
          <Text style={styles.totalText}>{totalDisplay} serving{currentTotal !== 1 ? 's' : ''}</Text>
        </>
      )}

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
