import type { EntityId, ISODateString } from '../shared';

export interface UserProgress {
  readonly id: EntityId;
  readonly userId: EntityId;
  readonly programId: EntityId;
  readonly completedLessonIds: readonly EntityId[];
  readonly percentComplete: number;
  readonly lastAccessedAt: ISODateString;
  readonly lastLessonId?: EntityId;
  readonly startedAt: ISODateString;
  readonly completedAt?: ISODateString;
}

export interface CompletionHistoryEntry {
  readonly id: EntityId;
  readonly userId: EntityId;
  readonly programId: EntityId;
  readonly lessonId: EntityId;
  readonly completedAt: ISODateString;
}

export interface AccessGrant {
  readonly id: EntityId;
  readonly userId: EntityId;
  readonly programId: EntityId;
  readonly grantedBy: EntityId;
  readonly grantedAt: ISODateString;
  readonly expiresAt?: ISODateString;
}

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';
