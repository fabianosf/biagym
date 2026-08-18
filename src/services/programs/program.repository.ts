import type { Category, ProgramDetail, ProgramSummary } from '@/domain';

import { getSupabaseClient } from '../supabase';
import type { CategoryRow, LessonRow, ProgramRow, WeekRow } from '../supabase/types';
import {
  DataServiceError,
  assertSupabaseConfigured,
  mapCategoryRow,
  mapLessonRow,
  mapProgramRow,
  mapSupabaseDataError,
  mapWeekRow,
} from '../shared';
import { isSupabaseConfigured } from '../supabase/client';
import type { ListProgramsFilters, ProgramLessonStats } from './program.types';

async function fetchCategoriesByProgramId(programId: string): Promise<Category[]> {
  const supabase = getSupabaseClient();
  const { data: links, error: linksError } = await supabase
    .from('program_categories')
    .select('category_id')
    .eq('program_id', programId);

  if (linksError) {
    throw mapSupabaseDataError(linksError);
  }

  const categoryIds = (links ?? []).map((link) => link.category_id);

  if (categoryIds.length === 0) {
    return [];
  }

  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .in('id', categoryIds);

  if (categoriesError) {
    throw mapSupabaseDataError(categoriesError);
  }

  return ((categories ?? []) as CategoryRow[]).map(mapCategoryRow);
}

async function fetchCategoryIdsByProgramIds(
  programIds: readonly string[],
): Promise<Map<string, string[]>> {
  if (programIds.length === 0) {
    return new Map();
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('program_categories')
    .select('program_id, category_id')
    .in('program_id', [...programIds]);

  if (error) {
    throw mapSupabaseDataError(error);
  }

  const map = new Map<string, string[]>();

  for (const row of data ?? []) {
    const current = map.get(row.program_id) ?? [];
    current.push(row.category_id);
    map.set(row.program_id, current);
  }

  return map;
}

async function fetchCategoriesByIds(categoryIds: readonly string[]): Promise<Map<string, Category>> {
  if (categoryIds.length === 0) {
    return new Map();
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from('categories').select('*').in('id', categoryIds);

  if (error) {
    throw mapSupabaseDataError(error);
  }

  return new Map(((data ?? []) as CategoryRow[]).map((row) => [row.id, mapCategoryRow(row)]));
}

function buildCategoriesByProgram(
  categoryIdsByProgram: Map<string, string[]>,
  categoriesById: Map<string, Category>,
): Map<string, Category[]> {
  const result = new Map<string, Category[]>();
  for (const [programId, categoryIds] of categoryIdsByProgram) {
    result.set(
      programId,
      categoryIds.map((id) => categoriesById.get(id)).filter((c): c is Category => Boolean(c)),
    );
  }
  return result;
}

export async function countLessonsByProgramIds(
  programIds: readonly string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (programIds.length === 0) {
    return map;
  }

  assertSupabaseConfigured(isSupabaseConfigured());
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('lessons')
    .select('program_id')
    .in('program_id', [...programIds]);

  if (error) {
    throw mapSupabaseDataError(error);
  }

  for (const row of data ?? []) {
    map.set(row.program_id, (map.get(row.program_id) ?? 0) + 1);
  }

  return map;
}

async function fetchLessonStats(
  programIds: readonly string[],
): Promise<Map<string, ProgramLessonStats>> {
  const map = new Map<string, ProgramLessonStats>();

  if (programIds.length === 0) {
    return map;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('lessons')
    .select('program_id, duration_seconds')
    .in('program_id', [...programIds]);

  if (error) {
    throw mapSupabaseDataError(error);
  }

  for (const row of data ?? []) {
    const current = map.get(row.program_id) ?? {
      programId: row.program_id,
      totalLessons: 0,
      totalDurationSeconds: 0,
    };

    const durationSeconds = Number(row.duration_seconds);
    map.set(row.program_id, {
      programId: row.program_id,
      totalLessons: current.totalLessons + 1,
      totalDurationSeconds:
        current.totalDurationSeconds + (Number.isFinite(durationSeconds) ? durationSeconds : 0),
    });
  }

  return map;
}

function applyProgramFilters(
  query: ReturnType<ReturnType<typeof getSupabaseClient>['from']>,
  filters: ListProgramsFilters,
) {
  let next = query;

  if (filters.publishedOnly !== false) {
    next = next.eq('is_published', true);
  }

  if (filters.level) {
    next = next.eq('level', filters.level);
  }

  if (filters.search?.trim()) {
    next = next.ilike('title', `%${filters.search.trim()}%`);
  }

  return next;
}

export async function listPrograms(
  filters: ListProgramsFilters = {},
): Promise<ProgramSummary[]> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  let query = supabase
    .from('programs')
    .select('*')
    .order('created_at', { ascending: false });

  query = applyProgramFilters(query, filters);

  const { data, error } = await query;

  if (error) {
    throw mapSupabaseDataError(error);
  }

  const rows = (data ?? []) as ProgramRow[];
  let programIds = rows.map((row) => row.id);

  if (filters.categoryId) {
    const supabaseClient = getSupabaseClient();
    const { data: links, error: linksError } = await supabaseClient
      .from('program_categories')
      .select('program_id')
      .eq('category_id', filters.categoryId);

    if (linksError) {
      throw mapSupabaseDataError(linksError);
    }

    const allowedIds = new Set((links ?? []).map((link: { program_id: string }) => link.program_id));
    programIds = programIds.filter((id) => allowedIds.has(id));
  }

  const filteredRows = rows.filter((row) => programIds.includes(row.id));
  const categoryMap = await fetchCategoryIdsByProgramIds(filteredRows.map((row) => row.id));
  const statsMap = await fetchLessonStats(filteredRows.map((row) => row.id));

  const allCategoryIds = [...new Set([...categoryMap.values()].flat())];
  const categoriesById = await fetchCategoriesByIds(allCategoryIds);
  const categoriesByProgram = buildCategoriesByProgram(categoryMap, categoriesById);

  return filteredRows.map((row) => {
    const stats = statsMap.get(row.id);
    const categoryIds = categoryMap.get(row.id) ?? [];

    return {
      ...mapProgramRow(row, categoryIds),
      categories: categoriesByProgram.get(row.id) ?? [],
      totalLessons: stats?.totalLessons ?? 0,
      totalDurationSeconds: stats?.totalDurationSeconds ?? 0,
    };
  });
}

export async function getProgramById(programId: string): Promise<ProgramDetail | null> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data: programData, error: programError } = await supabase
    .from('programs')
    .select('*')
    .eq('id', programId)
    .maybeSingle();

  if (programError) {
    throw mapSupabaseDataError(programError);
  }

  if (!programData) {
    return null;
  }

  const programRow = programData as ProgramRow;
  const categories = await fetchCategoriesByProgramId(programId);
  const categoryIds = categories.map((category) => category.id);

  const { data: weeksData, error: weeksError } = await supabase
    .from('weeks')
    .select('*')
    .eq('program_id', programId)
    .order('week_number', { ascending: true });

  if (weeksError) {
    throw mapSupabaseDataError(weeksError);
  }

  const weekRows = (weeksData ?? []) as WeekRow[];

  const { data: lessonsData, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .eq('program_id', programId)
    .order('sort_order', { ascending: true });

  if (lessonsError) {
    throw mapSupabaseDataError(lessonsError);
  }

  const lessonRows = (lessonsData ?? []) as LessonRow[];
  const lessonsByWeek = new Map<string, ReturnType<typeof mapLessonRow>[]>();
  const orphanLessons: ReturnType<typeof mapLessonRow>[] = [];

  for (const lessonRow of lessonRows) {
    try {
      const mapped = mapLessonRow(lessonRow);
      if (!lessonRow.week_id) {
        orphanLessons.push(mapped);
        continue;
      }

      const current = lessonsByWeek.get(lessonRow.week_id) ?? [];
      current.push(mapped);
      lessonsByWeek.set(lessonRow.week_id, current);
    } catch {
      continue;
    }
  }

  const weeks = weekRows.map((weekRow) => ({
    week: mapWeekRow(weekRow),
    lessons: lessonsByWeek.get(weekRow.id) ?? [],
  }));

  if (orphanLessons.length > 0) {
    weeks.push({
      week: {
        id: `${programId}-unassigned`,
        programId,
        weekNumber: weeks.length + 1,
        title: 'Outras aulas',
      },
      lessons: orphanLessons,
    });
  }

  return {
    program: {
      ...mapProgramRow(programRow, categoryIds),
      categories,
    },
    weeks,
  };
}

export async function countLessonsByProgramId(programId: string): Promise<number> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { count, error } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .eq('program_id', programId);

  if (error) {
    throw mapSupabaseDataError(error);
  }

  return count ?? 0;
}

export async function getLessonById(lessonId: string) {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .maybeSingle();

  if (error) {
    throw mapSupabaseDataError(error);
  }

  if (!data) {
    return null;
  }

  return mapLessonRow(data as LessonRow);
}

export async function listProgramsByIds(programIds: readonly string[]): Promise<ProgramSummary[]> {
  if (programIds.length === 0) {
    return [];
  }

  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .in('id', [...programIds])
    .order('created_at', { ascending: false });

  if (error) {
    throw mapSupabaseDataError(error);
  }

  const rows = (data ?? []) as ProgramRow[];
  const categoryMap = await fetchCategoryIdsByProgramIds(rows.map((row) => row.id));
  const statsMap = await fetchLessonStats(rows.map((row) => row.id));

  const allCategoryIds = [...new Set([...categoryMap.values()].flat())];
  const categoriesById = await fetchCategoriesByIds(allCategoryIds);
  const categoriesByProgram = buildCategoriesByProgram(categoryMap, categoriesById);

  return rows.map((row) => {
    const stats = statsMap.get(row.id);

    return {
      ...mapProgramRow(row, categoryMap.get(row.id) ?? []),
      categories: categoriesByProgram.get(row.id) ?? [],
      totalLessons: stats?.totalLessons ?? 0,
      totalDurationSeconds: stats?.totalDurationSeconds ?? 0,
    };
  });
}

export async function assertProgramExists(programId: string): Promise<ProgramRow> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('id', programId)
    .maybeSingle();

  if (error) {
    throw mapSupabaseDataError(error);
  }

  if (!data) {
    throw new DataServiceError('not_found');
  }

  return data as ProgramRow;
}
