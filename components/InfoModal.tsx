import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useColors, LightColors, Spacing, Typography, Radius } from '../constants/theme';

interface InfoModalProps {
  visible: boolean;
  title: string;
  description: string;
  onClose: () => void;
}

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      width: '100%',
      maxWidth: 340,
    },
    title: {
      ...Typography.h3,
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    description: {
      ...Typography.body,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    closeBtn: {
      marginTop: Spacing.lg,
      backgroundColor: colors.primary,
      borderRadius: Radius.sm,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
    },
    closeBtnText: {
      ...Typography.body,
      color: colors.white,
      fontWeight: '600',
    },
  });

export default function InfoModal({ visible, title, description, onClose }: InfoModalProps) {
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeBtnText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
