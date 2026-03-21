import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, G, Text as SvgText, Line } from 'react-native-svg';
import { useColors, LightColors, Spacing, Typography } from '../../constants/theme';
import { ringColorForProximity } from '../../utils/calorieColor';

const WATER_BLUE = '#2196F3';

const CHART_HEIGHT = 120;
const LABEL_HEIGHT = 16;
const SIDE_PAD = 6;
const Y_AXIS_WIDTH = 36;

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: Spacing.sm,
      paddingTop: Spacing.sm,
    },
    chartTitle: {
      ...Typography.small,
      color: colors.textSecondary,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: Spacing.xs,
      textAlign: 'center',
    },
  });

interface DayEntry {
  date: string;
  consumed: number;
  goal: number;
}

interface BarChartProps {
  data: DayEntry[];
  width: number;
  useProximityColors?: boolean;
  fixedBarColor?: string;
  goalLine?: number | null;
}

function BarChart({ data, width, useProximityColors, fixedBarColor, goalLine }: BarChartProps) {
  const colors = useColors();
  const chartWidth = width - Y_AXIS_WIDTH - SIDE_PAD;
  const usableWidth = chartWidth - SIDE_PAD;
  const slotWidth = usableWidth / 7;
  const barWidth = slotWidth * 0.55;
  const svgWidth = width;
  const svgHeight = CHART_HEIGHT + LABEL_HEIGHT;

  const maxValue = Math.max(...data.map((d) => Math.max(d.goal, d.consumed)), 1);

  const resolvedGoal = goalLine != null && goalLine > 0
    ? goalLine
    : (data.find((d) => d.goal > 0)?.goal ?? 0);
  const goalLineY = resolvedGoal > 0 ? CHART_HEIGHT - (resolvedGoal / maxValue) * CHART_HEIGHT : null;

  // Y-axis ticks: 3 evenly spaced values
  const tickCount = 3;
  const ticks = Array.from({ length: tickCount }, (_, i) =>
    Math.round((maxValue / (tickCount)) * (i + 1)),
  );

  return (
    <Svg width={svgWidth} height={svgHeight}>
      {/* Y-axis grid lines and labels */}
      {ticks.map((tick) => {
        const y = CHART_HEIGHT - (tick / maxValue) * CHART_HEIGHT;
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
        const x = Y_AXIS_WIDTH + SIDE_PAD + slotWidth * i + (slotWidth - barWidth) / 2;
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

        return (
          <G key={day.date}>
            {/* Consumed bar */}
            {day.consumed > 0 && (
              <Rect
                x={x}
                y={CHART_HEIGHT - consumedH}
                width={barWidth}
                height={consumedH}
                rx={3}
                fill={barFill}
              />
            )}
            {/* Value label above bar */}
            {day.consumed > 0 && (
              <SvgText
                x={x + barWidth / 2}
                y={CHART_HEIGHT - consumedH - 3}
                textAnchor="middle"
                fontSize={8}
                fill={colors.textSecondary}
              >
                {day.consumed >= 1000
                  ? `${(day.consumed / 1000).toFixed(1)}k`
                  : day.consumed}
              </SvgText>
            )}
            {/* Day label */}
            <SvgText
              x={x + barWidth / 2}
              y={svgHeight - 2}
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
  );
}

interface GraphProps {
  width: number;
  data: DayEntry[];
  goalLine?: number | null;
  title: string;
  useProximityColors?: boolean;
  fixedBarColor?: string;
}

function SingleGraph({ width, data, goalLine, title, useProximityColors, fixedBarColor }: GraphProps) {
  const colors = useColors();
  const styles = makeStyles(colors);

  if (width === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.chartTitle}>{title}</Text>
      <BarChart
        data={data}
        width={width}
        useProximityColors={useProximityColors}
        fixedBarColor={fixedBarColor}
        goalLine={goalLine}
      />
    </View>
  );
}

interface Props {
  width: number;
  calorieData: DayEntry[];
  waterData: DayEntry[];
  waterUnit: string;
  calorieGoal?: number | null;
  waterGoal?: number | null;
}

export function WeeklyCalorieGraph({ width, calorieData, calorieGoal }: Pick<Props, 'width' | 'calorieData' | 'calorieGoal'>) {
  return (
    <SingleGraph
      width={width}
      data={calorieData}
      goalLine={calorieGoal}
      title="Calories — 7 Days"
      useProximityColors
    />
  );
}

export function WeeklyWaterGraph({ width, waterData, waterGoal }: Pick<Props, 'width' | 'waterData' | 'waterGoal'>) {
  return (
    <SingleGraph
      width={width}
      data={waterData}
      goalLine={waterGoal}
      title="Water — 7 Days"
      fixedBarColor={WATER_BLUE}
    />
  );
}

// Keep default export for backward compatibility
export default function WeeklyIntakeGraph({ width, calorieData, waterData, calorieGoal, waterGoal }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);

  if (width === 0) return null;

  return (
    <View>
      <View style={styles.container}>
        <Text style={styles.chartTitle}>Calories — 7 Days</Text>
        <BarChart
          data={calorieData}
          width={width}
          useProximityColors
          goalLine={calorieGoal}
        />
      </View>
      <View style={styles.container}>
        <Text style={styles.chartTitle}>Water — 7 Days</Text>
        <BarChart
          data={waterData}
          width={width}
          fixedBarColor={WATER_BLUE}
          goalLine={waterGoal}
        />
      </View>
    </View>
  );
}
