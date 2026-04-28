import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Animated,
  Alert,
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
    subModeBtn: {
      paddingHorizontal: Spacing.xs,
      paddingVertical: Spacing.xs,
    },
    subModeBtnText: {
      ...Typography.small,
      fontWeight: '500',
    },
    subModeBtnTextActive: {
      fontWeight: '700',
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
    pillAdd: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    pillText: {
      ...Typography.body,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    pillTextActive: {
      color: colors.white,
    },
    pillTextAdd: {
      color: colors.primary,
      fontWeight: '600',
    },
    pillBadge: {
      position: 'absolute',
      top: -6,
      right: -6,
      zIndex: 1,
    },
    newFilterInput: {
      ...Typography.body,
      color: colors.text,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.background,
      minWidth: 100,
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
  const [editSubMode, setEditSubMode] = useState<'remove' | 'favorite'>('favorite');
  const [showNewFilterInput, setShowNewFilterInput] = useState(false);
  const [newFilterText, setNewFilterText] = useState('');
  const shakeAnims = useRef<Record<string, Animated.Value>>({});
  const shakeLoops = useRef<Record<string, Animated.CompositeAnimation>>({});
  const newFilterRef = useRef<TextInput>(null);

  const foodTypeCategories = preferences.foodTypeCategories ?? [];
  const favoriteFilterTypes = preferences.favoriteFilterTypes ?? [];

  useEffect(() => {
    if (visible) {
      setFoodTypes(currentFilters.foodTypes);
      setEditMode(false);
      setEditSubMode('favorite');
      setShowNewFilterInput(false);
      setNewFilterText('');
    }
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
    setEditSubMode('favorite');
    setShowNewFilterInput(false);
    setNewFilterText('');
    if (on) {
      favoriteFilterTypes.forEach(startShake);
    } else {
      stopAllShakes();
    }
  };

  const handleSetSubMode = (mode: 'remove' | 'favorite') => {
    setEditSubMode(mode);
    setShowNewFilterInput(false);
    setNewFilterText('');
    if (mode === 'favorite') {
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
    if (favoriteFilterTypes.length >= 4) {
      Alert.alert('Quick Filter Limit', 'You can only have up to 4 Quick Filters.');
      return;
    }
    const newFavorites = [...favoriteFilterTypes, type];
    dispatch({ type: 'SET_FAVORITE_FILTER_TYPES', types: newFavorites });
    startShake(type);
  };

  const handleDeleteCategory = (type: string) => {
    Alert.alert(
      'Delete Filter',
      `Delete "${type}"? This will remove it from all your foods.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch({
              type: 'SET_FOOD_TYPE_CATEGORIES',
              categories: foodTypeCategories.filter((c) => c !== type),
            });
            if (favoriteFilterTypes.includes(type)) {
              dispatch({
                type: 'SET_FAVORITE_FILTER_TYPES',
                types: favoriteFilterTypes.filter((t) => t !== type),
              });
            }
            setFoodTypes((prev) => prev.filter((t) => t !== type));
            shakeLoops.current[type]?.stop();
            delete shakeLoops.current[type];
            shakeAnims.current[type]?.setValue(0);
          },
        },
      ]
    );
  };

  const handleSubmitNewFilter = () => {
    const trimmed = newFilterText.trim();
    if (trimmed && !foodTypeCategories.includes(trimmed)) {
      dispatch({
        type: 'SET_FOOD_TYPE_CATEGORIES',
        categories: [...foodTypeCategories, trimmed],
      });
    }
    setNewFilterText('');
    setShowNewFilterInput(false);
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
    if (editMode && editSubMode === 'remove') {
      return (
        <TouchableOpacity
          key={type}
          style={[styles.pill, isSelected && styles.pillActive]}
          onPress={() => handleDeleteCategory(type)}
          activeOpacity={0.7}
        >
          <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>{type}</Text>
        </TouchableOpacity>
      );
    }

    if (editMode && editSubMode === 'favorite') {
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
              <Ionicons name="add-circle" size={16} color={colors.primary} />
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

  const renderAddPill = () => {
    if (!editMode) return null;
    if (showNewFilterInput) {
      return (
        <TextInput
          ref={newFilterRef}
          style={styles.newFilterInput}
          value={newFilterText}
          onChangeText={setNewFilterText}
          placeholder="New filter…"
          placeholderTextColor={colors.textSecondary}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSubmitNewFilter}
          onBlur={handleSubmitNewFilter}
          maxLength={30}
        />
      );
    }
    return (
      <TouchableOpacity
        style={[styles.pill, styles.pillAdd]}
        onPress={() => setShowNewFilterInput(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.pillTextAdd}>+</Text>
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
              {editMode ? (
                <>
                  <TouchableOpacity
                    style={styles.subModeBtn}
                    onPress={() => handleSetSubMode('remove')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.subModeBtnText,
                        editSubMode === 'remove'
                          ? [styles.subModeBtnTextActive, { color: colors.primary }]
                          : { color: colors.textSecondary },
                      ]}
                    >
                      Remove
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.subModeBtn}
                    onPress={() => handleSetSubMode('favorite')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.subModeBtnText,
                        editSubMode === 'favorite'
                          ? [styles.subModeBtnTextActive, { color: colors.primary }]
                          : { color: colors.textSecondary },
                      ]}
                    >
                      Favorite
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleEditMode(false)}
                    style={styles.editBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editBtnText}>Done</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  onPress={() => handleEditMode(true)}
                  style={styles.editBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
            {/* Selected Filters section */}
            {selectedTypes.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Selected</Text>
                <View style={styles.pillRow}>
                  {selectedTypes.map((type) => renderPill(type, true))}
                </View>
              </>
            )}

            {/* Available section */}
            <Text style={styles.sectionLabel}>Available</Text>
            <View style={styles.pillRow}>
              {(selectedTypes.length > 0 ? availableTypes : foodTypeCategories).map((type) =>
                renderPill(type, false)
              )}
              {renderAddPill()}
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
