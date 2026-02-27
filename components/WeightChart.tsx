import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useApp } from '../context/AppContext';
import { Colors, Spacing, Typography, Radius } from '../constants/theme';
import { formatShortDate } from '../utils/dateUtils';
import { convertWeight } from '../utils/unitConversion';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - Spacing.md * 2;

/** Maximum number of entries to display on the chart. */
const MAX_CHART_ENTRIES = 30;

export default function WeightChart() {
  const { entries, preferences } = useApp();

  // Sort ascending by date and take the most recent MAX_CHART_ENTRIES entries.
  const sorted = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-MAX_CHART_ENTRIES);

  if (sorted.length < 2) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Log at least 2 entries to see your weight chart.
        </Text>
      </View>
    );
  }

  const dataValues = sorted.map((e) =>
    convertWeight(e.weight, e.unit, preferences.unit),
  );

  // Show at most 6 labels to avoid crowding.
  const labelStep = Math.ceil(sorted.length / 6);
  const labels = sorted.map((e, i) =>
    i % labelStep === 0 ? formatShortDate(e.date) : '',
  );

  const chartData = {
    labels,
    datasets: [
      {
        data: dataValues,
        color: () => Colors.primary,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: Colors.card,
    backgroundGradientFrom: Colors.card,
    backgroundGradientTo: Colors.card,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: () => Colors.textSecondary,
    propsForDots: {
      r: '3',
      strokeWidth: '2',
      stroke: Colors.primary,
    },
    propsForBackgroundLines: {
      stroke: Colors.border,
      strokeDasharray: '4',
    },
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Weight Trend ({preferences.unit})
      </Text>
      <LineChart
        data={chartData}
        width={CHART_WIDTH}
        height={200}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withInnerLines
        withOuterLines={false}
        fromZero={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    margin: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    ...Typography.small,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  chart: {
    borderRadius: Radius.md,
    marginLeft: -Spacing.md,
  },
  placeholder: {
    backgroundColor: Colors.card,
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
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
