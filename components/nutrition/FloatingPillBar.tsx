import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Platform,
  KeyboardEvent,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, LightColors, Spacing, Typography } from '../../constants/theme';

interface Props {
  onCreate: () => void;
  searchExpanded: boolean;
  searchValue: string;
  onSearchChange: (text: string) => void;
  onSearchToggle: (expanded: boolean) => void;
  onFilterPress: () => void;
  hasActiveFilter: boolean;
  onCreateSearch?: () => void;
}

const PILL_SIZE = 48;

const makeStyles = (colors: typeof LightColors, isDark: boolean) =>
  StyleSheet.create({
    outerContainer: {
      position: 'absolute',
      left: Spacing.md,
      right: Spacing.md,
      height: PILL_SIZE,
    },
    pillRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    // Create pill — per-pill BlurView wrapper
    createBlur: {
      flex: 1,
      height: PILL_SIZE,
      borderRadius: 999,
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    createInner: {
      flex: 1,
      height: PILL_SIZE,
      paddingHorizontal: Spacing.md,
      backgroundColor: (colors.primary + '22') as any,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    createText: {
      ...Typography.body,
      color: colors.primary,
      fontWeight: '600',
    },
    // Search / expanded oval pill — per-pill BlurView wrapper
    ovalBlur: {
      flex: 1,
      height: PILL_SIZE,
      borderRadius: 999,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInner: {
      flex: 1,
      height: PILL_SIZE,
      paddingHorizontal: Spacing.md,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: Spacing.sm,
      overflow: 'hidden',
    },
    searchLabel: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    searchInput: {
      flex: 1,
      ...Typography.body,
      color: colors.text,
      paddingVertical: 0,
    },
    // Filter / close circle pill — per-pill BlurView wrapper
    circleBlur: {
      width: PILL_SIZE,
      height: PILL_SIZE,
      borderRadius: PILL_SIZE / 2,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    circleInner: {
      width: PILL_SIZE,
      height: PILL_SIZE,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Frosted-glass create circle — shown left of search input when expanded
    createCircleBlur: {
      width: PILL_SIZE,
      height: PILL_SIZE,
      borderRadius: PILL_SIZE / 2,
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    createCircleInner: {
      width: PILL_SIZE,
      height: PILL_SIZE,
      backgroundColor: (colors.primary + '22') as any,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterBadge: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
  });

export default function FloatingPillBar({
  onCreate,
  searchExpanded,
  searchValue,
  onSearchChange,
  onSearchToggle,
  onFilterPress,
  hasActiveFilter,
  onCreateSearch,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isDark = colors.background === '#1C1C1E';
  const styles = makeStyles(colors, isDark);
  const inputRef = useRef<TextInput>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (searchExpanded) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchExpanded]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSearchPress = () => {
    if (!searchExpanded) {
      onSearchToggle(true);
    }
  };

  const handleClose = () => {
    onSearchChange('');
    Keyboard.dismiss();
    inputRef.current?.blur();
    onSearchToggle(false);
  };

  const handleSubmit = () => {
    inputRef.current?.blur();
    Keyboard.dismiss();
    if (searchValue.trim().length === 0) {
      onSearchToggle(false);
    }
  };

  // Parents (add-food-modal, food-library-modal) use SafeAreaView which already applies
  // insets.bottom as bottom padding, so we must NOT add insets.bottom again. Use bottom: 0
  // for the resting state. For the keyboard-open state, subtract insets.bottom so the bar
  // sits flush with the keyboard top rather than floating above it.
  const bottomOffset =
    Platform.OS === 'ios' && keyboardHeight > 0
      ? Math.max(0, keyboardHeight - insets.bottom) + Spacing.xs
      : 0;

  const blurTint = isDark ? 'dark' : 'light';
  const androidNeutralBg = isDark ? 'rgba(44,44,46,0.97)' : 'rgba(235,236,240,0.97)';

  return (
    <View style={[styles.outerContainer, { bottom: bottomOffset }]}>
      <View style={styles.pillRow}>
        {!searchExpanded ? (
          <>
            <BlurView
              intensity={80}
              tint={blurTint}
              style={[styles.createBlur, Platform.OS === 'android' && { backgroundColor: colors.primary + '33' }]}
            >
              <TouchableOpacity style={styles.createInner} onPress={onCreate} activeOpacity={0.8}>
                <Ionicons name="add" size={20} color={colors.primary} />
                <Text style={styles.createText}>Create</Text>
              </TouchableOpacity>
            </BlurView>

            <BlurView
              intensity={80}
              tint={blurTint}
              style={[styles.ovalBlur, Platform.OS === 'android' && { backgroundColor: androidNeutralBg }]}
            >
              <TouchableOpacity style={styles.searchInner} onPress={handleSearchPress} activeOpacity={0.7}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <Text style={styles.searchLabel}>Search</Text>
              </TouchableOpacity>
            </BlurView>

            <BlurView
              intensity={80}
              tint={blurTint}
              style={[styles.circleBlur, Platform.OS === 'android' && { backgroundColor: androidNeutralBg }]}
            >
              <TouchableOpacity style={styles.circleInner} onPress={onFilterPress} activeOpacity={0.7}>
                <Ionicons
                  name="filter-outline"
                  size={22}
                  color={hasActiveFilter ? colors.primary : colors.textSecondary}
                />
                {hasActiveFilter && <View style={styles.filterBadge} />}
              </TouchableOpacity>
            </BlurView>
          </>
        ) : (
          <>
            {onCreateSearch && (
              <BlurView
                intensity={80}
                tint={blurTint}
                style={[styles.createCircleBlur, Platform.OS === 'android' && { backgroundColor: colors.primary + '33' }]}
              >
                <TouchableOpacity style={styles.createCircleInner} onPress={onCreateSearch} activeOpacity={0.8}>
                  <Ionicons name="add" size={22} color={colors.primary} />
                </TouchableOpacity>
              </BlurView>
            )}

            <BlurView
              intensity={80}
              tint={blurTint}
              style={[styles.ovalBlur, Platform.OS === 'android' && { backgroundColor: androidNeutralBg }]}
            >
              <TouchableOpacity
                style={styles.searchInner}
                activeOpacity={1}
                onPress={() => inputRef.current?.focus()}
              >
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                  ref={inputRef}
                  style={styles.searchInput}
                  value={searchValue}
                  onChangeText={onSearchChange}
                  placeholder="Search..."
                  placeholderTextColor={colors.textSecondary}
                  returnKeyType="search"
                  onSubmitEditing={handleSubmit}
                />
              </TouchableOpacity>
            </BlurView>

            <BlurView
              intensity={80}
              tint={blurTint}
              style={[styles.circleBlur, Platform.OS === 'android' && { backgroundColor: androidNeutralBg }]}
            >
              <TouchableOpacity style={styles.circleInner} onPress={handleClose} activeOpacity={0.7}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </BlurView>
          </>
        )}
      </View>
    </View>
  );
}
