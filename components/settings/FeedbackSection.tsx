import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';

// ─── Google Form config ───────────────────────────────────────────────────────
// To fill these in:
//   1. Open https://forms.gle/QkGKdSwg3yAN176c9 in a browser
//   2. View Page Source (Ctrl+U / Cmd+U)
//   3. Search for "FB_PUBLIC_LOAD_DATA_" and look for the form's action URL —
//      it will look like: /forms/d/e/1FAIpQLSe.../formResponse
//      Copy the full form ID (everything between /d/e/ and /formResponse)
//   4. Search for "entry." to find the field ID for your feedback text question
//      It will look like: entry.1234567890
// ─────────────────────────────────────────────────────────────────────────────
const GOOGLE_FORM_ID = 'YOUR_FORM_E_ID_HERE'; // e.g. 1FAIpQLSe...
const GOOGLE_FORM_ENTRY = 'entry.YOUR_FIELD_ID_HERE'; // e.g. entry.1234567890

const FORM_URL = `https://docs.google.com/forms/d/e/${GOOGLE_FORM_ID}/formResponse`;

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
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      const body = `${encodeURIComponent(GOOGLE_FORM_ENTRY)}=${encodeURIComponent(trimmed)}`;
      await fetch(FORM_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      setMessage('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    } catch {
      Alert.alert('Error', 'Could not send feedback. Please try again later.');
    } finally {
      setSubmitting(false);
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
        style={[styles.submitButton, (!message.trim() || submitting) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!message.trim() || submitting}
        activeOpacity={0.8}
      >
        <Text style={styles.submitButtonText}>{submitting ? 'Sending…' : 'Submit'}</Text>
      </TouchableOpacity>
      {submitted && (
        <Text style={styles.successText}>Thanks for your feedback!</Text>
      )}
    </View>
  );
}
