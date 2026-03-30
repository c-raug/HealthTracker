import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, LightColors, Spacing, Typography, Radius } from '../constants/theme';
import AppearanceModePicker from '../components/settings/AppearanceModePicker';
import ThemeColorPicker from '../components/settings/ThemeColorPicker';

const makeStyles = (colors: typeof LightColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...Typography.h2,
    color: colors.text,
    marginLeft: Spacing.sm,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionLabel: {
    ...Typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
});

export default function AppearanceModal() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appearance</Text>
      </View>
      <ScrollView style={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Color Mode</Text>
          <AppearanceModePicker />
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Accent Color</Text>
          <ThemeColorPicker />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
