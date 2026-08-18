import type { AuthSession, AuthUser } from '@/domain';
import { isAuthorizedAdminEmail, type SignInCredentials, type SignUpInput } from '@/domain/auth';
import type { CompleteOnboardingInput } from '@/domain/student';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

import { APP_SCHEME } from '@/shared/constants/app';
import { getDisplayPersonName, parseRequiredFullName } from '@/shared/utils/person-name';
import { parseRequiredWhatsAppPhone } from '@/shared/utils/phone';

import { captureException } from '../observability/sentry.service';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase';
import type { ProfileRow } from '../supabase/types';
import { DATA_FETCH_TIMEOUT_MS, withTimeout } from '../shared/with-timeout';
import {
  AuthServiceError,
  mapSupabaseAuthError,
} from './auth.errors';
import {
  mapSupabaseSessionToAuthSession,
  mapSupabaseUserToAuthUser,
} from './auth.mapper';

const PROFILE_BASE_COLUMNS = 'id, name, email, role, avatar_url, created_at, updated_at';
const PROFILE_COACHING_COLUMNS =
  `${PROFILE_BASE_COLUMNS}, weight_kg, height_cm, age, goal, onboarding_completed_at`;
const PROFILE_COACHING_COLUMNS_WITH_PHONE = `${PROFILE_COACHING_COLUMNS}, phone`;

function isMissingColumnError(error: { message?: string; code?: string } | null): boolean {
  const message = error?.message?.toLowerCase() ?? '';
  return (
    message.includes('does not exist') ||
    message.includes('schema cache') ||
    message.includes('could not find') ||
    error?.code === 'PGRST204'
  );
}

async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const supabase = getSupabaseClient();
  const withPhone = await supabase
    .from('profiles')
    .select(PROFILE_COACHING_COLUMNS_WITH_PHONE)
    .eq('id', userId)
    .maybeSingle();

  const fullResult =
    withPhone.error && isMissingColumnError(withPhone.error)
      ? await supabase
          .from('profiles')
          .select(PROFILE_COACHING_COLUMNS)
          .eq('id', userId)
          .maybeSingle()
      : withPhone;

  const source =
    fullResult.error && isMissingColumnError(fullResult.error)
      ? await supabase
          .from('profiles')
          .select(PROFILE_BASE_COLUMNS)
          .eq('id', userId)
          .maybeSingle()
      : fullResult;

  if (source.error || !source.data) {
    return null;
  }

  const row = source.data as Partial<ProfileRow> &
    Pick<ProfileRow, 'id' | 'name' | 'email' | 'role' | 'created_at' | 'updated_at'>;
  const coachingReady = !fullResult.error;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatar_url: row.avatar_url ?? null,
    push_notifications_enabled: row.push_notifications_enabled ?? false,
    expo_push_token: row.expo_push_token ?? null,
    push_platform: row.push_platform ?? null,
    push_token_updated_at: row.push_token_updated_at ?? null,
    weight_kg: coachingReady ? (row.weight_kg ?? null) : null,
    height_cm: coachingReady ? (row.height_cm ?? null) : null,
    age: coachingReady ? (row.age ?? null) : null,
    goal: coachingReady ? (row.goal ?? null) : null,
    onboarding_completed_at: coachingReady
      ? (row.onboarding_completed_at ?? null)
      : 'schema-pending',
    phone: row.phone ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function buildAuthSession(session: Session): Promise<AuthSession> {
  const profile = await fetchProfile(session.user.id);
  const user = mapSupabaseUserToAuthUser(session.user, profile);
  return mapSupabaseSessionToAuthSession(session, user);
}

function assertSupabaseConfigured(): void {
  if (!isSupabaseConfigured()) {
    throw new AuthServiceError('configuration_error');
  }
}

export async function signInWithEmail(
  credentials: SignInCredentials,
): Promise<AuthSession> {
  assertSupabaseConfigured();

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email.trim(),
    password: credentials.password,
  });

  if (error) {
    throw mapSupabaseAuthError(error);
  }

  if (!data.session) {
    throw new AuthServiceError('session_expired');
  }

  return buildAuthSession(data.session);
}

function requireFullPersonName(raw: string): string {
  const parsed = parseRequiredFullName(raw);
  if ('error' in parsed) {
    throw new AuthServiceError('unknown', undefined, parsed.error);
  }
  return parsed.name;
}

export async function signUpWithEmail(input: SignUpInput): Promise<AuthSession | null> {
  assertSupabaseConfigured();

  const supabase = getSupabaseClient();
  const email = input.email.trim();
  const name = requireFullPersonName(input.name);
  const parsedPhone = input.phone ? parseRequiredWhatsAppPhone(input.phone) : { phone: undefined };
  if ('error' in parsedPhone) {
    throw new AuthServiceError('unknown', undefined, parsedPhone.error);
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        name,
        full_name: name,
        role: 'student',
        phone: parsedPhone.phone,
      },
    },
  });

  if (error) {
    throw mapSupabaseAuthError(error);
  }

  if (!data.user) {
    throw new AuthServiceError('unknown');
  }

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: data.user.id,
      name,
      email,
      role: 'student',
      ...(parsedPhone.phone ? { phone: parsedPhone.phone } : {}),
    },
    { onConflict: 'id' },
  );

  if (profileError) {
    // Cadastro segue mesmo sem perfil persistido no client — o trigger
    // handle_new_user() do banco é a rede de segurança — mas registramos o
    // erro para investigar perfis "fantasma" sem depender de reclamação da aluna.
    captureException(profileError, { flow: 'sign_up_profile_upsert', userId: data.user.id });
  }

  if (!data.session) {
    return null;
  }

  return buildAuthSession(data.session);
}

export async function requestPasswordReset(email: string): Promise<void> {
  assertSupabaseConfigured();

  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${APP_SCHEME}://sign-in`,
  });

  if (error) {
    throw mapSupabaseAuthError(error);
  }
}

export async function signOut(): Promise<void> {
  assertSupabaseConfigured();

  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw mapSupabaseAuthError(error);
  }
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  assertSupabaseConfigured();

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw mapSupabaseAuthError(error);
  }

  if (!data.session) {
    return null;
  }

  return buildAuthSession(data.session);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  assertSupabaseConfigured();

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw mapSupabaseAuthError(error);
  }

  if (!data.user) {
    return null;
  }

  const profile = await fetchProfile(data.user.id);
  return mapSupabaseUserToAuthUser(data.user, profile);
}

const ADMIN_SQL_HINT =
  'No SQL Editor do Supabase, cole e execute o arquivo supabase/lock-admin-email.sql. Depois toque em Sou admin de novo.';

function isMissingRpcError(error: { message?: string; code?: string }): boolean {
  const message = error.message?.toLowerCase() ?? '';
  const code = error.code ?? '';

  return (
    code === 'PGRST202' ||
    code === '42883' ||
    message.includes('could not find the function') ||
    (message.includes('claim_coach_role') &&
      (message.includes('schema cache') ||
        message.includes('does not exist') ||
        message.includes('not found')))
  );
}

function throwPromoteError(
  cause: { message?: string; code?: string } | undefined,
  override?: string,
): never {
  const message = cause?.message?.toLowerCase() ?? '';

  if (
    message.includes('coach_not_allowlisted') ||
    message.includes('not_allowlisted') ||
    message.includes('admin_email_forbidden')
  ) {
    throw new AuthServiceError(
      'unknown',
      cause,
      'Esta conta não está autorizada a acessar o painel administrativo.',
    );
  }

  if (message.includes('not_authenticated') || message.includes('jwt')) {
    throw new AuthServiceError('session_expired', cause);
  }

  if (message.includes('profile_not_found')) {
    throw new AuthServiceError(
      'profile_not_found',
      cause,
      `Não encontramos seu perfil no banco. ${ADMIN_SQL_HINT}`,
    );
  }

  throw new AuthServiceError(
    'unknown',
    cause,
    override ?? `Não foi possível promover esta conta a admin. ${ADMIN_SQL_HINT}`,
  );
}

async function ensureOwnProfileRow(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const nameFromMeta =
    getDisplayPersonName(
      typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : undefined,
      typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : undefined,
    ) ?? 'Aluno';

  await supabase.from('profiles').upsert(
    {
      id: user.id,
      name: nameFromMeta,
      email: user.email ?? `${user.id}@local`,
    },
    { onConflict: 'id', ignoreDuplicates: true },
  );
}

export async function promoteCurrentUserToAdmin(): Promise<AuthSession> {
  assertSupabaseConfigured();

  const supabase = getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new AuthServiceError('session_expired');
  }

  if (!isAuthorizedAdminEmail(user.email)) {
    throw new AuthServiceError(
      'unknown',
      undefined,
      'Esta conta não está autorizada a acessar o painel administrativo.',
    );
  }

  await ensureOwnProfileRow(user);

  try {
    return await withTimeout(
      completeAdminPromotion(user.id),
      DATA_FETCH_TIMEOUT_MS,
      `A promoção a admin demorou demais. ${ADMIN_SQL_HINT}`,
    );
  } catch (error) {
    if (error instanceof AuthServiceError) {
      throw error;
    }

    throw new AuthServiceError(
      'unknown',
      error,
      `Não foi possível promover esta conta a admin. ${ADMIN_SQL_HINT}`,
    );
  }
}

async function completeAdminPromotion(userId: string): Promise<AuthSession> {
  const supabase = getSupabaseClient();
  const rpcResult = await supabase.rpc('claim_coach_role');

  if (rpcResult.error) {
    if (!isMissingRpcError(rpcResult.error)) {
      throwPromoteError(rpcResult.error);
    }

    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userId)
      .select('id, role')
      .maybeSingle();

    if (updateError) {
      throwPromoteError(
        updateError,
        `O banco bloqueou a promoção a admin (permissões/RLS). ${ADMIN_SQL_HINT}`,
      );
    }

    if (!updated || updated.role !== 'admin') {
      throw new AuthServiceError(
        'unknown',
        undefined,
        `A promoção não gravou o papel de admin. ${ADMIN_SQL_HINT}`,
      );
    }
  }

  const promotedProfile =
    rpcResult.data && !rpcResult.error ? (rpcResult.data as ProfileRow) : await fetchProfile(userId);

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new AuthServiceError('session_expired');
  }

  const mapped = mapSupabaseUserToAuthUser(session.user, promotedProfile);

  if (mapped.role !== 'admin') {
    throw new AuthServiceError(
      'unknown',
      undefined,
      `Ainda não há permissão de treinador nesta conta. ${ADMIN_SQL_HINT}`,
    );
  }

  return mapSupabaseSessionToAuthSession(session, mapped);
}

export async function completeStudentOnboarding(
  input: CompleteOnboardingInput,
): Promise<AuthSession> {
  assertSupabaseConfigured();

  const supabase = getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new AuthServiceError('session_expired');
  }

  const name = requireFullPersonName(input.name);
  const parsedPhone = parseRequiredWhatsAppPhone(input.phone);
  if ('error' in parsedPhone) {
    throw new AuthServiceError('unknown', undefined, parsedPhone.error);
  }
  const phone = parsedPhone.phone;
  const weightKg = Math.round(input.weightKg * 100) / 100;
  const heightCm = Math.round(input.heightCm * 10) / 10;
  const age = Math.round(input.age);
  const completedAt = new Date().toISOString();

  await ensureOwnProfileRow(user);

  const coachingPayload = {
    name,
    phone,
    weight_kg: weightKg,
    height_cm: heightCm,
    age,
    goal: input.goal,
    onboarding_completed_at: completedAt,
  };

  const updated = await supabase
    .from('profiles')
    .update(coachingPayload)
    .eq('id', user.id)
    .select(PROFILE_COACHING_COLUMNS_WITH_PHONE)
    .maybeSingle();

  let savedProfile: ProfileRow | null = null;

  if (updated.error && isMissingColumnError(updated.error)) {
    const { error: retryWithoutPhone } = await supabase
      .from('profiles')
      .update({
        name,
        weight_kg: weightKg,
        height_cm: heightCm,
        age,
        goal: input.goal,
        onboarding_completed_at: completedAt,
      })
      .eq('id', user.id);
    if (retryWithoutPhone && isMissingColumnError(retryWithoutPhone)) {
      const { error: nameError } = await supabase.from('profiles').update({ name }).eq('id', user.id);
      if (nameError && !isMissingColumnError(nameError)) {
        throw new AuthServiceError(
          'unknown',
          nameError,
          'Não foi possível salvar seu nome. Tente novamente.',
        );
      }
    } else if (retryWithoutPhone) {
      throw new AuthServiceError(
        'unknown',
        retryWithoutPhone,
        'Não foi possível salvar peso, altura, idade e objetivo. Tente novamente.',
      );
    }
  } else if (updated.error) {
    throw new AuthServiceError(
      'unknown',
      updated.error,
      'Não foi possível salvar peso, altura, idade e objetivo. Tente novamente.',
    );
  } else if (updated.data) {
    savedProfile = await fetchProfile(user.id);
  } else {
    const { error: upsertError } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        name,
        email: user.email ?? `${user.id}@local`,
        role: 'student',
      },
      { onConflict: 'id' },
    );

    if (upsertError && !isMissingColumnError(upsertError)) {
      throw new AuthServiceError(
        'unknown',
        upsertError,
        'Não foi possível salvar seus dados. Tente novamente.',
      );
    }

    const { error: retryError } = await supabase
      .from('profiles')
      .update(coachingPayload)
      .eq('id', user.id);

    if (retryError && !isMissingColumnError(retryError)) {
      throw new AuthServiceError(
        'unknown',
        retryError,
        'Não foi possível salvar peso, altura, idade e objetivo. Tente novamente.',
      );
    }

    savedProfile = await fetchProfile(user.id);
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      name,
      full_name: name,
      weight_kg: weightKg,
      height_cm: heightCm,
      age,
      goal: input.goal,
      phone,
      onboarding_completed: true,
    },
  });

  if (metadataError) {
    throw mapSupabaseAuthError(metadataError);
  }

  await supabase.from('body_logs').insert({
    user_id: user.id,
    weight_kg: weightKg,
    recorded_at: new Date().toISOString().slice(0, 10),
  });

  const {
    data: { user: refreshedUser },
  } = await supabase.auth.getUser();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new AuthServiceError('session_expired');
  }

  const overlayProfile: ProfileRow = {
    id: user.id,
    name,
    email: refreshedUser?.email ?? user.email ?? session.user.email ?? '',
    role: savedProfile?.role ?? 'student',
    avatar_url: savedProfile?.avatar_url ?? null,
    push_notifications_enabled: savedProfile?.push_notifications_enabled ?? false,
    expo_push_token: savedProfile?.expo_push_token ?? null,
    push_platform: savedProfile?.push_platform ?? null,
    push_token_updated_at: savedProfile?.push_token_updated_at ?? null,
    weight_kg: savedProfile?.weight_kg ?? weightKg,
    height_cm: savedProfile?.height_cm ?? heightCm,
    age: savedProfile?.age ?? age,
    goal: savedProfile?.goal ?? input.goal,
    onboarding_completed_at: savedProfile?.onboarding_completed_at ?? completedAt,
    phone: savedProfile?.phone ?? phone,
    created_at: savedProfile?.created_at ?? completedAt,
    updated_at: savedProfile?.updated_at ?? completedAt,
  };

  return mapSupabaseSessionToAuthSession(
    session,
    mapSupabaseUserToAuthUser(refreshedUser ?? user, overlayProfile),
  );
}

export function onAuthStateChange(
  callback: (session: AuthSession | null) => void,
): () => void {
  assertSupabaseConfigured();

  const supabase = getSupabaseClient();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
    try {
      if (!session) {
        callback(null);
        return;
      }

      const authSession = await withTimeout(
        buildAuthSession(session),
        DATA_FETCH_TIMEOUT_MS,
        'Não foi possível validar a sessão. Tente entrar novamente.',
      );
      callback(authSession);
    } catch {
      if (!session) {
        callback(null);
        return;
      }

      callback(mapSupabaseSessionToAuthSession(session, mapSupabaseUserToAuthUser(session.user)));
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}
