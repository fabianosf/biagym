import type { Exercise, MuscleGroup, TrainingPlan, TrainingPlanSummary, WorkoutExercise } from '@/domain/workout';
import { MUSCLE_GROUPS } from '@/domain/workout';

import type { ExerciseRow, TrainingPlanRow, WorkoutExerciseRow } from '../supabase/types';

const DEFAULT_PRESCRIPTION = {
  SETS: 3,
  REPS: '12',
  REST_SECONDS: 60,
} as const;

function parseMuscleGroup(value: string | null | undefined): MuscleGroup {
  return MUSCLE_GROUPS.includes(value as MuscleGroup) ? (value as MuscleGroup) : 'corpo_todo';
}

function toPositiveInt(value: number | null | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
}

export function mapExerciseRow(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name?.trim() || 'Exercício',
    description: row.description ?? undefined,
    muscleGroup: parseMuscleGroup(row.muscle_group),
    videoUrl: row.video_url ?? '',
    thumbnailUrl: row.thumbnail_url ?? undefined,
    createdBy: row.created_by ?? '',
    createdAt: row.created_at ?? '',
  };
}

export function placeholderExercise(exerciseId: string): Exercise {
  return {
    id: exerciseId || 'missing-exercise',
    name: 'Exercício indisponível',
    description: 'Este exercício não está mais no catálogo.',
    muscleGroup: 'corpo_todo',
    videoUrl: '',
    createdBy: '',
    createdAt: '',
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
    sets: toPositiveInt(row.sets, DEFAULT_PRESCRIPTION.SETS),
    reps: row.reps?.trim() || DEFAULT_PRESCRIPTION.REPS,
    loadKg: row.load_kg != null && Number.isFinite(Number(row.load_kg)) ? Number(row.load_kg) : undefined,
    restSeconds: toPositiveInt(row.rest_seconds, DEFAULT_PRESCRIPTION.REST_SECONDS),
    notes: row.notes ?? undefined,
    sortOrder: Number.isFinite(row.sort_order) ? row.sort_order : 0,
  };
}

export function mapTrainingPlanSummary(
  row: TrainingPlanRow,
  exerciseCount: number,
): TrainingPlanSummary {
  return {
    id: row.id,
    title: row.title?.trim() || 'Treino',
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
    title: row.title?.trim() || 'Treino',
    slug: row.slug ?? '',
    description: row.description ?? undefined,
    isPublished: Boolean(row.is_published),
    sortOrder: Number.isFinite(row.sort_order) ? row.sort_order : 0,
    createdBy: row.created_by ?? '',
    createdAt: row.created_at ?? '',
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
