import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { convertWeight } from '../../utils/unitConversion';
import { getLevelLabel } from '../../utils/xpCalculation';

const AVATAR_SIZE = 72;

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
      marginBottom: Spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
      overflow: 'hidden',
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.md,
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
    editChevron: {
      paddingLeft: Spacing.xs,
    },
  });

export default function ProfileCard() {
  const { preferences, entries, dispatch } = useApp();
  const router = useRouter();
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
    const ImagePicker = await import('expo-image-picker');
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
          const FileSystem = await import('expo-file-system/legacy');
          const avatarPath = (FileSystem.documentDirectory ?? '') + 'avatar.jpg';
          await FileSystem.copyAsync({ from: sourceUri, to: avatarPath });
          setAvatarUri(avatarPath);
          dispatch({ type: 'SET_AVATAR', uri: avatarPath });
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

  // Height display
  const displayHeight = (() => {
    if (!profile?.heightValue) return null;
    if (profile.heightUnit === 'in') {
      const ft = Math.floor(profile.heightValue / 12);
      const inches = profile.heightValue % 12;
      return `${ft}'${inches}"`;
    }
    return `${profile.heightValue} cm`;
  })();

  const initials = getInitials();

  // Level label
  const totalXp = preferences.totalXp ?? 0;
  const prestige = preferences.prestige ?? 0;
  const levelLabel =
    prestige > 0 ? `⭐ P${prestige} · ${getLevelLabel(totalXp)}` : `⭐ ${getLevelLabel(totalXp)}`;

  return (
    <View style={styles.card}>
      <View style={styles.summaryRow}>
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
        <TouchableOpacity
          style={styles.infoContainer}
          onPress={() => router.push('/profile-modal')}
          activeOpacity={0.7}
        >
          <Text style={styles.nameText}>{profile?.name || 'Your Profile'}</Text>
          <View style={styles.statRow}>
            {displayHeight !== null && <Text style={styles.statItem}>{displayHeight}</Text>}
            {currentWeight !== null && (
              <Text style={styles.statItem}>
                {currentWeight} {displayUnit}
              </Text>
            )}
            {(preferences.activityMode ?? 'auto') === 'auto' && profile?.activityLevel && (
              <Text style={styles.statItem}>
                {ACTIVITY_LABELS[profile.activityLevel] ?? profile.activityLevel}
              </Text>
            )}
            <Text style={styles.statItem} numberOfLines={1} ellipsizeMode="tail">
              {levelLabel}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/profile-modal')}
          style={styles.editChevron}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
