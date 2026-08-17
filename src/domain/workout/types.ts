export const MUSCLE_GROUPS = [
  'peito',
  'costas',
  'ombros',
  'biceps',
  'triceps',
  'pernas',
  'gluteos',
  'core',
  'cardio',
  'corpo_todo',
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  peito: 'Peito',
  costas: 'Costas',
  ombros: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  pernas: 'Pernas',
  gluteos: 'Glúteos',
  core: 'Core',
  cardio: 'Cardio',
  corpo_todo: 'Corpo todo',
};

export interface Exercise {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly muscleGroup: MuscleGroup;
  readonly videoUrl: string;
  readonly thumbnailUrl?: string;
  readonly createdBy: string;
  readonly createdAt: string;
}

export interface WorkoutExercise {
  readonly id: string;
  readonly planId: string;
  readonly exercise: Exercise;
  readonly sets: number;
  readonly reps: string;
  readonly loadKg?: number;
  readonly restSeconds: number;
  readonly notes?: string;
  readonly sortOrder: number;
}

export interface TrainingPlan {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly description?: string;
  readonly isPublished: boolean;
  readonly sortOrder: number;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly exercises: readonly WorkoutExercise[];
}

export interface TrainingPlanSummary {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly description?: string;
  readonly isPublished: boolean;
  readonly sortOrder: number;
  readonly exerciseCount: number;
}

export interface CreateExerciseInput {
  readonly name: string;
  readonly description?: string;
  readonly muscleGroup: MuscleGroup;
  readonly videoUrl: string;
  readonly thumbnailUrl?: string;
  readonly createdBy: string;
}

export interface UpdateExerciseInput {
  readonly name: string;
  readonly description?: string;
  readonly muscleGroup: MuscleGroup;
  readonly videoUrl?: string;
  readonly thumbnailUrl?: string;
}

export interface CreateTrainingPlanInput {
  readonly title: string;
  readonly slug: string;
  readonly description?: string;
  readonly createdBy: string;
  readonly sortOrder?: number;
}

export interface AddWorkoutExerciseInput {
  readonly planId: string;
  readonly exerciseId: string;
  readonly sets: number;
  readonly reps: string;
  readonly loadKg?: number;
  readonly restSeconds: number;
  readonly notes?: string;
  readonly sortOrder?: number;
}

export interface UpdateWorkoutExerciseInput {
  readonly sets: number;
  readonly reps: string;
  readonly loadKg?: number;
  readonly restSeconds: number;
  readonly notes?: string;
  readonly sortOrder?: number;
}

export interface WorkoutSession {
  readonly id: string;
  readonly userId: string;
  readonly planId: string;
  readonly completedExerciseIds: readonly string[];
  readonly completedAt: string;
}

export interface TrainingPlanGrant {
  readonly id: string;
  readonly userId: string;
  readonly planId: string;
  readonly grantedBy: string;
  readonly grantedAt: string;
}
