import type { CreateProgramInput } from '@/domain/program';
import type { CreateAccessGrantInput } from '@/domain/progress';

import {
  createNutritionPlan,
  deleteNutritionPlan,
  listNutritionPlans,
} from '../nutrition';
import {
  createTrainingSlot,
  deleteTrainingSlot,
  listTrainingSlots,
} from '../schedule';
import { listStudentProfiles, searchStudentProfiles } from '../users';
import {
  adminGrantProgramAccess,
  adminListProgramAccessGrants,
  adminRevokeAccessGrant,
  adminSearchStudents,
} from '../access/access.admin.service';
import {
  adminCreateLesson,
  adminCreateProgram,
  adminCreateWeek,
  adminDeleteLesson,
  adminDeleteWeek,
  adminGetNextLessonOrder,
  adminListLessons,
  adminListWeeks,
  adminSetProgramPublished,
  adminUpdateLesson,
  adminUpdateProgram,
  adminUpdateWeek,
  getAdminProgramDetail,
  listAdminPrograms,
} from '../programs/program.admin.service';
import { uploadLessonVideo } from '../storage/video.storage';

export {
  adminCreateLesson,
  adminCreateProgram,
  adminCreateWeek,
  adminDeleteLesson,
  adminDeleteWeek,
  adminGetNextLessonOrder,
  adminGrantProgramAccess,
  adminListLessons,
  adminListProgramAccessGrants,
  adminListWeeks,
  adminRevokeAccessGrant,
  adminSearchStudents,
  adminSetProgramPublished,
  adminUpdateLesson,
  adminUpdateProgram,
  adminUpdateWeek,
  getAdminProgramDetail,
  listAdminPrograms,
  listNutritionPlans,
  listStudentProfiles,
  listTrainingSlots,
  searchStudentProfiles,
  uploadLessonVideo,
};

export {
  createNutritionPlan as adminCreateNutritionPlan,
  createTrainingSlot as adminCreateTrainingSlot,
  deleteNutritionPlan as adminDeleteNutritionPlan,
  deleteTrainingSlot as adminDeleteTrainingSlot,
};

export type { AccessGrantWithUser } from '../access/access.admin.service';

export async function adminCreateProgramLegacy(input: CreateProgramInput) {
  return adminCreateProgram(input);
}

export async function adminGrantProgramAccessLegacy(input: CreateAccessGrantInput) {
  return adminGrantProgramAccess(input);
}
