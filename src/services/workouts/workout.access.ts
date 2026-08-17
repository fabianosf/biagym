import type { TrainingPlanGrant } from '@/domain/workout';

import { DataServiceError, assertSupabaseConfigured, mapSupabaseDataError } from '../shared';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase';
import type { TrainingPlanGrantRow } from '../supabase/types';

function mapGrant(row: TrainingPlanGrantRow): TrainingPlanGrant {
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id,
    grantedBy: row.granted_by,
    grantedAt: row.granted_at,
  };
}

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

  return ((data ?? []) as TrainingPlanGrantRow[]).map(mapGrant);
}

export async function listTrainingPlanGrantsForUser(userId: string): Promise<TrainingPlanGrant[]> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('training_plan_grants')
    .select('*')
    .eq('user_id', userId)
    .order('granted_at', { ascending: false });

  if (error) {
    throw mapSupabaseDataError(error);
  }

  return ((data ?? []) as TrainingPlanGrantRow[]).map(mapGrant);
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
      await supabase.from('training_plans').update({ is_published: true }).eq('id', input.planId);
      return;
    }
    if (error.code === '42501' || message.includes('permission denied') || message.includes('row-level security')) {
      throw new DataServiceError(
        'forbidden',
        error,
        'O banco ainda não reconheceu esta conta como admin. Execute supabase/lock-admin-email.sql e toque em Sou admin de novo.',
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

export async function publishTrainingPlanToStudents(input: {
  planId: string;
  studentIds: readonly string[];
  grantedBy: string;
}): Promise<void> {
  const uniqueIds = [...new Set(input.studentIds.filter((id) => id.trim().length > 0))];
  if (uniqueIds.length === 0) {
    throw new DataServiceError(
      'validation_error',
      undefined,
      'Escolha pelo menos um aluno. Sem isso, ninguém vê o treino.',
    );
  }

  for (const userId of uniqueIds) {
    await grantTrainingPlanAccess({
      userId,
      planId: input.planId,
      grantedBy: input.grantedBy,
    });
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
