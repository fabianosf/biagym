import type { StudentProfile } from '@/domain/student';
import { getStudentProfileById } from '@/services';
import { adminRoutes } from '@/shared/constants/admin-routes';
import { resolveRouteParam } from '@/shared/utils';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';

export function useAdminFocusedStudent() {
  const router = useRouter();
  const params = useLocalSearchParams<{ studentId?: string | string[] }>();
  const focusedStudentId = resolveRouteParam(params.studentId);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [isResolving, setIsResolving] = useState(Boolean(focusedStudentId));

  useEffect(() => {
    if (!focusedStudentId) {
      setStudent(null);
      setIsResolving(false);
      return;
    }

    let cancelled = false;
    setIsResolving(true);
    void getStudentProfileById(focusedStudentId)
      .then((profile) => {
        if (!cancelled) {
          setStudent(profile);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStudent(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsResolving(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [focusedStudentId]);

  function goBackToStudent() {
    if (focusedStudentId) {
      router.replace(adminRoutes.studentSpace(focusedStudentId) as Href);
      return;
    }
    router.back();
  }

  return { focusedStudentId, student, isResolving, goBackToStudent };
}
