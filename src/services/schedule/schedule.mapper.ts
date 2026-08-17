import type { TrainingSlot, Weekday } from '@/domain/schedule';
import { WEEKDAYS } from '@/domain/schedule';

import type { TrainingSlotRow } from '../supabase/types';

function parseWeekday(value: number): Weekday {
  return WEEKDAYS.includes(value as Weekday) ? (value as Weekday) : 1;
}

export function formatSlotTime(value: string): string {
  return value.slice(0, 5);
}

export function mapTrainingSlotRow(row: TrainingSlotRow): TrainingSlot {
  return {
    id: row.id,
    studentUserId: row.student_user_id,
    weekday: parseWeekday(row.weekday),
    startTime: formatSlotTime(row.start_time),
    durationMinutes: row.duration_minutes,
    title: row.title,
    notes: row.notes ?? undefined,
    programId: row.program_id ?? undefined,
    createdBy: row.created_by,
  };
}
