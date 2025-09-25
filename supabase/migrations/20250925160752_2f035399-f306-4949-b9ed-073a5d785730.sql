-- Remover todas as políticas RLS existentes que causam recursão infinita
DROP POLICY IF EXISTS "Usuarios - Master pode ver todos" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios - Proprietário/Gestor veem usuários da empresa" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios - Colaborador vê apenas a si mesmo" ON public.usuarios;
DROP POLICY IF EXISTS "Empresas - Master pode ver todas" ON public.empresas;
DROP POLICY IF EXISTS "Empresas - Proprietário/Gestor/Colaborador veem apenas sua empresa" ON public.empresas;

-- Desabilitar RLS temporariamente para permitir o login personalizado
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas DISABLE ROW LEVEL SECURITY;

-- Criar políticas simples para permitir acesso público às tabelas durante autenticação personalizada
-- (Como estamos usando autenticação via tabela, não via Supabase Auth)
CREATE POLICY "Allow public access to usuarios" ON public.usuarios FOR ALL USING (true);
CREATE POLICY "Allow public access to empresas" ON public.empresas FOR ALL USING (true);

-- Reabilitar RLS com as novas políticas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;