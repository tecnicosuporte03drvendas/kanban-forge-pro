import { Navigate } from 'react-router-dom';
import { useAuth, TipoUsuario } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: TipoUsuario[];
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = ['master', 'proprietario', 'gestor', 'colaborador'],
  requireAuth = true 
}) => {
  const { usuario, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se requer autenticação e usuário não está logado
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se usuário está logado mas não tem permissão para acessar a rota
  if (isAuthenticated && usuario && !allowedRoles.includes(usuario.tipo_usuario)) {
    // Redirecionar baseado no tipo de usuário
    switch (usuario.tipo_usuario) {
      case 'master':
        return <Navigate to="/admin" replace />;
      case 'proprietario':
      case 'gestor':
      case 'colaborador':
        return <Navigate to="/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
};