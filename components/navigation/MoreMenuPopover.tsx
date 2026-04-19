import { useRef, useEffect } from 'react';
import { Animated, Pressable, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, Spacing, Radius, Typography } from '../../constants/theme';
import { useMoreMenu } from '../../context/MoreMenuContext';

const TAB_BAR_BASE_HEIGHT = 49;
const POPOVER_WIDTH = 180;

export default function MoreMenuPopover() {
  const { visible, hide } = useMoreMenu();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
      Animated.timing(translateY, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    } else {
      opacity.setValue(0);
      translateY.setValue(10);
    }
  }, [visible]);

  if (!visible) return null;

  const tabBarHeight = TAB_BAR_BASE_HEIGHT + insets.bottom;
  const styles = makeStyles(colors, tabBarHeight);

  const navigate = (path: string) => {
    hide();
    router.push(path as any);
  };

  return (
    <>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={hide} />
      <Animated.View style={[styles.popover, { opacity, transform: [{ translateY }] }]}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigate('/(tabs)/profile')}
          activeOpacity={0.7}
        >
          <Ionicons name="person-outline" size={20} color={colors.text} />
          <Text style={styles.rowLabel}>Profile</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigate('/(tabs)/settings')}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={20} color={colors.text} />
          <Text style={styles.rowLabel}>Settings</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, tabBarHeight: number) {
  return StyleSheet.create({
    popover: {
      position: 'absolute',
      bottom: tabBarHeight + 8,
      right: Spacing.md,
      width: POPOVER_WIDTH,
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      padding: Spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.sm,
      gap: Spacing.sm,
    },
    rowLabel: {
      ...Typography.body,
      color: colors.text,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginHorizontal: Spacing.xs,
    },
  });
}
