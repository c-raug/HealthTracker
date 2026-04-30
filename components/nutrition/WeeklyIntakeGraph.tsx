import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, G, Text as SvgText, Line } from 'react-native-svg';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { ringColorForProximity } from '../../utils/calorieColor';

const WATER_BLUE = '#2196F3';

const TOOLTIP_WIDTH_ACTIVITY = 130;
const TOOLTIP_CLAMP_BUFFER = 4;

const CHART_HEIGHT = 160;
const LABEL_HEIGHT = 20;
const TOP_PAD = 12;
const SIDE_PAD = 6;
const Y_AXIS_WIDTH = 36;

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      paddingVertical: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 5,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.sm,
    },
    title: {
      ...Typography.small,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    chartWrapper: {
      marginHorizontal: Spacing.md,
      borderRadius: Radius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
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
  chartBg?: string;
  selectedBar?: number | null;
  onBarPress?: (index: number) => void;
  onOutsidePress?: () => void;
}

function BarChart({ data, width, useProximityColors, fixedBarColor, goalLine, chartBg, selectedBar, onBarPress, onOutsidePress }: BarChartProps) {
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
  const ticks = [...new Set(Array.from({ length: tickCount }, (_, i) =>
    Math.round((maxValue / tickCount) * (i + 1)),
  ))];

  const barPositions = data.map((_, i) => ({
    x: Y_AXIS_WIDTH + SIDE_PAD + slotWidth * i + (slotWidth - barWidth) / 2,
  }));

  return (
    <View>
      <Svg width={svgWidth} height={svgHeight}>
          {/* Chart background */}
          {chartBg && (
            <Rect x={0} y={0} width={svgWidth} height={svgHeight} fill={chartBg} />
          )}
          {/* Background tap area for outside-bar dismiss */}
          {onOutsidePress && (
            <Rect
              x={0}
              y={0}
              width={svgWidth}
              height={svgHeight}
              fill="rgba(0,0,0,0.001)"
              onPress={onOutsidePress}
            />
          )}
          {/* X-axis baseline */}
          <Line
            x1={Y_AXIS_WIDTH}
            y1={TOP_PAD + CHART_HEIGHT}
            x2={svgWidth - SIDE_PAD}
            y2={TOP_PAD + CHART_HEIGHT}
            stroke={colors.textSecondary}
            strokeWidth={1.5}
            strokeOpacity={0.5}
          />
          {/* Y-axis line */}
          <Line
            x1={Y_AXIS_WIDTH}
            y1={TOP_PAD}
            x2={Y_AXIS_WIDTH}
            y2={TOP_PAD + CHART_HEIGHT}
            stroke={colors.textSecondary}
            strokeWidth={1.5}
            strokeOpacity={0.5}
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
                  stroke={colors.textSecondary}
                  strokeWidth={1}
                  strokeOpacity={0.2}
                  strokeDasharray="4 4"
                />
                <SvgText
                  x={Y_AXIS_WIDTH - 4}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={10}
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
              <G key={day.date} onPress={onBarPress ? () => onBarPress(i) : undefined}>
                {/* Tap area */}
                {onBarPress && (
                  <Rect
                    x={x - (slotWidth - barWidth) / 2}
                    y={TOP_PAD}
                    width={slotWidth}
                    height={CHART_HEIGHT}
                    fill="rgba(0,0,0,0.001)"
                  />
                )}
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
                  fontSize={11}
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
                strokeWidth={2}
                strokeDasharray="4,3"
                strokeOpacity={0.9}
              />
              <SvgText
                x={svgWidth - SIDE_PAD - 42}
                y={goalLineY + 4}
                fontSize={9}
                fill={colors.textSecondary}
                opacity={0.9}
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

export function WeeklyCalorieGraph({ width, calorieData, calorieGoal }: CalorieGraphProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const isDark = colors.card === '#2C2C2E';
  const chartBg = isDark ? '#2C2C2E' : '#F8F9FB';

  if (width === 0) return null;

  const innerWidth = width - Spacing.md * 2;

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={isDark ? ['#3A3A3C', '#2C2C2E'] : ['#FFFFFF', '#F4F4F8']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.headerRow}>
        <Text style={styles.title}>Calories — 7 Days</Text>
      </View>
      <View style={[styles.chartWrapper, { backgroundColor: chartBg }]}>
        <BarChart
          data={calorieData}
          width={innerWidth}
          useProximityColors
          goalLine={calorieGoal}
          chartBg={chartBg}
        />
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

export function WeeklyWaterGraph({ width, waterData, waterGoal, waterUnit }: WaterGraphProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const isDark = colors.card === '#2C2C2E';
  const chartBg = isDark ? '#2C2C2E' : '#F8F9FB';

  if (width === 0) return null;

  const innerWidth = width - Spacing.md * 2;

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={isDark ? ['#3A3A3C', '#2C2C2E'] : ['#FFFFFF', '#F4F4F8']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.headerRow}>
        <Text style={styles.title}>Water — 7 Days</Text>
      </View>
      <View style={[styles.chartWrapper, { backgroundColor: chartBg }]}>
        <BarChart
          data={waterData}
          width={innerWidth}
          fixedBarColor={WATER_BLUE}
          goalLine={waterGoal}
          chartBg={chartBg}
        />
      </View>
    </View>
  );
}

// ---- WeeklyActivityGraph ----


interface ActivityGraphProps {
  width: number;
  activityData: DayEntry[];
  dailyBurnGoal?: number | null;
  activePageIndex?: number;
}

export function WeeklyActivityGraph({ width, activityData, dailyBurnGoal, activePageIndex }: ActivityGraphProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const isDark = colors.card === '#2C2C2E';
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

  const selectedDay = selectedBar !== null ? activityData[selectedBar] : null;

  let tooltipLeft: number | null = null;
  let tooltipTop: number | null = null;
  if (selectedBar !== null && selectedDay) {
    const x = Y_AXIS_WIDTH + SIDE_PAD + slotWidth * selectedBar + (slotWidth - barWidth) / 2;
    const dataMax = Math.max(...activityData.map((d) => Math.max(d.goal, d.consumed)), 1);
    const resolvedGoal = dailyBurnGoal != null && dailyBurnGoal > 0 ? dailyBurnGoal : (activityData.find((d) => d.goal > 0)?.goal ?? 0);
    const maxVal = Math.max(dataMax, resolvedGoal > 0 ? resolvedGoal * 1.15 : dataMax);
    const consumedH = Math.min((selectedDay.consumed / maxVal) * CHART_HEIGHT, CHART_HEIGHT);
    tooltipLeft = Math.min(Math.max(x - TOOLTIP_WIDTH_ACTIVITY / 2, 0), innerWidth - TOOLTIP_WIDTH_ACTIVITY - TOOLTIP_CLAMP_BUFFER);
    tooltipTop = Math.max(TOP_PAD + CHART_HEIGHT - consumedH - 75, 4);
  }

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={isDark ? ['#3A3A3C', '#2C2C2E'] : ['#FFFFFF', '#F4F4F8']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.headerRow}>
        <Text style={styles.title}>Calories Burned — 7 Days</Text>
      </View>
      <View>
        <BarChart
          data={activityData}
          width={innerWidth}
          fixedBarColor={colors.primary}
          goalLine={dailyBurnGoal}
          selectedBar={selectedBar}
          onBarPress={(i) => setSelectedBar(selectedBar === i ? null : i)}
          onOutsidePress={() => setSelectedBar(null)}
        />
        {selectedBar !== null && selectedDay && tooltipLeft !== null && tooltipTop !== null && (
          <View style={[styles.tooltip, { left: tooltipLeft, top: tooltipTop, width: TOOLTIP_WIDTH_ACTIVITY }]}>
            <TouchableOpacity style={styles.tooltipClose} onPress={() => setSelectedBar(null)}>
              <Text style={styles.tooltipCloseText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.tooltipDate}>{formatTooltipDate(selectedDay.date)}</Text>
            {selectedDay.consumed > 0 ? (
              <Text style={styles.tooltipCalories}>{Math.round(selectedDay.consumed)} cal</Text>
            ) : (
              <Text style={styles.tooltipNoData}>No activity logged</Text>
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
