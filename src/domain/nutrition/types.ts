export const MEAL_TYPES = ['cafe', 'almoco', 'lanche', 'jantar'] as const;

export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  cafe: 'Café da manhã',
  almoco: 'Almoço',
  lanche: 'Lanche',
  jantar: 'Jantar',
};

export interface NutritionMeal {
  readonly id: string;
  readonly planId: string;
  readonly mealType: MealType;
  readonly title: string;
  readonly description?: string;
  readonly timeLabel?: string;
  readonly sortOrder: number;
}

export interface NutritionMacros {
  readonly caloriesKcal?: number;
  readonly proteinG?: number;
  readonly carbsG?: number;
  readonly fatG?: number;
}

export interface NutritionPlan {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly studentUserId?: string;
  readonly createdBy: string;
  readonly isPublished: boolean;
  readonly createdAt: string;
  readonly macros?: NutritionMacros;
  readonly meals: readonly NutritionMeal[];
}

export interface CreateNutritionPlanInput {
  readonly title: string;
  readonly description?: string;
  readonly studentUserId?: string;
  readonly createdBy: string;
  readonly macros?: NutritionMacros;
  readonly meals: readonly {
    readonly mealType: MealType;
    readonly title: string;
    readonly description?: string;
    readonly timeLabel?: string;
  }[];
}

export interface UpdateNutritionPlanInput {
  readonly title: string;
  readonly description?: string;
  readonly macros?: NutritionMacros;
  readonly meals: readonly {
    readonly mealType: MealType;
    readonly title: string;
    readonly description?: string;
    readonly timeLabel?: string;
  }[];
}
