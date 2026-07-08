import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    iconRow: {
      marginBottom: Spacing.lg,
    },
    title: {
      ...Typography.h1,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Spacing.xl,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      width: '100%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    paragraph: {
      ...Typography.body,
      color: colors.text,
      lineHeight: 22,
      marginBottom: Spacing.md,
    },
    lastParagraph: {
      marginBottom: 0,
    },
    highlight: {
      fontWeight: '600',
      color: colors.primary,
    },
    exampleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: colors.background,
      borderRadius: Radius.md,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    exampleText: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '600',
    },
  });

export default function TutorialPrestigePage() {
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.iconRow}>
        <Ionicons name="ribbon-outline" size={52} color={colors.primary} />
      </View>
      <Text style={styles.title}>Prestige</Text>

      <View style={styles.card}>
        <Text style={styles.paragraph}>
          When you reach <Text style={styles.highlight}>Level 10 (Legend)</Text>, you unlock the
          ability to <Text style={styles.highlight}>Prestige</Text>.
        </Text>

        <Text style={styles.paragraph}>
          Prestiging resets your XP back to 0 and your level back to 1, but you earn a permanent
          prestige badge that shows alongside your level.
        </Text>

        <View style={styles.exampleRow}>
          <Text style={styles.exampleText}>P1 · Level 4 · Dedicated</Text>
        </View>

        <Text style={[styles.paragraph, styles.lastParagraph]}>
          You can prestige as many times as you like. Each time, your prestige number increases — P1,
          P2, P3, and so on. The journey never ends!
        </Text>
      </View>
    </View>
  );
}
