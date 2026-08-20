import { useAuth } from '@/features/auth';
import type { BodyLog } from '@/domain/student';
import type { WorkoutSession } from '@/domain/workout';
import { listBodyLogs, listWorkoutSessions } from '@/services';
import { Card } from '@/shared/components';
import { useT, useThemeColors } from '@/shared/theme';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEIGHT_BARS_MAX = 6;
const WEIGHT_BAR_HEIGHT = 56;
const WEIGHT_BAR_FLOOR = 10;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function PersonalPerformanceCard() {
  const { user } = useAuth();
  const t = useT();
  const colors = useThemeColors();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [logs, setLogs] = useState<BodyLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      const [sessionsData, logsData] = await Promise.all([
        listWorkoutSessions(user.id, 30),
        listBodyLogs(user.id),
      ]);
      setSessions(sessionsData);
      setLogs(logsData);
    } catch {
      setSessions([]);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  if (isLoading || !user) {
    return null;
  }

  const today = startOfDay(new Date());
  const trainedDays = new Set(
    sessions.map((session) => startOfDay(new Date(session.completedAt))),
  );
  const last7Days = Array.from({ length: 7 }, (_, index) => {
    const dayStart = today - (6 - index) * DAY_MS;
    return {
      dayStart,
      trained: trainedDays.has(dayStart),
      isToday: dayStart === today,
    };
  });

  const weightSeries = [...logs]
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .slice(-WEIGHT_BARS_MAX);
  const weights = weightSeries.map((log) => log.weightKg);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightRange = maxWeight - minWeight || 1;

  return (
    <Animated.View entering={FadeInDown.duration(420).springify()}>
      <Card className="gap-5">
        <Text className="text-xs font-semibold uppercase tracking-[1.6px] text-primary">
          {t('progress.evolutionPerformance')}
        </Text>

        <View>
          <Text className="mb-3 text-sm font-semibold text-ink">{t('progress.weekFrequency')}</Text>
          <View className="flex-row justify-between">
            {last7Days.map(({ dayStart, trained, isToday }, index) => (
              <View key={dayStart} className="items-center gap-1.5">
                <Animated.View
                  entering={
                    trained ? ZoomIn.delay(index * 60).springify().damping(12) : undefined
                  }
                  className="h-8 w-8 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: trained ? colors.primary : 'transparent',
                    borderWidth: trained ? 0 : 1.5,
                    borderColor: isToday ? colors.primary : colors.line,
                  }}
                >
                  {trained ? (
                    <Text className="text-xs font-bold text-white">✓</Text>
                  ) : null}
                </Animated.View>
                <Text
                  className={`text-[10px] font-semibold ${isToday ? 'text-primary' : 'text-faint'}`}
                >
                  {t(`weekdaysLetter.${new Date(dayStart).getDay()}`)}
                </Text>
              </View>
            ))}
          </View>
        </View>

      {weightSeries.length >= 2 ? (
        <View>
          <View className="mb-3 flex-row items-baseline justify-between">
            <Text className="text-sm font-semibold text-ink">{t('progress.recentWeight')}</Text>
            <Text
              className={`text-xs font-semibold ${
                weightSeries[weightSeries.length - 1]!.weightKg < weightSeries[0]!.weightKg
                  ? 'text-primary'
                  : 'text-muted'
              }`}
            >
              {weightSeries[weightSeries.length - 1]!.weightKg > weightSeries[0]!.weightKg
                ? '↑'
                : weightSeries[weightSeries.length - 1]!.weightKg < weightSeries[0]!.weightKg
                  ? '↓'
                  : '→'}{' '}
              {Math.abs(
                weightSeries[weightSeries.length - 1]!.weightKg - weightSeries[0]!.weightKg,
              ).toFixed(1)}{' '}
              kg
            </Text>
          </View>
          <View
            className="flex-row items-end justify-between gap-2"
            style={{ height: WEIGHT_BAR_HEIGHT }}
          >
            {weightSeries.map((log, index) => {
              const heightRatio = (log.weightKg - minWeight) / weightRange;
              const barHeight =
                WEIGHT_BAR_FLOOR + heightRatio * (WEIGHT_BAR_HEIGHT - WEIGHT_BAR_FLOOR);
              const isEdge = index === 0 || index === weightSeries.length - 1;
              return (
                <View key={log.id} className="flex-1 items-center gap-1">
                  <View
                    className="w-full rounded-full"
                    style={{
                      height: barHeight,
                      backgroundColor: isEdge ? colors.primary : colors.line,
                    }}
                  />
                  {isEdge ? (
                    <Text className="text-[10px] font-semibold text-muted">
                      {log.weightKg}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      ) : null}
      </Card>
    </Animated.View>
  );
}
