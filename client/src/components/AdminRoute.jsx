import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { Loader } from '@/components/ui/Loader';

export const AdminRoute = ({ children }) => {
  const { user, isReady } = useAuth();

  if (!isReady) return <Loader />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role?.toUpperCase() !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
};
