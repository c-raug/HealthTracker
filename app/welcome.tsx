import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useColors, LightColors, Typography, Spacing, Radius } from '../constants/theme';
import { backupExists, loadBackup } from '../storage/backupStorage';

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 48,
    },
    iconCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    title: {
      ...Typography.h1,
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    buttonContainer: {
      width: '100%',
      gap: Spacing.sm,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: Radius.md,
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 3,
    },
    primaryButtonText: {
      ...Typography.body,
      color: colors.white,
      fontWeight: '600',
    },
    secondaryButton: {
      backgroundColor: colors.card,
      paddingVertical: 14,
      borderRadius: Radius.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryButtonText: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '600',
    },
  });

export default function WelcomeScreen() {
  const { dispatch } = useApp();
  const router = useRouter();
  const colors = useColors();
  const styles = makeStyles(colors);

  const [hasBackup, setHasBackup] = useState(false);
  const [loadingBackup, setLoadingBackup] = useState(false);

  useEffect(() => {
    backupExists().then(setHasBackup).catch(() => setHasBackup(true));
  }, []);

  const handleLoadData = async () => {
    setLoadingBackup(true);
    try {
      const data = await loadBackup();
      if (data) {
        dispatch({
          type: 'LOAD_DATA',
          entries: data.entries,
          preferences: { ...data.preferences, onboardingComplete: true },
          nutritionLog: data.nutritionLog,
          customFoods: data.customFoods,
          savedMeals: data.savedMeals,
          activityLog: data.activityLog,
          waterLog: (data as any).waterLog ?? [],
        });
      } else {
        setLoadingBackup(false);
        Alert.alert(
          'No Backup Selected',
          'No backup file was selected. To create a backup, go to Settings → Save Data after setting up your profile.',
        );
      }
    } catch (e) {
      setLoadingBackup(false);
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to load backup data.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="fitness-outline" size={48} color={colors.primary} />
        </View>
        <Text style={styles.title}>HealthTracker</Text>
        <Text style={styles.subtitle}>
          Track your weight, nutrition, and activity
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace('/onboarding')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Start New Profile</Text>
        </TouchableOpacity>

        {hasBackup && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleLoadData}
            activeOpacity={0.8}
            disabled={loadingBackup}
          >
            {loadingBackup ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.secondaryButtonText}>Load Saved Data</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
