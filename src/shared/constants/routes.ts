export * from './admin-routes';
export const routes = {
  signIn: '/sign-in',
  signUp: '/sign-up',
  programs: '/',
  progress: '/progress',
  workouts: '/workouts',
  store: '/store',
  profile: '/profile',
  evolution: '/evolution',
  messages: '/messages',
  onboarding: '/onboarding',
  admin: '/admin',
  adminVideos: '/admin/videos',
  adminNutrition: '/admin/nutrition',
  adminSchedule: '/admin/schedule',
  adminStudents: '/admin/students',
} as const;

export function programDetailPath(programId: string): `/programs/${string}` {
  return `/programs/${programId}`;
}

export function programLessonPath(
  programId: string,
  lessonId: string,
): `/programs/${string}/lessons/${string}` {
  return `/programs/${programId}/lessons/${lessonId}`;
}
