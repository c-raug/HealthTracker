import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useApp } from '../../context/AppContext';
import {
  useColors,
  LightColors,
  Spacing,
  Typography,
  Radius,
} from '../../constants/theme';
import { UserProfile, Sex } from '../../types';

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    card: {
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
    row: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    input: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      ...Typography.body,
      color: colors.text,
    },
    inputLabel: {
      ...Typography.small,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    inputGroup: {
      flex: 1,
    },
    toggle: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: Radius.sm,
      padding: 3,
      gap: 3,
      marginBottom: Spacing.md,
    },
    toggleOption: {
      flex: 1,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
      borderRadius: Radius.sm - 2,
    },
    toggleOptionActive: {
      backgroundColor: colors.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    toggleText: {
      ...Typography.small,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    toggleTextActive: {
      color: colors.white,
    },
    dobBtn: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      justifyContent: 'center',
    },
    dobBtnText: {
      ...Typography.body,
      color: colors.text,
    },
    dobPlaceholder: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    pickerOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    pickerSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: Radius.lg,
      borderTopRightRadius: Radius.lg,
      paddingBottom: Spacing.xl,
    },
    pickerHeader: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerDone: {
      ...Typography.body,
      color: colors.primary,
      fontWeight: '600',
    },
    iosPicker: {
      height: 200,
    },
  });

export default function ProfileSection() {
  const { preferences, dispatch } = useApp();
  const colors = useColors();
  const styles = makeStyles(colors);
  const profile = preferences.profile;

  const [name, setName] = useState(profile?.name ?? '');
  const [dob, setDob] = useState<string | null>(profile?.dob ?? null);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [sex, setSex] = useState<Sex>(profile?.sex ?? 'male');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [heightCm, setHeightCm] = useState('');

  const isImperial = preferences.unit === 'lbs';

  useEffect(() => {
    if (profile) {
      if (profile.heightUnit === 'in') {
        const totalIn = profile.heightValue;
        setHeightFt(Math.floor(totalIn / 12).toString());
        setHeightIn((totalIn % 12).toString());
        setHeightCm('');
      } else {
        setHeightCm(profile.heightValue.toString());
        setHeightFt('');
        setHeightIn('');
      }
    }
  }, []);

  const buildAndSave = (overrides: {
    name?: string;
    dob?: string | null;
    sex?: Sex;
    heightFt?: string;
    heightIn?: string;
    heightCm?: string;
  } = {}) => {
    const resolvedDob = overrides.dob !== undefined ? overrides.dob : dob;

    let heightValue: number;
    let heightUnit: 'in' | 'cm';
    const ftVal = overrides.heightFt ?? heightFt;
    const inVal = overrides.heightIn ?? heightIn;
    const cmVal = overrides.heightCm ?? heightCm;

    if (isImperial) {
      const ft = parseInt(ftVal, 10) || 0;
      const inches = parseInt(inVal, 10) || 0;
      heightValue = ft * 12 + inches;
      heightUnit = 'in';
      if (heightValue < 1) return;
    } else {
      heightValue = parseFloat(cmVal) || 0;
      heightUnit = 'cm';
      if (heightValue < 1) return;
    }

    const updated: UserProfile = {
      name: (overrides.name ?? name) || undefined,
      dob: resolvedDob ?? undefined,
      sex: overrides.sex ?? sex,
      heightValue,
      heightUnit,
      // Preserve existing goal-related fields from profile
      activityLevel: profile?.activityLevel ?? 'moderately_active',
      weightGoal: profile?.weightGoal ?? 'maintain',
      fitnessGoal: profile?.fitnessGoal,
    };

    dispatch({ type: 'SET_PROFILE', profile: updated });
  };

  const handleNameChange = (val: string) => {
    setName(val);
    buildAndSave({ name: val });
  };

  const handleDobChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDobPicker(false);
    if (event.type === 'set' && date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const newDob = `${y}-${m}-${d}`;
      setDob(newDob);
      buildAndSave({ dob: newDob });
    }
  };

  const handleSexChange = (val: Sex) => {
    setSex(val);
    buildAndSave({ sex: val });
  };

  const handleHeightFtChange = (val: string) => {
    setHeightFt(val);
    if (val) buildAndSave({ heightFt: val });
  };

  const handleHeightInChange = (val: string) => {
    setHeightIn(val);
    buildAndSave({ heightIn: val });
  };

  const handleHeightCmChange = (val: string) => {
    setHeightCm(val);
    if (val) buildAndSave({ heightCm: val });
  };

  const formatDob = (dobStr: string) => {
    const [y, m, d] = dobStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const dobPickerValue = (() => {
    if (dob) {
      const [y, m, d] = dob.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    const d = new Date();
    d.setFullYear(d.getFullYear() - 30);
    return d;
  })();

  const maxDob = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 10);
    return d;
  })();

  return (
    <View style={styles.card}>
      {/* Name */}
      <Text style={styles.inputLabel}>Name (optional)</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={handleNameChange}
          placeholder="Your name"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="words"
          returnKeyType="done"
        />
      </View>

      {/* Date of Birth */}
      <Text style={styles.inputLabel}>Date of Birth</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.dobBtn}
          onPress={() => setShowDobPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={dob ? styles.dobBtnText : styles.dobPlaceholder}>
            {dob ? formatDob(dob) : 'Select date of birth'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sex */}
      <Text style={styles.inputLabel}>Sex</Text>
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleOption, sex === 'male' && styles.toggleOptionActive]}
          onPress={() => handleSexChange('male')}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, sex === 'male' && styles.toggleTextActive]}>
            Male
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleOption, sex === 'female' && styles.toggleOptionActive]}
          onPress={() => handleSexChange('female')}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, sex === 'female' && styles.toggleTextActive]}>
            Female
          </Text>
        </TouchableOpacity>
      </View>

      {/* Height */}
      <Text style={styles.inputLabel}>Height</Text>
      {isImperial ? (
        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              value={heightFt}
              onChangeText={handleHeightFtChange}
              keyboardType="number-pad"
              placeholder="ft"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              value={heightIn}
              onChangeText={handleHeightInChange}
              keyboardType="number-pad"
              placeholder="in"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>
      ) : (
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            value={heightCm}
            onChangeText={handleHeightCmChange}
            keyboardType="decimal-pad"
            placeholder="cm"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      )}

      {/* DOB Picker — Android inline, iOS modal */}
      {Platform.OS === 'android' && showDobPicker && (
        <DateTimePicker
          value={dobPickerValue}
          mode="date"
          display="default"
          maximumDate={maxDob}
          onChange={handleDobChange}
        />
      )}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showDobPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDobPicker(false)}
        >
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerSheet}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowDobPicker(false)}>
                  <Text style={styles.pickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={dobPickerValue}
                mode="date"
                display="spinner"
                maximumDate={maxDob}
                onChange={handleDobChange}
                style={styles.iosPicker}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
