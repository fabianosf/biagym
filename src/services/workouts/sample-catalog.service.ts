import type { TrainingPlan } from '@/domain/workout';

import { SAMPLE_WORKOUT_VIDEOS } from '@/shared/constants/sample-workout-videos';
import { isPlayableVideoUrl } from '@/shared/utils';

import { DataServiceError } from '../shared';
import { resolveSampleWorkoutVideo } from '../storage/sample-video.asset';
import { uploadExerciseVideo } from '../storage/video.storage';
import { createExercise, listExercises, updateExercise } from './exercise.repository';
import {
  addWorkoutExercise,
  createTrainingPlan,
  getTrainingPlan,
  listTrainingPlans,
  updateTrainingPlan,
} from './workout.repository';

export type SampleCatalogResult = {
  exerciseCount: number;
  planTitles: readonly string[];
};

async function ensureSampleExercises(createdBy: string): Promise<Map<string, string>> {
  const existing = await listExercises();
  const idsBySampleId = new Map<string, string>();

  for (const sample of SAMPLE_WORKOUT_VIDEOS) {
    let current = existing.find((exercise) => exercise.name === sample.title);

    if (!current) {
      current = await createExercise({
        name: sample.title,
        description: sample.description,
        muscleGroup: sample.muscleGroup,
        videoUrl: 'pending-upload',
        createdBy,
      });
    }

    if (!isPlayableVideoUrl(current.videoUrl)) {
      const file = await resolveSampleWorkoutVideo(sample);
      const videoUrl = await uploadExerciseVideo({
        exerciseId: current.id,
        fileUri: file.uri,
        mimeType: file.mimeType,
        fileName: file.name,
      });
      await updateExercise(current.id, {
        name: current.name,
        description: current.description,
        muscleGroup: current.muscleGroup,
        videoUrl,
      });
    }

    idsBySampleId.set(sample.id, current.id);
  }

  return idsBySampleId;
}

async function ensurePlanWithExercises(input: {
  createdBy: string;
  title: string;
  slug: string;
  description: string;
  sortOrder: number;
  sampleIds: readonly string[];
  exerciseIds: Map<string, string>;
}): Promise<TrainingPlan> {
  const plans = await listTrainingPlans();
  let plan = plans.find((item) => item.slug === input.slug || item.title === input.title);

  let detail: TrainingPlan;
  if (!plan) {
    detail = await createTrainingPlan({
      title: input.title,
      slug: input.slug,
      description: input.description,
      createdBy: input.createdBy,
      sortOrder: input.sortOrder,
    });
  } else {
    await updateTrainingPlan(plan.id, {
      title: input.title,
      description: input.description,
      isPublished: plan.isPublished,
      sortOrder: input.sortOrder,
    });
    const loaded = await getTrainingPlan(plan.id);
    if (!loaded) {
      throw new DataServiceError(
        'not_found',
        undefined,
        'Não foi possível abrir o treino de exemplo.',
      );
    }
    detail = loaded;
  }

  const alreadyLinked = new Set(detail.exercises.map((item) => item.exercise.id));

  for (const [index, sampleId] of input.sampleIds.entries()) {
    const exerciseId = input.exerciseIds.get(sampleId);
    const sample = SAMPLE_WORKOUT_VIDEOS.find((item) => item.id === sampleId);
    if (!exerciseId || !sample || alreadyLinked.has(exerciseId)) {
      continue;
    }

    await addWorkoutExercise({
      planId: detail.id,
      exerciseId,
      sets: sample.sets,
      reps: sample.reps,
      loadKg: sample.loadKg,
      restSeconds: sample.restSeconds,
      sortOrder: index,
    });
    alreadyLinked.add(exerciseId);
  }

  return detail;
}

export async function bootstrapSampleGymCatalog(createdBy: string): Promise<SampleCatalogResult> {
  const exerciseIds = await ensureSampleExercises(createdBy);

  await ensurePlanWithExercises({
    createdBy,
    title: 'Treino A',
    slug: 'treino-a',
    description: 'Inferiores e aquecimento — 40 a 50 min.',
    sortOrder: 1,
    sampleIds: ['video1', 'video2'],
    exerciseIds,
  });

  await ensurePlanWithExercises({
    createdBy,
    title: 'Treino B',
    slug: 'treino-b',
    description: 'Core e puxar — 40 min.',
    sortOrder: 2,
    sampleIds: ['video3', 'video4'],
    exerciseIds,
  });

  return {
    exerciseCount: exerciseIds.size,
    planTitles: ['Treino A', 'Treino B'],
  };
}
