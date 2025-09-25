-- Criar enum para tipos de usuário
CREATE TYPE public.tipo_usuario AS ENUM ('master', 'proprietario', 'gestor', 'colaborador');

-- Criar tabela de empresas
CREATE TABLE public.empresas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cnpj TEXT,
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT NOT NULL,
    criado_por UUID NOT NULL,
    ativa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de usuários
CREATE TABLE public.usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    tipo_usuario tipo_usuario NOT NULL,
    empresa_id UUID REFERENCES public.empresas(id),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar FK para criado_por após criar tabela usuarios
ALTER TABLE public.empresas 
ADD CONSTRAINT fk_empresas_criado_por 
FOREIGN KEY (criado_por) REFERENCES public.usuarios(id);

-- Habilitar RLS
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para empresas
CREATE POLICY "Empresas - Master pode ver todas" ON public.empresas
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id = auth.uid() AND tipo_usuario = 'master'
    )
);

CREATE POLICY "Empresas - Proprietário/Gestor/Colaborador veem apenas sua empresa" ON public.empresas
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id = auth.uid() AND empresa_id = empresas.id
    )
);

-- Políticas RLS para usuarios
CREATE POLICY "Usuarios - Master pode ver todos" ON public.usuarios
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.usuarios u2
        WHERE u2.id = auth.uid() AND u2.tipo_usuario = 'master'
    )
);

CREATE POLICY "Usuarios - Proprietário/Gestor veem usuários da empresa" ON public.usuarios
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.usuarios u2
        WHERE u2.id = auth.uid() 
        AND u2.empresa_id = usuarios.empresa_id
        AND u2.tipo_usuario IN ('proprietario', 'gestor')
    )
);

CREATE POLICY "Usuarios - Colaborador vê apenas a si mesmo" ON public.usuarios
FOR SELECT USING (
    id = auth.uid()
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_empresas_updated_at
    BEFORE UPDATE ON public.empresas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON public.usuarios
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir usuário master padrão (senha: master123)
INSERT INTO public.usuarios (nome, email, senha_hash, tipo_usuario) 
VALUES ('Master Admin', 'master@sistema.com', '$2b$10$rQJ5lQZ8yQZ8yQZ8yQZ8yOFKrQJ5lQZ8yQZ8yQZ8yQZ8yQZ8yQZ8y', 'master');