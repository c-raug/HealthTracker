import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '../context/ToastContext';
import { useColors, LightColors, Spacing, Typography, Radius } from '../constants/theme';

const makeStyles = (colors: typeof LightColors, topInset: number) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      top: topInset + Spacing.sm,
      left: Spacing.md,
      right: Spacing.md,
      zIndex: 9999,
    },
    toast: {
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emoji: {
      fontSize: 22,
    },
    text: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '600',
      flex: 1,
    },
    dismiss: {
      ...Typography.small,
      color: colors.textSecondary,
      paddingLeft: Spacing.xs,
    },
  });

export default function ToastNotification() {
  const { current, dismiss } = useToast();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors, insets.top);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (current) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [current]);

  if (!current) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]}>
      <TouchableOpacity style={styles.toast} onPress={dismiss} activeOpacity={0.85}>
        {current.emoji ? <Text style={styles.emoji}>{current.emoji}</Text> : null}
        <Text style={styles.text}>{current.text}</Text>
        <Text style={styles.dismiss}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
