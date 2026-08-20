import type { MuscleGroup, WorkoutExercise } from '@/domain/workout';

export function formatSetsReps(sets: number, reps: string): string {
  return `${sets} × ${reps}`;
}

export function formatLoadKg(loadKg: number | undefined): string | null {
  if (loadKg == null || loadKg <= 0) {
    return null;
  }

  return `${loadKg} kg`;
}

export function resolveDisplayedLoadKg(item: WorkoutExercise, override?: number): number {
  if (override != null) {
    return override;
  }

  return item.loadKg ?? 0;
}

export function formatPrescriptionLine(sets: number, reps: string, loadKg?: number): string {
  const base = formatSetsReps(sets, reps);
  const load = formatLoadKg(loadKg);
  return load ? `${base} | ${load}` : base;
}

export function formatRestClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatElapsedClock(elapsedMs: number): string {
  const total = Math.max(0, Math.floor(elapsedMs / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

export function formatIndexBadge(index: number): string {
  return String(index + 1).padStart(2, '0');
}

export function getPlanMuscleGroupSubtitle(
  t: (key: string, vars?: Record<string, string>) => string,
  items: readonly WorkoutExercise[],
): string {
  const seen = new Set<MuscleGroup>();
  const labels: string[] = [];

  for (const item of items) {
    const group = item.exercise?.muscleGroup ?? 'corpo_todo';
    if (seen.has(group)) {
      continue;
    }

    seen.add(group);
    labels.push(t(`muscleGroups.${group}`));
  }

  return labels.join(', ');
}

export function parseSessionLoadKg(value: string): number | null {
  const trimmed = value.trim().replace(',', '.');
  if (trimmed.length === 0) {
    return 0;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.round(parsed * 10) / 10;
}
