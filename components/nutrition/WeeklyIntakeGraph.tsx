import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Rect, G, Text as SvgText, Line } from 'react-native-svg';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { ringColorForProximity } from '../../utils/calorieColor';

const WATER_BLUE = '#2196F3';

const TOOLTIP_WIDTH_CALORIE = 160;
const TOOLTIP_WIDTH_WATER = 120;
const TOOLTIP_CLAMP_BUFFER = 4;

const CHART_HEIGHT = 160;
const LABEL_HEIGHT = 20;
const TOP_PAD = 12;
const SIDE_PAD = 6;
const Y_AXIS_WIDTH = 36;

const MACRO_PROTEIN = '#3B82F6';
const MACRO_CARBS = '#F59E0B';
const MACRO_FAT = '#EF4444';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    titleRow: {
      marginBottom: Spacing.sm,
    },
    title: {
      ...Typography.h3,
      color: colors.text,
    },
    tooltipOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    tooltip: {
      position: 'absolute',
      backgroundColor: colors.card,
      borderRadius: Radius.md,
      padding: Spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tooltipClose: {
      position: 'absolute',
      top: 4,
      right: 4,
      padding: 2,
    },
    tooltipCloseText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    tooltipDate: {
      ...Typography.small,
      color: colors.textSecondary,
      marginBottom: 2,
      paddingRight: 16,
    },
    tooltipCalories: {
      ...Typography.body,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    tooltipMacroRow: {
      flexDirection: 'row',
      gap: Spacing.xs,
      flexWrap: 'wrap',
    },
    tooltipMacro: {
      ...Typography.small,
      color: colors.text,
    },
    tooltipNoData: {
      ...Typography.small,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
  });

interface DayEntry {
  date: string;
  consumed: number;
  goal: number;
}

interface DayMacro {
  date: string;
  protein: number;
  carbs: number;
  fat: number;
}

function formatTooltipDate(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return `${DAY_LABELS[d.getDay()]} ${MONTH_LABELS[parts[1] - 1]} ${parts[2]}`;
}

interface BarChartProps {
  data: DayEntry[];
  width: number;
  useProximityColors?: boolean;
  fixedBarColor?: string;
  goalLine?: number | null;
  selectedBar: number | null;
  onBarPress: (index: number) => void;
  onOutsidePress: () => void;
}

function BarChart({ data, width, useProximityColors, fixedBarColor, goalLine, selectedBar, onBarPress, onOutsidePress }: BarChartProps) {
  const colors = useColors();
  const chartWidth = width - Y_AXIS_WIDTH - SIDE_PAD;
  const usableWidth = chartWidth - SIDE_PAD;
  const slotWidth = usableWidth / 7;
  const barWidth = slotWidth * 0.55;
  const svgWidth = width;
  const svgHeight = CHART_HEIGHT + LABEL_HEIGHT + TOP_PAD;

  const dataMax = Math.max(...data.map((d) => Math.max(d.goal, d.consumed)), 1);
  const resolvedGoal = goalLine != null && goalLine > 0
    ? goalLine
    : (data.find((d) => d.goal > 0)?.goal ?? 0);
  const maxValue = Math.max(dataMax, resolvedGoal > 0 ? resolvedGoal * 1.15 : dataMax);

  const goalLineY = resolvedGoal > 0
    ? TOP_PAD + CHART_HEIGHT - (resolvedGoal / maxValue) * CHART_HEIGHT
    : null;

  const tickCount = 3;
  const ticks = Array.from({ length: tickCount }, (_, i) =>
    Math.round((maxValue / tickCount) * (i + 1)),
  );

  const barPositions = data.map((_, i) => ({
    x: Y_AXIS_WIDTH + SIDE_PAD + slotWidth * i + (slotWidth - barWidth) / 2,
  }));

  return (
    <View>
      <Svg width={svgWidth} height={svgHeight}>
          {/* Background tap area for outside-bar dismiss */}
          <Rect
            x={0}
            y={0}
            width={svgWidth}
            height={svgHeight}
            fill="rgba(0,0,0,0.001)"
            onPress={onOutsidePress}
          />
          {/* Y-axis grid lines and labels */}
          {ticks.map((tick) => {
            const y = TOP_PAD + CHART_HEIGHT - (tick / maxValue) * CHART_HEIGHT;
            return (
              <G key={tick}>
                <Line
                  x1={Y_AXIS_WIDTH}
                  y1={y}
                  x2={svgWidth - SIDE_PAD}
                  y2={y}
                  stroke={colors.border}
                  strokeWidth={1}
                  strokeOpacity={0.3}
                  strokeDasharray="4 4"
                />
                <SvgText
                  x={Y_AXIS_WIDTH - 4}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={9}
                  fill={colors.textSecondary}
                >
                  {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
                </SvgText>
              </G>
            );
          })}

          {data.map((day, i) => {
            const { x } = barPositions[i];
            const consumedH = Math.min((day.consumed / maxValue) * CHART_HEIGHT, CHART_HEIGHT);

            const parts = day.date.split('-').map(Number);
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            const dayLabel = DAY_LABELS[d.getDay()];

            let barFill: string;
            if (fixedBarColor) {
              barFill = fixedBarColor;
            } else if (useProximityColors) {
              barFill = ringColorForProximity(day.consumed, day.goal, colors.primary);
            } else {
              barFill = colors.primary;
            }

            const isSelected = selectedBar === i;

            return (
              <G key={day.date} onPress={() => onBarPress(i)}>
                {/* Tap area */}
                <Rect
                  x={x - (slotWidth - barWidth) / 2}
                  y={TOP_PAD}
                  width={slotWidth}
                  height={CHART_HEIGHT}
                  fill="rgba(0,0,0,0.001)"
                />
                {/* Consumed bar */}
                {day.consumed > 0 && (
                  <Rect
                    x={x}
                    y={TOP_PAD + CHART_HEIGHT - consumedH}
                    width={barWidth}
                    height={consumedH}
                    rx={3}
                    fill={barFill}
                    opacity={isSelected ? 1 : 0.85}
                  />
                )}
                {/* Day label */}
                <SvgText
                  x={x + barWidth / 2}
                  y={svgHeight - 4}
                  textAnchor="middle"
                  fontSize={10}
                  fill={colors.textSecondary}
                >
                  {dayLabel}
                </SvgText>
              </G>
            );
          })}

          {/* Dotted goal line overlay */}
          {goalLineY !== null && (
            <>
              <Line
                x1={Y_AXIS_WIDTH}
                y1={goalLineY}
                x2={svgWidth - SIDE_PAD - 44}
                y2={goalLineY}
                stroke={colors.textSecondary}
                strokeWidth={1.5}
                strokeDasharray="4,3"
                strokeOpacity={0.7}
              />
              <SvgText
                x={svgWidth - SIDE_PAD - 42}
                y={goalLineY + 4}
                fontSize={8}
                fill={colors.textSecondary}
                opacity={0.7}
              >
                {`Goal: ${resolvedGoal >= 1000 ? `${(resolvedGoal / 1000).toFixed(1)}k` : resolvedGoal}`}
              </SvgText>
            </>
          )}
      </Svg>
    </View>
  );
}

// ---- WeeklyCalorieGraph ----

interface CalorieGraphProps {
  width: number;
  calorieData: DayEntry[];
  macroData?: DayMacro[];
  calorieGoal?: number | null;
  activePageIndex?: number;
}

export function WeeklyCalorieGraph({ width, calorieData, macroData, calorieGoal, activePageIndex }: CalorieGraphProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  useEffect(() => {
    setSelectedBar(null);
  }, [activePageIndex]);

  if (width === 0) return null;

  const innerWidth = width - Spacing.md * 2;
  const chartWidth = innerWidth - Y_AXIS_WIDTH - SIDE_PAD;
  const usableWidth = chartWidth - SIDE_PAD;
  const slotWidth = usableWidth / 7;
  const barWidth = slotWidth * 0.55;

  const selectedDay = selectedBar !== null ? calorieData[selectedBar] : null;
  const selectedMacro = selectedBar !== null && macroData ? macroData[selectedBar] : null;

  // Compute tooltip x position — clamp to stay within card with buffer for border/padding
  let tooltipLeft: number | null = null;
  let tooltipTop: number | null = null;
  if (selectedBar !== null && selectedDay) {
    const x = Y_AXIS_WIDTH + SIDE_PAD + slotWidth * selectedBar + (slotWidth - barWidth) / 2;
    const dataMax = Math.max(...calorieData.map((d) => Math.max(d.goal, d.consumed)), 1);
    const resolvedGoal = calorieGoal != null && calorieGoal > 0 ? calorieGoal : (calorieData.find((d) => d.goal > 0)?.goal ?? 0);
    const maxVal = Math.max(dataMax, resolvedGoal > 0 ? resolvedGoal * 1.15 : dataMax);
    const consumedH = Math.min((selectedDay.consumed / maxVal) * CHART_HEIGHT, CHART_HEIGHT);
    tooltipLeft = Math.min(Math.max(x - TOOLTIP_WIDTH_CALORIE / 2, 0), innerWidth - TOOLTIP_WIDTH_CALORIE - TOOLTIP_CLAMP_BUFFER);
    tooltipTop = Math.max(TOP_PAD + CHART_HEIGHT - consumedH - 90, 4);
  }

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Calories — 7 Days</Text>
      </View>
      <View>
        <BarChart
          data={calorieData}
          width={innerWidth}
          useProximityColors
          goalLine={calorieGoal}
          selectedBar={selectedBar}
          onBarPress={(i) => setSelectedBar(selectedBar === i ? null : i)}
          onOutsidePress={() => setSelectedBar(null)}
        />
        {selectedBar !== null && selectedDay && tooltipLeft !== null && tooltipTop !== null && (
          <View style={[styles.tooltip, { left: tooltipLeft, top: tooltipTop, width: TOOLTIP_WIDTH_CALORIE }]}>
            <TouchableOpacity style={styles.tooltipClose} onPress={() => setSelectedBar(null)}>
              <Text style={styles.tooltipCloseText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.tooltipDate}>{formatTooltipDate(selectedDay.date)}</Text>
            {selectedDay.consumed > 0 ? (
              <>
                <Text style={styles.tooltipCalories}>{Math.round(selectedDay.consumed)} cal</Text>
                {selectedMacro && (
                  <View style={styles.tooltipMacroRow}>
                    <Text style={[styles.tooltipMacro, { color: MACRO_PROTEIN }]}>■ P: {Math.round(selectedMacro.protein)}g</Text>
                    <Text style={[styles.tooltipMacro, { color: MACRO_CARBS }]}>■ C: {Math.round(selectedMacro.carbs)}g</Text>
                    <Text style={[styles.tooltipMacro, { color: MACRO_FAT }]}>■ F: {Math.round(selectedMacro.fat)}g</Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.tooltipNoData}>No data logged</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

// ---- WeeklyWaterGraph ----

interface WaterGraphProps {
  width: number;
  waterData: DayEntry[];
  waterGoal?: number | null;
  waterUnit?: string;
  activePageIndex?: number;
}

export function WeeklyWaterGraph({ width, waterData, waterGoal, waterUnit, activePageIndex }: WaterGraphProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  useEffect(() => {
    setSelectedBar(null);
  }, [activePageIndex]);

  if (width === 0) return null;

  const innerWidth = width - Spacing.md * 2;
  const chartWidth = innerWidth - Y_AXIS_WIDTH - SIDE_PAD;
  const usableWidth = chartWidth - SIDE_PAD;
  const slotWidth = usableWidth / 7;
  const barWidth = slotWidth * 0.55;

  const selectedDay = selectedBar !== null ? waterData[selectedBar] : null;

  let tooltipLeft: number | null = null;
  let tooltipTop: number | null = null;
  if (selectedBar !== null && selectedDay) {
    const x = Y_AXIS_WIDTH + SIDE_PAD + slotWidth * selectedBar + (slotWidth - barWidth) / 2;
    const dataMax = Math.max(...waterData.map((d) => Math.max(d.goal, d.consumed)), 1);
    const resolvedGoal = waterGoal != null && waterGoal > 0 ? waterGoal : (waterData.find((d) => d.goal > 0)?.goal ?? 0);
    const maxVal = Math.max(dataMax, resolvedGoal > 0 ? resolvedGoal * 1.15 : dataMax);
    const consumedH = Math.min((selectedDay.consumed / maxVal) * CHART_HEIGHT, CHART_HEIGHT);
    tooltipLeft = Math.min(Math.max(x - TOOLTIP_WIDTH_WATER / 2, 0), innerWidth - TOOLTIP_WIDTH_WATER - TOOLTIP_CLAMP_BUFFER);
    tooltipTop = Math.max(TOP_PAD + CHART_HEIGHT - consumedH - 75, 4);
  }

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Water — 7 Days</Text>
      </View>
      <View>
        <BarChart
          data={waterData}
          width={innerWidth}
          fixedBarColor={WATER_BLUE}
          goalLine={waterGoal}
          selectedBar={selectedBar}
          onBarPress={(i) => setSelectedBar(selectedBar === i ? null : i)}
          onOutsidePress={() => setSelectedBar(null)}
        />
        {selectedBar !== null && selectedDay && tooltipLeft !== null && tooltipTop !== null && (
          <View style={[styles.tooltip, { left: tooltipLeft, top: tooltipTop, width: TOOLTIP_WIDTH_WATER }]}>
            <TouchableOpacity style={styles.tooltipClose} onPress={() => setSelectedBar(null)}>
              <Text style={styles.tooltipCloseText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.tooltipDate}>{formatTooltipDate(selectedDay.date)}</Text>
            {selectedDay.consumed > 0 ? (
              <Text style={styles.tooltipCalories}>{Math.round(selectedDay.consumed)} {waterUnit ?? 'oz'}</Text>
            ) : (
              <Text style={styles.tooltipNoData}>No data logged</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

// Keep default export for backward compatibility
export default function WeeklyIntakeGraph({ width, calorieData, waterData, calorieGoal, waterGoal }: {
  width: number;
  calorieData: DayEntry[];
  waterData: DayEntry[];
  waterUnit: string;
  calorieGoal?: number | null;
  waterGoal?: number | null;
}) {
  return (
    <View>
      <WeeklyCalorieGraph width={width} calorieData={calorieData} calorieGoal={calorieGoal} />
      <WeeklyWaterGraph width={width} waterData={waterData} waterGoal={waterGoal} />
    </View>
  );
}
