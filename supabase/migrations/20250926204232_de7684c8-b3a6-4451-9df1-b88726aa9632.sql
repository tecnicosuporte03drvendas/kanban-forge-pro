-- Remover triggers existentes e criar nova lógica simplificada para cálculo de tempo
DROP TRIGGER IF EXISTS handle_task_status_change_trigger ON public.tarefas;
DROP TRIGGER IF EXISTS calculate_session_minutes_trigger ON public.tarefas_tempo_sessoes;
DROP TRIGGER IF EXISTS update_task_total_time_trigger ON public.tarefas_tempo_sessoes;

-- Criar função simplificada para cálculo de tempo da tarefa
CREATE OR REPLACE FUNCTION public.calculate_task_time()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Se tarefa voltou para "criada", resetar tempos
  IF NEW.status = 'criada' AND OLD.status != 'criada' THEN
    NEW.tempo_inicio = NULL;
    NEW.tempo_fim = NULL;
    NEW.tempo_gasto_minutos = 0;
    
    -- Fechar todas as sessões ativas
    UPDATE public.tarefas_tempo_sessoes 
    SET fim = NOW()
    WHERE tarefa_id = NEW.id 
    AND fim IS NULL;
  END IF;
  
  -- Se tempo_fim foi setado e temos tempo_inicio, calcular diferença
  IF NEW.tempo_fim IS NOT NULL AND NEW.tempo_inicio IS NOT NULL THEN
    NEW.tempo_gasto_minutos = EXTRACT(EPOCH FROM (NEW.tempo_fim - NEW.tempo_inicio)) / 60;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Criar trigger para a função de cálculo de tempo
CREATE TRIGGER calculate_task_time_trigger
  BEFORE UPDATE ON public.tarefas
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_task_time();