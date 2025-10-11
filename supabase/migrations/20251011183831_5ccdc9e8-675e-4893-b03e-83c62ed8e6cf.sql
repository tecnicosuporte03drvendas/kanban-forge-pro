-- Dropar funções que referenciam o enum status_tarefa
DROP FUNCTION IF EXISTS public.calculate_task_time() CASCADE;
DROP FUNCTION IF EXISTS public.handle_task_status_change() CASCADE;
DROP FUNCTION IF EXISTS public.reorder_task_positions() CASCADE;

-- Adicionar coluna temporária
ALTER TABLE public.tarefas ADD COLUMN status_temp text;

-- Copiar dados, convertendo 'validada' para 'aprovada'
UPDATE public.tarefas 
SET status_temp = CASE 
  WHEN status::text = 'validada' THEN 'aprovada'
  ELSE status::text
END;

-- Remover a coluna status original
ALTER TABLE public.tarefas DROP COLUMN status;

-- Dropar o enum antigo
DROP TYPE public.status_tarefa;

-- Criar novo enum com 'aprovada' ao invés de 'validada'
CREATE TYPE public.status_tarefa AS ENUM ('criada', 'aceita', 'executando', 'concluida', 'aprovada');

-- Recriar a coluna status com o novo enum
ALTER TABLE public.tarefas ADD COLUMN status public.status_tarefa NOT NULL DEFAULT 'criada';

-- Copiar dados de volta da coluna temporária
UPDATE public.tarefas 
SET status = status_temp::public.status_tarefa;

-- Remover coluna temporária
ALTER TABLE public.tarefas DROP COLUMN status_temp;

-- Recriar função calculate_task_time (com 'aprovada' ao invés de 'validada')
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

-- Recriar função handle_task_status_change (com 'aprovada' ao invés de 'validada')
CREATE OR REPLACE FUNCTION public.handle_task_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Se tarefa voltou para "criada", fechar todas as sessões ativas
  IF NEW.status = 'criada' AND OLD.status != 'criada' THEN
    -- Fechar sessões ativas
    UPDATE public.tarefas_tempo_sessoes 
    SET fim = NOW()
    WHERE tarefa_id = NEW.id 
    AND fim IS NULL;
    
    -- Resetar tempo_inicio e tempo_fim para começar nova contagem
    NEW.tempo_inicio = NULL;
    NEW.tempo_fim = NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recriar função reorder_task_positions
CREATE OR REPLACE FUNCTION public.reorder_task_positions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Se mudou de coluna (status), reorganizar posições
  IF OLD.status != NEW.status THEN
    -- Atualizar posições na coluna origem (fechar gaps)
    UPDATE public.tarefas 
    SET posicao_coluna = posicao_coluna - 1
    WHERE status = OLD.status 
    AND posicao_coluna > OLD.posicao_coluna
    AND empresa_id = NEW.empresa_id;
    
    -- Definir nova posição (final da coluna destino)
    NEW.posicao_coluna = COALESCE((
      SELECT MAX(posicao_coluna) + 1 
      FROM public.tarefas 
      WHERE status = NEW.status 
      AND empresa_id = NEW.empresa_id
      AND id != NEW.id
    ), 0);
  END IF;
  
  RETURN NEW;
END;
$function$;