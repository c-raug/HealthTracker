import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColors, LightColors } from '../constants/theme';
import { NutritionFoodItem } from '../types';
import CreateMealFlow from '../components/nutrition/CreateMealFlow';

const makeStyles = (colors: typeof LightColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });

export default function CreateMealModal() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ initialFoodsJson?: string; initialMealName?: string }>();

  const initialFoods: NutritionFoodItem[] = params.initialFoodsJson
    ? JSON.parse(params.initialFoodsJson)
    : [];
  const initialName = params.initialMealName ?? '';

  return (
    <SafeAreaView style={styles.container}>
      <CreateMealFlow
        onDone={() => router.back()}
        initialFoods={initialFoods}
        initialName={initialName}
      />
    </SafeAreaView>
  );
}
