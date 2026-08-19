import type { StudentProfile } from '@/domain/student';
import {
  adminListAllUserProgress,
  adminListAllWorkoutSessions,
  listAdminPrograms,
  listCoupons,
  listStudentProfiles,
} from '@/services';
import { useCallback, useEffect, useState } from 'react';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const QUIET_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export type StudentActivity = {
  student: StudentProfile;
  lastActivity: string | null;
};

export type RankedStudent = {
  student: StudentProfile;
  sessionCount: number;
};

export type CompletionByProgram = {
  title: string;
  averagePercent: number;
  studentCount: number;
};

export type DailySessionCount = {
  dayStart: number;
  count: number;
};

/** Dados agregados de todos os alunos, compartilhados entre o painel admin e o resumo no Início da treinadora. */
export function useAdminOverview() {
  const [activities, setActivities] = useState<StudentActivity[]>([]);
  const [weeklyRanking, setWeeklyRanking] = useState<RankedStudent[]>([]);
  const [weeklySessionsCount, setWeeklySessionsCount] = useState(0);
  const [dailySessionCounts, setDailySessionCounts] = useState<DailySessionCount[]>([]);
  const [completionByProgram, setCompletionByProgram] = useState<CompletionByProgram[]>([]);
  const [overallCompletion, setOverallCompletion] = useState<number | null>(null);
  const [couponCount, setCouponCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [students, progress, sessions, programs, coupons] = await Promise.all([
        listStudentProfiles(),
        adminListAllUserProgress(),
        adminListAllWorkoutSessions(200),
        listAdminPrograms(),
        listCoupons().catch(() => []),
      ]);

      const lastActivityByUser = new Map<string, string>();
      const bump = (userId: string, iso: string) => {
        const current = lastActivityByUser.get(userId);
        if (!current || new Date(iso).getTime() > new Date(current).getTime()) {
          lastActivityByUser.set(userId, iso);
        }
      };
      for (const item of progress) {
        bump(item.userId, item.lastAccessedAt);
      }
      for (const session of sessions) {
        bump(session.userId, session.completedAt);
      }

      setActivities(
        students.map((student) => ({
          student,
          lastActivity: lastActivityByUser.get(student.userId) ?? null,
        })),
      );

      const now = Date.now();
      const sessionCountByUser = new Map<string, number>();
      let weeklyTotal = 0;
      for (const session of sessions) {
        if (now - new Date(session.completedAt).getTime() < WEEK_MS) {
          sessionCountByUser.set(session.userId, (sessionCountByUser.get(session.userId) ?? 0) + 1);
          weeklyTotal += 1;
        }
      }
      setWeeklySessionsCount(weeklyTotal);

      const today = startOfDay(new Date());
      const countByDay = new Map<number, number>();
      for (const session of sessions) {
        const dayStart = startOfDay(new Date(session.completedAt));
        if (today - dayStart < 7 * DAY_MS && dayStart <= today) {
          countByDay.set(dayStart, (countByDay.get(dayStart) ?? 0) + 1);
        }
      }
      setDailySessionCounts(
        Array.from({ length: 7 }, (_, index) => {
          const dayStart = today - (6 - index) * DAY_MS;
          return { dayStart, count: countByDay.get(dayStart) ?? 0 };
        }),
      );

      const studentById = new Map(students.map((student) => [student.userId, student]));
      setWeeklyRanking(
        [...sessionCountByUser.entries()]
          .map(([userId, sessionCount]) => ({ student: studentById.get(userId), sessionCount }))
          .filter((item): item is RankedStudent => Boolean(item.student))
          .sort((a, b) => b.sessionCount - a.sessionCount)
          .slice(0, 5),
      );

      setCouponCount(coupons.length);

      if (progress.length > 0) {
        const total = progress.reduce((sum, item) => sum + item.percentComplete, 0);
        setOverallCompletion(Math.round(total / progress.length));
      } else {
        setOverallCompletion(null);
      }

      const byProgram = new Map<string, { total: number; count: number }>();
      for (const item of progress) {
        const entry = byProgram.get(item.programId) ?? { total: 0, count: 0 };
        entry.total += item.percentComplete;
        entry.count += 1;
        byProgram.set(item.programId, entry);
      }
      const programTitleById = new Map(programs.map((program) => [program.id, program.title]));
      setCompletionByProgram(
        [...byProgram.entries()]
          .map(([programId, { total, count }]) => ({
            title: programTitleById.get(programId) ?? 'Programa',
            averagePercent: Math.round(total / count),
            studentCount: count,
          }))
          .sort((a, b) => a.averagePercent - b.averagePercent),
      );
    } catch {
      setActivities([]);
      setWeeklyRanking([]);
      setWeeklySessionsCount(0);
      setDailySessionCounts([]);
      setCompletionByProgram([]);
      setOverallCompletion(null);
      setCouponCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const now = Date.now();
  const activeThisWeek = activities.filter(
    (item) => item.lastActivity && now - new Date(item.lastActivity).getTime() < WEEK_MS,
  ).length;
  const quiet = activities
    .filter(
      (item) => !item.lastActivity || now - new Date(item.lastActivity).getTime() >= QUIET_THRESHOLD_MS,
    )
    .sort((a, b) => {
      const aTime = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
      const bTime = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
      return aTime - bTime;
    });

  return {
    isLoading,
    activities,
    activeThisWeek,
    quiet,
    weeklyRanking,
    weeklySessionsCount,
    dailySessionCounts,
    completionByProgram,
    overallCompletion,
    couponCount,
    reload: load,
  };
}
