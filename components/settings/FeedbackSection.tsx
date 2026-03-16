import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';

const FEEDBACK_EMAIL = 'feedback@healthtracker.app';

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
      marginBottom: Spacing.md,
    },
    textInput: {
      backgroundColor: colors.background,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      ...Typography.body,
      color: colors.text,
      minHeight: 110,
      textAlignVertical: 'top',
      marginBottom: Spacing.sm,
    },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: Radius.sm,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 3,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      ...Typography.body,
      color: colors.white,
      fontWeight: '600',
    },
    successText: {
      ...Typography.small,
      color: colors.primary,
      textAlign: 'center',
      marginTop: Spacing.sm,
      fontStyle: 'italic',
    },
  });

export default function FeedbackSection() {
  const colors = useColors();
  const styles = makeStyles(colors);

  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const subject = encodeURIComponent('HealthTracker Feedback');
    const body = encodeURIComponent(trimmed);
    const url = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert('No Mail App', 'No email client found on this device. Please send feedback to ' + FEEDBACK_EMAIL);
        return;
      }
      await Linking.openURL(url);
      setMessage('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    } catch {
      Alert.alert('Error', 'Could not open mail app. Please send feedback to ' + FEEDBACK_EMAIL);
    }
  };

  return (
    <View>
      <Text style={styles.label}>Send Feedback</Text>
      <Text style={styles.description}>
        Have a suggestion or found a bug? We'd love to hear from you.
      </Text>
      <TextInput
        style={styles.textInput}
        value={message}
        onChangeText={(val) => { setMessage(val); setSubmitted(false); }}
        placeholder="Write your feedback here…"
        placeholderTextColor={colors.textSecondary}
        multiline
        numberOfLines={5}
        returnKeyType="default"
      />
      <TouchableOpacity
        style={[styles.submitButton, !message.trim() && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!message.trim()}
        activeOpacity={0.8}
      >
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>
      {submitted && (
        <Text style={styles.successText}>Thanks for your feedback!</Text>
      )}
    </View>
  );
}
