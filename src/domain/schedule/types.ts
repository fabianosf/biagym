export const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
};

export interface TrainingSlot {
  readonly id: string;
  readonly studentUserId: string;
  readonly weekday: Weekday;
  readonly startTime: string;
  readonly durationMinutes: number;
  readonly title: string;
  readonly notes?: string;
  readonly programId?: string;
  readonly createdBy: string;
  readonly checkedInToday?: boolean;
}

export interface TrainingCheckin {
  readonly id: string;
  readonly slotId: string;
  readonly studentUserId: string;
  readonly checkinDate: string;
  readonly createdAt: string;
}

export interface CreateTrainingSlotInput {
  readonly studentUserId: string;
  readonly weekday: Weekday;
  readonly startTime: string;
  readonly durationMinutes: number;
  readonly title: string;
  readonly notes?: string;
  readonly programId?: string;
  readonly createdBy: string;
}

export interface UpdateTrainingSlotInput {
  readonly weekday: Weekday;
  readonly startTime: string;
  readonly durationMinutes: number;
  readonly title: string;
  readonly notes?: string;
}
