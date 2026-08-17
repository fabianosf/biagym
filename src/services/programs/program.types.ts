import type { EntityId } from '@/domain';
import type { ProgramLevel } from '@/domain/program';

export type ListProgramsFilters = {
  readonly categoryId?: EntityId;
  readonly level?: ProgramLevel;
  readonly search?: string;
  readonly publishedOnly?: boolean;
};

export type ProgramLessonStats = {
  readonly programId: EntityId;
  readonly totalLessons: number;
  readonly totalDurationSeconds: number;
};
