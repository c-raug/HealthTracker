import { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import ProfileCard from '../../components/profile/ProfileCard';
import BadgesSection from '../../components/profile/BadgesSection';

const makeStyles = (colors: typeof LightColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: Spacing.md,
  },
  navRow: {
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  navRowText: {
    ...Typography.h3,
    color: colors.text,
  },
});

export default function ProfileScreen() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { focusActivityMode } = useLocalSearchParams<{ focusActivityMode?: string }>();

  useFocusEffect(
    useCallback(() => {
      if (focusActivityMode) {
        router.setParams({ focusActivityMode: undefined });
        router.push('/nutrition-goals-modal');
      }
    }, [focusActivityMode]),
  );

  return (
    <ScrollView style={styles.container}>
      <ProfileCard />

      <BadgesSection />

      <TouchableOpacity
        style={styles.navRow}
        onPress={() => router.push('/food-library-modal')}
        activeOpacity={0.7}
      >
        <Text style={styles.navRowText}>Food Library</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navRow}
        onPress={() => router.push('/nutrition-goals-modal')}
        activeOpacity={0.7}
      >
        <Text style={styles.navRowText}>Nutrition Goals</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </ScrollView>
  );
}
