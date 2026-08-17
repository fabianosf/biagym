export const adminRoutes = {
  home: '/admin',
  programs: '/admin/programs',
  programNew: '/admin/programs/new',
  programDetail: (id: string) => `/admin/programs/${id}` as const,
  programEdit: (id: string) => `/admin/programs/${id}/edit` as const,
  lessonNew: (programId: string, weekId?: string) =>
    weekId
      ? (`/admin/programs/${programId}/lessons/new?weekId=${weekId}` as const)
      : (`/admin/programs/${programId}/lessons/new` as const),
  lessonEdit: (programId: string, lessonId: string) =>
    `/admin/programs/${programId}/lessons/${lessonId}` as const,
  access: '/admin/access',
  nutrition: '/admin/nutrition',
  schedule: '/admin/schedule',
  students: '/admin/students',
  messages: '/admin/messages',
  workouts: '/admin/workouts',
  workoutDetail: (id: string) => `/admin/workouts/${id}` as const,
  exercises: '/admin/exercises',
  workoutAccess: '/admin/workout-access',
} as const;
