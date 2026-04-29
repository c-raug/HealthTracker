import { Animated, Text, StyleSheet, View, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, Typography, Spacing } from '../../constants/theme';
import HeaderXpBar from './HeaderXpBar';

export const COLLAPSIBLE_HEADER_HEIGHT = 52;

interface Props {
  title: string;
  scrollY: Animated.Value;
}

export default function CollapsibleTabHeader({ title, scrollY }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';

  const totalHeight = insets.top + COLLAPSIBLE_HEADER_HEIGHT;

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, totalHeight],
    outputRange: [0, -totalHeight],
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
      <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={{ flex: 1 }}>
        <View style={[styles.titleRow, { paddingTop: insets.top }]}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          <HeaderXpBar />
        </View>
      </BlurView>
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
