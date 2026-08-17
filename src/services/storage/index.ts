export {
  LESSON_VIDEOS_BUCKET,
  deleteLessonVideoByUrl,
  uploadExerciseVideo,
  uploadLessonVideo,
} from './video.storage';
export type { UploadLessonVideoInput } from './video.storage';
export { BODY_PROGRESS_BUCKET, uploadBodyPhoto } from './body.storage';
export type { UploadBodyPhotoInput } from './body.storage';
export { resolveSampleWorkoutVideo, getSampleWorkoutVideo } from './sample-video.asset';

