-- Create enum for task priority
CREATE TYPE public.prioridade_tarefa AS ENUM ('baixa', 'media', 'alta', 'urgente');

-- Create enum for task status
CREATE TYPE public.status_tarefa AS ENUM ('criada', 'assumida', 'executando', 'concluida', 'validada');

-- Create tarefas table
CREATE TABLE public.tarefas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  prioridade prioridade_tarefa NOT NULL DEFAULT 'media',
  data_conclusao DATE NOT NULL,
  horario_conclusao TIME NOT NULL DEFAULT '18:00:00',
  status status_tarefa NOT NULL DEFAULT 'criada',
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  criado_por UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tarefas_responsaveis table (N:M relationship for users and teams)
CREATE TABLE public.tarefas_responsaveis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tarefa_id UUID NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  equipe_id UUID REFERENCES public.equipes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_responsavel CHECK (
    (usuario_id IS NOT NULL AND equipe_id IS NULL) OR 
    (usuario_id IS NULL AND equipe_id IS NOT NULL)
  )
);

-- Create tarefas_checklists table
CREATE TABLE public.tarefas_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tarefa_id UUID NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tarefas_checklist_itens table
CREATE TABLE public.tarefas_checklist_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES public.tarefas_checklists(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  concluido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tarefas_comentarios table
CREATE TABLE public.tarefas_comentarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tarefa_id UUID NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  comentario TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tarefas_atividades table
CREATE TABLE public.tarefas_atividades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tarefa_id UUID NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  acao TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas_responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas_checklist_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas_atividades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tarefas
CREATE POLICY "Users can view company tasks" ON public.tarefas
  FOR SELECT USING (true);

CREATE POLICY "Users can create company tasks" ON public.tarefas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update company tasks" ON public.tarefas
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete company tasks" ON public.tarefas
  FOR DELETE USING (true);

-- Create RLS policies for tarefas_responsaveis
CREATE POLICY "Users can view task responsibles" ON public.tarefas_responsaveis
  FOR SELECT USING (true);

CREATE POLICY "Users can create task responsibles" ON public.tarefas_responsaveis
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete task responsibles" ON public.tarefas_responsaveis
  FOR DELETE USING (true);

-- Create RLS policies for tarefas_checklists
CREATE POLICY "Users can manage task checklists" ON public.tarefas_checklists
  FOR ALL USING (true);

-- Create RLS policies for tarefas_checklist_itens
CREATE POLICY "Users can manage checklist items" ON public.tarefas_checklist_itens
  FOR ALL USING (true);

-- Create RLS policies for tarefas_comentarios
CREATE POLICY "Users can manage task comments" ON public.tarefas_comentarios
  FOR ALL USING (true);

-- Create RLS policies for tarefas_atividades
CREATE POLICY "Users can manage task activities" ON public.tarefas_atividades
  FOR ALL USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_tarefas_updated_at
  BEFORE UPDATE ON public.tarefas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tarefas_checklists_updated_at
  BEFORE UPDATE ON public.tarefas_checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tarefas_checklist_itens_updated_at
  BEFORE UPDATE ON public.tarefas_checklist_itens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_tarefas_empresa_id ON public.tarefas(empresa_id);
CREATE INDEX idx_tarefas_status ON public.tarefas(status);
CREATE INDEX idx_tarefas_responsaveis_tarefa_id ON public.tarefas_responsaveis(tarefa_id);
CREATE INDEX idx_tarefas_comentarios_tarefa_id ON public.tarefas_comentarios(tarefa_id);
CREATE INDEX idx_tarefas_atividades_tarefa_id ON public.tarefas_atividades(tarefa_id);