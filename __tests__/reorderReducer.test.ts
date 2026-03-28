/**
 * Unit tests for the REORDER_PINNED_FOODS, REORDER_PINNED_MEALS, and
 * REORDER_MEAL_FOODS reducer actions. We replicate the reducer logic directly
 * (same pattern as the FeedbackSection tests) to verify ordering behaviour
 * without mounting React.
 */

import { CustomFood, SavedMeal, MealCategory, NutritionFoodItem, DayNutrition } from '../types';

// ---------------------------------------------------------------------------
// Reducer logic extracted from context/AppContext.tsx
// ---------------------------------------------------------------------------

function reorderMealFoods(
  nutritionLog: DayNutrition[],
  date: string,
  category: MealCategory,
  foods: NutritionFoodItem[],
): DayNutrition[] {
  const day = nutritionLog.find((d) => d.date === date) ?? {
    date,
    meals: { breakfast: [], lunch: [], dinner: [], snacks: [] },
  };
  const updatedDay: DayNutrition = {
    ...day,
    meals: { ...day.meals, [category]: foods },
  };
  return [updatedDay, ...nutritionLog.filter((d) => d.date !== date)];
}

function reorderPinnedFoods(
  customFoods: CustomFood[],
  ids: string[],
): CustomFood[] {
  return customFoods.map((f) => {
    const idx = ids.indexOf(f.id);
    return idx !== -1 ? { ...f, pinnedOrder: idx } : f;
  });
}

function reorderPinnedMeals(
  savedMeals: SavedMeal[],
  category: MealCategory,
  ids: string[],
): SavedMeal[] {
  return savedMeals.map((m) => {
    const idx = ids.indexOf(m.id);
    if (idx === -1) return m;
    return {
      ...m,
      pinnedOrder: { ...(m.pinnedOrder ?? {}), [category]: idx },
    };
  });
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const makeFood = (overrides: Partial<CustomFood> & { id: string; name: string; calories: number }): CustomFood => ({
  protein: 0,
  carbs: 0,
  fat: 0,
  servingSize: '1 serving',
  createdAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const makeFoods = (): CustomFood[] => [
  makeFood({ id: 'a', name: 'Apple', calories: 95, pinned: true, pinnedOrder: 0 }),
  makeFood({ id: 'b', name: 'Banana', calories: 105, pinned: true, pinnedOrder: 1 }),
  makeFood({ id: 'c', name: 'Carrot', calories: 25, pinned: true, pinnedOrder: 2 }),
  makeFood({ id: 'd', name: 'Donut', calories: 300 }), // not pinned
];

const makeMeals = (): SavedMeal[] => [
  {
    id: 'm1',
    name: 'Morning Meal',
    foods: [],
    createdAt: '2026-01-01T00:00:00Z',
    pinnedCategories: ['breakfast' as MealCategory],
    pinnedOrder: { breakfast: 0 },
  },
  {
    id: 'm2',
    name: 'Lunch Meal',
    foods: [],
    createdAt: '2026-01-01T00:00:00Z',
    pinnedCategories: ['breakfast' as MealCategory, 'lunch' as MealCategory],
    pinnedOrder: { breakfast: 1, lunch: 0 },
  },
  {
    id: 'm3',
    name: 'Dinner Meal',
    foods: [],
    createdAt: '2026-01-01T00:00:00Z',
    pinnedCategories: ['dinner' as MealCategory],
    pinnedOrder: { dinner: 0 },
  },
];

// ---------------------------------------------------------------------------
// REORDER_PINNED_FOODS tests
// ---------------------------------------------------------------------------

describe('REORDER_PINNED_FOODS', () => {
  it('reverses the order of all pinned foods', () => {
    const result = reorderPinnedFoods(makeFoods(), ['c', 'b', 'a']);
    expect(result.find((f) => f.id === 'a')!.pinnedOrder).toBe(2);
    expect(result.find((f) => f.id === 'b')!.pinnedOrder).toBe(1);
    expect(result.find((f) => f.id === 'c')!.pinnedOrder).toBe(0);
  });

  it('does not modify unpinned foods', () => {
    const result = reorderPinnedFoods(makeFoods(), ['c', 'b', 'a']);
    const donut = result.find((f) => f.id === 'd')!;
    expect(donut.pinnedOrder).toBeUndefined();
  });

  it('handles a single pinned food', () => {
    const foods: CustomFood[] = [
      makeFood({ id: 'x', name: 'X', calories: 10, pinned: true, pinnedOrder: 0 }),
    ];
    const result = reorderPinnedFoods(foods, ['x']);
    expect(result[0].pinnedOrder).toBe(0);
  });

  it('sets sequential pinnedOrder values starting from 0', () => {
    const result = reorderPinnedFoods(makeFoods(), ['b', 'c', 'a']);
    expect(result.find((f) => f.id === 'b')!.pinnedOrder).toBe(0);
    expect(result.find((f) => f.id === 'c')!.pinnedOrder).toBe(1);
    expect(result.find((f) => f.id === 'a')!.pinnedOrder).toBe(2);
  });

  it('preserves all other food properties', () => {
    const result = reorderPinnedFoods(makeFoods(), ['c', 'b', 'a']);
    const apple = result.find((f) => f.id === 'a')!;
    expect(apple.name).toBe('Apple');
    expect(apple.calories).toBe(95);
    expect(apple.pinned).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// REORDER_PINNED_MEALS tests
// ---------------------------------------------------------------------------

describe('REORDER_PINNED_MEALS', () => {
  it('updates pinnedOrder for the target category', () => {
    const result = reorderPinnedMeals(
      makeMeals(),
      'breakfast' as MealCategory,
      ['m2', 'm1'],
    );
    expect(result.find((m) => m.id === 'm1')!.pinnedOrder!.breakfast).toBe(1);
    expect(result.find((m) => m.id === 'm2')!.pinnedOrder!.breakfast).toBe(0);
  });

  it('does not modify pinnedOrder for other categories', () => {
    const result = reorderPinnedMeals(
      makeMeals(),
      'breakfast' as MealCategory,
      ['m2', 'm1'],
    );
    // m2's lunch order should remain unchanged
    expect(result.find((m) => m.id === 'm2')!.pinnedOrder!.lunch).toBe(0);
  });

  it('does not touch meals not in the ids list', () => {
    const result = reorderPinnedMeals(
      makeMeals(),
      'breakfast' as MealCategory,
      ['m2', 'm1'],
    );
    const dinner = result.find((m) => m.id === 'm3')!;
    expect(dinner.pinnedOrder).toEqual({ dinner: 0 });
  });

  it('initializes pinnedOrder when it was previously undefined', () => {
    const meals: SavedMeal[] = [
      {
        id: 'n1',
        name: 'New Meal',
        foods: [],
        createdAt: '2026-01-01T00:00:00Z',
        pinnedCategories: ['snacks' as MealCategory],
        // no pinnedOrder at all
      },
    ];
    const result = reorderPinnedMeals(meals, 'snacks' as MealCategory, ['n1']);
    expect(result[0].pinnedOrder).toEqual({ snacks: 0 });
  });

  it('preserves all other meal properties', () => {
    const result = reorderPinnedMeals(
      makeMeals(),
      'breakfast' as MealCategory,
      ['m2', 'm1'],
    );
    const m1 = result.find((m) => m.id === 'm1')!;
    expect(m1.name).toBe('Morning Meal');
    expect(m1.pinnedCategories).toEqual(['breakfast']);
  });
});

// ---------------------------------------------------------------------------
// REORDER_MEAL_FOODS tests
// ---------------------------------------------------------------------------

const makeNutritionItem = (id: string, name: string, cal: number): NutritionFoodItem => ({
  id,
  name,
  calories: cal,
});

describe('REORDER_MEAL_FOODS', () => {
  const date = '2026-03-28';
  const makeDayLog = (): DayNutrition[] => [
    {
      date,
      meals: {
        breakfast: [
          makeNutritionItem('f1', 'Eggs', 150),
          makeNutritionItem('f2', 'Toast', 120),
          makeNutritionItem('f3', 'Bacon', 200),
        ],
        lunch: [makeNutritionItem('f4', 'Salad', 300)],
        dinner: [],
        snacks: [],
      },
    },
  ];

  it('reorders foods in the specified category', () => {
    const reordered = [
      makeNutritionItem('f3', 'Bacon', 200),
      makeNutritionItem('f1', 'Eggs', 150),
      makeNutritionItem('f2', 'Toast', 120),
    ];
    const result = reorderMealFoods(makeDayLog(), date, 'breakfast', reordered);
    const day = result.find((d) => d.date === date)!;
    expect(day.meals.breakfast.map((f) => f.id)).toEqual(['f3', 'f1', 'f2']);
  });

  it('does not affect other categories', () => {
    const reordered = [
      makeNutritionItem('f3', 'Bacon', 200),
      makeNutritionItem('f1', 'Eggs', 150),
      makeNutritionItem('f2', 'Toast', 120),
    ];
    const result = reorderMealFoods(makeDayLog(), date, 'breakfast', reordered);
    const day = result.find((d) => d.date === date)!;
    expect(day.meals.lunch.map((f) => f.id)).toEqual(['f4']);
    expect(day.meals.dinner).toEqual([]);
  });

  it('creates a new day entry if one does not exist', () => {
    const foods = [makeNutritionItem('f5', 'Soup', 250)];
    const result = reorderMealFoods([], '2026-04-01', 'dinner', foods);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-04-01');
    expect(result[0].meals.dinner).toEqual(foods);
    expect(result[0].meals.breakfast).toEqual([]);
  });

  it('preserves food item properties through reorder', () => {
    const foods = makeDayLog()[0].meals.breakfast;
    const reordered = [...foods].reverse();
    const result = reorderMealFoods(makeDayLog(), date, 'breakfast', reordered);
    const day = result.find((d) => d.date === date)!;
    const bacon = day.meals.breakfast[0];
    expect(bacon.name).toBe('Bacon');
    expect(bacon.calories).toBe(200);
  });
});
