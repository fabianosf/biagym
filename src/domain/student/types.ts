export const STUDENT_GOALS = [
  'emagrecimento',
  'hipertrofia',
  'condicionamento',
  'saude',
  'mobilidade',
] as const;

export type StudentGoal = (typeof STUDENT_GOALS)[number];

export const STUDENT_GOAL_LABELS: Record<StudentGoal, string> = {
  emagrecimento: 'Emagrecimento',
  hipertrofia: 'Hipertrofia',
  condicionamento: 'Condicionamento',
  saude: 'Saúde e disposição',
  mobilidade: 'Mobilidade e postura',
};

export interface StudentBodyMetrics {
  readonly weightKg: number;
  readonly heightCm: number;
  readonly age: number;
  readonly goal: StudentGoal;
}

export interface StudentProfile {
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly avatarUrl?: string;
  readonly phone?: string;
  readonly metrics: StudentBodyMetrics | null;
  readonly onboardingCompleted: boolean;
}

export interface CompleteOnboardingInput {
  readonly name: string;
  readonly phone: string;
  readonly weightKg: number;
  readonly heightCm: number;
  readonly age: number;
  readonly goal: StudentGoal;
}

export interface BodyLog {
  readonly id: string;
  readonly userId: string;
  readonly weightKg: number;
  readonly notes?: string;
  readonly photoUrl?: string;
  readonly recordedAt: string;
  readonly createdAt: string;
}

export interface CreateBodyLogInput {
  readonly userId: string;
  readonly weightKg: number;
  readonly notes?: string;
  readonly photoUrl?: string;
  readonly recordedAt?: string;
}
