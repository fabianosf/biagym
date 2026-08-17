import type { Exercise, MuscleGroup, TrainingPlan, TrainingPlanSummary, WorkoutExercise } from '@/domain/workout';
import { MUSCLE_GROUPS } from '@/domain/workout';

import type { ExerciseRow, TrainingPlanRow, WorkoutExerciseRow } from '../supabase/types';

function parseMuscleGroup(value: string): MuscleGroup {
  return MUSCLE_GROUPS.includes(value as MuscleGroup) ? (value as MuscleGroup) : 'corpo_todo';
}

export function mapExerciseRow(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    muscleGroup: parseMuscleGroup(row.muscle_group),
    videoUrl: row.video_url,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export function mapWorkoutExercise(
  row: WorkoutExerciseRow,
  exercise: Exercise,
): WorkoutExercise {
  return {
    id: row.id,
    planId: row.plan_id,
    exercise,
    sets: row.sets,
    reps: row.reps,
    loadKg: row.load_kg != null ? Number(row.load_kg) : undefined,
    restSeconds: row.rest_seconds,
    notes: row.notes ?? undefined,
    sortOrder: row.sort_order,
  };
}

export function mapTrainingPlanSummary(
  row: TrainingPlanRow,
  exerciseCount: number,
): TrainingPlanSummary {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? undefined,
    isPublished: row.is_published,
    sortOrder: row.sort_order,
    exerciseCount,
  };
}

export function mapTrainingPlan(
  row: TrainingPlanRow,
  exercises: readonly WorkoutExercise[],
): TrainingPlan {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? undefined,
    isPublished: row.is_published,
    sortOrder: row.sort_order,
    createdBy: row.created_by,
    createdAt: row.created_at,
    exercises: [...exercises].sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export function slugifyPlanTitle(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);
}

export function parseOptionalLoadKg(value: string): number | undefined {
  const trimmed = value.trim().replace(',', '.');
  if (trimmed.length === 0) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
