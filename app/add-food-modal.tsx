import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors, LightColors, Spacing, Typography } from '../constants/theme';
import { MealCategory } from '../types';
import AddFoodTab from '../components/nutrition/AddFoodTab';
import AddMealTab from '../components/nutrition/AddMealTab';
import QuickAddTab from '../components/nutrition/QuickAddTab';

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
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
    tabRowWrapper: {
      overflow: 'hidden',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tabRow: {
      flexDirection: 'row',
    },
    tab: {
      flex: 1,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    tabText: {
      ...Typography.body,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    tabTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
  });

type Tab = 'food' | 'meal' | 'quickadd';

export default function AddFoodModal() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ date: string; category: string }>();

  const date = params.date ?? '';
  const category = (params.category ?? 'breakfast') as MealCategory;

  const [activeTab, setActiveTab] = useState<Tab>('food');
  const isDark = colors.card === '#2C2C2E';

  const handleDone = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDone}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add to {category.charAt(0).toUpperCase() + category.slice(1)}</Text>
      </View>

      <View style={styles.tabRowWrapper}>
        <LinearGradient
          colors={isDark ? ['#3A3A3C', '#2C2C2E'] : ['#FFFFFF', '#F4F4F8']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'food' && styles.tabActive]}
          onPress={() => setActiveTab('food')}
        >
          <Text style={[styles.tabText, activeTab === 'food' && styles.tabTextActive]}>
            Add Food
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'meal' && styles.tabActive]}
          onPress={() => setActiveTab('meal')}
        >
          <Text style={[styles.tabText, activeTab === 'meal' && styles.tabTextActive]}>
            Add Meal
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'quickadd' && styles.tabActive]}
          onPress={() => setActiveTab('quickadd')}
        >
          <Text style={[styles.tabText, activeTab === 'quickadd' && styles.tabTextActive]}>
            Quick Add
          </Text>
        </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'food' && (
        <AddFoodTab date={date} category={category} onDone={handleDone} />
      )}
      {activeTab === 'meal' && (
        <AddMealTab date={date} category={category} onDone={handleDone} />
      )}
      {activeTab === 'quickadd' && (
        <QuickAddTab date={date} category={category} onDone={handleDone} />
      )}
    </SafeAreaView>
  );
}
