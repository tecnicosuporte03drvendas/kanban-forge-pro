-- Adicionar campos celular e funcao_empresa à tabela usuarios
ALTER TABLE public.usuarios 
ADD COLUMN celular TEXT NOT NULL DEFAULT '',
ADD COLUMN funcao_empresa TEXT;

-- Atualizar usuários existentes para não ter celular vazio
UPDATE public.usuarios SET celular = '+55 11 99999-9999' WHERE celular = '';

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.usuarios.celular IS 'Número de celular do usuário no formato brasileiro';
COMMENT ON COLUMN public.usuarios.funcao_empresa IS 'Função/cargo específico do usuário na empresa';