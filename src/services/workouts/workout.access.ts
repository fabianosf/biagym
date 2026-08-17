import type { TrainingPlanGrant } from '@/domain/workout';

import { DataServiceError, assertSupabaseConfigured, mapSupabaseDataError } from '../shared';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase';
import type { TrainingPlanGrantRow } from '../supabase/types';

export async function listTrainingPlanGrants(planId: string): Promise<TrainingPlanGrant[]> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('training_plan_grants')
    .select('*')
    .eq('plan_id', planId)
    .order('granted_at', { ascending: false });

  if (error) {
    throw mapSupabaseDataError(error);
  }

  return ((data ?? []) as TrainingPlanGrantRow[]).map((row) => ({
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id,
    grantedBy: row.granted_by,
    grantedAt: row.granted_at,
  }));
}

export async function grantTrainingPlanAccess(input: {
  userId: string;
  planId: string;
  grantedBy: string;
}): Promise<void> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { error } = await supabase.from('training_plan_grants').insert({
    user_id: input.userId,
    plan_id: input.planId,
    granted_by: input.grantedBy,
  });

  if (error) {
    const message = error.message?.toLowerCase() ?? '';
    if (error.code === '23505' || message.includes('duplicate')) {
      throw new DataServiceError(
        'conflict',
        error,
        'Este aluno já tem acesso a este treino.',
      );
    }
    throw mapSupabaseDataError(error);
  }

  const { error: publishError } = await supabase
    .from('training_plans')
    .update({ is_published: true })
    .eq('id', input.planId);

  if (publishError) {
    throw mapSupabaseDataError(publishError);
  }
}

export async function revokeTrainingPlanAccess(grantId: string): Promise<void> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { error } = await supabase.from('training_plan_grants').delete().eq('id', grantId);

  if (error) {
    throw mapSupabaseDataError(error);
  }
}
