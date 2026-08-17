import type { ProgramLevel, UserRole } from '@/domain';

export type ProfileRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  push_notifications_enabled: boolean;
  expo_push_token: string | null;
  push_platform: string | null;
  push_token_updated_at: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  goal: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NutritionPlanRow = {
  id: string;
  title: string;
  description: string | null;
  student_user_id: string | null;
  created_by: string;
  is_published: boolean;
  calories_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  created_at: string;
  updated_at: string;
};

export type NutritionMealRow = {
  id: string;
  plan_id: string;
  meal_type: string;
  title: string;
  description: string | null;
  time_label: string | null;
  sort_order: number;
  created_at: string;
};

export type TrainingSlotRow = {
  id: string;
  student_user_id: string;
  weekday: number;
  start_time: string;
  duration_minutes: number;
  title: string;
  notes: string | null;
  program_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type TrainingCheckinRow = {
  id: string;
  slot_id: string;
  student_user_id: string;
  checkin_date: string;
  created_at: string;
};

export type BodyLogRow = {
  id: string;
  user_id: string;
  weight_kg: number;
  notes: string | null;
  photo_url: string | null;
  recorded_at: string;
  created_at: string;
};

export type CoachMessageRow = {
  id: string;
  student_user_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type ExerciseRow = {
  id: string;
  name: string;
  description: string | null;
  muscle_group: string;
  video_url: string;
  thumbnail_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type TrainingPlanRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  is_published: boolean;
  sort_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type WorkoutExerciseRow = {
  id: string;
  plan_id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  load_kg: number | null;
  rest_seconds: number;
  notes: string | null;
  sort_order: number;
  created_at: string;
};

export type TrainingPlanGrantRow = {
  id: string;
  user_id: string;
  plan_id: string;
  granted_by: string;
  granted_at: string;
};

export type WorkoutSessionRow = {
  id: string;
  user_id: string;
  plan_id: string;
  completed_exercise_ids: string[];
  completed_at: string;
};

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type ProgramRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  cover_url: string;
  trainer_name: string;
  level: ProgramLevel;
  duration_weeks: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type ProgramCategoryRow = {
  program_id: string;
  category_id: string;
};

export type WeekRow = {
  id: string;
  program_id: string;
  week_number: number;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export type LessonRow = {
  id: string;
  program_id: string;
  week_id: string;
  title: string;
  description: string | null;
  video_url: string;
  duration_seconds: number;
  sort_order: number;
  is_free_preview: boolean;
  created_at: string;
  updated_at: string;
};

export type UserProgressRow = {
  id: string;
  user_id: string;
  program_id: string;
  completed_lesson_ids: string[];
  percent_complete: number;
  last_accessed_at: string;
  last_lesson_id: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AccessGrantRow = {
  id: string;
  user_id: string;
  program_id: string;
  granted_by: string;
  granted_at: string;
  expires_at: string | null;
  created_at: string;
};

type TableDefinition<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: TableDefinition<
        ProfileRow,
        {
          id: string;
          name: string;
          email: string;
          role?: UserRole;
          avatar_url?: string | null;
        },
        {
          name?: string;
          email?: string;
          role?: UserRole;
          avatar_url?: string | null;
          push_notifications_enabled?: boolean;
          expo_push_token?: string | null;
          push_platform?: string | null;
          push_token_updated_at?: string | null;
          weight_kg?: number | null;
          height_cm?: number | null;
          age?: number | null;
          goal?: string | null;
          onboarding_completed_at?: string | null;
          updated_at?: string;
        }
      >;
      categories: TableDefinition<
        CategoryRow,
        {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
        },
        {
          name?: string;
          slug?: string;
          description?: string | null;
        }
      >;
      programs: TableDefinition<
        ProgramRow,
        {
          id?: string;
          title: string;
          slug: string;
          description: string;
          cover_url: string;
          trainer_name: string;
          level: ProgramLevel;
          duration_weeks: number;
          is_published?: boolean;
        },
        {
          title?: string;
          slug?: string;
          description?: string;
          cover_url?: string;
          trainer_name?: string;
          level?: ProgramLevel;
          duration_weeks?: number;
          is_published?: boolean;
        }
      >;
      program_categories: TableDefinition<
        ProgramCategoryRow,
        ProgramCategoryRow,
        never
      >;
      weeks: TableDefinition<
        WeekRow,
        {
          id?: string;
          program_id: string;
          week_number: number;
          title?: string | null;
        },
        {
          week_number?: number;
          title?: string | null;
        }
      >;
      lessons: TableDefinition<
        LessonRow,
        {
          id?: string;
          program_id: string;
          week_id: string;
          title: string;
          description?: string | null;
          video_url: string;
          duration_seconds: number;
          sort_order: number;
          is_free_preview?: boolean;
        },
        {
          week_id?: string;
          title?: string;
          description?: string | null;
          video_url?: string;
          duration_seconds?: number;
          sort_order?: number;
          is_free_preview?: boolean;
        }
      >;
      user_progress: TableDefinition<
        UserProgressRow,
        {
          id?: string;
          user_id: string;
          program_id: string;
          completed_lesson_ids?: string[];
          percent_complete?: number;
          last_accessed_at?: string;
          last_lesson_id?: string | null;
          started_at?: string;
          completed_at?: string | null;
        },
        {
          completed_lesson_ids?: string[];
          percent_complete?: number;
          last_accessed_at?: string;
          last_lesson_id?: string | null;
          completed_at?: string | null;
        }
      >;
      access_grants: TableDefinition<
        AccessGrantRow,
        {
          id?: string;
          user_id: string;
          program_id: string;
          granted_by: string;
          granted_at?: string;
          expires_at?: string | null;
        },
        {
          expires_at?: string | null;
        }
      >;
      nutrition_plans: TableDefinition<
        NutritionPlanRow,
        {
          id?: string;
          title: string;
          description?: string | null;
          student_user_id?: string | null;
          created_by: string;
          is_published?: boolean;
          calories_kcal?: number | null;
          protein_g?: number | null;
          carbs_g?: number | null;
          fat_g?: number | null;
        },
        {
          title?: string;
          description?: string | null;
          student_user_id?: string | null;
          is_published?: boolean;
          calories_kcal?: number | null;
          protein_g?: number | null;
          carbs_g?: number | null;
          fat_g?: number | null;
        }
      >;
      nutrition_meals: TableDefinition<
        NutritionMealRow,
        {
          id?: string;
          plan_id: string;
          meal_type: string;
          title: string;
          description?: string | null;
          time_label?: string | null;
          sort_order?: number;
        },
        {
          meal_type?: string;
          title?: string;
          description?: string | null;
          time_label?: string | null;
          sort_order?: number;
        }
      >;
      training_slots: TableDefinition<
        TrainingSlotRow,
        {
          id?: string;
          student_user_id: string;
          weekday: number;
          start_time: string;
          duration_minutes?: number;
          title: string;
          notes?: string | null;
          program_id?: string | null;
          created_by: string;
        },
        {
          student_user_id?: string;
          weekday?: number;
          start_time?: string;
          duration_minutes?: number;
          title?: string;
          notes?: string | null;
          program_id?: string | null;
        }
      >;
      training_checkins: TableDefinition<
        TrainingCheckinRow,
        {
          id?: string;
          slot_id: string;
          student_user_id: string;
          checkin_date: string;
        },
        never
      >;
      body_logs: TableDefinition<
        BodyLogRow,
        {
          id?: string;
          user_id: string;
          weight_kg: number;
          notes?: string | null;
          photo_url?: string | null;
          recorded_at?: string;
        },
        {
          weight_kg?: number;
          notes?: string | null;
          photo_url?: string | null;
        }
      >;
      coach_messages: TableDefinition<
        CoachMessageRow,
        {
          id?: string;
          student_user_id: string;
          sender_id: string;
          body: string;
          read_at?: string | null;
        },
        {
          read_at?: string | null;
        }
      >;
      exercises: TableDefinition<
        ExerciseRow,
        {
          id?: string;
          name: string;
          description?: string | null;
          muscle_group: string;
          video_url?: string;
          thumbnail_url?: string | null;
          created_by: string;
        },
        {
          name?: string;
          description?: string | null;
          muscle_group?: string;
          video_url?: string;
          thumbnail_url?: string | null;
        }
      >;
      training_plans: TableDefinition<
        TrainingPlanRow,
        {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          is_published?: boolean;
          sort_order?: number;
          created_by: string;
        },
        {
          title?: string;
          slug?: string;
          description?: string | null;
          is_published?: boolean;
          sort_order?: number;
        }
      >;
      workout_exercises: TableDefinition<
        WorkoutExerciseRow,
        {
          id?: string;
          plan_id: string;
          exercise_id: string;
          sets?: number;
          reps?: string;
          load_kg?: number | null;
          rest_seconds?: number;
          notes?: string | null;
          sort_order?: number;
        },
        {
          sets?: number;
          reps?: string;
          load_kg?: number | null;
          rest_seconds?: number;
          notes?: string | null;
          sort_order?: number;
        }
      >;
      training_plan_grants: TableDefinition<
        TrainingPlanGrantRow,
        {
          id?: string;
          user_id: string;
          plan_id: string;
          granted_by: string;
          granted_at?: string;
        },
        never
      >;
      workout_sessions: TableDefinition<
        WorkoutSessionRow,
        {
          id?: string;
          user_id: string;
          plan_id: string;
          completed_exercise_ids?: string[];
          completed_at?: string;
        },
        never
      >;
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      has_active_access: { Args: { p_program_id: string }; Returns: boolean };
      can_read_program: { Args: { p_program_id: string }; Returns: boolean };
      can_read_training_plan: { Args: { p_plan_id: string }; Returns: boolean };
      claim_coach_role: { Args: Record<string, never>; Returns: ProfileRow };
      can_self_promote_to_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
