import { useWorkoutRunStore } from '@/features/workouts/store/workout-run.store';
import { formatElapsedClock } from '@/features/workouts/utils/format';
import { useEffect, useState } from 'react';

export function useSessionClock(planId: string | undefined): string {
  const startedAt = useWorkoutRunStore((state) =>
    planId ? state.startedAtByPlanId[planId] : undefined,
  );
  const ensureStarted = useWorkoutRunStore((state) => state.ensureStarted);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!planId) {
      return;
    }

    ensureStarted(planId);
  }, [ensureStarted, planId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  if (!startedAt) {
    return '00:00:00';
  }

  return formatElapsedClock(now - startedAt);
}
