import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { getLevelLabel } from '../../utils/xpCalculation';
import { getISOWeekString, getToday } from '../../utils/dateUtils';

const AVATAR_SIZE = 72;
const RING_BORDER = 3;
const RING_GAP = 3;
const RING_SIZE = AVATAR_SIZE + (RING_BORDER + RING_GAP) * 2;
const BADGE_SIZE = 12;

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      marginBottom: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 5,
      overflow: 'hidden',
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.md,
    },
    avatarRing: {
      width: RING_SIZE,
      height: RING_SIZE,
      borderRadius: RING_SIZE / 2,
      borderWidth: RING_BORDER,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
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
    recapBadge: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: BADGE_SIZE,
      height: BADGE_SIZE,
      borderRadius: BADGE_SIZE / 2,
      backgroundColor: '#FF3B30',
      borderWidth: 1.5,
      borderColor: colors.card,
    },
    infoContainer: {
      flex: 1,
    },
    nameText: {
      ...Typography.h3,
      color: colors.text,
      marginBottom: Spacing.xs,
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
  const { preferences } = useApp();
  const router = useRouter();
  const colors = useColors();
  const styles = makeStyles(colors);
  const profile = preferences.profile;
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    setAvatarUri(preferences.avatarUri ?? null);
  }, [preferences.avatarUri]);

  const getInitials = () => {
    if (!profile?.name) return null;
    const parts = profile.name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0]?.toUpperCase() ?? null;
  };

  const initials = getInitials();

  const totalXp = preferences.totalXp ?? 0;
  const prestige = preferences.prestige ?? 0;
  const levelLabel =
    prestige > 0 ? `⭐ P${prestige} · ${getLevelLabel(totalXp)}` : `⭐ ${getLevelLabel(totalXp)}`;

  const currentISOWeek = getISOWeekString(getToday());
  const showRecapBadge = preferences.lastRecapShownWeek !== currentISOWeek;

  const isDark = colors.card === '#2C2C2E';

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={isDark ? ['#3A3A3C', '#2C2C2E'] : ['#FFFFFF', '#F4F4F8']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.summaryRow}>
        <TouchableOpacity
          onPress={() => router.push('/weekly-recap-modal')}
          activeOpacity={0.8}
        >
          <View style={styles.avatarRing}>
            <View style={styles.avatarContainer}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : initials ? (
                <Text style={styles.initialsText}>{initials}</Text>
              ) : (
                <Ionicons name="person" size={36} color={colors.textSecondary} />
              )}
            </View>
          </View>
          {showRecapBadge && <View style={styles.recapBadge} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.infoContainer}
          onPress={() => router.push('/profile-modal')}
          activeOpacity={0.7}
        >
          <Text style={styles.nameText}>{profile?.name || 'Your Profile'}</Text>
          <Text style={styles.statItem} numberOfLines={1} ellipsizeMode="tail">
            {levelLabel}
          </Text>
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
