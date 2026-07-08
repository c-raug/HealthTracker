import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../constants/theme';
import TutorialXpPage from '../components/tutorial/TutorialXpPage';
import TutorialLevelsPage from '../components/tutorial/TutorialLevelsPage';
import TutorialPrestigePage from '../components/tutorial/TutorialPrestigePage';

const PAGE_COUNT = 3;

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.xs,
    },
    progressBar: {
      flexDirection: 'row',
      gap: Spacing.xs,
      flex: 1,
      marginRight: Spacing.sm,
    },
    progressSegment: {
      flex: 1,
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.border,
    },
    progressSegmentFilled: {
      backgroundColor: colors.primary,
    },
    closeButton: {
      padding: Spacing.xs,
    },
    pageArea: {
      flex: 1,
    },
    tapZones: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
    },
    tapLeft: {
      flex: 1,
    },
    tapRight: {
      flex: 1,
    },
    footer: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.lg,
    },
    nextButton: {
      backgroundColor: colors.primary,
      borderRadius: Radius.md,
      paddingVertical: Spacing.md,
      alignItems: 'center',
    },
    nextButtonText: {
      ...Typography.body,
      color: colors.white,
      fontWeight: '600',
    },
  });

export default function LevelingTutorialModal() {
  const router = useRouter();
  const colors = useColors();
  const styles = makeStyles(colors);
  const { preferences } = useApp();

  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState(0);
  const totalXp = preferences.totalXp ?? 0;

  const handleClose = () => {
    router.back();
  };

  const handleAdvance = () => {
    if (currentPage < PAGE_COUNT - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const isLastPage = currentPage === PAGE_COUNT - 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header: progress bar + close */}
      <View style={styles.header}>
        <View style={styles.progressBar}>
          {Array.from({ length: PAGE_COUNT }, (_, i) => (
            <View
              key={i}
              style={[
                styles.progressSegment,
                i <= currentPage && styles.progressSegmentFilled,
              ]}
            />
          ))}
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={26} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Page content */}
      <View style={styles.pageArea}>
        {currentPage === 0 && <TutorialXpPage />}
        {currentPage === 1 && <TutorialLevelsPage totalXp={totalXp} />}
        {currentPage === 2 && <TutorialPrestigePage />}

        {/* Invisible tap zones: left half = go back, right half = advance */}
        <View style={styles.tapZones} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.tapLeft}
            onPress={handleBack}
            activeOpacity={1}
          />
          <TouchableOpacity
            style={styles.tapRight}
            onPress={handleAdvance}
            activeOpacity={1}
          />
        </View>
      </View>

      {/* Footer: next/done button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleAdvance}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {isLastPage ? 'Done' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
