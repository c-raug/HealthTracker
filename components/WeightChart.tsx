import { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useApp } from '../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../constants/theme';
import { formatShortDate, getToday } from '../utils/dateUtils';
import { convertWeight } from '../utils/unitConversion';

const SCREEN_WIDTH = Dimensions.get('window').width;
// 16px scrollview padding + 16px card margin, each side = 64px total
const CHART_WIDTH = SCREEN_WIDTH - Spacing.md * 4;

type TimeRange = '1W' | '1M' | '3M' | '1Y' | 'All';

const TIME_RANGE_OPTIONS: TimeRange[] = ['1W', '1M', '3M', '1Y', 'All'];

function getDaysForRange(range: TimeRange): number | null {
  switch (range) {
    case '1W': return 7;
    case '1M': return 30;
    case '3M': return 90;
    case '1Y': return 365;
    case 'All': return null;
  }
}

const makeStyles = (colors: typeof LightColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    margin: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
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
  rangeSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  rangeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  rangeBtnActive: {
    backgroundColor: colors.primary,
  },
  rangeBtnText: {
    ...Typography.small,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  rangeBtnTextActive: {
    color: colors.white,
  },
  chart: {
    borderRadius: Radius.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    ...Typography.small,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    ...Typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  summaryChange: {
    ...Typography.body,
    fontWeight: '600',
  },
  placeholder: {
    backgroundColor: colors.card,
    margin: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  placeholderText: {
    ...Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default function WeightChart() {
  const { entries, preferences } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1M');

  // Sort ascending by date (all entries)
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length < 2) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Log at least 2 entries to see your weight chart.
        </Text>
      </View>
    );
  }

  // Filter by selected time range
  const days = getDaysForRange(selectedRange);
  const filtered = days === null
    ? sorted
    : (() => {
        const today = getToday();
        const [ty, tm, td] = today.split('-').map(Number);
        const cutoff = new Date(ty, tm - 1, td - days);
        return sorted.filter((e) => {
          const [ey, em, ed] = e.date.split('-').map(Number);
          return new Date(ey, em - 1, ed) >= cutoff;
        });
      })();

  // Need at least 2 points to render a line chart
  const chartEntries = filtered.length >= 2 ? filtered : sorted.slice(-2);

  const dataValues = chartEntries.map((e) =>
    convertWeight(e.weight, e.unit, preferences.unit),
  );

  // Show at most 6 labels to avoid crowding.
  const labelStep = Math.ceil(chartEntries.length / 6);
  const labels = chartEntries.map((e, i) =>
    i % labelStep === 0 ? formatShortDate(e.date) : '',
  );

  const chartData = {
    labels,
    datasets: [
      {
        data: dataValues,
        color: () => colors.primary,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: () => colors.textSecondary,
    propsForDots: {
      r: '3',
      strokeWidth: '2',
      stroke: colors.primary,
    },
    propsForBackgroundLines: {
      stroke: colors.border,
      strokeDasharray: '4',
    },
  };

  const startWeight = dataValues[0];
  const endWeight = dataValues[dataValues.length - 1];
  const netChange = endWeight - startWeight;
  const netChangeStr = (netChange >= 0 ? '+' : '') + netChange.toFixed(1) + ' ' + preferences.unit;
  const netChangeColor = netChange < 0 ? colors.primary : netChange > 0 ? colors.danger : colors.textSecondary;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Weight Trend ({preferences.unit})</Text>
        <View style={styles.rangeSelector}>
          {TIME_RANGE_OPTIONS.map((range) => (
            <TouchableOpacity
              key={range}
              style={[styles.rangeBtn, selectedRange === range && styles.rangeBtnActive]}
              onPress={() => setSelectedRange(range)}
              activeOpacity={0.7}
            >
              <Text style={[styles.rangeBtnText, selectedRange === range && styles.rangeBtnTextActive]}>
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <LineChart
        data={chartData}
        width={CHART_WIDTH}
        height={200}
        chartConfig={chartConfig}
        style={styles.chart}
        withInnerLines
        withOuterLines={false}
        fromZero={false}
      />
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Start</Text>
          <Text style={styles.summaryValue}>{startWeight.toFixed(1)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Change</Text>
          <Text style={[styles.summaryChange, { color: netChangeColor }]}>{netChangeStr}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Current</Text>
          <Text style={styles.summaryValue}>{endWeight.toFixed(1)}</Text>
        </View>
      </View>
    </View>
  );
}
