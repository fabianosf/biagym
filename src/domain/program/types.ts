import type { EntityId, Timestamps } from '../shared';

export type ProgramLevel = 'iniciante' | 'intermediário' | 'avançado';

export const PROGRAM_LEVELS: readonly ProgramLevel[] = ['iniciante', 'intermediário', 'avançado'];

export interface Category {
  readonly id: EntityId;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
}

export interface Program extends Timestamps {
  readonly id: EntityId;
  readonly title: string;
  readonly slug: string;
  readonly description: string;
  readonly coverUrl: string;
  readonly trainerName: string;
  readonly level: ProgramLevel;
  readonly durationWeeks: number;
  readonly categoryIds: readonly EntityId[];
  readonly isPublished: boolean;
}

export interface Week {
  readonly id: EntityId;
  readonly programId: EntityId;
  readonly weekNumber: number;
  readonly title?: string;
}

export interface Lesson {
  readonly id: EntityId;
  readonly programId: EntityId;
  readonly weekId: EntityId;
  readonly title: string;
  readonly description?: string;
  readonly videoUrl: string;
  readonly durationSeconds: number;
  readonly order: number;
  readonly isFreePreview?: boolean;
}
