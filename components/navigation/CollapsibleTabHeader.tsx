import { Animated, Text, StyleSheet, View, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, Typography, Spacing } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import HeaderXpBar from './HeaderXpBar';

export const COLLAPSIBLE_HEADER_HEIGHT = 52;

interface Props {
  title: string;
  scrollY: Animated.Value;
}

export default function CollapsibleTabHeader({ title, scrollY }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { preferences } = useApp();
  const deviceScheme = useColorScheme();
  const appearanceMode = preferences.appearanceMode ?? 'system';
  const resolvedScheme =
    appearanceMode === 'light'
      ? 'light'
      : appearanceMode === 'dark'
        ? 'dark'
        : (deviceScheme ?? 'light');
  const isDark = resolvedScheme === 'dark';

  const totalHeight = insets.top + COLLAPSIBLE_HEADER_HEIGHT;

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, totalHeight],
    outputRange: [0, -totalHeight],
    extrapolate: 'clamp',
  });

  // The solid background covers the blur at rest; fades out quickly as soon as
  // the user starts scrolling so blurred content becomes visible behind the title.
  // iOS cannot animate opacity directly on UIVisualEffectView — this overlay approach
  // is the correct workaround.
  const solidOpacity = scrollY.interpolate({
    inputRange: [0, 20],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Fade the blur layer out as the header reaches the top so it doesn't linger
  // at full strength once the title row is gone.
  const blurContainerOpacity = scrollY.interpolate({
    inputRange: [totalHeight - 15, totalHeight],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // The BlurView MUST live in a separate, non-clipped (no overflow:hidden), non-translated
  // container. On iOS, UIVisualEffectView inside a masksToBounds + transformed layer
  // captures the wrong screen pixels, killing the visible blur effect.
  // The solid overlay and title row are in separate layers on top of the blur.
  return (
    <>
      {/* Blur layer — fixed, no transform, no overflow:hidden so UIVisualEffectView
          samples the correct screen backdrop and the blur is actually visible */}
      <Animated.View
        pointerEvents="none"
        style={[styles.blurLayer, { height: totalHeight, opacity: blurContainerOpacity }]}
      >
        <BlurView
          intensity={90}
          tint={isDark ? 'dark' : 'light'}
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Solid overlay — fixed, covers blur initially, fades out on scroll */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blurLayer,
          { height: totalHeight, backgroundColor: colors.background, opacity: solidOpacity, zIndex: 11 },
        ]}
      />

      {/* Title + XP row — translates off screen as user scrolls */}
      <Animated.View
        pointerEvents="box-none"
        style={[styles.titleLayer, { height: totalHeight, transform: [{ translateY: headerTranslateY }] }]}
      >
        <View style={[styles.titleRow, { paddingTop: insets.top }]}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          <HeaderXpBar />
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  blurLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 10,
  },
  titleLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 12,
    elevation: 12,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  title: {
    ...Typography.h2,
    flex: 1,
  },
});
