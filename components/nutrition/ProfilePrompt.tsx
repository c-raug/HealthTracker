import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    icon: {
      marginBottom: Spacing.md,
    },
    title: {
      ...Typography.h3,
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    description: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.md,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: Radius.md,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
    },
    buttonText: {
      ...Typography.body,
      color: colors.white,
      fontWeight: '600',
    },
  });

export default function ProfilePrompt({ message }: { message: string }) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();

  return (
    <View style={styles.card}>
      <Ionicons
        name="person-circle-outline"
        size={48}
        color={colors.textSecondary}
        style={styles.icon}
      />
      <Text style={styles.title}>Set Up Your Profile</Text>
      <Text style={styles.description}>{message}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/settings')}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Go to Settings</Text>
      </TouchableOpacity>
    </View>
  );
}
