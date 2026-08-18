import type {
  AddWorkoutExerciseInput,
  CreateTrainingPlanInput,
  TrainingPlan,
  TrainingPlanSummary,
  UpdateWorkoutExerciseInput,
  WorkoutSession,
} from '@/domain/workout';

import { assertSupabaseConfigured, mapSupabaseDataError } from '../shared';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase';
import type { ExerciseRow, TrainingPlanRow, WorkoutExerciseRow, WorkoutSessionRow } from '../supabase/types';
import { mapExerciseRow, mapTrainingPlan, mapTrainingPlanSummary, mapWorkoutExercise, placeholderExercise, slugifyPlanTitle } from './workout.mapper';

function isMissing(error: { message?: string; code?: string }): boolean {
  const message = error.message?.toLowerCase() ?? '';
  return (
    message.includes('training_plans') ||
    message.includes('workout_exercises') ||
    message.includes('does not exist') ||
    message.includes('schema cache') ||
    error.code === 'PGRST205' ||
    error.code === '42P01'
  );
}

async function hydratePlan(row: TrainingPlanRow): Promise<TrainingPlan> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('plan_id', row.id)
      .order('sort_order', { ascending: true });

    if (error) {
      return mapTrainingPlan(row, []);
    }

    const items = (data ?? []) as WorkoutExerciseRow[];
    const exerciseIds = [...new Set(items.map((item) => item.exercise_id).filter(Boolean))];

    let exerciseRows: ExerciseRow[] = [];
    if (exerciseIds.length > 0) {
      const { data: exerciseData, error: exerciseError } = await supabase
        .from('exercises')
        .select('*')
        .in('id', exerciseIds);

      if (!exerciseError) {
        exerciseRows = (exerciseData ?? []) as ExerciseRow[];
      }
    }

    const exercisesById = new Map(
      exerciseRows.map((exercise) => [exercise.id, mapExerciseRow(exercise)]),
    );

    return mapTrainingPlan(
      row,
      items.map((item, index) =>
        mapWorkoutExercise(
          {
            ...item,
            sort_order: Number.isFinite(item.sort_order) ? item.sort_order : index,
          },
          exercisesById.get(item.exercise_id) ?? placeholderExercise(item.exercise_id),
        ),
      ),
    );
  } catch {
    return mapTrainingPlan(row, []);
  }
}

export async function listTrainingPlans(options?: { publishedOnly?: boolean }): Promise<TrainingPlanSummary[]> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  let query = supabase.from('training_plans').select('*').order('sort_order', { ascending: true });

  if (options?.publishedOnly) {
    query = query.eq('is_published', true);
  }

  const { data, error } = await query;

  if (error) {
    throw mapSupabaseDataError(
      isMissing(error)
        ? {
            ...error,
            message:
              'As tabelas de treinos ainda não existem. Execute supabase/phase13-workouts.sql no SQL Editor.',
          }
        : error,
    );
  }

  const rows = (data ?? []) as TrainingPlanRow[];
  const planIds = rows.map((row) => row.id);

  const countByPlanId = new Map<string, number>();
  if (planIds.length > 0) {
    const { data: itemsData, error: itemsError } = await supabase
      .from('workout_exercises')
      .select('plan_id')
      .in('plan_id', planIds);

    if (itemsError) {
      throw mapSupabaseDataError(itemsError);
    }

    for (const item of itemsData ?? []) {
      countByPlanId.set(item.plan_id, (countByPlanId.get(item.plan_id) ?? 0) + 1);
    }
  }

  return rows.map((row) => mapTrainingPlanSummary(row, countByPlanId.get(row.id) ?? 0));
}

export async function getTrainingPlan(planId: string): Promise<TrainingPlan | null> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('training_plans')
    .select('*')
    .eq('id', planId)
    .maybeSingle();

  if (error) {
    throw mapSupabaseDataError(
      isMissing(error)
        ? {
            ...error,
            message:
              'As tabelas de treinos ainda não existem. Execute supabase/phase13-workouts.sql no SQL Editor.',
          }
        : error,
    );
  }

  if (!data) {
    return null;
  }

  return hydratePlan(data as TrainingPlanRow);
}

async function uniquePlanSlug(base: string): Promise<string> {
  const supabase = getSupabaseClient();
  let candidate = base || 'treino';

  for (let suffix = 2; suffix <= 20; suffix += 1) {
    const { data, error } = await supabase
      .from('training_plans')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();

    if (error) {
      throw mapSupabaseDataError(error);
    }

    if (!data) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
  }

  return `${base}-${Date.now()}`;
}

export async function createTrainingPlan(input: CreateTrainingPlanInput): Promise<TrainingPlan> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const slug = await uniquePlanSlug(input.slug.trim() || slugifyPlanTitle(input.title));
  const { data, error } = await supabase
    .from('training_plans')
    .insert({
      title: input.title.trim(),
      slug,
      description: input.description?.trim() || null,
      sort_order: input.sortOrder ?? 0,
      created_by: input.createdBy,
      is_published: false,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw mapSupabaseDataError(error ?? { message: 'Não foi possível criar o treino.' });
  }

  return hydratePlan(data as TrainingPlanRow);
}

export async function updateTrainingPlan(
  planId: string,
  input: { title: string; description?: string; isPublished?: boolean; sortOrder?: number },
): Promise<void> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('training_plans')
    .update({
      title: input.title.trim() || 'Treino',
      description: input.description?.trim() || null,
      is_published: input.isPublished,
      sort_order: input.sortOrder,
    })
    .eq('id', planId);

  if (error) {
    throw mapSupabaseDataError(error);
  }
}

export async function deleteTrainingPlan(planId: string): Promise<void> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { error } = await supabase.from('training_plans').delete().eq('id', planId);

  if (error) {
    throw mapSupabaseDataError(error);
  }
}

export async function addWorkoutExercise(input: AddWorkoutExerciseInput): Promise<void> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { count } = await supabase
    .from('workout_exercises')
    .select('id', { count: 'exact', head: true })
    .eq('plan_id', input.planId);

  const { error } = await supabase.from('workout_exercises').insert({
    plan_id: input.planId,
    exercise_id: input.exerciseId,
    sets: input.sets,
    reps: input.reps.trim(),
    load_kg: input.loadKg ?? null,
    rest_seconds: input.restSeconds,
    notes: input.notes?.trim() || null,
    sort_order: input.sortOrder ?? count ?? 0,
  });

  if (error) {
    throw mapSupabaseDataError(error);
  }
}

export async function updateWorkoutExercise(
  itemId: string,
  input: UpdateWorkoutExerciseInput,
): Promise<void> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('workout_exercises')
    .update({
      sets: input.sets,
      reps: input.reps.trim(),
      load_kg: input.loadKg ?? null,
      rest_seconds: input.restSeconds,
      notes: input.notes?.trim() || null,
      sort_order: input.sortOrder,
    })
    .eq('id', itemId);

  if (error) {
    throw mapSupabaseDataError(error);
  }
}

export async function deleteWorkoutExercise(itemId: string): Promise<void> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { error } = await supabase.from('workout_exercises').delete().eq('id', itemId);

  if (error) {
    throw mapSupabaseDataError(error);
  }
}

export async function completeWorkoutSession(input: {
  userId: string;
  planId: string;
  completedExerciseIds: readonly string[];
}): Promise<WorkoutSession> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: input.userId,
      plan_id: input.planId,
      completed_exercise_ids: [...input.completedExerciseIds],
    })
    .select('*')
    .single();

  if (error || !data) {
    throw mapSupabaseDataError(error ?? { message: 'Não foi possível finalizar o treino.' });
  }

  const row = data as WorkoutSessionRow;
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id,
    completedExerciseIds: Array.isArray(row.completed_exercise_ids)
      ? row.completed_exercise_ids.filter((id): id is string => typeof id === 'string')
      : [],
    completedAt: row.completed_at,
  };
}
