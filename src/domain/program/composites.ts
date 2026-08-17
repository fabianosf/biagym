import type { Category, Lesson, Program, Week } from './types';

export interface ProgramWithCategories extends Program {
  readonly categories: readonly Category[];
}

export interface WeekWithLessons {
  readonly week: Week;
  readonly lessons: readonly Lesson[];
}

/** Programa com semanas ordenadas e aulas aninhadas. */
export interface ProgramDetail {
  readonly program: ProgramWithCategories;
  readonly weeks: readonly WeekWithLessons[];
}

/** Visão resumida para catálogo (sem conteúdo completo das semanas). */
export interface ProgramSummary extends Program {
  readonly categories: readonly Category[];
  readonly totalLessons: number;
  readonly totalDurationSeconds: number;
}

export interface LessonWithContext {
  readonly lesson: Lesson;
  readonly week: Week;
  readonly program: Program;
}
