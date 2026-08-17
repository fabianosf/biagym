export type {
  AccessGrant,
  CompletionHistoryEntry,
  ProgressStatus,
  UserProgress,
} from './types';

export type {
  CompleteLessonInput,
  CreateAccessGrantInput,
  RevokeAccessGrantInput,
  StartProgressInput,
  TouchLessonAccessInput,
  UpdateProgressInput,
} from './dto';

export type {
  AccessGrantWithContext,
  ProgramWithProgress,
  StudentProgressOverview,
  UserProgramAccess,
} from './composites';

export {
  buildProgressAfterLessonAccess,
  buildProgressAfterLessonComplete,
  calculatePercentComplete,
  clampPercentComplete,
  createInitialProgress,
  deriveProgressStatus,
  hasProgramAccess,
  isAccessGrantActive,
  isLessonCompleted,
  mergeCompletedLessonIds,
  mergeRemoteProgress,
  unionCompletedLessonIds,
} from './rules';
