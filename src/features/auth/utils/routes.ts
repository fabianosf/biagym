import type { AuthUser } from '@/domain';
import type { Href } from 'expo-router';

import { routes } from '@/shared/constants/routes';

export function getAuthenticatedHomeRoute(user: AuthUser): Href {
  if (user.role === 'student' && !user.onboardingCompleted) {
    return routes.onboarding as Href;
  }

  return routes.programs;
}
