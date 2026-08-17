import type { ProgramDetail, ProgramSummary } from '@/domain';
import type { CreateProgramInput } from '@/domain/program';

import { getSupabaseClient } from '../supabase';
import { isSupabaseConfigured } from '../supabase/client';
import type { ProgramRow } from '../supabase/types';
import {
  assertSupabaseConfigured,
  mapProgramRow,
  mapSupabaseDataError,
} from '../shared';
import {
  assertProgramExists,
  countLessonsByProgramId,
  getProgramById as getProgramByIdFromRepo,
  listPrograms as listProgramsFromRepo,
} from './program.repository';
import type { ListProgramsFilters } from './program.types';

export type ListProgramsOptions = ListProgramsFilters;

export async function listPublishedPrograms(
  filters: ListProgramsOptions = {},
): Promise<ProgramSummary[]> {
  return listProgramsFromRepo({
    ...filters,
    publishedOnly: filters.publishedOnly ?? true,
  });
}

export async function getProgramDetail(programId: string): Promise<ProgramDetail | null> {
  return getProgramByIdFromRepo(programId);
}

export async function createProgram(input: CreateProgramInput): Promise<ProgramSummary> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('programs')
    .insert({
      title: input.title,
      slug: input.slug,
      description: input.description,
      cover_url: input.coverUrl,
      trainer_name: input.trainerName,
      level: input.level,
      duration_weeks: input.durationWeeks,
      is_published: input.isPublished ?? false,
    })
    .select('*')
    .single();

  if (error) {
    throw mapSupabaseDataError(error);
  }

  const programRow = data as ProgramRow;

  if (input.categoryIds.length > 0) {
    const { error: linkError } = await supabase.from('program_categories').insert(
      input.categoryIds.map((categoryId) => ({
        program_id: programRow.id,
        category_id: categoryId,
      })),
    );

    if (linkError) {
      throw mapSupabaseDataError(linkError);
    }
  }

  await assertProgramExists(programRow.id);

  const detail = await getProgramByIdFromRepo(programRow.id);

  if (!detail) {
    throw mapSupabaseDataError({ message: 'Program created but not found' });
  }

  return {
    ...detail.program,
    totalLessons: 0,
    totalDurationSeconds: 0,
  };
}

export async function getProgramLessonCount(programId: string): Promise<number> {
  await assertProgramExists(programId);
  return countLessonsByProgramId(programId);
}

export { mapProgramRow };
