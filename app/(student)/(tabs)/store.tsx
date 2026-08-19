import { AdminProgramsListScreen } from '@/features/admin';
import { useAuth } from '@/features/auth';
import { StoreScreen } from '@/features/programs';

export default function StoreTab() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminProgramsListScreen /> : <StoreScreen />;
}
