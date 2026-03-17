import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, G, Text as SvgText, Line } from 'react-native-svg';
import { useColors, LightColors, Spacing, Typography } from '../../constants/theme';

const CHART_HEIGHT = 72;
const LABEL_HEIGHT = 16;
const SIDE_PAD = 6;

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: Spacing.sm,
      paddingTop: Spacing.sm,
    },
    chartSection: {
      marginBottom: Spacing.xs,
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
  barColor: string;
  goalColor: string;
  dimColor: string;
  labelColor: string;
  goalLineColor: string;
  goalLabel: string;
  /** When true, over-goal bars keep accent color instead of turning danger red */
  keepAccentWhenOver?: boolean;
}

function BarChart({ data, width, barColor, goalColor, dimColor, labelColor, goalLineColor, goalLabel, keepAccentWhenOver }: BarChartProps) {
  const usableWidth = width - SIDE_PAD * 2;
  const slotWidth = usableWidth / 7;
  const barWidth = slotWidth * 0.55;
  const svgHeight = CHART_HEIGHT + LABEL_HEIGHT;

  const maxValue = Math.max(...data.map((d) => Math.max(d.goal, d.consumed)), 1);

  // Compute the shared goal value (first non-zero goal across days)
  const sharedGoal = data.find((d) => d.goal > 0)?.goal ?? 0;
  const goalLineY = sharedGoal > 0 ? CHART_HEIGHT - (sharedGoal / maxValue) * CHART_HEIGHT : null;

  return (
    <Svg width={width} height={svgHeight}>
      {data.map((day, i) => {
        const x = SIDE_PAD + slotWidth * i + (slotWidth - barWidth) / 2;
        const goalH = Math.max((day.goal / maxValue) * CHART_HEIGHT, 2);
        const consumedH = Math.min((day.consumed / maxValue) * CHART_HEIGHT, CHART_HEIGHT);

        // Parse date safely (avoid timezone issues)
        const parts = day.date.split('-').map(Number);
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        const dayLabel = DAY_LABELS[d.getDay()];

        const isOver = day.consumed > day.goal && day.goal > 0;
        const barFill = isOver && !keepAccentWhenOver ? goalColor : barColor;

        return (
          <G key={day.date}>
            {/* Goal background bar */}
            <Rect
              x={x}
              y={CHART_HEIGHT - goalH}
              width={barWidth}
              height={goalH}
              rx={3}
              fill={dimColor}
            />
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
            {/* Day label */}
            <SvgText
              x={x + barWidth / 2}
              y={svgHeight - 2}
              textAnchor="middle"
              fontSize={10}
              fill={labelColor}
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
            x1={SIDE_PAD}
            y1={goalLineY}
            x2={width - SIDE_PAD - 36}
            y2={goalLineY}
            stroke={goalLineColor}
            strokeWidth={1}
            strokeDasharray="3,3"
          />
          <SvgText
            x={width - SIDE_PAD - 34}
            y={goalLineY + 4}
            fontSize={9}
            fill={goalLineColor}
            textAnchor="start"
          >
            {goalLabel}
          </SvgText>
        </>
      )}
    </Svg>
  );
}

interface Props {
  width: number;
  calorieData: DayEntry[];
  waterData: DayEntry[];
  waterUnit: string;
}

export default function WeeklyIntakeGraph({ width, calorieData, waterData, waterUnit }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);

  if (width === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Calories — 7 days</Text>
        <BarChart
          data={calorieData}
          width={width}
          barColor={colors.primary}
          goalColor={colors.danger}
          dimColor={colors.border}
          labelColor={colors.textSecondary}
          goalLineColor={colors.textSecondary}
          goalLabel={calorieData.find((d) => d.goal > 0) ? `${Math.round(calorieData.find((d) => d.goal > 0)!.goal)} cal` : ''}
        />
      </View>
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Water · {waterUnit} — 7 days</Text>
        <BarChart
          data={waterData}
          width={width}
          barColor={colors.primary}
          goalColor={colors.danger}
          dimColor={colors.border}
          labelColor={colors.textSecondary}
          goalLineColor={colors.textSecondary}
          goalLabel={waterData.find((d) => d.goal > 0) ? `${Math.round(waterData.find((d) => d.goal > 0)!.goal)} ${waterUnit}` : ''}
          keepAccentWhenOver
        />
      </View>
    </View>
  );
}
