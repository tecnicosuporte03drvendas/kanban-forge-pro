-- Corrigir funções para adicionar search_path por segurança
CREATE OR REPLACE FUNCTION calculate_session_minutes()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.fim IS NOT NULL AND NEW.inicio IS NOT NULL THEN
    NEW.minutos_trabalhados = EXTRACT(EPOCH FROM (NEW.fim - NEW.inicio)) / 60;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_task_total_time()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;