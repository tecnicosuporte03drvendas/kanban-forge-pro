import { useAuth } from '@/contexts/AuthContext';
import { useStealthUser } from '@/components/StealthUserProvider';
import { useStealth } from '@/hooks/use-stealth';

/**
 * Hook que retorna o usuário efetivo baseado no contexto:
 * - Em modo stealth: retorna o usuário simulado da empresa
 * - Em modo normal: retorna o usuário autenticado
 */
export const useEffectiveUser = () => {
  const { usuario: authUser, ...authRest } = useAuth();
  
  try {
    const { stealthUser, loading: stealthLoading } = useStealthUser();
    const { isStealthMode } = useStealth();

    const effectiveUser = isStealthMode ? stealthUser : authUser;
    const loading = isStealthMode ? stealthLoading : false;

    return {
      usuario: effectiveUser,
      loading,
      isStealthMode,
      originalUser: authUser,
      simulatedUser: stealthUser,
      ...authRest
    };
  } catch {
    // Se não estiver dentro do StealthUserProvider, retorna apenas os dados de auth
    return {
      usuario: authUser,
      loading: false,
      isStealthMode: false,
      originalUser: authUser,
      simulatedUser: null,
      ...authRest
    };
  }
};