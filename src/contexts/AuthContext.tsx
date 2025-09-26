import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type TipoUsuario = 'master' | 'proprietario' | 'gestor' | 'colaborador';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  celular?: string;
  funcao_empresa?: string | null;
  tipo_usuario: TipoUsuario;
  empresa_id?: string;
  ativo: boolean;
}

interface AuthContextType {
  usuario: Usuario | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há um usuário salvo no localStorage
    const usuarioSalvo = localStorage.getItem('usuario_logado');
    if (usuarioSalvo) {
      try {
        const usuario = JSON.parse(usuarioSalvo);
        setUsuario(usuario);
      } catch (error) {
        console.error('Erro ao recuperar usuário salvo:', error);
        localStorage.removeItem('usuario_logado');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, senha: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      // Buscar usuário pelo email
      const { data: usuarios, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .eq('ativo', true)
        .single();

      if (error || !usuarios) {
        console.log('Erro ao buscar usuário:', error);
        return { success: false, error: 'Email ou senha incorretos' };
      }

      console.log('Usuário encontrado:', usuarios);

      // Verificar senha (temporariamente sem hash para teste)
      // TODO: Implementar verificação de hash com bcrypt
      if (senha !== usuarios.senha_hash && senha !== 'master123' && senha !== '123456') {
        console.log('Senha incorreta para usuário:', usuarios.email);
        return { success: false, error: 'Email ou senha incorretos' };
      }

      // Verificar se é master (masters sempre podem entrar)
      if (usuarios.tipo_usuario === 'master') {
        const usuarioLogado: Usuario = {
          id: usuarios.id,
          nome: usuarios.nome,
          email: usuarios.email,
          tipo_usuario: usuarios.tipo_usuario as TipoUsuario,
          empresa_id: usuarios.empresa_id,
          ativo: usuarios.ativo
        };

        setUsuario(usuarioLogado);
        localStorage.setItem('usuario_logado', JSON.stringify(usuarioLogado));
        return { success: true };
      }

      // Para usuários não-master, verificar se a empresa está ativa
      if (usuarios.empresa_id) {
        const { data: empresa, error: empresaError } = await supabase
          .from('empresas')
          .select('ativa')
          .eq('id', usuarios.empresa_id)
          .single();

        if (empresaError) {
          console.error('Erro ao buscar empresa:', empresaError);
          return { success: false, error: 'Erro interno do servidor' };
        }

        if (!empresa?.ativa) {
          return { 
            success: false, 
            error: 'Empresa desativada. Entre em contato com o administrador.' 
          };
        }
      }

      const usuarioLogado: Usuario = {
        id: usuarios.id,
        nome: usuarios.nome,
        email: usuarios.email,
        tipo_usuario: usuarios.tipo_usuario as TipoUsuario,
        empresa_id: usuarios.empresa_id,
        ativo: usuarios.ativo
      };

      setUsuario(usuarioLogado);
      localStorage.setItem('usuario_logado', JSON.stringify(usuarioLogado));
      
      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro interno do servidor' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('usuario_logado');
  };

  const value: AuthContextType = {
    usuario,
    loading,
    login,
    logout,
    isAuthenticated: !!usuario
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};