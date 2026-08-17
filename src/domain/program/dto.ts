import type { EntityId } from '../shared';
import type { ProgramLevel } from './types';

export interface CreateCategoryInput {
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
}

export interface UpdateCategoryInput {
  readonly name?: string;
  readonly slug?: string;
  readonly description?: string | null;
}

export interface CreateProgramInput {
  readonly title: string;
  readonly slug: string;
  readonly description: string;
  readonly coverUrl: string;
  readonly trainerName: string;
  readonly level: ProgramLevel;
  readonly durationWeeks: number;
  readonly categoryIds: readonly EntityId[];
  readonly isPublished?: boolean;
}

export interface UpdateProgramInput {
  readonly title?: string;
  readonly slug?: string;
  readonly description?: string;
  readonly coverUrl?: string;
  readonly trainerName?: string;
  readonly level?: ProgramLevel;
  readonly durationWeeks?: number;
  readonly categoryIds?: readonly EntityId[];
  readonly isPublished?: boolean;
}

export interface CreateWeekInput {
  readonly programId: EntityId;
  readonly weekNumber: number;
  readonly title?: string;
}

export interface UpdateWeekInput {
  readonly weekNumber?: number;
  readonly title?: string | null;
}

export interface CreateLessonInput {
  readonly programId: EntityId;
  readonly weekId: EntityId;
  readonly title: string;
  readonly description?: string;
  readonly videoUrl: string;
  readonly durationSeconds: number;
  readonly order: number;
  readonly isFreePreview?: boolean;
}

export interface UpdateLessonInput {
  readonly weekId?: EntityId;
  readonly title?: string;
  readonly description?: string | null;
  readonly videoUrl?: string;
  readonly durationSeconds?: number;
  readonly order?: number;
  readonly isFreePreview?: boolean;
}
