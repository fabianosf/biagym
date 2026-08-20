import {
  AdminShell,
  AdminStudentActionCard,
  AdminStudentAvatar,
} from '@/features/admin/components';
import { getStudentFirstName } from '@/features/admin/utils/student-label';
import { useAuth } from '@/features/auth';
import type { BodyLog, StudentProfile } from '@/domain/student';
import type { TrainingPlanGrant, TrainingPlanSummary, WorkoutSession } from '@/domain/workout';
import type { AccessGrant, ProgramSummary } from '@/domain';
import {
  DATA_FETCH_TIMEOUT_MS,
  adminGrantProgramAccess,
  adminListStudentGrants,
  adminRevokeAccessGrant,
  getDataErrorMessage,
  getStudentProfileById,
  grantTrainingPlanAccess,
  listAdminPrograms,
  listBodyLogs,
  listTrainingPlanGrantsForUser,
  listTrainingPlans,
  listWorkoutSessions,
  revokeTrainingPlanAccess,
  withTimeout,
} from '@/services';
import { AppImage, EmptyState, ErrorState, LoadingIndicator } from '@/shared/components';
import { adminRoutes } from '@/shared/constants/admin-routes';
import { useT } from '@/shared/theme';
import { formatRelativeAccessDate, resolveRouteParam } from '@/shared/utils';
import { buildWhatsAppUrl, formatPhoneDisplay } from '@/shared/utils/phone';
import { useStudentPinsStore } from '@/features/admin/store/student-pins.store';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';

type AssignedPlan = {
  plan: TrainingPlanSummary;
  grant: TrainingPlanGrant;
};

export function AdminStudentSpaceScreen() {
  const router = useRouter();
  const t = useT();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const studentId = resolveRouteParam(params.id);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [plans, setPlans] = useState<TrainingPlanSummary[]>([]);
  const [grants, setGrants] = useState<TrainingPlanGrant[]>([]);
  const [bodyLogs, setBodyLogs] = useState<BodyLog[]>([]);
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [programGrants, setProgramGrants] = useState<AccessGrant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);
  const [busyProgramId, setBusyProgramId] = useState<string | null>(null);

  const markOpened = useStudentPinsStore((state) => state.markOpened);
  const requestIdRef = useRef(0);

  const load = useCallback(async (silent = false) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!studentId) {
      setStudent(null);
      setError(t('admin.studentSpace.invalidStudent'));
      setIsLoading(false);
      return;
    }

    if (!silent) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const [profile, catalog, studentGrants, logs, sessions, programCatalog, studentProgramGrants] =
        await withTimeout(
          Promise.all([
            getStudentProfileById(studentId),
            listTrainingPlans(),
            listTrainingPlanGrantsForUser(studentId),
            listBodyLogs(studentId),
            listWorkoutSessions(studentId, 20),
            listAdminPrograms(),
            adminListStudentGrants(studentId),
          ]),
          DATA_FETCH_TIMEOUT_MS,
          t('admin.studentSpace.loadTimeout'),
        );
      if (requestId !== requestIdRef.current) {
        return;
      }
      setStudent(profile);
      setPlans(catalog);
      setGrants(studentGrants);
      setBodyLogs(logs);
      setWorkoutSessions(sessions);
      setPrograms(programCatalog);
      setProgramGrants(studentProgramGrants);
      if (!profile) {
        setError(t('admin.studentSpace.notRegistered'));
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setError(getDataErrorMessage(err));
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [studentId]);

  useFocusEffect(
    useCallback(() => {
      void load();
      if (user?.id && studentId) {
        markOpened(user.id, studentId);
      }
    }, [load, markOpened, studentId, user?.id]),
  );

  const assigned = useMemo((): AssignedPlan[] => {
    const planById = new Map(plans.map((plan) => [plan.id, plan]));
    return grants.flatMap((grant) => {
      const plan = planById.get(grant.planId);
      return plan ? [{ plan, grant }] : [];
    });
  }, [grants, plans]);

  const available = useMemo(() => {
    const grantedIds = new Set(grants.map((grant) => grant.planId));
    return plans.filter((plan) => !grantedIds.has(plan.id));
  }, [grants, plans]);

  type AssignedProgram = { program: ProgramSummary; grant: AccessGrant };

  const assignedPrograms = useMemo((): AssignedProgram[] => {
    const programById = new Map(programs.map((program) => [program.id, program]));
    return programGrants.flatMap((grant) => {
      const program = programById.get(grant.programId);
      return program ? [{ program, grant }] : [];
    });
  }, [programGrants, programs]);

  const availablePrograms = useMemo(() => {
    const grantedIds = new Set(programGrants.map((grant) => grant.programId));
    return programs.filter((program) => !grantedIds.has(program.id));
  }, [programGrants, programs]);

  async function handleGrant(plan: TrainingPlanSummary) {
    if (!user || !student) {
      return;
    }

    setBusyPlanId(plan.id);
    setError(null);
    setNotice(null);
    try {
      await grantTrainingPlanAccess({
        userId: student.userId,
        planId: plan.id,
        grantedBy: user.id,
      });
      setNotice(t('admin.studentSpace.planReleased', { title: plan.title, name: student.name }));
      await load(true);
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setBusyPlanId(null);
    }
  }

  async function handleRevoke(assignedPlan: AssignedPlan) {
    setBusyPlanId(assignedPlan.plan.id);
    setError(null);
    setNotice(null);
    try {
      await revokeTrainingPlanAccess(assignedPlan.grant.id);
      setNotice(t('admin.studentSpace.planRemoved', { title: assignedPlan.plan.title }));
      await load(true);
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setBusyPlanId(null);
    }
  }

  async function handleGrantProgram(program: ProgramSummary) {
    if (!user || !student) {
      return;
    }

    setBusyProgramId(program.id);
    setError(null);
    setNotice(null);
    try {
      await adminGrantProgramAccess({
        userId: student.userId,
        programId: program.id,
        grantedBy: user.id,
        grantedAt: new Date().toISOString(),
      });
      setNotice(t('admin.studentSpace.programReleased', { title: program.title, name: student.name }));
      await load(true);
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setBusyProgramId(null);
    }
  }

  async function handleRevokeProgram(assignedProgram: AssignedProgram) {
    setBusyProgramId(assignedProgram.program.id);
    setError(null);
    setNotice(null);
    try {
      await adminRevokeAccessGrant(assignedProgram.grant.id);
      setNotice(t('admin.studentSpace.programRemoved', { title: assignedProgram.program.title }));
      await load(true);
    } catch (err) {
      setError(getDataErrorMessage(err));
    } finally {
      setBusyProgramId(null);
    }
  }

  const firstName = student ? getStudentFirstName(student.name) : t('admin.studentSpace.thisStudent');

  return (
    <AdminShell
      title={student?.name ?? t('admin.studentSpace.title')}
      subtitle={t('admin.studentSpace.subtitle', { name: firstName })}
      showBack
      onBack={() => router.replace(adminRoutes.home as Href)}
    >
      {isLoading ? <LoadingIndicator fullScreen message={t('admin.studentSpace.loading')} /> : null}

      {!isLoading && error && !student ? (
        <View className="flex-1 px-5">
          <ErrorState message={error} onRetry={() => void load()} />
        </View>
      ) : null}

      {!isLoading && student ? (
        <ScrollView className="flex-1" contentContainerClassName="gap-4 px-5 pb-12">
          {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
          {notice ? <Text className="text-sm text-primary">{notice}</Text> : null}

          <View className="rounded-card border border-line bg-surface p-5">
            <Text className="text-xs font-semibold uppercase tracking-[1.6px] text-primary">
              {t('admin.studentSpace.studentData')}
            </Text>
            <View className="mt-3 flex-row items-center gap-4">
              <AdminStudentAvatar student={student} size={64} />
              <View className="min-w-0 flex-1">
                <Text className="text-lg font-semibold text-ink">{student.name}</Text>
                <Text className="mt-0.5 text-sm text-muted">{student.email}</Text>
              </View>
            </View>
            {student.metrics ? (
              <View className="mt-4 flex-row flex-wrap gap-2">
                <MetricChip label={`${student.metrics.weightKg} kg`} />
                <MetricChip label={`${student.metrics.heightCm} cm`} />
                <MetricChip label={t('profile.ageYears', { age: String(student.metrics.age) })} />
                <MetricChip label={t(`studentGoals.${student.metrics.goal}`)} />
              </View>
            ) : (
              <Text className="mt-4 text-sm text-faint">{t('admin.studentSpace.noOnboarding')}</Text>
            )}
            {student.phone ? (
              <Pressable
                onPress={() => {
                  const url = buildWhatsAppUrl(student.phone ?? '');
                  if (url) {
                    void Linking.openURL(url);
                  }
                }}
                className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3"
              >
                <Text className="text-sm font-semibold text-primary">
                  WhatsApp {formatPhoneDisplay(student.phone)}
                </Text>
                <Text className="mt-0.5 text-xs text-muted">
                  {t('admin.studentSpace.openWhatsappWith', { name: firstName })}
                </Text>
              </Pressable>
            ) : (
              <Text className="mt-4 text-sm text-faint">{t('admin.noWhatsapp')}</Text>
            )}
          </View>

          <Text className="text-xs font-semibold uppercase tracking-[1.6px] text-primary">
            {t('admin.studentSpace.resolveFor', { name: firstName })}
          </Text>
          <View className="flex-row flex-wrap gap-3">
            <AdminStudentActionCard
              title={t('admin.studentSpace.actionWorkouts')}
              description={t('admin.studentSpace.actionWorkoutsDesc', { name: firstName })}
              icon="barbell-outline"
              onPress={() =>
                router.push(adminRoutes.workoutsFor(student.userId) as Href)
              }
            />
            <AdminStudentActionCard
              title={t('admin.studentSpace.actionExercises')}
              description={t('admin.studentSpace.actionExercisesDesc')}
              icon="videocam-outline"
              onPress={() =>
                router.push(adminRoutes.exercisesFor(student.userId) as Href)
              }
            />
            <AdminStudentActionCard
              title={t('admin.studentSpace.actionNutrition')}
              description={t('admin.studentSpace.actionNutritionDesc', { name: firstName })}
              icon="nutrition-outline"
              onPress={() =>
                router.push(adminRoutes.nutritionFor(student.userId) as Href)
              }
            />
            <AdminStudentActionCard
              title={t('admin.studentSpace.actionMessages')}
              description={t('admin.studentSpace.actionMessagesDesc', { name: firstName })}
              icon="chatbubbles-outline"
              onPress={() =>
                router.push(adminRoutes.messagesFor(student.userId) as Href)
              }
            />
          </View>

          <Text className="mt-2 text-xs font-semibold uppercase tracking-[1.6px] text-primary">
            {t('admin.studentSpace.workoutsOf', { name: firstName })}
          </Text>
          {assigned.length === 0 ? (
            <Text className="text-sm text-muted">
              {t('admin.studentSpace.noWorkoutsGranted', { name: firstName })}
            </Text>
          ) : (
            assigned.map((item) => {
              const planSessions = workoutSessions.filter(
                (session) => session.planId === item.plan.id,
              );
              const lastSession = planSessions[0];
              return (
              <View
                key={item.grant.id}
                className="flex-row items-center rounded-card border border-line bg-surface p-4"
              >
                <Pressable
                  onPress={() =>
                    router.push(adminRoutes.workoutDetail(item.plan.id, student.userId) as Href)
                  }
                  className="min-w-0 flex-1 pr-3"
                  accessibilityRole="button"
                  accessibilityLabel={t('admin.studentSpace.a11yOpen', { title: item.plan.title, name: student.name })}
                >
                  <Text className="font-semibold text-ink">{item.plan.title}</Text>
                  <Text className="mt-0.5 text-sm text-muted">
                    {t('admin.studentSpace.onlyNameSees', { name: firstName })} ·{' '}
                    {t(
                      item.plan.exerciseCount === 1
                        ? 'admin.studentSpace.exerciseCountOne'
                        : 'admin.studentSpace.exerciseCountOther',
                      { count: String(item.plan.exerciseCount) },
                    )}
                  </Text>
                  <Text className="mt-0.5 text-xs text-primary">
                    {lastSession
                      ? t('admin.studentSpace.sessionsLast', {
                          sessions: t(
                            planSessions.length === 1
                              ? 'admin.studentSpace.sessionsCompletedOne'
                              : 'admin.studentSpace.sessionsCompletedOther',
                            { count: String(planSessions.length) },
                          ),
                          date: formatRelativeAccessDate(lastSession.completedAt),
                        })
                      : t('admin.studentSpace.noSessionYet')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleRevoke(item)}
                  disabled={busyPlanId === item.plan.id}
                  accessibilityRole="button"
                  accessibilityLabel={t('admin.studentSpace.a11yRemove', { title: item.plan.title, name: student.name })}
                  hitSlop={8}
                >
                  <Text className="text-sm font-semibold text-red-500">{t('common.remove')}</Text>
                </Pressable>
              </View>
              );
            })
          )}

          <Text className="mt-2 text-xs font-semibold uppercase tracking-[1.6px] text-primary">
            {t('admin.studentSpace.evolutionOf', { name: firstName })}
          </Text>
          {bodyLogs.length === 0 ? (
            <Text className="text-sm text-muted">
              {t('admin.studentSpace.noBodyLogs', { name: firstName })}
            </Text>
          ) : (
            <View className="gap-3">
              {bodyLogs.slice(0, 5).map((log) => (
                <View
                  key={log.id}
                  className="flex-row items-center gap-3 rounded-card border border-line bg-surface p-4"
                >
                  {log.photoUrl ? (
                    <AppImage uri={log.photoUrl} aspectRatio={1} className="h-16 w-16 rounded-2xl" />
                  ) : null}
                  <View className="min-w-0 flex-1">
                    <Text className="font-semibold text-ink">{log.weightKg} kg</Text>
                    <Text className="mt-0.5 text-xs text-muted">
                      {formatRelativeAccessDate(log.recordedAt)}
                    </Text>
                    {log.notes ? (
                      <Text className="mt-1 text-sm text-muted" numberOfLines={3}>
                        {log.notes}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}

          <Text className="mt-2 text-xs font-semibold uppercase tracking-[1.6px] text-primary">
            {t('admin.studentSpace.resolveFor', { name: firstName })}
          </Text>
          <Text className="text-sm text-muted">{t('admin.studentSpace.releaseHintWorkouts')}</Text>
          {plans.length === 0 ? (
            <EmptyState
              title={t('admin.studentSpace.noPlansYet')}
              description={t('admin.studentSpace.buildPlanHint', { name: firstName })}
            />
          ) : null}
          {available.map((plan) => (
            <View
              key={plan.id}
              className="flex-row items-center rounded-card border border-line bg-surface p-4"
            >
              <Pressable
                onPress={() =>
                  router.push(adminRoutes.workoutDetail(plan.id, student.userId) as Href)
                }
                className="min-w-0 flex-1 pr-3"
              >
                <Text className="font-semibold text-ink">{plan.title}</Text>
                <Text className="mt-0.5 text-sm text-muted">
                  {t(
                    plan.exerciseCount === 1
                      ? 'admin.studentSpace.exerciseCountOne'
                      : 'admin.studentSpace.exerciseCountOther',
                    { count: String(plan.exerciseCount) },
                  )}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void handleGrant(plan)}
                disabled={busyPlanId != null}
                accessibilityRole="button"
                accessibilityLabel={t('admin.studentSpace.a11yGrant', { title: plan.title, name: student.name })}
              >
                <Text className="text-sm font-semibold text-primary">
                  {busyPlanId === plan.id ? '...' : t('admin.studentSpace.releaseFor', { name: firstName })}
                </Text>
              </Pressable>
            </View>
          ))}

          <Text className="mt-2 text-xs font-semibold uppercase tracking-[1.6px] text-primary">
            {t('admin.studentSpace.programsOf', { name: firstName })}
          </Text>
          {assignedPrograms.length === 0 ? (
            <Text className="text-sm text-muted">
              {t('admin.studentSpace.noProgramsGranted', { name: firstName })}
            </Text>
          ) : (
            assignedPrograms.map((item) => (
              <View
                key={item.grant.id}
                className="flex-row items-center rounded-card border border-line bg-surface p-4"
              >
                <View className="min-w-0 flex-1 pr-3">
                  <Text className="font-semibold text-ink">{item.program.title}</Text>
                  <Text className="mt-0.5 text-sm text-muted">
                    {t('admin.studentSpace.onlySeesProgram', { name: firstName })}
                  </Text>
                </View>
                <Pressable
                  onPress={() => void handleRevokeProgram(item)}
                  disabled={busyProgramId === item.program.id}
                  accessibilityRole="button"
                  accessibilityLabel={t('admin.studentSpace.a11yRemove', { title: item.program.title, name: student.name })}
                  hitSlop={8}
                >
                  <Text className="text-sm font-semibold text-red-500">{t('common.remove')}</Text>
                </Pressable>
              </View>
            ))
          )}

          <Text className="mt-2 text-xs font-semibold uppercase tracking-[1.6px] text-primary">
            {t('admin.studentSpace.releaseProgramFor', { name: firstName })}
          </Text>
          <Text className="text-sm text-muted">{t('admin.studentSpace.releaseHintPrograms')}</Text>
          {programs.length === 0 ? (
            <EmptyState
              title={t('admin.studentSpace.noProgramsYet')}
              description={t('admin.studentSpace.createProgramHint')}
            />
          ) : null}
          {availablePrograms.map((program) => (
            <View
              key={program.id}
              className="flex-row items-center rounded-card border border-line bg-surface p-4"
            >
              <View className="min-w-0 flex-1 pr-3">
                <Text className="font-semibold text-ink">{program.title}</Text>
                <Text className="mt-0.5 text-sm text-muted">
                  {t(
                    program.totalLessons === 1
                      ? 'admin.studentSpace.lessonCountOne'
                      : 'admin.studentSpace.lessonCountOther',
                    { count: String(program.totalLessons) },
                  )}
                </Text>
              </View>
              <Pressable
                onPress={() => void handleGrantProgram(program)}
                disabled={busyProgramId != null}
                accessibilityRole="button"
                accessibilityLabel={t('admin.studentSpace.a11yGrant', { title: program.title, name: student.name })}
              >
                <Text className="text-sm font-semibold text-primary">
                  {busyProgramId === program.id ? '...' : t('admin.studentSpace.releaseFor', { name: firstName })}
                </Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : null}
    </AdminShell>
  );
}

function MetricChip({ label }: { label: string }) {
  return (
    <View className="rounded-full bg-primary/10 px-3 py-1">
      <Text className="text-xs font-semibold text-primary">{label}</Text>
    </View>
  );
}
