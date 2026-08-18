import type { CreateProductInput, Product, UpdateProductInput } from '@/domain/store';

import { assertSupabaseConfigured, mapSupabaseDataError } from '../shared';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase';
import type { ProductRow } from '../supabase/types';

function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    priceCents: row.price_cents,
    imageUrl: row.image_url ?? undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export async function listProducts(): Promise<Product[]> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw mapSupabaseDataError(error);
  }

  return ((data ?? []) as ProductRow[]).map(mapProductRow);
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: input.name,
      description: input.description ?? null,
      price_cents: input.priceCents,
      image_url: input.imageUrl ?? null,
      created_by: input.createdBy,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw mapSupabaseDataError(error ?? { message: 'Não foi possível salvar o produto.' });
  }

  return mapProductRow(data as ProductRow);
}

export async function updateProduct(productId: string, input: UpdateProductInput): Promise<Product> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('products')
    .update({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.priceCents !== undefined ? { price_cents: input.priceCents } : {}),
      ...(input.imageUrl !== undefined ? { image_url: input.imageUrl } : {}),
    })
    .eq('id', productId)
    .select('*')
    .single();

  if (error || !data) {
    throw mapSupabaseDataError(error ?? { message: 'Não foi possível atualizar o produto.' });
  }

  return mapProductRow(data as ProductRow);
}

export async function deleteProduct(productId: string): Promise<void> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const { error } = await supabase.from('products').delete().eq('id', productId);

  if (error) {
    throw mapSupabaseDataError(error);
  }
}
