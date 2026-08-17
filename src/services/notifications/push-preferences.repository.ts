import type {
  NotificationPreferences,
  PushPlatform,
  UpdateNotificationPreferencesInput,
} from '@/domain/notifications';

import { getSupabaseClient } from '../supabase';
import { isSupabaseConfigured } from '../supabase/client';
import type { ProfileRow } from '../supabase/types';
import {
  assertSupabaseConfigured,
  DataServiceError,
  mapSupabaseDataError,
} from '../shared';

type ProfileNotificationRow = Pick<
  ProfileRow,
  | 'push_notifications_enabled'
  | 'expo_push_token'
  | 'push_platform'
  | 'push_token_updated_at'
>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: false,
  expoPushToken: null,
  platform: null,
  updatedAt: null,
};

function mapNotificationPreferences(row: ProfileNotificationRow): NotificationPreferences {
  return {
    enabled: row.push_notifications_enabled,
    expoPushToken: row.expo_push_token,
    platform: (row.push_platform as PushPlatform | null) ?? null,
    updatedAt: row.push_token_updated_at,
  };
}

export async function getNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences> {
  if (!isSupabaseConfigured()) {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select(
        'push_notifications_enabled, expo_push_token, push_platform, push_token_updated_at',
      )
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw mapSupabaseDataError(error);
    }

    if (!data) {
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }

    return mapNotificationPreferences(data as ProfileNotificationRow);
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

export async function updateNotificationPreferences(
  userId: string,
  input: UpdateNotificationPreferencesInput,
): Promise<NotificationPreferences> {
  assertSupabaseConfigured(isSupabaseConfigured());

  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const payload: {
    push_notifications_enabled: boolean;
    push_token_updated_at: string;
    expo_push_token?: string | null;
    push_platform?: string | null;
  } = {
    push_notifications_enabled: input.enabled,
    push_token_updated_at: now,
  };

  if (input.enabled) {
    if (input.expoPushToken !== undefined) {
      payload.expo_push_token = input.expoPushToken;
    }
    if (input.platform !== undefined) {
      payload.push_platform = input.platform;
    }
  } else {
    payload.expo_push_token = null;
    payload.push_platform = null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select(
        'push_notifications_enabled, expo_push_token, push_platform, push_token_updated_at',
      )
      .single();

    if (error) {
      throw mapSupabaseDataError(error);
    }

    return mapNotificationPreferences(data as ProfileNotificationRow);
  } catch (error) {
    if (error instanceof DataServiceError && error.code === 'configuration_error') {
      return {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        enabled: input.enabled,
      };
    }

    throw error;
  }
}

export async function listEnabledPushTokensForUsers(
  userIds: readonly string[],
): Promise<Array<{ userId: string; token: string }>> {
  assertSupabaseConfigured(isSupabaseConfigured());

  if (userIds.length === 0) {
    return [];
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, expo_push_token')
    .in('id', [...userIds])
    .eq('push_notifications_enabled', true)
    .not('expo_push_token', 'is', null);

  if (error) {
    throw mapSupabaseDataError(error);
  }

  return (data ?? [])
    .filter((row) => typeof row.expo_push_token === 'string')
    .map((row) => ({
      userId: row.id as string,
      token: row.expo_push_token as string,
    }));
}
