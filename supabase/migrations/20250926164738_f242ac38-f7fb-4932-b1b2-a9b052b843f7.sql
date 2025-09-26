-- Adicionar coluna para ordem dos cards na coluna
ALTER TABLE public.tarefas 
ADD COLUMN posicao_coluna INTEGER DEFAULT 0;

-- Criar índice para performance nas consultas ordenadas
CREATE INDEX idx_tarefas_status_posicao ON public.tarefas(status, posicao_coluna);

-- Atualizar trigger para fechar sessões quando tarefa volta para "criada"
CREATE OR REPLACE FUNCTION public.handle_task_status_change()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para handle status changes
DROP TRIGGER IF EXISTS trigger_task_status_change ON public.tarefas;
CREATE TRIGGER trigger_task_status_change
  BEFORE UPDATE ON public.tarefas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_task_status_change();

-- Função para reordenar posições quando card é movido
CREATE OR REPLACE FUNCTION public.reorder_task_positions()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para reordenar posições
DROP TRIGGER IF EXISTS trigger_reorder_positions ON public.tarefas;
CREATE TRIGGER trigger_reorder_positions
  BEFORE UPDATE ON public.tarefas
  FOR EACH ROW
  EXECUTE FUNCTION public.reorder_task_positions();