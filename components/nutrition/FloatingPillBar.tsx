import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
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
}

const PILL_SIZE = 48;
const ANIM_DURATION = 200;
const CREATE_WIDTH_ESTIMATE = 108;

const makeStyles = (colors: typeof LightColors, insetsBottom: number) =>
  StyleSheet.create({
    fadeWrapper: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
    },
    fadeLayerMid: {
      height: Spacing.lg,
      backgroundColor: colors.background,
      opacity: 0.5,
    },
    fadeLayerBot: {
      height: Spacing.xl,
      backgroundColor: colors.background,
      opacity: 0.9,
    },
    fadeSolid: {
      height: insetsBottom + Spacing.md + PILL_SIZE + Spacing.md,
      backgroundColor: colors.background,
    },
    pillRow: {
      position: 'absolute',
      left: Spacing.md,
      right: Spacing.md,
      bottom: insetsBottom + Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      height: PILL_SIZE,
    },
    createPill: {
      height: PILL_SIZE,
      borderRadius: 999,
      paddingHorizontal: Spacing.lg,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    createText: {
      ...Typography.body,
      color: colors.white,
      fontWeight: '600',
    },
    searchWrapper: {
      height: PILL_SIZE,
      borderRadius: 999,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    searchCircleContent: {
      width: PILL_SIZE,
      height: PILL_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchExpandedContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: Spacing.md,
      paddingRight: Spacing.sm,
      height: PILL_SIZE,
      flex: 1,
    },
    searchInput: {
      flex: 1,
      ...Typography.body,
      color: colors.text,
      paddingVertical: 0,
    },
    clearIcon: {
      padding: Spacing.xs,
    },
    cancelBtn: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    cancelText: {
      ...Typography.body,
      color: colors.primary,
      fontWeight: '600',
    },
    filterPill: {
      width: PILL_SIZE,
      height: PILL_SIZE,
      borderRadius: PILL_SIZE / 2,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
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
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors, insets.bottom);
  const inputRef = useRef<TextInput>(null);
  const widthAnim = useRef(new Animated.Value(searchExpanded ? 1 : 0)).current;
  const [rowWidth, setRowWidth] = useState(0);

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: searchExpanded ? 1 : 0,
      duration: ANIM_DURATION,
      useNativeDriver: false,
    }).start();
    if (searchExpanded) {
      setTimeout(() => inputRef.current?.focus(), ANIM_DURATION);
    }
  }, [searchExpanded, widthAnim]);

  const handleRowLayout = (e: LayoutChangeEvent) => {
    setRowWidth(e.nativeEvent.layout.width);
  };

  const handleSearchPress = () => {
    if (!searchExpanded) {
      onSearchToggle(true);
    }
  };

  const handleCancel = () => {
    onSearchChange('');
    Keyboard.dismiss();
    inputRef.current?.blur();
    onSearchToggle(false);
  };

  const handleClear = () => {
    if (searchValue.length === 0) {
      handleCancel();
      return;
    }
    onSearchChange('');
  };

  const handleSubmit = () => {
    inputRef.current?.blur();
    Keyboard.dismiss();
    if (searchValue.trim().length === 0) {
      onSearchToggle(false);
    }
  };

  // Compute expanded width: row width minus Create pill width, minus Filter pill, minus 2 gaps
  const expandedWidth = Math.max(
    PILL_SIZE,
    rowWidth - CREATE_WIDTH_ESTIMATE - PILL_SIZE - Spacing.sm * 2,
  );

  return (
    <>
      <View style={styles.fadeWrapper} pointerEvents="none">
        <View style={styles.fadeLayerMid} />
        <View style={styles.fadeLayerBot} />
        <View style={styles.fadeSolid} />
      </View>

      <View style={styles.pillRow} onLayout={handleRowLayout}>
        <TouchableOpacity
          style={styles.createPill}
          onPress={onCreate}
          activeOpacity={0.8}
        >
          <Text style={styles.createText}>+ Create</Text>
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.searchWrapper,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [PILL_SIZE, expandedWidth],
              }),
            },
          ]}
        >
          {!searchExpanded ? (
            <TouchableOpacity
              style={styles.searchCircleContent}
              onPress={handleSearchPress}
              activeOpacity={0.7}
            >
              <Ionicons name="search" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.searchExpandedContent}>
              <Ionicons
                name="search"
                size={20}
                color={colors.textSecondary}
                style={{ marginRight: Spacing.sm }}
              />
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
              <TouchableOpacity
                style={styles.clearIcon}
                onPress={handleClear}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        <TouchableOpacity
          style={styles.filterPill}
          onPress={onFilterPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name="filter-outline"
            size={22}
            color={hasActiveFilter ? colors.primary : colors.textSecondary}
          />
          {hasActiveFilter && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </View>
    </>
  );
}
