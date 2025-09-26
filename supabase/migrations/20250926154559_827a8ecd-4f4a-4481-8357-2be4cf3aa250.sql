-- Adicionar colunas de tempo na tabela tarefas
ALTER TABLE public.tarefas 
ADD COLUMN tempo_inicio TIMESTAMP WITH TIME ZONE,
ADD COLUMN tempo_fim TIMESTAMP WITH TIME ZONE,
ADD COLUMN tempo_gasto_minutos INTEGER DEFAULT 0;

-- Criar tabela para sessões de trabalho
CREATE TABLE public.tarefas_tempo_sessoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tarefa_id UUID NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL,
  inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fim TIMESTAMP WITH TIME ZONE,
  minutos_trabalhados INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.tarefas_tempo_sessoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para sessões de tempo
CREATE POLICY "Users can view task time sessions" 
ON public.tarefas_tempo_sessoes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create task time sessions" 
ON public.tarefas_tempo_sessoes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update task time sessions" 
ON public.tarefas_tempo_sessoes 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete task time sessions" 
ON public.tarefas_tempo_sessoes 
FOR DELETE 
USING (true);

-- Função para calcular minutos trabalhados
CREATE OR REPLACE FUNCTION calculate_session_minutes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.fim IS NOT NULL AND NEW.inicio IS NOT NULL THEN
    NEW.minutos_trabalhados = EXTRACT(EPOCH FROM (NEW.fim - NEW.inicio)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular automaticamente os minutos da sessão
CREATE TRIGGER calculate_session_minutes_trigger
  BEFORE INSERT OR UPDATE ON public.tarefas_tempo_sessoes
  FOR EACH ROW
  EXECUTE FUNCTION calculate_session_minutes();

-- Função para atualizar tempo total da tarefa
CREATE OR REPLACE FUNCTION update_task_total_time()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar tempo total gasto na tarefa
  UPDATE public.tarefas 
  SET tempo_gasto_minutos = (
    SELECT COALESCE(SUM(minutos_trabalhados), 0)
    FROM public.tarefas_tempo_sessoes 
    WHERE tarefa_id = COALESCE(NEW.tarefa_id, OLD.tarefa_id)
    AND fim IS NOT NULL
  )
  WHERE id = COALESCE(NEW.tarefa_id, OLD.tarefa_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar tempo total quando sessão for finalizada
CREATE TRIGGER update_task_total_time_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.tarefas_tempo_sessoes
  FOR EACH ROW
  EXECUTE FUNCTION update_task_total_time();