import { useAuth } from '@/features/auth';
import { getCompletionHistory } from '@/services';
import type { CompletionHistoryEntry } from '@/domain/progress';
import { Card } from '@/shared/components';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

export function CompletionHistorySection() {
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
      <Text className="text-lg font-semibold text-ink">Histórico recente</Text>
      <View className="mt-3 gap-3">
        {history.map((entry) => (
          <View
            key={entry.id}
            className="rounded-2xl border border-line bg-elevated px-3 py-3"
          >
            <Text className="text-sm text-ink">Aula concluída</Text>
            <Text className="mt-1 text-xs text-faint">
              {new Date(entry.completedAt).toLocaleString('pt-BR')}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
