export type PrioridadeTarefa = 'baixa' | 'media' | 'alta' | 'urgente';
export type StatusTarefa = 'criada' | 'aceita' | 'executando' | 'concluida' | 'aprovada';
export type TipoTarefa = 'pessoal' | 'profissional';

export type FrequenciaRecorrencia = 'diaria' | 'semanal' | 'mensal' | 'anual';

export interface TarefaRecorrente {
  id: string;
  tarefa_template_id: string;
  empresa_id: string;
  criado_por: string;
  frequencia: FrequenciaRecorrencia;
  intervalo: number;
  dias_semana: number[] | null;
  dia_mes: number | null;
  hora_geracao: string;
  data_inicio: string;
  data_fim: string | null;
  ativo: boolean;
  proxima_execucao: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tarefa {
  id: string;
  titulo: string;
  descricao?: string;
  prioridade: PrioridadeTarefa;
  data_conclusao: string;
  horario_conclusao: string;
  status: StatusTarefa;
  empresa_id: string;
  criado_por: string;
  created_at: string;
  updated_at: string;
  tempo_inicio?: string;
  tempo_fim?: string;
  tempo_gasto_minutos?: number;
  arquivada: boolean;
  posicao_coluna?: number;
  tarefa_recorrente_id?: string | null;
  tipo_tarefa: TipoTarefa;
}

export interface TarefaResponsavel {
  id: string;
  tarefa_id: string;
  usuario_id?: string;
  equipe_id?: string;
  created_at: string;
}

export interface TarefaChecklist {
  id: string;
  tarefa_id: string;
  titulo: string;
  created_at: string;
  updated_at: string;
  itens: TarefaChecklistItem[];
}

export interface TarefaChecklistItem {
  id: string;
  checklist_id: string;
  item: string;
  concluido: boolean;
  created_at: string;
  updated_at: string;
}

export interface TarefaComentario {
  id: string;
  tarefa_id: string;
  usuario_id: string;
  comentario: string;
  created_at: string;
  usuario?: {
    nome: string;
  };
}

export interface TarefaAtividade {
  id: string;
  tarefa_id: string;
  usuario_id: string;
  acao: string;
  descricao?: string;
  created_at: string;
  usuario?: {
    nome: string;
  };
}

export interface TarefaTempoSessao {
  id: string;
  tarefa_id: string;
  usuario_id: string;
  inicio: string;
  fim?: string;
  minutos_trabalhados?: number;
  created_at: string;
}

export interface TarefaCompleta extends Tarefa {
  responsaveis: TarefaResponsavel[];
  checklists: TarefaChecklist[];
  comentarios: TarefaComentario[];
  atividades: TarefaAtividade[];
  tempo_sessoes?: TarefaTempoSessao[];
}