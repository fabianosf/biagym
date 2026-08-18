import type { CreateNutritionPlanInput, NutritionPlan } from '@/domain/nutrition';

import {
  assertSupabaseConfigured,
  DataServiceError,
  escapePostgrestPattern,
  mapSupabaseDataError,
} from '../shared';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase';
import type { NutritionMealRow, NutritionPlanRow } from '../supabase/types';
import { mapNutritionPlanRow } from './nutrition.mapper';

function isCoachingSchemaMissing(error: { message?: string; code?: string }): boolean {
  const message = error.message?.toLowerCase() ?? '';
  return (
    message.includes('nutrition_plans') ||
    message.includes('nutrition_meals') ||
    message.includes('schema cache') ||
    message.includes('does not exist') ||
    message.includes('could not find') ||
    error.code === 'PGRST205' ||
    error.code === 'PGRST204' ||
    error.code === '42P01'
  );
}

function throwCoachingSchemaError(error: { message?: string; code?: string }): never {
  throw new DataServiceError(
    'configuration_error',
    error,
    'Recursos de nutrição ainda não foram aplicados. Execute supabase/phase12-coaching.sql no SQL Editor.',
  );
}

async function fetchPlansWithMeals(planIds: readonly string[]): Promise<NutritionPlan[]> {
  if (planIds.length === 0) {
    return [];
  }

  const supabase = getSupabaseClient();
  const [{ data: plans, error: plansError }, { data: meals, error: mealsError }] =
    await Promise.all([
      supabase.from('nutrition_plans').select('*').in('id', [...planIds]).order('created_at', {
        ascending: false,
      }),
      supabase.from('nutrition_meals').select('*').in('plan_id', [...planIds]).order('sort_order', {
        ascending: true,
      }),
    ]);

  if (plansError) {
    if (isCoachingSchemaMissing(plansError)) {
      throwCoachingSchemaError(plansError);
    }
    throw mapSupabaseDataError(plansError);
  }

  if (mealsError) {
    if (isCoachingSchemaMissing(mealsError)) {
      throwCoachingSchemaError(mealsError);
    }
    throw mapSupabaseDataError(mealsError);
  }

  return (plans ?? []).map((plan) =>
    mapNutritionPlanRow(plan as NutritionPlanRow, (meals ?? []) as NutritionMealRow[]),
  );
}

export async function listNutritionPlans(): Promise<NutritionPlan[]> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('nutrition_plans')
    .select('id')
    .order('created_at', { ascending: false });

  if (error) {
    if (isCoachingSchemaMissing(error)) {
      return [];
    }
    throw mapSupabaseDataError(error);
  }

  return fetchPlansWithMeals((data ?? []).map((row) => (row as { id: string }).id));
}

export async function listNutritionPlansForStudent(userId: string): Promise<NutritionPlan[]> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('nutrition_plans')
    .select('id, student_user_id')
    .eq('is_published', true)
    .or(`student_user_id.eq.${escapePostgrestPattern(userId)},student_user_id.is.null`)
    .order('created_at', { ascending: false });

  if (error) {
    if (isCoachingSchemaMissing(error)) {
      return [];
    }
    throw mapSupabaseDataError(error);
  }

  const plans = await fetchPlansWithMeals((data ?? []).map((row) => (row as { id: string }).id));
  const personal = plans.filter((plan) => plan.studentUserId === userId);
  return personal.length > 0 ? personal : plans.filter((plan) => !plan.studentUserId);
}

export async function createNutritionPlan(
  input: CreateNutritionPlanInput,
): Promise<NutritionPlan> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const payload = {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    student_user_id: input.studentUserId ?? null,
    created_by: input.createdBy,
    is_published: true,
    calories_kcal: input.macros?.caloriesKcal ?? null,
    protein_g: input.macros?.proteinG ?? null,
    carbs_g: input.macros?.carbsG ?? null,
    fat_g: input.macros?.fatG ?? null,
  };

  let insertResult = await supabase.from('nutrition_plans').insert(payload).select('*').single();

  if (insertResult.error && isCoachingSchemaMissing(insertResult.error)) {
    insertResult = await supabase
      .from('nutrition_plans')
      .insert({
        title: payload.title,
        description: payload.description,
        student_user_id: payload.student_user_id,
        created_by: payload.created_by,
        is_published: true,
      })
      .select('*')
      .single();
  }

  const { data, error } = insertResult;

  if (error || !data) {
    if (error && isCoachingSchemaMissing(error)) {
      throwCoachingSchemaError(error);
    }
    throw mapSupabaseDataError(error ?? { message: 'Falha ao criar plano de alimentação.' });
  }

  const plan = data as NutritionPlanRow;
  const mealsToInsert = input.meals
    .filter((meal) => meal.title.trim().length > 0)
    .map((meal, index) => ({
      plan_id: plan.id,
      meal_type: meal.mealType,
      title: meal.title.trim(),
      description: meal.description?.trim() || null,
      time_label: meal.timeLabel?.trim() || null,
      sort_order: index,
    }));

  if (mealsToInsert.length > 0) {
    const { error: mealsError } = await supabase.from('nutrition_meals').insert(mealsToInsert);
    if (mealsError) {
      throw mapSupabaseDataError(mealsError);
    }
  }

  const [created] = await fetchPlansWithMeals([plan.id]);
  if (!created) {
    throw new DataServiceError('not_found');
  }

  return created;
}

export async function deleteNutritionPlan(planId: string): Promise<void> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { error } = await supabase.from('nutrition_plans').delete().eq('id', planId);

  if (error) {
    throw mapSupabaseDataError(error);
  }
}
