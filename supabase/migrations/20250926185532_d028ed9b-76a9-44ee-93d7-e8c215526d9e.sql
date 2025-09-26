-- Criar tabela de reuniões
CREATE TABLE public.reunioes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_reuniao DATE NOT NULL,
  horario_inicio TIME WITHOUT TIME ZONE NOT NULL,
  duracao_minutos INTEGER NOT NULL,
  link_reuniao TEXT,
  empresa_id UUID NOT NULL,
  criado_por UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de participantes de reuniões
CREATE TABLE public.reunioes_participantes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reuniao_id UUID NOT NULL,
  usuario_id UUID,
  equipe_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_reuniao FOREIGN KEY (reuniao_id) REFERENCES public.reunioes(id) ON DELETE CASCADE
);

-- Habilitar RLS para reuniões
ALTER TABLE public.reunioes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reunioes_participantes ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para reuniões
CREATE POLICY "Users can view company meetings" 
ON public.reunioes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create company meetings" 
ON public.reunioes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update company meetings" 
ON public.reunioes 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete company meetings" 
ON public.reunioes 
FOR DELETE 
USING (true);

-- Políticas de RLS para participantes de reuniões
CREATE POLICY "Users can view meeting participants" 
ON public.reunioes_participantes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create meeting participants" 
ON public.reunioes_participantes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can delete meeting participants" 
ON public.reunioes_participantes 
FOR DELETE 
USING (true);

-- Trigger para atualizar updated_at nas reuniões
CREATE TRIGGER update_reunioes_updated_at
BEFORE UPDATE ON public.reunioes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();