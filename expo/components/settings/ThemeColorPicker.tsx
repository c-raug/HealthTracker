import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useColors, LightColors, ACCENT_PRESETS, Spacing, Typography, Radius } from '../../constants/theme';

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      padding: Spacing.md,
    },
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
      marginBottom: Spacing.md,
    },
    swatchRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      flexWrap: 'wrap',
    },
    swatchWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    swatch: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    swatchSelected: {
      borderWidth: 2,
      borderColor: colors.text,
    },
  });

export default function ThemeColorPicker() {
  const { preferences, dispatch } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);

  const currentColor = preferences.themeColor ?? ACCENT_PRESETS[0].primary;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Accent Color</Text>
      <Text style={styles.description}>
        Choose an accent color for buttons, icons, and progress indicators.
      </Text>
      <View style={styles.swatchRow}>
        {ACCENT_PRESETS.map((preset) => {
          const isSelected = currentColor === preset.primary;
          return (
            <TouchableOpacity
              key={preset.id}
              style={styles.swatchWrapper}
              onPress={() => dispatch({ type: 'SET_THEME_COLOR', color: preset.primary })}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: preset.primary },
                  isSelected && styles.swatchSelected,
                ]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={20} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
