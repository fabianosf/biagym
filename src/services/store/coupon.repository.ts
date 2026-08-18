import type { Coupon, CreateCouponInput } from '@/domain/store';

import { assertSupabaseConfigured, DataServiceError, mapSupabaseDataError } from '../shared';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase';
import type { CouponRow } from '../supabase/types';

function mapCouponRow(row: CouponRow): Coupon {
  return {
    id: row.id,
    code: row.code,
    discountPercent: row.discount_percent,
    description: row.description ?? undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export async function listCoupons(): Promise<Coupon[]> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw mapSupabaseDataError(error);
  }

  return ((data ?? []) as CouponRow[]).map(mapCouponRow);
}

export async function createCoupon(input: CreateCouponInput): Promise<Coupon> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const code = input.code.trim().toUpperCase();
  if (code.length < 3) {
    throw new DataServiceError('validation_error', undefined, 'Informe um código de cupom válido.');
  }

  if (input.discountPercent < 1 || input.discountPercent > 100) {
    throw new DataServiceError('validation_error', undefined, 'O desconto deve ser entre 1% e 100%.');
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('coupons')
    .insert({
      code,
      discount_percent: input.discountPercent,
      description: input.description ?? null,
      created_by: input.createdBy,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw mapSupabaseDataError(error ?? { message: 'Não foi possível salvar o cupom.' });
  }

  return mapCouponRow(data as CouponRow);
}

export async function deleteCoupon(couponId: string): Promise<void> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { error } = await supabase.from('coupons').delete().eq('id', couponId);

  if (error) {
    throw mapSupabaseDataError(error);
  }
}
