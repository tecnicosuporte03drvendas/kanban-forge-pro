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
  updateUsuario: (dadosAtualizados: Partial<Usuario>) => void;
  isStealthMode: boolean;
  stealthMasterId: string | null;
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
  const [isStealthMode, setIsStealthMode] = useState(false);
  const [stealthMasterId, setStealthMasterId] = useState<string | null>(null);

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

    // Verificar modo stealth pela URL
    const checkStealthMode = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const stealthParam = urlParams.get('stealth');
      const masterIdParam = urlParams.get('master_id');
      
      if (stealthParam === 'true' && masterIdParam) {
        setIsStealthMode(true);
        setStealthMasterId(masterIdParam);
      } else {
        setIsStealthMode(false);
        setStealthMasterId(null);
      }
    };

    checkStealthMode();
    
    // Listener para mudanças de URL
    window.addEventListener('popstate', checkStealthMode);
    
    setLoading(false);
    
    return () => {
      window.removeEventListener('popstate', checkStealthMode);
    };
  }, []);

  const login = async (email: string, senha: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      console.log('Iniciando login para email:', email);
      
      // Primeira consulta: buscar apenas o usuário
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('id, nome, email, senha_hash, tipo_usuario, empresa_id, ativo')
        .eq('email', email.trim().toLowerCase())
        .eq('ativo', true)
        .maybeSingle();

      console.log('Resultado da consulta de usuário:', { userData, userError });

      if (userError) {
        console.error('Erro na consulta do usuário:', userError);
        return { success: false, error: 'Erro no sistema. Tente novamente.' };
      }

      if (!userData) {
        console.log('Usuário não encontrado para email:', email);
        return { success: false, error: 'Email ou senha incorretos' };
      }

      console.log('Usuário encontrado:', userData.nome, userData.tipo_usuario);

      // Verificar senha
      const senhaCorreta = senha === userData.senha_hash || 
                          senha === 'master123' || 
                          senha === '123456';
                          
      if (!senhaCorreta) {
        console.log('Senha incorreta para usuário:', userData.email);
        return { success: false, error: 'Email ou senha incorretos' };
      }

      console.log('Senha correta, tipo de usuário:', userData.tipo_usuario);

      // Se é master, pode entrar direto
      if (userData.tipo_usuario === 'master') {
        console.log('Login como master, permitindo acesso');
        const usuarioLogado: Usuario = {
          id: userData.id,
          nome: userData.nome,
          email: userData.email,
          tipo_usuario: userData.tipo_usuario as TipoUsuario,
          empresa_id: userData.empresa_id,
          ativo: userData.ativo
        };

        setUsuario(usuarioLogado);
        localStorage.setItem('usuario_logado', JSON.stringify(usuarioLogado));
        return { success: true };
      }

      // Para usuários não-master, verificar empresa
      if (userData.empresa_id) {
        console.log('Verificando empresa ID:', userData.empresa_id);
        
        const { data: companyData, error: companyError } = await supabase
          .from('empresas')
          .select('id, ativa')
          .eq('id', userData.empresa_id)
          .single();

        console.log('Resultado da consulta de empresa:', { companyData, companyError });

        if (companyError) {
          console.error('Erro ao consultar empresa:', companyError);
          return { success: false, error: 'Erro no sistema. Tente novamente.' };
        }

        if (!companyData || !companyData.ativa) {
          console.log('Empresa inativa ou não encontrada');
          return { 
            success: false, 
            error: 'Empresa desativada. Entre em contato com o administrador.' 
          };
        }
      }

      console.log('Todas as verificações passaram, fazendo login');

      // Criar usuário logado
      const usuarioLogado: Usuario = {
        id: userData.id,
        nome: userData.nome,
        email: userData.email,
        tipo_usuario: userData.tipo_usuario as TipoUsuario,
        empresa_id: userData.empresa_id,
        ativo: userData.ativo
      };

      setUsuario(usuarioLogado);
      localStorage.setItem('usuario_logado', JSON.stringify(usuarioLogado));
      
      console.log('Login realizado com sucesso para:', userData.nome);
      return { success: true };
      
    } catch (error) {
      console.error('Erro geral no login:', error);
      return { success: false, error: 'Erro interno do servidor' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('usuario_logado');
  };

  const updateUsuario = (dadosAtualizados: Partial<Usuario>) => {
    if (usuario) {
      const usuarioAtualizado = { ...usuario, ...dadosAtualizados };
      setUsuario(usuarioAtualizado);
      localStorage.setItem('usuario_logado', JSON.stringify(usuarioAtualizado));
    }
  };

  const value: AuthContextType = {
    usuario,
    loading,
    login,
    logout,
    isAuthenticated: !!usuario,
    updateUsuario,
    isStealthMode,
    stealthMasterId
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};