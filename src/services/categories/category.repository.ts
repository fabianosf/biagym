import type { Category } from '@/domain';

import { getSupabaseClient } from '../supabase/client';
import { isSupabaseConfigured } from '../supabase/client';
import type { CategoryRow } from '../supabase/types';
import {
  assertSupabaseConfigured,
  mapCategoryRow,
  mapSupabaseDataError,
} from '../shared';

export async function listCategories(): Promise<Category[]> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw mapSupabaseDataError(error);
  }

  return ((data ?? []) as CategoryRow[]).map(mapCategoryRow);
}
