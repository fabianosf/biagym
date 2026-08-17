import type { EntityId, ISODateString } from '../shared';

export interface StartProgressInput {
  readonly userId: EntityId;
  readonly programId: EntityId;
  readonly startedAt: ISODateString;
}

export interface UpdateProgressInput {
  readonly completedLessonIds: readonly EntityId[];
  readonly percentComplete: number;
  readonly lastAccessedAt: ISODateString;
  readonly completedAt?: ISODateString | null;
}

export interface CompleteLessonInput {
  readonly userId: EntityId;
  readonly programId: EntityId;
  readonly lessonId: EntityId;
  readonly totalLessons: number;
  readonly accessedAt: ISODateString;
}

export interface TouchLessonAccessInput {
  readonly userId: EntityId;
  readonly programId: EntityId;
  readonly lessonId: EntityId;
  readonly accessedAt: ISODateString;
}

export interface CreateAccessGrantInput {
  readonly userId: EntityId;
  readonly programId: EntityId;
  readonly grantedBy: EntityId;
  readonly grantedAt: ISODateString;
  readonly expiresAt?: ISODateString;
}

export interface RevokeAccessGrantInput {
  readonly grantId: EntityId;
  readonly revokedAt: ISODateString;
}
