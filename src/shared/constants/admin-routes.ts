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
  nutritionFor: (studentId: string) => `/admin/nutrition?studentId=${studentId}` as const,
  schedule: '/admin/schedule',
  scheduleFor: (studentId: string) => `/admin/schedule?studentId=${studentId}` as const,
  students: '/admin/students',
  studentSpace: (id: string) => `/admin/students/${id}` as const,
  messages: '/admin/messages',
  messagesFor: (studentId: string) => `/admin/messages?studentId=${studentId}` as const,
  workouts: '/admin/workouts',
  workoutsFor: (studentId: string) => `/admin/workouts?studentId=${studentId}` as const,
  workoutDetail: (id: string, studentId?: string) =>
    studentId
      ? (`/admin/workouts/${id}?studentId=${studentId}` as const)
      : (`/admin/workouts/${id}` as const),
  exercises: '/admin/exercises',
  exercisesFor: (studentId: string) => `/admin/exercises?studentId=${studentId}` as const,
  workoutAccess: '/admin/workout-access',
} as const;
