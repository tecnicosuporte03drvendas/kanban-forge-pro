-- Parte 1: Recriar trigger para cálculo automático de tempo
DROP TRIGGER IF EXISTS calculate_task_time_trigger ON public.tarefas;

CREATE TRIGGER calculate_task_time_trigger
  BEFORE UPDATE ON public.tarefas
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_task_time();

-- Parte 2: Corrigir tarefas existentes com tempo zerado mas que têm tempo_inicio e tempo_fim
UPDATE public.tarefas
SET tempo_gasto_minutos = EXTRACT(EPOCH FROM (tempo_fim - tempo_inicio)) / 60
WHERE tempo_inicio IS NOT NULL 
  AND tempo_fim IS NOT NULL 
  AND (tempo_gasto_minutos IS NULL OR tempo_gasto_minutos = 0);