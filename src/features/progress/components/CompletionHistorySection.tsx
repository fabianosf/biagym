import { useAuth } from '@/features/auth';
import { getCompletionHistory } from '@/services';
import type { CompletionHistoryEntry } from '@/domain/progress';
import { Card } from '@/shared/components';
import { usePreferencesStore, useT } from '@/shared/theme';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

const INTL_LOCALE: Record<string, string> = { 'pt-BR': 'pt-BR', en: 'en-US' };

export function CompletionHistorySection() {
  const t = useT();
  const locale = usePreferencesStore((state) => state.locale);
  const { user } = useAuth();
  const [history, setHistory] = useState<CompletionHistoryEntry[]>([]);

  const load = useCallback(async () => {
    if (!user) {
      setHistory([]);
      return;
    }

    const entries = await getCompletionHistory(user.id);
    setHistory(entries.slice(0, 8));
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  if (history.length === 0) {
    return null;
  }

  return (
    <Card>
      <Text className="text-lg font-semibold text-ink">{t('progress.recentHistory')}</Text>
      <View className="mt-3 gap-3">
        {history.map((entry) => (
          <View
            key={entry.id}
            className="rounded-2xl border border-line bg-elevated px-3 py-3"
          >
            <Text className="text-sm text-ink">{t('progress.lessonCompleted')}</Text>
            <Text className="mt-1 text-xs text-faint">
              {new Date(entry.completedAt).toLocaleString(INTL_LOCALE[locale] ?? 'pt-BR')}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
