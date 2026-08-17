import type { Program, ProgramSummary } from '../program';
import type { EntityId } from '../shared';
import type { User } from '../user';
import type { AccessGrant, ProgressStatus, UserProgress } from './types';

export interface ProgramWithProgress {
  readonly program: Program | ProgramSummary;
  readonly progress: UserProgress | null;
  readonly status: ProgressStatus;
}

export interface UserProgramAccess {
  readonly user: Pick<User, 'id' | 'name' | 'email'>;
  readonly programId: EntityId;
  readonly grant: AccessGrant | null;
  readonly hasAccess: boolean;
}

export interface AccessGrantWithContext extends AccessGrant {
  readonly userName: string;
  readonly userEmail: string;
  readonly programTitle: string;
}

export interface StudentProgressOverview {
  readonly userId: EntityId;
  readonly programsInProgress: number;
  readonly programsCompleted: number;
  readonly items: readonly ProgramWithProgress[];
}
