import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, LightColors, Spacing } from '../../constants/theme';
import { useMoreMenu } from '../../context/MoreMenuContext';
import { useColorScheme } from 'react-native';
import { useApp } from '../../context/AppContext';

const PILL_HEIGHT = 56;
const FADE_HEIGHT = 0;

// Exported so MoreMenuPopover can anchor above the pill
export const PILL_TOTAL_HEIGHT = PILL_HEIGHT + Spacing.sm;

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  home: { active: 'home', inactive: 'home-outline' },
  index: { active: 'scale', inactive: 'scale-outline' },
  nutrition: { active: 'restaurant', inactive: 'restaurant-outline' },
  activities: { active: 'flame', inactive: 'flame-outline' },
  more: { active: 'ellipsis-horizontal', inactive: 'ellipsis-horizontal' },
};

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent',
    },
    fade: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
    },
    pillWrapper: {
      flexDirection: 'row',
      marginHorizontal: Spacing.md,
      borderRadius: PILL_HEIGHT / 2,
      overflow: 'hidden',
    },
    pillInner: {
      flex: 1,
      flexDirection: 'row',
      height: PILL_HEIGHT,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    label: {
      fontSize: 10,
      fontWeight: '600' as const,
    },
  });

export default function PillTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const insets = useSafeAreaInsets();
  const { toggle } = useMoreMenu();
  const { preferences } = useApp();
  const systemScheme = useColorScheme();
  const isDark =
    preferences.appearanceMode === 'dark' ? true :
    preferences.appearanceMode === 'light' ? false :
    systemScheme === 'dark';

  const pillBottom = insets.bottom + Spacing.sm;
  const containerHeight = PILL_HEIGHT + pillBottom;

  const androidBg = isDark ? 'rgba(44,44,46,0.92)' : 'rgba(255,255,255,0.92)';
  const gradientColors: [string, string, string] = [
    'transparent',
    isDark ? 'rgba(28,28,30,0.20)' : 'rgba(247,248,250,0.20)',
    isDark ? 'rgba(28,28,30,0.45)' : 'rgba(247,248,250,0.45)',
  ];

  return (
    <View style={[styles.container, { height: containerHeight }]} pointerEvents="box-none">
      {/* Gradient fade sitting behind the pill */}
      <LinearGradient
        colors={gradientColors}
        style={[styles.fade, { height: containerHeight }]}
        pointerEvents="none"
      />

      {/* Pill */}
      <View style={[styles.pillWrapper, { bottom: pillBottom, position: 'absolute', left: Spacing.md, right: Spacing.md }]}>
        {Platform.OS === 'android' ? (
          <View style={[styles.pillInner, { backgroundColor: androidBg, borderRadius: PILL_HEIGHT / 2 }]}>
            {renderTabs(state, descriptors, navigation, colors, styles, toggle, isDark)}
          </View>
        ) : (
          <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={{ flex: 1, borderRadius: PILL_HEIGHT / 2, overflow: 'hidden' }}>
            <View style={styles.pillInner}>
              {renderTabs(state, descriptors, navigation, colors, styles, toggle, isDark)}
            </View>
          </BlurView>
        )}
      </View>
    </View>
  );
}

function renderTabs(
  state: BottomTabBarProps['state'],
  descriptors: BottomTabBarProps['descriptors'],
  navigation: BottomTabBarProps['navigation'],
  colors: ReturnType<typeof useColors>,
  styles: ReturnType<typeof makeStyles>,
  toggle: () => void,
  isDark: boolean,
) {
  const visibleRoutes = state.routes.filter(r => r.name !== 'profile' && r.name !== 'settings');
  return visibleRoutes.map((route) => {
    const index = state.routes.indexOf(route);
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;
    const isMore = route.name === 'more';

    const iconSet = TAB_ICONS[route.name] ?? { active: 'ellipsis-horizontal', inactive: 'ellipsis-horizontal' };
    const iconName = isFocused ? iconSet.active : iconSet.inactive;
    const iconColor = isFocused ? colors.primary : colors.textSecondary;

    // Label from options or route name
    const label = typeof options.tabBarLabel === 'string'
      ? options.tabBarLabel
      : typeof options.title === 'string'
      ? options.title
      : route.name === 'index' ? 'Weight' : route.name.charAt(0).toUpperCase() + route.name.slice(1);

    const handlePress = () => {
      if (isMore) {
        toggle();
        return;
      }
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    return (
      <TouchableOpacity
        key={route.key}
        style={styles.tab}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
      >
        <Ionicons name={iconName as any} size={24} color={iconColor} />
        <Text style={[styles.label, { color: iconColor }]}>{label}</Text>
      </TouchableOpacity>
    );
  });
}
