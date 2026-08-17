import type { MealType, NutritionMacros, NutritionMeal, NutritionPlan } from '@/domain/nutrition';
import { MEAL_TYPES } from '@/domain/nutrition';

import type { NutritionMealRow, NutritionPlanRow } from '../supabase/types';

function parseMealType(value: string): MealType {
  return MEAL_TYPES.includes(value as MealType) ? (value as MealType) : 'lanche';
}

function mapMacros(row: NutritionPlanRow): NutritionMacros | undefined {
  if (
    row.calories_kcal == null &&
    row.protein_g == null &&
    row.carbs_g == null &&
    row.fat_g == null
  ) {
    return undefined;
  }

  return {
    caloriesKcal: row.calories_kcal ?? undefined,
    proteinG: row.protein_g ?? undefined,
    carbsG: row.carbs_g ?? undefined,
    fatG: row.fat_g ?? undefined,
  };
}

export function mapNutritionMealRow(row: NutritionMealRow): NutritionMeal {
  return {
    id: row.id,
    planId: row.plan_id,
    mealType: parseMealType(row.meal_type),
    title: row.title,
    description: row.description ?? undefined,
    timeLabel: row.time_label ?? undefined,
    sortOrder: row.sort_order,
  };
}

export function mapNutritionPlanRow(
  row: NutritionPlanRow,
  meals: readonly NutritionMealRow[] = [],
): NutritionPlan {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    studentUserId: row.student_user_id ?? undefined,
    createdBy: row.created_by,
    isPublished: row.is_published,
    createdAt: row.created_at,
    macros: mapMacros(row),
    meals: meals
      .filter((meal) => meal.plan_id === row.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapNutritionMealRow),
  };
}
