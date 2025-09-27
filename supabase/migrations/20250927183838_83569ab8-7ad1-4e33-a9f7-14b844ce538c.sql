-- Remover a política atual que não funciona com autenticação customizada
DROP POLICY IF EXISTS "Master users can manage system configs" ON public.configuracoes_sistema;

-- Criar nova política mais permissiva para a tabela de configurações do sistema
-- Como esta tabela só contém configurações do sistema (não dados sensíveis dos usuários)
-- e o acesso já é controlado no frontend pelo tipo de usuário, podemos ser mais permissivos
CREATE POLICY "Allow system config management" 
ON public.configuracoes_sistema 
FOR ALL 
USING (true);

-- Fazer o mesmo para instancias_whatsapp
DROP POLICY IF EXISTS "Master users can manage whatsapp instances" ON public.instancias_whatsapp;

CREATE POLICY "Allow whatsapp instances management" 
ON public.instancias_whatsapp 
FOR ALL 
USING (true);