-- Criar função para buscar tarefa por título e responsável
CREATE OR REPLACE FUNCTION public.buscar_tarefa_por_responsavel(
  p_titulo TEXT,
  p_usuario_id UUID
)
RETURNS TABLE (
  id UUID,
  titulo TEXT,
  descricao TEXT,
  prioridade prioridade_tarefa,
  status status_tarefa,
  data_conclusao DATE,
  horario_conclusao TIME,
  criado_por UUID,
  empresa_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  arquivada BOOLEAN,
  posicao_coluna INTEGER,
  tempo_inicio TIMESTAMPTZ,
  tempo_fim TIMESTAMPTZ,
  tempo_gasto_minutos INTEGER,
  tarefa_recorrente_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    t.id,
    t.titulo,
    t.descricao,
    t.prioridade,
    t.status,
    t.data_conclusao,
    t.horario_conclusao,
    t.criado_por,
    t.empresa_id,
    t.created_at,
    t.updated_at,
    t.arquivada,
    t.posicao_coluna,
    t.tempo_inicio,
    t.tempo_fim,
    t.tempo_gasto_minutos,
    t.tarefa_recorrente_id
  FROM public.tarefas t
  INNER JOIN public.tarefas_responsaveis tr ON t.id = tr.tarefa_id
  WHERE t.titulo ILIKE p_titulo
    AND tr.usuario_id = p_usuario_id
  ORDER BY t.created_at DESC
  LIMIT 1;
END;
$$;