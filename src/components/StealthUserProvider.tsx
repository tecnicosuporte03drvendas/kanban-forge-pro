import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useStealth } from '@/hooks/use-stealth';
import type { Usuario } from '@/contexts/AuthContext';

interface StealthUserContextType {
  stealthUser: Usuario | null;
  loading: boolean;
}

const StealthUserContext = createContext<StealthUserContextType | undefined>(undefined);

export const useStealthUser = () => {
  const context = useContext(StealthUserContext);
  if (context === undefined) {
    throw new Error('useStealthUser must be used within a StealthUserProvider');
  }
  return context;
};

interface StealthUserProviderProps {
  children: ReactNode;
}

export const StealthUserProvider: React.FC<StealthUserProviderProps> = ({ children }) => {
  const { empresaId } = useParams();
  const { isStealthMode } = useStealth();
  const [stealthUser, setStealthUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStealthUser = async () => {
      if (!isStealthMode || !empresaId) {
        setLoading(false);
        return;
      }

      try {
        // Buscar o primeiro proprietário ativo da empresa para simular seu acesso
        const { data: usuarios, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('empresa_id', empresaId)
          .eq('tipo_usuario', 'proprietario')
          .eq('ativo', true)
          .limit(1);

        if (error) {
          console.error('❌ Erro ao buscar usuário stealth:', error);
          setLoading(false);
          return;
        }

        if (usuarios && usuarios.length > 0) {
          const usuario = usuarios[0];
          setStealthUser({
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            celular: usuario.celular,
            funcao_empresa: usuario.funcao_empresa,
            tipo_usuario: usuario.tipo_usuario,
            empresa_id: usuario.empresa_id,
            ativo: usuario.ativo
          });
        }
      } catch (error) {
        console.error('❌ Erro ao carregar usuário stealth:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStealthUser();
  }, [isStealthMode, empresaId]);

  const value: StealthUserContextType = {
    stealthUser,
    loading
  };

  return (
    <StealthUserContext.Provider value={value}>
      {children}
    </StealthUserContext.Provider>
  );
};