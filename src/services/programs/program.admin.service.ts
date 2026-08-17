import type { ProgramDetail, ProgramSummary } from '@/domain';
import type {
  CreateLessonInput,
  CreateProgramInput,
  CreateWeekInput,
  UpdateLessonInput,
  UpdateProgramInput,
} from '@/domain/program';

import { deleteLessonVideoByUrl } from '../storage/video.storage';
import { getSupabaseClient } from '../supabase';
import { isSupabaseConfigured } from '../supabase/client';
import type { ProgramRow } from '../supabase/types';
import {
  assertSupabaseConfigured,
  mapSupabaseDataError,
} from '../shared';
import {
  createLesson,
  deleteLesson,
  getLessonById,
  getNextLessonOrder,
  listLessonsByProgramId,
  updateLesson,
} from './lesson.repository';
import {
  assertProgramExists,
  getProgramById,
  listPrograms,
} from './program.repository';
import { createProgram } from './program.service';
import {
  createWeek,
  deleteWeek,
  listWeeksByProgramId,
  updateWeek,
} from './week.repository';

export async function listAdminPrograms(): Promise<ProgramSummary[]> {
  return listPrograms({ publishedOnly: false });
}

export async function getAdminProgramDetail(programId: string): Promise<ProgramDetail | null> {
  return getProgramById(programId);
}

export async function adminCreateProgram(input: CreateProgramInput) {
  const program = await createProgram(input);

  for (let weekNumber = 1; weekNumber <= input.durationWeeks; weekNumber += 1) {
    try {
      await createWeek({
        programId: program.id,
        weekNumber,
        title: `Semana ${weekNumber}`,
      });
    } catch {
      // Semana já existente — segue o fluxo de criação.
    }
  }

  return program;
}

export async function adminUpdateProgram(
  programId: string,
  input: UpdateProgramInput,
): Promise<void> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('programs')
    .update({
      title: input.title,
      slug: input.slug,
      description: input.description,
      cover_url: input.coverUrl,
      trainer_name: input.trainerName,
      level: input.level,
      duration_weeks: input.durationWeeks,
      is_published: input.isPublished,
    })
    .eq('id', programId);

  if (error) {
    throw mapSupabaseDataError(error);
  }

  if (input.categoryIds) {
    const { error: deleteError } = await supabase
      .from('program_categories')
      .delete()
      .eq('program_id', programId);

    if (deleteError) {
      throw mapSupabaseDataError(deleteError);
    }

    if (input.categoryIds.length > 0) {
      const { error: insertError } = await supabase.from('program_categories').insert(
        input.categoryIds.map((categoryId) => ({
          program_id: programId,
          category_id: categoryId,
        })),
      );

      if (insertError) {
        throw mapSupabaseDataError(insertError);
      }
    }
  }
}

export async function adminSetProgramPublished(
  programId: string,
  isPublished: boolean,
): Promise<void> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('programs')
    .update({ is_published: isPublished })
    .eq('id', programId);

  if (error) {
    throw mapSupabaseDataError(error);
  }
}

export async function adminCreateWeek(input: CreateWeekInput) {
  await assertProgramExists(input.programId);
  return createWeek(input);
}

export async function adminUpdateWeek(
  weekId: string,
  input: Parameters<typeof updateWeek>[1],
) {
  return updateWeek(weekId, input);
}

export async function adminDeleteWeek(weekId: string) {
  return deleteWeek(weekId);
}

export async function adminCreateLesson(input: CreateLessonInput) {
  await assertProgramExists(input.programId);
  return createLesson(input);
}

export async function adminUpdateLesson(lessonId: string, input: UpdateLessonInput) {
  return updateLesson(lessonId, input);
}

export async function adminDeleteLesson(lessonId: string) {
  const lesson = await getLessonById(lessonId);

  if (lesson?.videoUrl) {
    await deleteLessonVideoByUrl(lesson.videoUrl).catch(() => undefined);
  }

  return deleteLesson(lessonId);
}

export async function adminGetNextLessonOrder(weekId: string) {
  return getNextLessonOrder(weekId);
}

export async function adminListWeeks(programId: string) {
  return listWeeksByProgramId(programId);
}

export async function adminListLessons(programId: string) {
  return listLessonsByProgramId(programId);
}

export async function adminGetProgramRow(programId: string): Promise<ProgramRow> {
  return assertProgramExists(programId);
}
