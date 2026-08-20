import { useAuth } from '@/features/auth';
import type { NutritionPlan } from '@/domain/nutrition';
import type { TrainingSlot } from '@/domain/schedule';
import {
  checkInTrainingSlot,
  listNutritionPlansForStudent,
  listTrainingSlots,
} from '@/services';
import { Button, Card } from '@/shared/components';
import { useT } from '@/shared/theme';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

function isSlotToday(slot: TrainingSlot): boolean {
  return slot.weekday === new Date().getDay();
}

function formatMacros(plan: NutritionPlan): string | null {
  const macros = plan.macros;
  if (!macros) {
    return null;
  }

  const parts = [
    macros.caloriesKcal != null ? `${macros.caloriesKcal} kcal` : null,
    macros.proteinG != null ? `P ${macros.proteinG}g` : null,
    macros.carbsG != null ? `C ${macros.carbsG}g` : null,
    macros.fatG != null ? `G ${macros.fatG}g` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' · ') : null;
}

export function CoachingPlanSection() {
  const t = useT();
  const { user } = useAuth();
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [slots, setSlots] = useState<TrainingSlot[]>([]);
  const [checkingSlotId, setCheckingSlotId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      const [plans, schedule] = await Promise.all([
        listNutritionPlansForStudent(user.id),
        listTrainingSlots(user.id),
      ]);
      setPlan(plans[0] ?? null);
      setSlots(schedule);
    } catch {
      setPlan(null);
      setSlots([]);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCheckIn(slot: TrainingSlot) {
    if (!user) {
      return;
    }

    setCheckingSlotId(slot.id);
    try {
      await checkInTrainingSlot({ slotId: slot.id, studentUserId: user.id });
      await load();
    } finally {
      setCheckingSlotId(null);
    }
  }

  if (!plan && slots.length === 0) {
    return null;
  }

  return (
    <View className="gap-4">
      {slots.length > 0 ? (
        <Card>
          <Text className="text-xs font-semibold uppercase tracking-[1.6px] text-primary">
            {t('progress.yourSchedule')}
          </Text>
          <Text className="mt-2 text-lg font-semibold text-ink">{t('progress.trainingTimes')}</Text>
          {slots.map((slot) => (
            <View key={slot.id} className="mt-3 border-t border-line pt-3">
              <Text className="text-sm leading-5 text-ink">
                {t('progress.scheduleSlot', {
                  weekday: t(`weekdays.${slot.weekday}`),
                  time: slot.startTime,
                  title: slot.title,
                  minutes: String(slot.durationMinutes),
                })}
              </Text>
              {isSlotToday(slot) ? (
                slot.checkedInToday ? (
                  <Text className="mt-2 text-sm font-semibold text-primary">
                    {t('progress.trainedToday')}
                  </Text>
                ) : (
                  <Button
                    className="mt-3"
                    label={t('progress.checkInButton')}
                    loading={checkingSlotId === slot.id}
                    onPress={() => void handleCheckIn(slot)}
                  />
                )
              ) : null}
            </View>
          ))}
        </Card>
      ) : null}

      {plan ? (
        <Card>
          <Text className="text-xs font-semibold uppercase tracking-[1.6px] text-primary">
            {t('progress.nutrition')}
          </Text>
          <Text className="mt-2 text-lg font-semibold text-ink">{plan.title}</Text>
          {formatMacros(plan) ? (
            <Text className="mt-1 text-sm font-semibold text-primary">{formatMacros(plan)}</Text>
          ) : null}
          {plan.description ? (
            <Text className="mt-1 text-sm text-muted">{plan.description}</Text>
          ) : null}
          {plan.meals.map((meal) => (
            <View key={meal.id} className="mt-3">
              <Text className="text-sm font-semibold text-ink">
                {t(`mealTypes.${meal.mealType}`)}
                {meal.timeLabel ? ` · ${meal.timeLabel}` : ''}
              </Text>
              <Text className="text-sm text-muted">{meal.title}</Text>
            </View>
          ))}
        </Card>
      ) : null}
    </View>
  );
}
