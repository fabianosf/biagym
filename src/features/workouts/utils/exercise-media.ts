import type { Exercise, MuscleGroup } from '@/domain/workout';
import { SAMPLE_WORKOUT_VIDEOS, type SampleWorkoutVideo } from '@/shared/constants/sample-workout-videos';
import type { ImageSource } from 'expo-image';

const THUMB_PLANK = require('../../../../assets/images/exercises/plank-jacks.png');
const THUMB_CRUNCH = require('../../../../assets/images/exercises/bicycle-crunches.png');
const THUMB_SQUAT = require('../../../../assets/images/exercises/goblet-squat.png');
const THUMB_ROW = require('../../../../assets/images/exercises/single-arm-row.png');

const GALLERY: readonly ImageSource[] = [THUMB_PLANK, THUMB_CRUNCH, THUMB_SQUAT, THUMB_ROW];

const THUMB_BY_MUSCLE: Record<MuscleGroup, ImageSource> = {
  pernas: THUMB_SQUAT,
  gluteos: THUMB_SQUAT,
  costas: THUMB_ROW,
  peito: THUMB_ROW,
  ombros: THUMB_ROW,
  biceps: THUMB_ROW,
  triceps: THUMB_ROW,
  core: THUMB_CRUNCH,
  cardio: THUMB_PLANK,
  corpo_todo: THUMB_PLANK,
};

type ExerciseMediaInput = Pick<Exercise, 'id' | 'name' | 'muscleGroup' | 'thumbnailUrl'>;

export function normalizeExerciseName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function hashSlot(id: string, total: number): number {
  if (total <= 0) {
    return 0;
  }

  let hash = 0;
  for (const character of id) {
    hash = (hash + character.charCodeAt(0)) % total;
  }

  return hash;
}

function isRemoteImageUrl(url: string | undefined): url is string {
  if (!url) {
    return false;
  }

  const trimmed = url.trim();
  return trimmed.startsWith('https://') || trimmed.startsWith('http://');
}

function thumbnailByName(name: string): ImageSource | null {
  const normalized = normalizeExerciseName(name);

  if (/(agach|squat|goblet|afundo|lunge|leg press)/.test(normalized)) {
    return THUMB_SQUAT;
  }

  if (/(remada|row|puxada|barra fixa|pulldown)/.test(normalized)) {
    return THUMB_ROW;
  }

  if (/(prancha|plank|jack)/.test(normalized)) {
    return THUMB_PLANK;
  }

  if (/(crunch|abdominal|bicycle|bicicleta)/.test(normalized)) {
    return THUMB_CRUNCH;
  }

  if (/(aquec|mobilidade|cardio|condicion)/.test(normalized)) {
    return THUMB_PLANK;
  }

  return null;
}

export function exerciseThumbnailSource(exercise?: ExerciseMediaInput | null): ImageSource {
  if (!exercise) {
    return THUMB_PLANK;
  }

  if (isRemoteImageUrl(exercise.thumbnailUrl)) {
    return { uri: exercise.thumbnailUrl.trim() };
  }

  return (
    thumbnailByName(exercise.name ?? '') ??
    THUMB_BY_MUSCLE[exercise.muscleGroup ?? 'corpo_todo'] ??
    GALLERY[hashSlot(exercise.id ?? 'exercise', GALLERY.length)] ??
    THUMB_PLANK
  );
}

const VIDEO_MATCH_RULES: readonly { test: RegExp; videoId: string }[] = [
  { test: /(agach|squat|goblet|afundo|lunge)/, videoId: 'video2' },
  { test: /(prancha|plank|core|abdominal|crunch)/, videoId: 'video3' },
  { test: /(remada|row|puxada)/, videoId: 'video4' },
  { test: /(aquec|mobilidade)/, videoId: 'video1' },
  { test: /(condicion|cardio|circuito)/, videoId: 'video5' },
];

const VIDEO_BY_MUSCLE: Partial<Record<MuscleGroup, string>> = {
  pernas: 'video2',
  gluteos: 'video2',
  core: 'video3',
  costas: 'video4',
  peito: 'video4',
  ombros: 'video4',
  biceps: 'video4',
  triceps: 'video4',
  cardio: 'video5',
  corpo_todo: 'video1',
};

export function pickSampleWorkoutVideoForExercise(
  exercise?: ExerciseMediaInput | null,
): SampleWorkoutVideo | undefined {
  if (!exercise?.id || !exercise.name || SAMPLE_WORKOUT_VIDEOS.length === 0) {
    return undefined;
  }

  const normalizedName = normalizeExerciseName(exercise.name);
  for (const rule of VIDEO_MATCH_RULES) {
    if (rule.test.test(normalizedName)) {
      return SAMPLE_WORKOUT_VIDEOS.find((v) => v.id === rule.videoId);
    }
  }

  const videoIdByMuscle = VIDEO_BY_MUSCLE[exercise.muscleGroup];
  const sampleByMuscle = videoIdByMuscle ? SAMPLE_WORKOUT_VIDEOS.find((v) => v.id === videoIdByMuscle) : undefined;
  if (sampleByMuscle) return sampleByMuscle;

  return SAMPLE_WORKOUT_VIDEOS[hashSlot(exercise.id, SAMPLE_WORKOUT_VIDEOS.length)];
}
