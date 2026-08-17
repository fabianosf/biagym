export {
  appendCompletionHistoryEntry,
  createPendingActionId,
  enqueuePendingProgressAction,
  getCachedProgramProgress,
  getNextClientSequence,
  listCachedProgramProgress,
  listCompletionHistory,
  listPendingProgressActions,
  removePendingProgressAction,
  setCachedProgramProgress,
  type PendingProgressAction,
} from './progress-local.storage';

export {
  countPendingProgressActions,
  getCompletionHistory,
  getMergedProgramProgress,
  listMergedUserProgress,
  markLessonCompleteWithSync,
  syncPendingProgress,
  touchLessonAccessWithSync,
  type MarkLessonCompleteResult,
  type SyncProgressResult,
  type TouchLessonAccessResult,
} from './progress-sync.service';

export {
  clearStaleLessonDownloads,
  downloadLessonVideo,
  getDownloadedLessonsByProgram,
  getLessonDownloadRecord,
  getLocalLessonVideoUri,
  isLessonDownloaded,
  listLessonDownloads,
  removeLessonDownload,
  subscribeToLessonDownloadProgress,
  type LessonDownloadProgress,
  type LessonDownloadRecord,
} from './video-download.service';
