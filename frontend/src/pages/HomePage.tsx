import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

export function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="page-loader">Загрузка...</div>;
  }

  return <Navigate to={isAuthenticated ? '/surveys' : '/login'} replace />;
}
