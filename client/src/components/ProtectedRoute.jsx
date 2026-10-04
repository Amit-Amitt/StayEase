import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { Loader } from '@/components/ui/Loader';

export const ProtectedRoute = ({ children, roles }) => {
  const { user, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) return <Loader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role?.toUpperCase())) return <Navigate to="/" replace />;
  return children || <Outlet />;
};
