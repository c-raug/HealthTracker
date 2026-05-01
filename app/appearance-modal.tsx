import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
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
  const isDark = colors.card === '#2C2C2E';
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appearance</Text>
      </View>
      <ScrollView style={styles.scrollContent}>
        <View style={styles.card}>
          <LinearGradient colors={isDark ? ['#3A3A3C', '#2C2C2E'] : ['#FFFFFF', '#F4F4F8']} style={StyleSheet.absoluteFill} />
          <Text style={styles.sectionLabel}>Color Mode</Text>
          <AppearanceModePicker />
        </View>
        <View style={styles.card}>
          <LinearGradient colors={isDark ? ['#3A3A3C', '#2C2C2E'] : ['#FFFFFF', '#F4F4F8']} style={StyleSheet.absoluteFill} />
          <Text style={styles.sectionLabel}>Accent Color</Text>
          <ThemeColorPicker />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
