import { NutritionFoodItem } from '../types';
import { generateId } from '../utils/generateId';

const API_KEY = process.env.EXPO_PUBLIC_USDA_API_KEY ?? '';
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const USDA_ENABLED = process.env.EXPO_PUBLIC_ENABLE_USDA_SEARCH === 'true';

/** USDA nutrient IDs */
const NUTRIENT_KCAL = 1008;
const NUTRIENT_PROTEIN = 1003;
const NUTRIENT_FAT = 1004;
const NUTRIENT_CARBS = 1005;

interface FDCNutrient {
  nutrientId: number;
  value: number;
}

interface FDCFood {
  description: string;
  foodNutrients: FDCNutrient[];
}

interface FDCSearchResponse {
  foods: FDCFood[];
  totalHits: number;
}

function getNutrientValue(nutrients: FDCNutrient[], id: number): number {
  return nutrients.find((n) => n.nutrientId === id)?.value ?? 0;
}

export async function searchFoods(
  query: string,
  page: number = 1,
  signal?: AbortSignal,
): Promise<{ items: NutritionFoodItem[]; total: number }> {
  if (!USDA_ENABLED) return { items: [], total: 0 };

  const res = await fetch(`${BASE_URL}?api_key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      dataType: ['Foundation', 'SR Legacy'],
      pageSize: 25,
      pageNumber: page,
      nutrients: [NUTRIENT_KCAL, NUTRIENT_PROTEIN, NUTRIENT_FAT, NUTRIENT_CARBS],
    }),
    signal,
  });

  if (!res.ok) throw new Error(`USDA search failed: ${res.status}`);

  const data: FDCSearchResponse = await res.json();

  const items: NutritionFoodItem[] = data.foods.map((food) => {
    const cal = getNutrientValue(food.foodNutrients, NUTRIENT_KCAL);
    const protein = getNutrientValue(food.foodNutrients, NUTRIENT_PROTEIN);
    const fat = getNutrientValue(food.foodNutrients, NUTRIENT_FAT);
    const carbs = getNutrientValue(food.foodNutrients, NUTRIENT_CARBS);

    return {
      id: generateId(),
      name: food.description,
      calories: Math.round(cal),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      servingSize: '100g',
      servings: 1,
    };
  });

  return { items, total: data.totalHits };
}
