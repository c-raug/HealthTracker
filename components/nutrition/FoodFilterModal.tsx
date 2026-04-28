import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { useApp } from '../../context/AppContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface FoodFilters {
  foodTypes: string[];
}

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: Radius.lg,
      borderTopRightRadius: Radius.lg,
      maxHeight: '85%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    headerTitle: {
      ...Typography.h2,
      color: colors.text,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    editBtn: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    editBtnText: {
      ...Typography.small,
      color: colors.primary,
      fontWeight: '600',
    },
    content: {
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.lg,
    },
    sectionLabel: {
      ...Typography.small,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: Spacing.sm,
      marginTop: Spacing.md,
    },
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    pillWrapper: {
      position: 'relative',
    },
    pill: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.md,
      backgroundColor: colors.border,
    },
    pillActive: {
      backgroundColor: colors.primary,
    },
    pillText: {
      ...Typography.body,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    pillTextActive: {
      color: colors.white,
    },
    pillBadge: {
      position: 'absolute',
      top: -6,
      right: -6,
      zIndex: 1,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.lg,
    },
    clearBtn: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: Radius.md,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    clearBtnText: {
      ...Typography.body,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    applyBtn: {
      flex: 2,
      backgroundColor: colors.primary,
      borderRadius: Radius.md,
      paddingVertical: Spacing.md,
      alignItems: 'center',
    },
    applyBtnText: {
      ...Typography.body,
      color: colors.white,
      fontWeight: '600',
    },
  });

interface Props {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FoodFilters) => void;
  currentFilters: FoodFilters;
}

export default function FoodFilterModal({ visible, onClose, onApply, currentFilters }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { preferences, dispatch } = useApp();

  const [foodTypes, setFoodTypes] = useState<string[]>(currentFilters.foodTypes);
  const [editMode, setEditMode] = useState(false);
  const shakeAnims = useRef<Record<string, Animated.Value>>({});
  const shakeLoops = useRef<Record<string, Animated.CompositeAnimation>>({});

  const foodTypeCategories = preferences.foodTypeCategories ?? [];
  const favoriteFilterTypes = preferences.favoriteFilterTypes ?? [];

  useEffect(() => {
    if (visible) {
      setFoodTypes(currentFilters.foodTypes);
      setEditMode(false);
    }
    // Stop all animations whenever visibility changes
    Object.values(shakeLoops.current).forEach((loop) => loop.stop());
    shakeLoops.current = {};
    Object.values(shakeAnims.current).forEach((anim) => anim.setValue(0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const getShakeAnim = (type: string) => {
    if (!shakeAnims.current[type]) {
      shakeAnims.current[type] = new Animated.Value(0);
    }
    return shakeAnims.current[type];
  };

  const startShake = (type: string) => {
    const anim = getShakeAnim(type);
    anim.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(anim, { toValue: -1, duration: 160, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 80, useNativeDriver: true }),
      ])
    );
    shakeLoops.current[type] = loop;
    loop.start();
  };

  const stopAllShakes = () => {
    Object.values(shakeLoops.current).forEach((loop) => loop.stop());
    shakeLoops.current = {};
    Object.values(shakeAnims.current).forEach((anim) => anim.setValue(0));
  };

  const handleEditMode = (on: boolean) => {
    setEditMode(on);
    if (on) {
      favoriteFilterTypes.forEach(startShake);
    } else {
      stopAllShakes();
    }
  };

  const handleRemoveFavorite = (type: string) => {
    const newFavorites = favoriteFilterTypes.filter((t) => t !== type);
    dispatch({ type: 'SET_FAVORITE_FILTER_TYPES', types: newFavorites });
    shakeLoops.current[type]?.stop();
    delete shakeLoops.current[type];
    shakeAnims.current[type]?.setValue(0);
  };

  const handleAddFavorite = (type: string) => {
    if (favoriteFilterTypes.length >= 4) return;
    const newFavorites = [...favoriteFilterTypes, type];
    dispatch({ type: 'SET_FAVORITE_FILTER_TYPES', types: newFavorites });
    startShake(type);
  };

  const toggleFoodType = (type: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFoodTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleClear = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFoodTypes([]);
  };

  const handleApply = () => {
    onApply({ foodTypes });
    onClose();
  };

  const handleClose = () => {
    setEditMode(false);
    stopAllShakes();
    onClose();
  };

  const selectedTypes = foodTypes;
  const availableTypes = foodTypeCategories.filter((t) => !selectedTypes.includes(t));

  const renderPill = (type: string, isSelected: boolean) => {
    if (editMode) {
      const isFavorite = favoriteFilterTypes.includes(type);
      const anim = getShakeAnim(type);
      const rotate = anim.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ['-2deg', '0deg', '2deg'],
      });
      return (
        <Animated.View key={type} style={[styles.pillWrapper, { transform: [{ rotate }] }]}>
          <View style={[styles.pill, isSelected && styles.pillActive]}>
            <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>{type}</Text>
          </View>
          {isFavorite ? (
            <TouchableOpacity
              style={styles.pillBadge}
              onPress={() => handleRemoveFavorite(type)}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Ionicons name="remove-circle" size={16} color={colors.danger} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.pillBadge}
              onPress={() => handleAddFavorite(type)}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Ionicons
                name="add-circle"
                size={16}
                color={favoriteFilterTypes.length >= 4 ? colors.textSecondary : colors.primary}
              />
            </TouchableOpacity>
          )}
        </Animated.View>
      );
    }

    return (
      <TouchableOpacity
        key={type}
        style={[styles.pill, isSelected && styles.pillActive]}
        onPress={() => toggleFoodType(type)}
        activeOpacity={0.7}
      >
        <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>{type}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filter Foods</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => handleEditMode(!editMode)}
                style={styles.editBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.editBtnText}>{editMode ? 'Done' : 'Edit Favorites'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content}>
            {/* Selected Filters section */}
            {selectedTypes.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Selected</Text>
                <View style={styles.pillRow}>
                  {selectedTypes.map((type) => renderPill(type, true))}
                </View>
              </>
            )}

            {/* Available / Food Type section */}
            <Text style={styles.sectionLabel}>
              {selectedTypes.length > 0 ? 'Available' : 'Food Type'}
            </Text>
            <View style={styles.pillRow}>
              {(selectedTypes.length > 0 ? availableTypes : foodTypeCategories).map((type) =>
                renderPill(type, false)
              )}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.clearBtn} onPress={handleClear} activeOpacity={0.8}>
                <Text style={styles.clearBtnText}>Clear Filters</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.8}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
