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
  Platform,
  KeyboardEvent,
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

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    pillRow: {
      position: 'absolute',
      left: Spacing.md,
      right: Spacing.md,
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
    createPillCompact: {
      width: PILL_SIZE,
      height: PILL_SIZE,
      borderRadius: PILL_SIZE / 2,
      paddingHorizontal: 0,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
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
      paddingHorizontal: Spacing.md,
      height: PILL_SIZE,
      flex: 1,
    },
    searchInput: {
      flex: 1,
      ...Typography.body,
      color: colors.text,
      paddingVertical: 0,
    },
    circlePill: {
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
  const styles = makeStyles(colors);
  const inputRef = useRef<TextInput>(null);
  const widthAnim = useRef(new Animated.Value(searchExpanded ? 1 : 0)).current;
  const [rowWidth, setRowWidth] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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

  const handleRowLayout = (e: LayoutChangeEvent) => {
    setRowWidth(e.nativeEvent.layout.width);
  };

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

  // On iOS the keyboard overlays the view, so lift the bar by the keyboard height.
  // On Android Expo defaults to adjustResize, which shrinks the view so the
  // absolutely-positioned bar already rises with it — no extra lift needed.
  const bottomOffset =
    Platform.OS === 'ios' && keyboardHeight > 0
      ? keyboardHeight + Spacing.sm
      : insets.bottom + Spacing.sm;

  // In expanded mode the Create pill collapses to a 48px circle and the Filter
  // pill becomes an X circle. Expanded width fills the remaining row space.
  const expandedWidth = Math.max(
    PILL_SIZE,
    rowWidth - PILL_SIZE - PILL_SIZE - Spacing.sm * 2,
  );

  return (
    <View style={[styles.pillRow, { bottom: bottomOffset }]} onLayout={handleRowLayout}>
      {searchExpanded ? (
        <TouchableOpacity
          style={styles.createPillCompact}
          onPress={onCreate}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={26} color={colors.white} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.createPill}
          onPress={onCreate}
          activeOpacity={0.8}
        >
          <Text style={styles.createText}>+ Create</Text>
        </TouchableOpacity>
      )}

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
          </View>
        )}
      </Animated.View>

      {searchExpanded ? (
        <TouchableOpacity
          style={styles.circlePill}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.circlePill}
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
      )}
    </View>
  );
}
