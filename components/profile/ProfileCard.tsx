import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useApp } from '../../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { convertWeight } from '../../utils/unitConversion';
import { calculateDailyCalories, ageFromDob } from '../../utils/tdeeCalculation';

const AVATAR_SIZE = 72;
const AVATAR_PATH = (FileSystem.documentDirectory ?? '') + 'avatar.jpg';

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Sedentary',
  lightly_active: 'Lightly Active',
  moderately_active: 'Moderate',
  active: 'Active',
  very_active: 'Very Active',
};

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    avatarContainer: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
    },
    initialsText: {
      ...Typography.h2,
      color: colors.primary,
      fontWeight: '700',
    },
    infoContainer: {
      flex: 1,
    },
    nameText: {
      ...Typography.h3,
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    statRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    statItem: {
      ...Typography.small,
      color: colors.textSecondary,
    },
  });

export default function ProfileCard() {
  const { preferences, entries, dispatch } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);
  const profile = preferences.profile;
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // Load avatar from filesystem on mount
  useEffect(() => {
    if (preferences.avatarUri) {
      setAvatarUri(preferences.avatarUri);
    }
  }, [preferences.avatarUri]);

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo library access to set an avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const sourceUri = result.assets[0].uri;
      try {
        if (Platform.OS !== 'web') {
          await FileSystem.copyAsync({ from: sourceUri, to: AVATAR_PATH });
          setAvatarUri(AVATAR_PATH);
          dispatch({ type: 'SET_AVATAR', uri: AVATAR_PATH });
        } else {
          setAvatarUri(sourceUri);
          dispatch({ type: 'SET_AVATAR', uri: sourceUri });
        }
      } catch {
        setAvatarUri(sourceUri);
        dispatch({ type: 'SET_AVATAR', uri: sourceUri });
      }
    }
  };

  const getInitials = () => {
    if (!profile?.name) return null;
    const parts = profile.name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0]?.toUpperCase() ?? null;
  };

  // Current weight
  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const latestWeight = sortedEntries[0];
  const displayUnit = preferences.unit;
  const currentWeight = latestWeight
    ? convertWeight(latestWeight.weight, latestWeight.unit, displayUnit)
    : null;

  // Calorie target
  const resolvedAge = profile?.dob ? ageFromDob(profile.dob) : (profile?.age ?? null);
  const calorieTarget =
    profile && latestWeight && resolvedAge !== null
      ? calculateDailyCalories(
          latestWeight.weight,
          latestWeight.unit,
          profile.heightValue,
          profile.heightUnit,
          resolvedAge,
          profile.sex,
          profile.activityLevel,
          profile.weightGoal,
          preferences.activityMode ?? 'auto',
        )
      : null;

  const initials = getInitials();

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.7}>
        <View style={styles.avatarContainer}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : initials ? (
            <Text style={styles.initialsText}>{initials}</Text>
          ) : (
            <Ionicons name="person" size={36} color={colors.textSecondary} />
          )}
        </View>
      </TouchableOpacity>
      <View style={styles.infoContainer}>
        <Text style={styles.nameText}>{profile?.name || 'Your Profile'}</Text>
        <View style={styles.statRow}>
          {currentWeight !== null && (
            <Text style={styles.statItem}>
              {currentWeight} {displayUnit}
            </Text>
          )}
          {calorieTarget !== null && (
            <Text style={styles.statItem}>{calorieTarget} cal</Text>
          )}
          {profile?.activityLevel && (
            <Text style={styles.statItem}>
              {ACTIVITY_LABELS[profile.activityLevel] ?? profile.activityLevel}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
