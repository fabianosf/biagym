import { AdminStudentSearch, AdminShell } from '@/features/admin/components';
import { useAdminFocusedStudent } from '@/features/admin/hooks/useAdminFocusedStudent';
import { getStudentFirstName } from '@/features/admin/utils/student-label';
import { useAuth } from '@/features/auth';
import { MEAL_TYPES, type NutritionPlan } from '@/domain/nutrition';
import type { StudentProfile } from '@/domain/student';
import {
  adminCreateNutritionPlan,
  adminDeleteNutritionPlan,
  adminUpdateNutritionPlan,
  getDataErrorMessage,
  listNutritionPlans,
} from '@/services';
import { Button, ErrorState, LoadingIndicator, TextField } from '@/shared/components';
import { useT } from '@/shared/theme';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';

const EMPTY_MEALS = MEAL_TYPES.map((mealType) => ({
  mealType,
  title: '',
  description: '',
  timeLabel: '',
}));

function parseMacro(value: string): number | undefined {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
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

export function AdminNutritionScreen() {
  const t = useT();
  const { user } = useAuth();
  const { focusedStudentId, student: focusedStudent, goBackToStudent } = useAdminFocusedStudent();
  const [plans, setPlans] = useState<NutritionPlan[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [title, setTitle] = useState(t('admin.nutrition.defaultTitle'));
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [meals, setMeals] = useState(EMPTY_MEALS);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    setError(null);
    try {
      const data = await listNutritionPlans();
      setPlans(data);
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    if (focusedStudent) {
      setSelectedStudent(focusedStudent);
    }
  }, [focusedStudent]);

  const firstName = focusedStudent ? getStudentFirstName(focusedStudent.name) : null;
  const visiblePlans = useMemo(
    () =>
      focusedStudentId
        ? plans.filter((plan) => plan.studentUserId === focusedStudentId)
        : plans,
    [focusedStudentId, plans],
  );

  function resetForm() {
    setEditingPlanId(null);
    setTitle(t('admin.nutrition.defaultTitle'));
    setDescription('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setMeals(EMPTY_MEALS);
  }

  function handleStartEdit(plan: NutritionPlan) {
    setEditingPlanId(plan.id);
    setTitle(plan.title);
    setDescription(plan.description ?? '');
    setCalories(plan.macros?.caloriesKcal != null ? String(plan.macros.caloriesKcal) : '');
    setProtein(plan.macros?.proteinG != null ? String(plan.macros.proteinG) : '');
    setCarbs(plan.macros?.carbsG != null ? String(plan.macros.carbsG) : '');
    setFat(plan.macros?.fatG != null ? String(plan.macros.fatG) : '');
    setMeals(
      MEAL_TYPES.map((mealType) => {
        const existing = plan.meals.find((meal) => meal.mealType === mealType);
        return {
          mealType,
          title: existing?.title ?? '',
          description: existing?.description ?? '',
          timeLabel: existing?.timeLabel ?? '',
        };
      }),
    );
    setError(null);
  }

  async function handleSave() {
    if (!user) {
      return;
    }

    if (title.trim().length < 3) {
      setError(t('admin.nutrition.titleRequired'));
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const mealsInput = meals.map((meal) => ({
        mealType: meal.mealType,
        title: meal.title,
        description: meal.description || undefined,
        timeLabel: meal.timeLabel || undefined,
      }));
      const macros = {
        caloriesKcal: parseMacro(calories),
        proteinG: parseMacro(protein),
        carbsG: parseMacro(carbs),
        fatG: parseMacro(fat),
      };

      if (editingPlanId) {
        await adminUpdateNutritionPlan(editingPlanId, {
          title,
          description: description || undefined,
          macros,
          meals: mealsInput,
        });
      } else {
        await adminCreateNutritionPlan({
          title,
          description: description || undefined,
          studentUserId: focusedStudentId ?? selectedStudent?.userId,
          createdBy: user.id,
          macros,
          meals: mealsInput,
        });
      }

      resetForm();
      await loadPlans();
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(planId: string) {
    try {
      await adminDeleteNutritionPlan(planId);
      if (editingPlanId === planId) {
        resetForm();
      }
      await loadPlans();
    } catch (err) {
      setError(getDataErrorMessage(err));
    }
  }

  return (
    <AdminShell
      title={firstName ? t('admin.nutrition.titleFor', { name: firstName }) : t('admin.nutrition.title')}
      subtitle={
        focusedStudent
          ? t('admin.nutrition.subtitleFor', { name: focusedStudent.name })
          : t('admin.nutrition.subtitleGeneric')
      }
      showBack
      onBack={goBackToStudent}
    >
      {isLoading ? <LoadingIndicator fullScreen message={t('admin.nutrition.loading')} /> : null}

      {!isLoading && error && plans.length === 0 ? (
        <View className="px-5 pt-2">
          <ErrorState message={error} onRetry={() => void loadPlans()} />
        </View>
      ) : null}

      {!isLoading && (plans.length > 0 || !error) ? (
        <ScrollView className="flex-1" contentContainerClassName="gap-5 px-5 pb-12">
          {error ? <Text className="text-sm text-red-400">{error}</Text> : null}

          <View className="rounded-card border border-line bg-surface p-5 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-ink">
                {editingPlanId
                  ? t('admin.nutrition.editPlan')
                  : firstName
                    ? t('admin.nutrition.newPlanFor', { name: firstName })
                    : t('admin.nutrition.newPlan')}
              </Text>
              {editingPlanId ? (
                <Pressable onPress={resetForm}>
                  <Text className="text-sm text-muted">{t('common.cancel')}</Text>
                </Pressable>
              ) : null}
            </View>
            {focusedStudentId ? (
              <Text className="text-sm text-muted">
                {t('admin.schedule.individualFor', {
                  name: focusedStudent?.name ?? t('admin.studentSpace.thisStudent'),
                })}
              </Text>
            ) : (
              <AdminStudentSearch
                selected={selectedStudent}
                onSelect={setSelectedStudent}
                allowEmptySelection
                onClear={() => setSelectedStudent(null)}
              />
            )}
            <TextField
              label={t('admin.programForm.title')}
              value={title}
              onChangeText={setTitle}
              placeholder="Cutting 4 semanas"
              icon="restaurant-outline"
            />
            <TextField
              label={t('admin.schedule.notesLabel')}
              value={description}
              onChangeText={setDescription}
              placeholder={t('admin.nutrition.descriptionPlaceholder')}
              icon="document-text-outline"
            />
            <View className="flex-row flex-wrap gap-3">
              <View className="min-w-[46%] flex-1">
                <TextField
                  label={t('admin.nutrition.caloriesLabel')}
                  value={calories}
                  onChangeText={setCalories}
                  keyboardType="number-pad"
                  placeholder="1800"
                  icon="flash-outline"
                />
              </View>
              <View className="min-w-[46%] flex-1">
                <TextField
                  label={t('admin.nutrition.proteinLabel')}
                  value={protein}
                  onChangeText={setProtein}
                  keyboardType="decimal-pad"
                  placeholder="120"
                  icon="barbell-outline"
                />
              </View>
              <View className="min-w-[46%] flex-1">
                <TextField
                  label={t('admin.nutrition.carbsLabel')}
                  value={carbs}
                  onChangeText={setCarbs}
                  keyboardType="decimal-pad"
                  placeholder="180"
                  icon="nutrition-outline"
                />
              </View>
              <View className="min-w-[46%] flex-1">
                <TextField
                  label={t('admin.nutrition.fatLabel')}
                  value={fat}
                  onChangeText={setFat}
                  keyboardType="decimal-pad"
                  placeholder="50"
                  icon="water-outline"
                />
              </View>
            </View>
            {meals.map((meal, index) => (
              <View key={meal.mealType} className="gap-2">
                <Text className="text-sm font-semibold text-ink">
                  {t(`mealTypes.${meal.mealType}`)}
                </Text>
                <TextField
                  label={t('admin.nutrition.mealTitleLabel')}
                  value={meal.title}
                  onChangeText={(value) =>
                    setMeals((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, title: value } : item,
                      ),
                    )
                  }
                  placeholder={t('admin.nutrition.mealTitlePlaceholder')}
                  icon="leaf-outline"
                />
                <TextField
                  label={t('admin.nutrition.mealTimeLabel')}
                  value={meal.timeLabel}
                  onChangeText={(value) =>
                    setMeals((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, timeLabel: value } : item,
                      ),
                    )
                  }
                  placeholder="07:30"
                  icon="time-outline"
                />
              </View>
            ))}
            <Button
              label={
                editingPlanId
                  ? t('admin.schedule.saveChanges')
                  : firstName
                    ? t('admin.nutrition.saveNutritionFor', { name: firstName })
                    : t('admin.nutrition.savePlan')
              }
              loading={isSaving}
              onPress={() => void handleSave()}
            />
          </View>

          <View className="gap-3">
            <Text className="text-lg font-semibold text-ink">
              {firstName ? t('admin.nutrition.plansOf', { name: firstName }) : t('admin.nutrition.registeredPlans')}
            </Text>
            {visiblePlans.length === 0 ? (
              <Text className="text-muted">
                {firstName
                  ? t('admin.nutrition.noPlansFor', { name: firstName })
                  : t('admin.nutrition.noPlansYet')}
              </Text>
            ) : (
              visiblePlans.map((plan) => (
                <View key={plan.id} className="rounded-card border border-line bg-surface p-5">
                  <Text className="font-semibold text-ink">{plan.title}</Text>
                  <Text className="mt-1 text-xs text-muted">
                    {plan.studentUserId ? t('admin.nutrition.individualPlan') : t('admin.nutrition.generalPlan')}
                    {formatMacros(plan) ? ` · ${formatMacros(plan)}` : ''}
                  </Text>
                  {plan.meals.map((meal) => (
                    <Text key={meal.id} className="mt-2 text-sm text-ink">
                      {t(`mealTypes.${meal.mealType}`)}
                      {meal.timeLabel ? ` · ${meal.timeLabel}` : ''}: {meal.title}
                    </Text>
                  ))}
                  <View className="mt-3 flex-row gap-4">
                    <Pressable onPress={() => handleStartEdit(plan)}>
                      <Text className="text-sm font-semibold text-primary">{t('common.edit')}</Text>
                    </Pressable>
                    <Pressable onPress={() => void handleDelete(plan.id)}>
                      <Text className="text-sm text-red-400">{t('common.remove')}</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      ) : null}
    </AdminShell>
  );
}
