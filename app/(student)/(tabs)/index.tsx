import { TrainerDashboardScreen } from '@/features/admin';
import { useAuth } from '@/features/auth';
import { HomeScreen } from '@/features/programs';

export default function IndexTab() {
  const { isAdmin } = useAuth();
  return isAdmin ? <TrainerDashboardScreen /> : <HomeScreen />;
}
