import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import {
  RenderItemParams,
  NestableDraggableFlatList,
} from 'react-native-draggable-flatlist';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors, LightColors, Spacing, Typography, Radius } from '../../constants/theme';
import { NutritionFoodItem, MealCategory as MealCategoryType } from '../../types';
import { useApp } from '../../context/AppContext';
import { generateId } from '../../utils/generateId';
import FoodItem from './FoodItem';

const CATEGORY_LABELS: Record<MealCategoryType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      marginBottom: Spacing.sm,
      backgroundColor: colors.card,
      borderRadius: Radius.lg,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: colors.card,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    headerTitle: {
      ...Typography.h3,
      color: colors.text,
    },
    headerInfo: {
      ...Typography.small,
      color: colors.textSecondary,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    actionBtn: {
      padding: Spacing.xs,
    },
    emptyText: {
      ...Typography.small,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: Spacing.md,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    pickerSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: Radius.lg,
      borderTopRightRadius: Radius.lg,
      paddingBottom: Spacing.xl,
    },
    pickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerTitle: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '600',
    },
    pickerDone: {
      ...Typography.body,
      color: colors.primary,
      fontWeight: '600',
    },
    pickerCancel: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    iosPicker: {
      height: 200,
    },
  });

interface Props {
  category: MealCategoryType;
  foods: NutritionFoodItem[];
  date: string;
}

export default function MealCategoryComponent({ category, foods, date }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const { dispatch, nutritionLog } = useApp();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [showCopyPicker, setShowCopyPicker] = useState(false);

  // Parse today's date for max date in picker
  const [todayYear, todayMonth, todayDay] = date.split('-').map(Number);
  // Default copy picker to yesterday
  const yesterday = new Date(todayYear, todayMonth - 1, todayDay - 1);
  const [copyDate, setCopyDate] = useState<Date>(yesterday);

  const totalCal = foods.reduce((sum, f) => sum + (f.calories ?? 0), 0);

  const handleDelete = (foodId: string) => {
    dispatch({ type: 'DELETE_FOOD_FROM_MEAL', date, category, foodId });
  };

  const handleReorder = (data: NutritionFoodItem[]) => {
    dispatch({ type: 'REORDER_MEAL_FOODS', date, category, foods: data });
  };

  const handleAdd = () => {
    router.push({
      pathname: '/add-food-modal',
      params: { date, category },
    });
  };

  const handleCopyConfirm = (sourceDate: string) => {
    const sourceDay = nutritionLog.find((d) => d.date === sourceDate);
    const sourceFoods: NutritionFoodItem[] = sourceDay?.meals[category] ?? [];
    if (sourceFoods.length === 0) {
      Alert.alert(
        'Nothing to Copy',
        `No foods logged in ${CATEGORY_LABELS[category]} on that date.`,
      );
      return;
    }
    sourceFoods.forEach((food) => {
      dispatch({
        type: 'ADD_FOOD_TO_MEAL',
        date,
        category,
        food: { ...food, id: generateId() },
      });
    });
  };

  const handleCopyPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowCopyPicker(false);
      if (event.type === 'set' && selected) {
        const y = selected.getFullYear();
        const m = String(selected.getMonth() + 1).padStart(2, '0');
        const d = String(selected.getDate()).padStart(2, '0');
        handleCopyConfirm(`${y}-${m}-${d}`);
      }
    } else {
      if (selected) setCopyDate(selected);
    }
  };

  const confirmCopyiOS = () => {
    setShowCopyPicker(false);
    const y = copyDate.getFullYear();
    const m = String(copyDate.getMonth() + 1).padStart(2, '0');
    const d = String(copyDate.getDate()).padStart(2, '0');
    handleCopyConfirm(`${y}-${m}-${d}`);
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<NutritionFoodItem>) => (
    <FoodItem
      item={item}
      onDelete={() => handleDelete(item.id)}
      drag={drag}
      isActive={isActive}
      date={date}
      category={category}
    />
  );

  // Maximum date for picker is yesterday (can't copy from today)
  const maxDate = new Date(todayYear, todayMonth - 1, todayDay - 1);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setCollapsed(!collapsed)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Ionicons
            name={collapsed ? 'chevron-forward' : 'chevron-down'}
            size={18}
            color={colors.textSecondary}
          />
          <Text style={styles.headerTitle}>{CATEGORY_LABELS[category]}</Text>
          {foods.length > 0 && (
            <Text style={styles.headerInfo}>
              ({foods.length}) · {totalCal} cal
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setShowCopyPicker(true)}
          >
            <Ionicons name="copy-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleAdd}
          >
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {!collapsed && (
        <>
          {foods.length === 0 && (
            <Text style={styles.emptyText}>No foods logged</Text>
          )}

          {foods.length > 0 && (
            <View>
              <NestableDraggableFlatList
                data={foods}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                onDragEnd={({ data }) => handleReorder(data)}
              />
            </View>
          )}
        </>
      )}

      {/* Android: inline date picker */}
      {Platform.OS === 'android' && showCopyPicker && (
        <DateTimePicker
          value={copyDate}
          mode="date"
          display="default"
          maximumDate={maxDate}
          onChange={handleCopyPickerChange}
        />
      )}

      {/* iOS: bottom-sheet date picker */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showCopyPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCopyPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pickerSheet}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowCopyPicker(false)}>
                  <Text style={styles.pickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Copy from…</Text>
                <TouchableOpacity onPress={confirmCopyiOS}>
                  <Text style={styles.pickerDone}>Copy</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={copyDate}
                mode="date"
                display="spinner"
                maximumDate={maxDate}
                onChange={handleCopyPickerChange}
                style={styles.iosPicker}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
