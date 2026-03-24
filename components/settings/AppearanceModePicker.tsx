import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { useApp } from '../../context/AppContext';

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    label: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    description: {
      ...Typography.small,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: Spacing.sm,
    },
    row: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    option: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.xs,
      borderRadius: Radius.md,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.card,
      gap: Spacing.xs,
    },
    optionSelected: {
      borderColor: colors.primary,
    },
    iconLabel: {
      ...Typography.small,
      color: colors.text,
      fontWeight: '600',
    },
    iconLabelSelected: {
      color: colors.primary,
    },
    iconDesc: {
      fontSize: 11,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

const OPTIONS: { mode: 'light' | 'dark' | 'system'; icon: string; label: string; desc: string }[] = [
  { mode: 'light',  icon: 'sunny-outline',          label: 'Light',  desc: 'Always light' },
  { mode: 'dark',   icon: 'moon-outline',            label: 'Dark',   desc: 'Always dark'  },
  { mode: 'system', icon: 'phone-portrait-outline',  label: 'System', desc: 'Match device' },
];

export default function AppearanceModePicker() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { preferences, dispatch } = useApp();
  const current = preferences.appearanceMode ?? 'system';

  return (
    <View>
      <Text style={styles.label}>Appearance</Text>
      <Text style={styles.description}>Choose light, dark, or follow the device setting.</Text>
      <View style={styles.row}>
        {OPTIONS.map(({ mode, icon, label, desc }) => {
          const selected = current === mode;
          return (
            <TouchableOpacity
              key={mode}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => dispatch({ type: 'SET_APPEARANCE_MODE', mode })}
              activeOpacity={0.7}
            >
              <Ionicons
                name={icon as any}
                size={22}
                color={selected ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.iconLabel, selected && styles.iconLabelSelected]}>{label}</Text>
              <Text style={styles.iconDesc}>{desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
