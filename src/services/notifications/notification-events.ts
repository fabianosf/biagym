import type { EntityId } from '@/domain';
import type { NotificationType } from '@/domain/notifications';

import { listAccessGrantsByProgramId } from '../access';
import { sendPushNotification } from './push-notification.service';
import { listEnabledPushTokensForUsers } from './push-preferences.repository';

const BODY_PREVIEW_LENGTH = 120;

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

/**
 * Best-effort: envia push só pra quem tem o toggle ligado (checado aqui e de
 * novo no servidor) e nunca deixa falha de notificação derrubar a ação
 * principal (recado, liberação de acesso, publicação de aula).
 */
async function notifyUsers(
  userIds: readonly EntityId[],
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  const uniqueIds = [...new Set(userIds)];
  if (uniqueIds.length === 0) {
    return;
  }

  try {
    const recipients = await listEnabledPushTokensForUsers(uniqueIds);
    await Promise.all(
      recipients.map(({ userId }) =>
        sendPushNotification({ userId, title, body, type, data }).catch(() => undefined),
      ),
    );
  } catch {
    // Notificação nunca deve quebrar o fluxo que a disparou.
  }
}

export async function notifyCoachMessage(
  studentUserId: EntityId,
  messageBody: string,
): Promise<void> {
  const preview = truncate(messageBody, BODY_PREVIEW_LENGTH);
  await notifyUsers(
    [studentUserId],
    'coach_message',
    'Recado da treinadora',
    preview || 'Você recebeu um novo recado.',
    { screen: 'messages' },
  );
}

export async function notifyAccessGranted(
  studentUserIds: readonly EntityId[],
  itemTitle: string,
  screen: 'programs' | 'workouts',
): Promise<void> {
  await notifyUsers(
    studentUserIds,
    'new_program',
    screen === 'programs' ? 'Novo programa liberado' : 'Novo treino liberado',
    `${itemTitle} já está disponível para você.`,
    { screen },
  );
}

export async function notifyNewLesson(
  programId: EntityId,
  programTitle: string,
  lessonTitle: string,
): Promise<void> {
  const grants = await listAccessGrantsByProgramId(programId).catch(() => []);
  const studentIds = grants.map((grant) => grant.userId);

  await notifyUsers(
    studentIds,
    'new_lesson',
    'Nova aula disponível',
    `${lessonTitle} foi adicionada a ${programTitle}.`,
    { screen: 'programs', programId },
  );
}

/**
 * Sem checagem automática de versão (exigiria expo-updates) — disponível
 * pra disparo manual ou futura integração com EAS Update.
 */
export async function notifyAppUpdate(
  userIds: readonly EntityId[],
  message: string,
): Promise<void> {
  await notifyUsers(userIds, 'app_update', 'Nova versão disponível', message, {
    screen: 'profile',
  });
}
