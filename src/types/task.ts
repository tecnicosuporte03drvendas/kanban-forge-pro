export type PrioridadeTarefa = 'baixa' | 'media' | 'alta' | 'urgente';
export type StatusTarefa = 'criada' | 'assumida' | 'executando' | 'concluida' | 'validada';

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

export interface TarefaCompleta extends Tarefa {
  responsaveis: TarefaResponsavel[];
  checklists: TarefaChecklist[];
  comentarios: TarefaComentario[];
  atividades: TarefaAtividade[];
}