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

export function pickSampleWorkoutVideoForExercise(
  exercise?: ExerciseMediaInput | null,
): SampleWorkoutVideo | undefined {
  if (!exercise || SAMPLE_WORKOUT_VIDEOS.length === 0) {
    return undefined;
  }

  const normalized = normalizeExerciseName(exercise.name ?? '');
  const byTitle = SAMPLE_WORKOUT_VIDEOS.find((sample) =>
    normalized.includes(normalizeExerciseName(sample.title)),
  );

  if (byTitle) {
    return byTitle;
  }

  if (/(agach|squat|goblet|afundo|lunge)/.test(normalized)) {
    return SAMPLE_WORKOUT_VIDEOS.find((sample) => sample.id === 'video2');
  }

  if (/(prancha|plank|core|abdominal|crunch)/.test(normalized)) {
    return SAMPLE_WORKOUT_VIDEOS.find((sample) => sample.id === 'video3');
  }

  if (/(remada|row|puxada)/.test(normalized)) {
    return SAMPLE_WORKOUT_VIDEOS.find((sample) => sample.id === 'video4');
  }

  if (/(aquec|mobilidade)/.test(normalized)) {
    return SAMPLE_WORKOUT_VIDEOS.find((sample) => sample.id === 'video1');
  }

  if (/(condicion|cardio|circuito)/.test(normalized)) {
    return SAMPLE_WORKOUT_VIDEOS.find((sample) => sample.id === 'video5');
  }

  const byMuscle: Partial<Record<MuscleGroup, string>> = {
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

  const muscleSampleId = byMuscle[exercise.muscleGroup];
  const byMuscleGroup = muscleSampleId
    ? SAMPLE_WORKOUT_VIDEOS.find((sample) => sample.id === muscleSampleId)
    : undefined;

  if (byMuscleGroup) {
    return byMuscleGroup;
  }

  return SAMPLE_WORKOUT_VIDEOS[hashSlot(exercise.id, SAMPLE_WORKOUT_VIDEOS.length)];
}
