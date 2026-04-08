import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, Platform, TextInput, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useApp } from '../../context/AppContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { convertWeight } from '../../utils/unitConversion';
import { UserProfile, Sex, ActivityMode, ActivityLevel } from '../../types';
import InfoModal from '../InfoModal';

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
    // Edit form styles
    editContainer: {
      padding: Spacing.md,
      paddingTop: 0,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    inputLabel: {
      ...Typography.small,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    row: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    input: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      ...Typography.body,
      color: colors.text,
    },
    inputGroup: {
      flex: 1,
    },
    toggle: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: Radius.sm,
      padding: 3,
      gap: 3,
      marginBottom: Spacing.md,
    },
    toggleOption: {
      flex: 1,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
      borderRadius: Radius.sm - 2,
    },
    toggleOptionActive: {
      backgroundColor: colors.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    toggleText: {
      ...Typography.small,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    toggleTextActive: {
      color: colors.white,
    },
    dobBtn: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      justifyContent: 'center',
    },
    dobBtnText: {
      ...Typography.body,
      color: colors.text,
    },
    dobPlaceholder: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    activityGrid: {
      gap: Spacing.xs,
      marginBottom: Spacing.md,
    },
    activityBtn: {
      backgroundColor: colors.background,
      borderRadius: Radius.sm,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      alignItems: 'center',
    },
    activityBtnActive: {
      backgroundColor: colors.primary,
    },
    activityBtnText: {
      ...Typography.small,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    activityBtnTextActive: {
      color: colors.white,
    },
    saveRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    cancelBtn: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: Radius.sm,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
    },
    cancelBtnText: {
      ...Typography.body,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    saveBtn: {
      flex: 2,
      backgroundColor: colors.primary,
      borderRadius: Radius.sm,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
    },
    saveBtnText: {
      ...Typography.body,
      color: colors.white,
      fontWeight: '600',
    },
    pickerOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    pickerSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: Radius.lg,
      borderTopRightRadius: Radius.lg,
      paddingBottom: Spacing.xl,
    },
    pickerHeader: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerDone: {
      ...Typography.body,
      color: colors.primary,
      fontWeight: '600',
    },
    iosPicker: {
      height: 200,
    },
    modeRow: {
      gap: Spacing.xs,
      marginBottom: Spacing.md,
    },
    modePillRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    modePill: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: Radius.sm,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      alignItems: 'center',
    },
    modePillActive: {
      backgroundColor: colors.primary,
    },
    modePillText: {
      ...Typography.small,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    modePillTextActive: {
      color: colors.white,
    },
    modeInfoIcon: {
      padding: Spacing.xs,
    },
  });

const ACTIVITY_LEVEL_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'lightly_active', label: 'Lightly Active' },
  { value: 'moderately_active', label: 'Moderately Active' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very Active' },
];

const ACTIVITY_MODE_LABELS: Record<ActivityMode, string> = {
  auto: 'Auto',
  manual: 'Manual',
  smartwatch: 'Smart Watch',
};

const ACTIVITY_MODE_INFO: Record<ActivityMode, { title: string; description: string }> = {
  auto: {
    title: 'Auto Mode',
    description:
      "Your activity level multiplier is built into your daily calorie target. Exercise you log on the Activity tab is tracked for reference only — it won't increase your calorie target. Best for people with a consistent activity routine.",
  },
  manual: {
    title: 'Manual Mode',
    description:
      'Your base calorie target assumes a sedentary lifestyle. Every workout and step count you log on the Activity tab is added directly to your daily calorie target. Best for people with variable activity day to day.',
  },
  smartwatch: {
    title: 'Smart Watch Mode',
    description:
      'Your base calorie target assumes a sedentary lifestyle. Enter the total calories burned from your smart watch each day on the Activity tab, and that amount is added to your calorie target.',
  },
};

export default function ProfileCard() {
  const { preferences, entries, dispatch } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);
  const profile = preferences.profile;
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Edit form state
  const [name, setName] = useState(profile?.name ?? '');
  const [dob, setDob] = useState<string | null>(profile?.dob ?? null);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [sex, setSex] = useState<Sex>(profile?.sex ?? 'male');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [activityLevel, setActivityLevel] = useState(profile?.activityLevel ?? 'moderately_active');
  const [activityMode, setActivityModeState] = useState<ActivityMode>(
    preferences.activityMode ?? 'auto',
  );
  const [modeInfoModal, setModeInfoModal] = useState<{ title: string; description: string } | null>(null);

  const isImperial = preferences.unit === 'lbs';

  // Load avatar from filesystem on mount
  useEffect(() => {
    if (preferences.avatarUri) {
      setAvatarUri(preferences.avatarUri);
    }
  }, [preferences.avatarUri]);

  const handleActivityModeChange = (mode: ActivityMode) => {
    setActivityModeState(mode);
    dispatch({ type: 'SET_ACTIVITY_MODE', mode });
  };

  // Sync edit form when profile changes externally
  useEffect(() => {
    setName(profile?.name ?? '');
    setDob(profile?.dob ?? null);
    setSex(profile?.sex ?? 'male');
    setActivityLevel(profile?.activityLevel ?? 'moderately_active');
    setActivityModeState(preferences.activityMode ?? 'auto');
    if (profile) {
      if (profile.heightUnit === 'in') {
        setHeightFt(Math.floor(profile.heightValue / 12).toString());
        setHeightIn((profile.heightValue % 12).toString());
        setHeightCm('');
      } else {
        setHeightCm(profile.heightValue.toString());
        setHeightFt('');
        setHeightIn('');
      }
    }
  }, [expanded]);

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

  const handleSave = () => {
    let heightValue: number;
    let heightUnit: 'in' | 'cm';

    if (isImperial) {
      const ft = parseInt(heightFt, 10) || 0;
      const inches = parseInt(heightIn, 10) || 0;
      heightValue = ft * 12 + inches;
      heightUnit = 'in';
      if (heightValue < 1) {
        Alert.alert('Invalid Height', 'Please enter a valid height.');
        return;
      }
    } else {
      heightValue = parseFloat(heightCm) || 0;
      heightUnit = 'cm';
      if (heightValue < 1) {
        Alert.alert('Invalid Height', 'Please enter a valid height.');
        return;
      }
    }

    const updated: UserProfile = {
      name: name || undefined,
      dob: dob ?? undefined,
      sex,
      heightValue,
      heightUnit,
      activityLevel: activityLevel as UserProfile['activityLevel'],
      weightGoal: profile?.weightGoal ?? 'maintain',
      fitnessGoal: profile?.fitnessGoal,
    };

    dispatch({ type: 'SET_PROFILE', profile: updated });
    setExpanded(false);
  };

  const handleDobChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDobPicker(false);
    if (event.type === 'set' && date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      setDob(`${y}-${m}-${d}`);
    }
  };

  const formatDob = (dobStr: string) => {
    const [y, m, d] = dobStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const dobPickerValue = (() => {
    if (dob) {
      const [y, m, d] = dob.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    const d = new Date();
    d.setFullYear(d.getFullYear() - 30);
    return d;
  })();

  const maxDob = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 10);
    return d;
  })();

  return (
    <View style={styles.card}>
      {/* Summary row — tapping anywhere except avatar toggles edit form */}
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
          onPress={() => setExpanded((v) => !v)}
          activeOpacity={0.7}
        >
          <Text style={styles.nameText}>{profile?.name || 'Your Profile'}</Text>
          <View style={styles.statRow}>
            {displayHeight !== null && (
              <Text style={styles.statItem}>{displayHeight}</Text>
            )}
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
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setExpanded((v) => !v)}
          style={styles.editChevron}
          activeOpacity={0.7}
        >
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Inline edit form */}
      {expanded && (
        <ScrollView
          style={styles.editContainer}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          {/* Name */}
          <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>Name (optional)</Text>
          <View style={styles.row}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>

          {/* Date of Birth */}
          <Text style={styles.inputLabel}>Date of Birth</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.dobBtn}
              onPress={() => setShowDobPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={dob ? styles.dobBtnText : styles.dobPlaceholder}>
                {dob ? formatDob(dob) : 'Select date of birth'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sex */}
          <Text style={styles.inputLabel}>Sex</Text>
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleOption, sex === 'male' && styles.toggleOptionActive]}
              onPress={() => setSex('male')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, sex === 'male' && styles.toggleTextActive]}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleOption, sex === 'female' && styles.toggleOptionActive]}
              onPress={() => setSex('female')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, sex === 'female' && styles.toggleTextActive]}>Female</Text>
            </TouchableOpacity>
          </View>

          {/* Height */}
          <Text style={styles.inputLabel}>Height</Text>
          {isImperial ? (
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  value={heightFt}
                  onChangeText={setHeightFt}
                  keyboardType="number-pad"
                  placeholder="ft"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  value={heightIn}
                  onChangeText={setHeightIn}
                  keyboardType="number-pad"
                  placeholder="in"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
          ) : (
            <View style={styles.row}>
              <TextInput
                style={styles.input}
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="decimal-pad"
                placeholder="cm"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          )}

          {/* Activity Tracking Mode */}
          <Text style={styles.inputLabel}>Activity Tracking Mode</Text>
          <View style={styles.modeRow}>
            {(['auto', 'manual', 'smartwatch'] as ActivityMode[]).map((mode) => (
              <View key={mode} style={styles.modePillRow}>
                <TouchableOpacity
                  style={[styles.modePill, activityMode === mode && styles.modePillActive]}
                  onPress={() => handleActivityModeChange(mode)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modePillText, activityMode === mode && styles.modePillTextActive]}>
                    {ACTIVITY_MODE_LABELS[mode]}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setModeInfoModal(ACTIVITY_MODE_INFO[mode])}
                  style={styles.modeInfoIcon}
                  hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                  activeOpacity={0.6}
                >
                  <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Activity Level — only shown in Auto mode */}
          {activityMode === 'auto' && (
            <>
              <Text style={styles.inputLabel}>Activity Level</Text>
              <View style={styles.activityGrid}>
                {ACTIVITY_LEVEL_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.activityBtn, activityLevel === opt.value && styles.activityBtnActive]}
                    onPress={() => setActivityLevel(opt.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.activityBtnText, activityLevel === opt.value && styles.activityBtnTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Save / Cancel */}
          <View style={styles.saveRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setExpanded(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* DOB Picker */}
          {Platform.OS === 'android' && showDobPicker && (
            <DateTimePicker
              value={dobPickerValue}
              mode="date"
              display="default"
              maximumDate={maxDob}
              onChange={handleDobChange}
            />
          )}
          {Platform.OS === 'ios' && (
            <Modal
              visible={showDobPicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowDobPicker(false)}
            >
              <View style={styles.pickerOverlay}>
                <View style={styles.pickerSheet}>
                  <View style={styles.pickerHeader}>
                    <TouchableOpacity onPress={() => setShowDobPicker(false)}>
                      <Text style={styles.pickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={dobPickerValue}
                    mode="date"
                    display="spinner"
                    maximumDate={maxDob}
                    onChange={handleDobChange}
                    style={styles.iosPicker}
                  />
                </View>
              </View>
            </Modal>
          )}

          {/* Bottom padding */}
          <View style={{ height: Spacing.md }} />
        </ScrollView>
      )}

      <InfoModal
        visible={modeInfoModal !== null}
        title={modeInfoModal?.title ?? ''}
        description={modeInfoModal?.description ?? ''}
        onClose={() => setModeInfoModal(null)}
      />
    </View>
  );
}
