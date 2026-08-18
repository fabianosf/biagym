export {
  LESSON_VIDEOS_BUCKET,
  deleteLessonVideoByUrl,
  resolveLessonVideoPlayableUrl,
  uploadExerciseVideo,
  uploadLessonVideo,
} from './video.storage';
export type { UploadLessonVideoInput } from './video.storage';
export { BODY_PROGRESS_BUCKET, getBodyPhotoPlayableUrls, uploadBodyPhoto } from './body.storage';
export type { UploadBodyPhotoInput } from './body.storage';
export { AVATAR_BUCKET, uploadAvatarPhoto } from './avatar.storage';
export type { UploadAvatarPhotoInput } from './avatar.storage';
export { PRODUCT_IMAGE_BUCKET, uploadProductImage } from './product.storage';
export type { UploadProductImageInput } from './product.storage';
export { PROGRAM_COVER_BUCKET, uploadProgramCover } from './program-cover.storage';
export type { UploadProgramCoverInput } from './program-cover.storage';
export {
  MESSAGE_ATTACHMENT_BUCKET,
  getMessageAttachmentPlayableUrls,
  uploadMessageAttachment,
} from './message-attachment.storage';
export type { UploadMessageAttachmentInput } from './message-attachment.storage';
export { resolveSampleWorkoutVideo, getSampleWorkoutVideo } from './sample-video.asset';

