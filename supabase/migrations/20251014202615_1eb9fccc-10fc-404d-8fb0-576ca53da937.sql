-- Criar tabela de tarefas recorrentes
CREATE TABLE public.tarefas_recorrentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefa_template_id UUID REFERENCES public.tarefas(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL,
  criado_por UUID NOT NULL,
  frequencia TEXT NOT NULL CHECK (frequencia IN ('diaria', 'semanal', 'mensal', 'anual')),
  intervalo INTEGER DEFAULT 1 CHECK (intervalo > 0),
  dias_semana INTEGER[], -- Para recorrência semanal [0-6, onde 0=domingo]
  dia_mes INTEGER CHECK (dia_mes BETWEEN 1 AND 31), -- Para recorrência mensal
  hora_geracao TIME DEFAULT '00:00',
  data_inicio DATE NOT NULL,
  data_fim DATE,
  ativo BOOLEAN DEFAULT true,
  proxima_execucao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna na tabela tarefas para vincular instâncias
ALTER TABLE public.tarefas 
ADD COLUMN tarefa_recorrente_id UUID REFERENCES public.tarefas_recorrentes(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.tarefas_recorrentes ENABLE ROW LEVEL SECURITY;

-- RLS Policies para tarefas_recorrentes
CREATE POLICY "Users can view company recurring tasks"
ON public.tarefas_recorrentes
FOR SELECT
USING (true);

CREATE POLICY "Users can create company recurring tasks"
ON public.tarefas_recorrentes
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update company recurring tasks"
ON public.tarefas_recorrentes
FOR UPDATE
USING (true);

CREATE POLICY "Users can delete company recurring tasks"
ON public.tarefas_recorrentes
FOR DELETE
USING (true);

-- Função para calcular próxima execução
CREATE OR REPLACE FUNCTION public.calcular_proxima_execucao(
  p_frequencia TEXT,
  p_intervalo INTEGER,
  p_dias_semana INTEGER[],
  p_dia_mes INTEGER,
  p_data_inicio DATE,
  p_data_fim DATE,
  p_ultima_execucao TIMESTAMP WITH TIME ZONE
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proxima TIMESTAMP WITH TIME ZONE;
  v_base_date DATE;
  v_dia_atual INTEGER;
  v_encontrou BOOLEAN := false;
BEGIN
  -- Se tem data fim e já passou, retorna NULL
  IF p_data_fim IS NOT NULL AND p_data_fim < CURRENT_DATE THEN
    RETURN NULL;
  END IF;

  -- Define data base (última execução ou data início)
  IF p_ultima_execucao IS NOT NULL THEN
    v_base_date := (p_ultima_execucao + INTERVAL '1 day')::DATE;
  ELSE
    v_base_date := p_data_inicio;
  END IF;

  -- Garante que não está no passado
  IF v_base_date < CURRENT_DATE THEN
    v_base_date := CURRENT_DATE;
  END IF;

  CASE p_frequencia
    WHEN 'diaria' THEN
      v_proxima := v_base_date + (p_intervalo || ' days')::INTERVAL;
      
    WHEN 'semanal' THEN
      -- Procura próximo dia da semana válido
      FOR i IN 0..13 LOOP
        v_dia_atual := EXTRACT(DOW FROM v_base_date + (i || ' days')::INTERVAL)::INTEGER;
        IF v_dia_atual = ANY(p_dias_semana) THEN
          v_proxima := v_base_date + (i || ' days')::INTERVAL;
          v_encontrou := true;
          EXIT;
        END IF;
      END LOOP;
      
      IF NOT v_encontrou THEN
        RETURN NULL;
      END IF;
      
    WHEN 'mensal' THEN
      v_proxima := v_base_date + (p_intervalo || ' months')::INTERVAL;
      -- Ajusta para o dia do mês correto
      v_proxima := DATE_TRUNC('month', v_proxima) + ((p_dia_mes - 1) || ' days')::INTERVAL;
      
    WHEN 'anual' THEN
      v_proxima := v_base_date + (p_intervalo || ' years')::INTERVAL;
      
    ELSE
      RETURN NULL;
  END CASE;

  -- Verifica se não passou da data fim
  IF p_data_fim IS NOT NULL AND v_proxima::DATE > p_data_fim THEN
    RETURN NULL;
  END IF;

  RETURN v_proxima;
END;
$$;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_tarefas_recorrentes_updated_at
BEFORE UPDATE ON public.tarefas_recorrentes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_tarefas_recorrentes_empresa ON public.tarefas_recorrentes(empresa_id);
CREATE INDEX idx_tarefas_recorrentes_ativo ON public.tarefas_recorrentes(ativo);
CREATE INDEX idx_tarefas_recorrentes_proxima_execucao ON public.tarefas_recorrentes(proxima_execucao);
CREATE INDEX idx_tarefas_tarefa_recorrente ON public.tarefas(tarefa_recorrente_id);