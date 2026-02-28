import { NutritionFoodItem } from '../types';
import { generateId } from '../utils/generateId';

const BASE_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

interface OFFProduct {
  product_name?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    'proteins_100g'?: number;
    'carbohydrates_100g'?: number;
    'fat_100g'?: number;
  };
  serving_quantity?: number;
  serving_size?: string;
}

interface OFFSearchResponse {
  products: OFFProduct[];
  count: number;
  page: number;
  page_size: number;
}

export async function searchFoods(
  query: string,
  page: number = 1,
): Promise<{ items: NutritionFoodItem[]; total: number }> {
  const params = new URLSearchParams({
    search_terms: query,
    json: 'true',
    page_size: '20',
    page: page.toString(),
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) throw new Error(`OFF search failed: ${res.status}`);

  const data: OFFSearchResponse = await res.json();

  const items = data.products
    .filter(
      (p) =>
        p.product_name &&
        p.nutriments?.['energy-kcal_100g'] != null,
    )
    .map((p) => offProductToFoodItem(p, 1));

  return { items, total: data.count };
}

export function offProductToFoodItem(
  product: OFFProduct,
  servings: number,
): NutritionFoodItem {
  const n = product.nutriments ?? {};
  const servingGrams = product.serving_quantity ?? 100;
  const factor = (servingGrams / 100) * servings;

  return {
    id: generateId(),
    name: product.product_name ?? 'Unknown',
    calories: Math.round((n['energy-kcal_100g'] ?? 0) * factor),
    protein: Math.round((n['proteins_100g'] ?? 0) * factor * 10) / 10,
    carbs: Math.round((n['carbohydrates_100g'] ?? 0) * factor * 10) / 10,
    fat: Math.round((n['fat_100g'] ?? 0) * factor * 10) / 10,
    servingSize: product.serving_size ?? `${servingGrams}g`,
    servings,
  };
}
