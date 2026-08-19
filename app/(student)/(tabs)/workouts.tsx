import { AdminWorkoutsScreen } from '@/features/admin';
import { useAuth } from '@/features/auth';
import { WorkoutListScreen } from '@/features/workouts';

export default function WorkoutsTab() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminWorkoutsScreen /> : <WorkoutListScreen />;
}
