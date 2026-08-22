export type PushPlatform = 'ios' | 'android' | 'web';

export type NotificationType =
  | 'training_reminder'
  | 'new_program'
  | 'new_lesson'
  | 'coach_message'
  | 'app_update'
  | 'test';

export interface NotificationPreferences {
  readonly enabled: boolean;
  readonly expoPushToken: string | null;
  readonly platform: PushPlatform | null;
  readonly updatedAt: string | null;
}

export interface UpdateNotificationPreferencesInput {
  readonly enabled: boolean;
  readonly expoPushToken?: string | null;
  readonly platform?: PushPlatform | null;
}

export interface SendPushNotificationInput {
  readonly userId: string;
  readonly title: string;
  readonly body: string;
  readonly type: NotificationType;
  readonly data?: Record<string, string>;
}
