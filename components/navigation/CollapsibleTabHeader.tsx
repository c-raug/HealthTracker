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

  // Solid background fades out as you start scrolling, revealing the BlurView beneath
  // so the title and XP bar sit over a frosted-glass blur of the scrolling content.
  // iOS cannot animate opacity on a UIVisualEffectView (BlurView) directly — animating
  // a plain solid overlay that fades out is the correct workaround.
  const solidOpacity = scrollY.interpolate({
    inputRange: [0, 20],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.header,
        {
          height: totalHeight,
          transform: [{ translateY: headerTranslateY }],
        },
      ]}
    >
      {/* Always-on blur — visible once solid overlay fades out */}
      <BlurView
        intensity={90}
        tint={isDark ? 'dark' : 'light'}
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      {/* Solid overlay — fades out on scroll to reveal blur */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, opacity: solidOpacity }]}
      />
      <View style={[styles.titleRow, { paddingTop: insets.top }]}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <HeaderXpBar />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 10,
    elevation: 10,
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
