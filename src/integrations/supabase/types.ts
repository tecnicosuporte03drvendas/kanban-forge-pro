export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      anexos: {
        Row: {
          associado_a_tarefa_id: string
          data_de_atualizacao: string | null
          data_de_criacao: string
          id: string
          nome_do_arquivo: string
          tipo: Database["public"]["Enums"]["tipo_anexo"]
          titulo: string | null
          url_do_arquivo: string
        }
        Insert: {
          associado_a_tarefa_id: string
          data_de_atualizacao?: string | null
          data_de_criacao?: string
          id?: string
          nome_do_arquivo: string
          tipo?: Database["public"]["Enums"]["tipo_anexo"]
          titulo?: string | null
          url_do_arquivo: string
        }
        Update: {
          associado_a_tarefa_id?: string
          data_de_atualizacao?: string | null
          data_de_criacao?: string
          id?: string
          nome_do_arquivo?: string
          tipo?: Database["public"]["Enums"]["tipo_anexo"]
          titulo?: string | null
          url_do_arquivo?: string
        }
        Relationships: [
          {
            foreignKeyName: "anexos_associado_a_tarefa_id_fkey"
            columns: ["associado_a_tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          data_de_atualizacao: string | null
          data_de_criacao: string
          descricao: string | null
          id: number
          nome: string
          workspace_id: string
        }
        Insert: {
          data_de_atualizacao?: string | null
          data_de_criacao?: string
          descricao?: string | null
          id?: number
          nome: string
          workspace_id: string
        }
        Update: {
          data_de_atualizacao?: string | null
          data_de_criacao?: string
          descricao?: string | null
          id?: number
          nome?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      comentarios: {
        Row: {
          associado_a_tarefa_id: string
          conteudo: string
          criado_por_usuario_id: string
          data_de_atualizacao: string | null
          data_de_criacao: string
          id: string
        }
        Insert: {
          associado_a_tarefa_id: string
          conteudo: string
          criado_por_usuario_id: string
          data_de_atualizacao?: string | null
          data_de_criacao?: string
          id?: string
        }
        Update: {
          associado_a_tarefa_id?: string
          conteudo?: string
          criado_por_usuario_id?: string
          data_de_atualizacao?: string | null
          data_de_criacao?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_associado_a_tarefa_id_fkey"
            columns: ["associado_a_tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_criado_por_usuario_id_fkey"
            columns: ["criado_por_usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_user_stats: {
        Row: {
          data_de_atualizacao: string | null
          data_de_criacao: string
          data_referencia: string
          id: string
          produtividade: number | null
          ranking_posicao: number | null
          ranking_total: number | null
          tarefas_atrasadas: number | null
          tarefas_concluidas: number | null
          tarefas_criadas: number | null
          tarefas_pendentes: number | null
          tempo_trabalhado: number | null
          usuario_id: string
          workspace_id: string
        }
        Insert: {
          data_de_atualizacao?: string | null
          data_de_criacao?: string
          data_referencia: string
          id?: string
          produtividade?: number | null
          ranking_posicao?: number | null
          ranking_total?: number | null
          tarefas_atrasadas?: number | null
          tarefas_concluidas?: number | null
          tarefas_criadas?: number | null
          tarefas_pendentes?: number | null
          tempo_trabalhado?: number | null
          usuario_id: string
          workspace_id: string
        }
        Update: {
          data_de_atualizacao?: string | null
          data_de_criacao?: string
          data_referencia?: string
          id?: string
          produtividade?: number | null
          ranking_posicao?: number | null
          ranking_total?: number | null
          tarefas_atrasadas?: number | null
          tarefas_concluidas?: number | null
          tarefas_criadas?: number | null
          tarefas_pendentes?: number | null
          tempo_trabalhado?: number | null
          usuario_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      event_notifications_schedule: {
        Row: {
          created_at: string
          event_id: string
          event_type: string
          id: string
          notification_type: string
          scheduled_for: string
          sent_at: string | null
          status: string
          updated_at: string
          usuario_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          event_type: string
          id?: string
          notification_type: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          usuario_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          event_type?: string
          id?: string
          notification_type?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          usuario_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          assunto: string
          data_de_atualizacao: string
          data_de_criacao: string
          id: string
          mensagem: string
          prioridade: Database["public"]["Enums"]["prioridade_feedback"]
          status: Database["public"]["Enums"]["status_feedback"]
          tipo: Database["public"]["Enums"]["tipo_feedback"]
          usuario_id: string
          workspace_id: string
        }
        Insert: {
          assunto: string
          data_de_atualizacao?: string
          data_de_criacao?: string
          id?: string
          mensagem: string
          prioridade?: Database["public"]["Enums"]["prioridade_feedback"]
          status?: Database["public"]["Enums"]["status_feedback"]
          tipo?: Database["public"]["Enums"]["tipo_feedback"]
          usuario_id: string
          workspace_id: string
        }
        Update: {
          assunto?: string
          data_de_atualizacao?: string
          data_de_criacao?: string
          id?: string
          mensagem?: string
          prioridade?: Database["public"]["Enums"]["prioridade_feedback"]
          status?: Database["public"]["Enums"]["status_feedback"]
          tipo?: Database["public"]["Enums"]["tipo_feedback"]
          usuario_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_configuracoes: {
        Row: {
          ativo: boolean
          calendarios_selecionados: string[]
          data_de_atualizacao: string
          data_de_criacao: string
          id: string
          intervalo_sincronizacao_minutos: number
          mostrar_eventos_pessoais: boolean
          notificar_reunioes: boolean
          sincronizar_automatico: boolean
          workspace_id: string
        }
        Insert: {
          ativo?: boolean
          calendarios_selecionados?: string[]
          data_de_atualizacao?: string
          data_de_criacao?: string
          id?: string
          intervalo_sincronizacao_minutos?: number
          mostrar_eventos_pessoais?: boolean
          notificar_reunioes?: boolean
          sincronizar_automatico?: boolean
          workspace_id: string
        }
        Update: {
          ativo?: boolean
          calendarios_selecionados?: string[]
          data_de_atualizacao?: string
          data_de_criacao?: string
          id?: string
          intervalo_sincronizacao_minutos?: number
          mostrar_eventos_pessoais?: boolean
          notificar_reunioes?: boolean
          sincronizar_automatico?: boolean
          workspace_id?: string
        }
        Relationships: []
      }
      google_meet_configuracoes: {
        Row: {
          ativo: boolean
          criar_automatico_reunioes: boolean
          data_de_atualizacao: string
          data_de_criacao: string
          duracao_padrao_minutos: number | null
          id: string
          template_descricao: string | null
          template_titulo: string | null
          workspace_id: string
        }
        Insert: {
          ativo?: boolean
          criar_automatico_reunioes?: boolean
          data_de_atualizacao?: string
          data_de_criacao?: string
          duracao_padrao_minutos?: number | null
          id?: string
          template_descricao?: string | null
          template_titulo?: string | null
          workspace_id: string
        }
        Update: {
          ativo?: boolean
          criar_automatico_reunioes?: boolean
          data_de_atualizacao?: string
          data_de_criacao?: string
          duracao_padrao_minutos?: number | null
          id?: string
          template_descricao?: string | null
          template_titulo?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      google_tokens: {
        Row: {
          access_token: string
          ativo: boolean
          data_de_atualizacao: string
          data_de_criacao: string
          id: string
          refresh_token: string | null
          scope: string
          token_expiry: string
          usuario_id: string
        }
        Insert: {
          access_token: string
          ativo?: boolean
          data_de_atualizacao?: string
          data_de_criacao?: string
          id?: string
          refresh_token?: string | null
          scope?: string
          token_expiry: string
          usuario_id: string
        }
        Update: {
          access_token?: string
          ativo?: boolean
          data_de_atualizacao?: string
          data_de_criacao?: string
          id?: string
          refresh_token?: string | null
          scope?: string
          token_expiry?: string
          usuario_id?: string
        }
        Relationships: []
      }
      grupo_de_usuarios: {
        Row: {
          cor: string | null
          data_de_atualizacao: string | null
          data_de_criacao: string
          descricao: string | null
          gestor_responsavel_id: string | null
          icone: string | null
          id: number
          nome: string
          workspace_id: string
        }
        Insert: {
          cor?: string | null
          data_de_atualizacao?: string | null
          data_de_criacao?: string
          descricao?: string | null
          gestor_responsavel_id?: string | null
          icone?: string | null
          id?: number
          nome: string
          workspace_id: string
        }
        Update: {
          cor?: string | null
          data_de_atualizacao?: string | null
          data_de_criacao?: string
          descricao?: string | null
          gestor_responsavel_id?: string | null
          icone?: string | null
          id?: number
          nome?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupo_de_usuarios_gestor_responsavel_id_fkey"
            columns: ["gestor_responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupo_de_usuarios_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_logs: {
        Row: {
          data_de_atualizacao: string | null
          data_de_criacao: string | null
          detalhes: Json | null
          id: string
          mensagem: string
          tipo: string
          usuario_id: string | null
          workspace_id: string | null
        }
        Insert: {
          data_de_atualizacao?: string | null
          data_de_criacao?: string | null
          detalhes?: Json | null
          id?: string
          mensagem: string
          tipo: string
          usuario_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          data_de_atualizacao?: string | null
          data_de_criacao?: string | null
          detalhes?: Json | null
          id?: string
          mensagem?: string
          tipo?: string
          usuario_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      lembretes: {
        Row: {
          ativo: boolean
          data_de_atualizacao: string
          data_de_criacao: string
          data_hora: string
          descricao: string | null
          id: string
          tipo: string
          titulo: string
          usuario_id: string
          workspace_id: string
        }
        Insert: {
          ativo?: boolean
          data_de_atualizacao?: string
          data_de_criacao?: string
          data_hora: string
          descricao?: string | null
          id?: string
          tipo?: string
          titulo: string
          usuario_id: string
          workspace_id: string
        }
        Update: {
          ativo?: boolean
          data_de_atualizacao?: string
          data_de_criacao?: string
          data_hora?: string
          descricao?: string | null
          id?: string
          tipo?: string
          titulo?: string
          usuario_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      meeting_notifications_sent: {
        Row: {
          created_at: string
          event_id: string
          id: string
          meeting_start_time: string
          notification_sent_at: string
          usuario_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          meeting_start_time: string
          notification_sent_at?: string
          usuario_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          meeting_start_time?: string
          notification_sent_at?: string
          usuario_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      performance_insights: {
        Row: {
          dados_contexto: Json | null
          data_de_criacao: string
          data_de_expiracao: string | null
          data_referencia: string | null
          descricao: string
          id: string
          impacto: string | null
          lido: boolean | null
          prioridade: string | null
          tipo_insight: string
          titulo: string
          usuario_id: string
          workspace_id: string
        }
        Insert: {
          dados_contexto?: Json | null
          data_de_criacao?: string
          data_de_expiracao?: string | null
          data_referencia?: string | null
          descricao: string
          id?: string
          impacto?: string | null
          lido?: boolean | null
          prioridade?: string | null
          tipo_insight: string
          titulo: string
          usuario_id: string
          workspace_id: string
        }
        Update: {
          dados_contexto?: Json | null
          data_de_criacao?: string
          data_de_expiracao?: string | null
          data_referencia?: string | null
          descricao?: string
          id?: string
          impacto?: string | null
          lido?: boolean | null
          prioridade?: string | null
          tipo_insight?: string
          titulo?: string
          usuario_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          anexos: Json | null
          assignee_id: string | null
          categoria: Database["public"]["Enums"]["categoria_ticket"]
          data_de_atualizacao: string
          data_de_criacao: string
          data_de_resolucao: string | null
          descricao: string
          id: string
          prioridade: Database["public"]["Enums"]["prioridade_ticket"]
          status: Database["public"]["Enums"]["status_ticket"]
          tags: string[] | null
          titulo: string
          usuario_id: string
          workspace_id: string
        }
        Insert: {
          anexos?: Json | null
          assignee_id?: string | null
          categoria?: Database["public"]["Enums"]["categoria_ticket"]
          data_de_atualizacao?: string
          data_de_criacao?: string
          data_de_resolucao?: string | null
          descricao: string
          id?: string
          prioridade?: Database["public"]["Enums"]["prioridade_ticket"]
          status?: Database["public"]["Enums"]["status_ticket"]
          tags?: string[] | null
          titulo: string
          usuario_id: string
          workspace_id: string
        }
        Update: {
          anexos?: Json | null
          assignee_id?: string | null
          categoria?: Database["public"]["Enums"]["categoria_ticket"]
          data_de_atualizacao?: string
          data_de_criacao?: string
          data_de_resolucao?: string | null
          descricao?: string
          id?: string
          prioridade?: Database["public"]["Enums"]["prioridade_ticket"]
          status?: Database["public"]["Enums"]["status_ticket"]
          tags?: string[] | null
          titulo?: string
          usuario_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      system_info: {
        Row: {
          created_at: string
          features_count: number
          id: string
          last_update: string
          status: string
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          features_count?: number
          id?: string
          last_update: string
          status?: string
          updated_at?: string
          version: string
        }
        Update: {
          created_at?: string
          features_count?: number
          id?: string
          last_update?: string
          status?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          cor: string | null
          data_de_atualizacao: string | null
          data_de_criacao: string
          id: number
          nome: string
          workspace_id: string
        }
        Insert: {
          cor?: string | null
          data_de_atualizacao?: string | null
          data_de_criacao?: string
          id?: number
          nome: string
          workspace_id: string
        }
        Update: {
          cor?: string | null
          data_de_atualizacao?: string | null
          data_de_criacao?: string
          id?: number
          nome?: string
          workspace_id?: string
        }
        Relationships: []
      }
      tarefa_responsaveis: {
        Row: {
          data_de_criacao: string | null
          id: string
          tarefa_id: string
          usuario_id: string
        }
        Insert: {
          data_de_criacao?: string | null
          id?: string
          tarefa_id: string
          usuario_id: string
        }
        Update: {
          data_de_criacao?: string | null
          id?: string
          tarefa_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefa_responsaveis_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefa_responsaveis_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefa_tags: {
        Row: {
          data_de_criacao: string
          id: string
          tag_id: number
          tarefa_id: string
        }
        Insert: {
          data_de_criacao?: string
          id?: string
          tag_id: number
          tarefa_id: string
        }
        Update: {
          data_de_criacao?: string
          id?: string
          tag_id?: number
          tarefa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefa_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefa_tags_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas: {
        Row: {
          arquivada: boolean | null
          categoria_id: number | null
          data_de_atualizacao: string | null
          data_de_criacao: string
          data_de_entrega: string | null
          descricao: string | null
          habilitada: boolean
          id: string
          prioridade: Database["public"]["Enums"]["prioridade_tarefa"]
          responsavel_id: string
          status: Database["public"]["Enums"]["status_tarefa"]
          tempo_fim_automatico: string | null
          tempo_inicio_automatico: string | null
          tempo_trabalhado: number | null
          timer_iniciado_em: string | null
          tipo: string
          titulo: string
          tracking_automatico_ativo: boolean | null
          workspace_id: string
        }
        Insert: {
          arquivada?: boolean | null
          categoria_id?: number | null
          data_de_atualizacao?: string | null
          data_de_criacao?: string
          data_de_entrega?: string | null
          descricao?: string | null
          habilitada?: boolean
          id?: string
          prioridade?: Database["public"]["Enums"]["prioridade_tarefa"]
          responsavel_id: string
          status?: Database["public"]["Enums"]["status_tarefa"]
          tempo_fim_automatico?: string | null
          tempo_inicio_automatico?: string | null
          tempo_trabalhado?: number | null
          timer_iniciado_em?: string | null
          tipo?: string
          titulo: string
          tracking_automatico_ativo?: boolean | null
          workspace_id: string
        }
        Update: {
          arquivada?: boolean | null
          categoria_id?: number | null
          data_de_atualizacao?: string | null
          data_de_criacao?: string
          data_de_entrega?: string | null
          descricao?: string | null
          habilitada?: boolean
          id?: string
          prioridade?: Database["public"]["Enums"]["prioridade_tarefa"]
          responsavel_id?: string
          status?: Database["public"]["Enums"]["status_tarefa"]
          tempo_fim_automatico?: string | null
          tempo_inicio_automatico?: string | null
          tempo_trabalhado?: number | null
          timer_iniciado_em?: string | null
          tipo?: string
          titulo?: string
          tracking_automatico_ativo?: boolean | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      task_activities: {
        Row: {
          action_type: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          task_id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          task_id: string
          user_id: string
          workspace_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          task_id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      task_checklists: {
        Row: {
          completed: boolean
          created_at: string
          created_by: string
          id: string
          task_id: string
          text: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          created_by: string
          id?: string
          task_id: string
          text: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          created_by?: string
          id?: string
          task_id?: string
          text?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      ticket_comments: {
        Row: {
          data_de_criacao: string
          id: string
          interno: boolean
          mensagem: string
          ticket_id: string
          usuario_id: string
        }
        Insert: {
          data_de_criacao?: string
          id?: string
          interno?: boolean
          mensagem: string
          ticket_id: string
          usuario_id: string
        }
        Update: {
          data_de_criacao?: string
          id?: string
          interno?: boolean
          mensagem?: string
          ticket_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tipo_de_usuario: {
        Row: {
          data_de_atualizacao: string | null
          data_de_criacao: string
          descricao: string | null
          id: number
          nome: string
        }
        Insert: {
          data_de_atualizacao?: string | null
          data_de_criacao?: string
          descricao?: string | null
          id?: number
          nome: string
        }
        Update: {
          data_de_atualizacao?: string | null
          data_de_criacao?: string
          descricao?: string | null
          id?: number
          nome?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          cor: string | null
          data_de_criacao: string
          data_desbloqueio: string
          descricao: string | null
          icone: string | null
          id: string
          tipo_conquista: string
          titulo: string
          usuario_id: string
          valor_conquista: number | null
          workspace_id: string
        }
        Insert: {
          cor?: string | null
          data_de_criacao?: string
          data_desbloqueio?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          tipo_conquista: string
          titulo: string
          usuario_id: string
          valor_conquista?: number | null
          workspace_id: string
        }
        Update: {
          cor?: string | null
          data_de_criacao?: string
          data_desbloqueio?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          tipo_conquista?: string
          titulo?: string
          usuario_id?: string
          valor_conquista?: number | null
          workspace_id?: string
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          ativa: boolean
          data_de_atualizacao: string | null
          data_de_criacao: string
          id: string
          periodo_fim: string
          periodo_inicio: string
          tipo_meta: string
          usuario_id: string
          valor_atual: number | null
          valor_meta: number
          workspace_id: string
        }
        Insert: {
          ativa?: boolean
          data_de_atualizacao?: string | null
          data_de_criacao?: string
          id?: string
          periodo_fim: string
          periodo_inicio: string
          tipo_meta: string
          usuario_id: string
          valor_atual?: number | null
          valor_meta: number
          workspace_id: string
        }
        Update: {
          ativa?: boolean
          data_de_atualizacao?: string | null
          data_de_criacao?: string
          id?: string
          periodo_fim?: string
          periodo_inicio?: string
          tipo_meta?: string
          usuario_id?: string
          valor_atual?: number | null
          valor_meta?: number
          workspace_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: unknown | null
          last_activity: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown | null
          last_activity?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          last_activity?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          bloqueado_ate: string | null
          celular: string
          data_de_atualizacao: string | null
          data_de_criacao: string
          email: string
          grupo_de_usuario_id: number | null
          id: string
          nome: string
          salt: string | null
          senha_hash: string | null
          tentativas_login: number | null
          tipo_de_usuario_id: number
          ultimo_login: string | null
          username: string | null
          workspace_ativo_id: string | null
        }
        Insert: {
          bloqueado_ate?: string | null
          celular: string
          data_de_atualizacao?: string | null
          data_de_criacao?: string
          email: string
          grupo_de_usuario_id?: number | null
          id?: string
          nome: string
          salt?: string | null
          senha_hash?: string | null
          tentativas_login?: number | null
          tipo_de_usuario_id: number
          ultimo_login?: string | null
          username?: string | null
          workspace_ativo_id?: string | null
        }
        Update: {
          bloqueado_ate?: string | null
          celular?: string
          data_de_atualizacao?: string | null
          data_de_criacao?: string
          email?: string
          grupo_de_usuario_id?: number | null
          id?: string
          nome?: string
          salt?: string | null
          senha_hash?: string | null
          tentativas_login?: number | null
          tipo_de_usuario_id?: number
          ultimo_login?: string | null
          username?: string | null
          workspace_ativo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_grupo_de_usuario"
            columns: ["grupo_de_usuario_id"]
            isOneToOne: false
            referencedRelation: "grupo_de_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_usuarios_grupo_de_usuario"
            columns: ["grupo_de_usuario_id"]
            isOneToOne: false
            referencedRelation: "grupo_de_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_tipo_de_usuario_id_fkey"
            columns: ["tipo_de_usuario_id"]
            isOneToOne: false
            referencedRelation: "tipo_de_usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_workspace_ativo_id_fkey"
            columns: ["workspace_ativo_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_configuracoes: {
        Row: {
          ativo: boolean
          data_de_atualizacao: string
          data_de_criacao: string
          id: string
          notificar_conclusao_tarefa: boolean
          notificar_criacao_tarefa: boolean
          notificar_evento_1_dia_antes: boolean
          notificar_evento_30_min_antes: boolean
          notificar_evento_na_hora: boolean
          notificar_prazo_tarefa: boolean
          notificar_reuniao_30min: boolean
          template_conclusao_tarefa: string | null
          template_criacao_tarefa: string | null
          template_evento_1_dia_antes: string | null
          template_evento_30_min_antes: string | null
          template_evento_na_hora: string | null
          template_prazo_tarefa: string | null
          template_reuniao_30min: string | null
          webhook_url: string | null
          workspace_id: string
        }
        Insert: {
          ativo?: boolean
          data_de_atualizacao?: string
          data_de_criacao?: string
          id?: string
          notificar_conclusao_tarefa?: boolean
          notificar_criacao_tarefa?: boolean
          notificar_evento_1_dia_antes?: boolean
          notificar_evento_30_min_antes?: boolean
          notificar_evento_na_hora?: boolean
          notificar_prazo_tarefa?: boolean
          notificar_reuniao_30min?: boolean
          template_conclusao_tarefa?: string | null
          template_criacao_tarefa?: string | null
          template_evento_1_dia_antes?: string | null
          template_evento_30_min_antes?: string | null
          template_evento_na_hora?: string | null
          template_prazo_tarefa?: string | null
          template_reuniao_30min?: string | null
          webhook_url?: string | null
          workspace_id: string
        }
        Update: {
          ativo?: boolean
          data_de_atualizacao?: string
          data_de_criacao?: string
          id?: string
          notificar_conclusao_tarefa?: boolean
          notificar_criacao_tarefa?: boolean
          notificar_evento_1_dia_antes?: boolean
          notificar_evento_30_min_antes?: boolean
          notificar_evento_na_hora?: boolean
          notificar_prazo_tarefa?: boolean
          notificar_reuniao_30min?: boolean
          template_conclusao_tarefa?: string | null
          template_criacao_tarefa?: string | null
          template_evento_1_dia_antes?: string | null
          template_evento_30_min_antes?: string | null
          template_evento_na_hora?: string | null
          template_prazo_tarefa?: string | null
          template_reuniao_30min?: string | null
          webhook_url?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      whatsapp_logs: {
        Row: {
          conteudo_mensagem: string
          data_de_criacao: string
          erro: string | null
          id: string
          numero_destino: string
          resposta_api: Json | null
          status: string
          tarefa_id: string | null
          tipo_notificacao: string
          usuario_id: string | null
          workspace_id: string
        }
        Insert: {
          conteudo_mensagem: string
          data_de_criacao?: string
          erro?: string | null
          id?: string
          numero_destino: string
          resposta_api?: Json | null
          status?: string
          tarefa_id?: string | null
          tipo_notificacao: string
          usuario_id?: string | null
          workspace_id: string
        }
        Update: {
          conteudo_mensagem?: string
          data_de_criacao?: string
          erro?: string | null
          id?: string
          numero_destino?: string
          resposta_api?: Json | null
          status?: string
          tarefa_id?: string | null
          tipo_notificacao?: string
          usuario_id?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      workspace_configuracoes: {
        Row: {
          data_de_atualizacao: string | null
          data_de_criacao: string
          horario_fim: string | null
          horario_inicio: string | null
          id: string
          lembretes_tarefas: boolean | null
          notificacoes_email: boolean | null
          notificacoes_push: boolean | null
          workspace_id: string
        }
        Insert: {
          data_de_atualizacao?: string | null
          data_de_criacao?: string
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          lembretes_tarefas?: boolean | null
          notificacoes_email?: boolean | null
          notificacoes_push?: boolean | null
          workspace_id: string
        }
        Update: {
          data_de_atualizacao?: string | null
          data_de_criacao?: string
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          lembretes_tarefas?: boolean | null
          notificacoes_email?: boolean | null
          notificacoes_push?: boolean | null
          workspace_id?: string
        }
        Relationships: []
      }
      workspace_funcoes: {
        Row: {
          data_de_atualizacao: string
          data_de_criacao: string
          descricao: string | null
          funcao: string
          id: string
          usuario_id: string
          workspace_id: string
        }
        Insert: {
          data_de_atualizacao?: string
          data_de_criacao?: string
          descricao?: string | null
          funcao: string
          id?: string
          usuario_id: string
          workspace_id: string
        }
        Update: {
          data_de_atualizacao?: string
          data_de_criacao?: string
          descricao?: string | null
          funcao?: string
          id?: string
          usuario_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      workspace_membros: {
        Row: {
          ativo: boolean
          data_de_atualizacao: string | null
          data_de_entrada: string
          id: string
          papel: Database["public"]["Enums"]["papel_workspace"]
          usuario_id: string
          workspace_id: string
        }
        Insert: {
          ativo?: boolean
          data_de_atualizacao?: string | null
          data_de_entrada?: string
          id?: string
          papel?: Database["public"]["Enums"]["papel_workspace"]
          usuario_id: string
          workspace_id: string
        }
        Update: {
          ativo?: boolean
          data_de_atualizacao?: string | null
          data_de_entrada?: string
          id?: string
          papel?: Database["public"]["Enums"]["papel_workspace"]
          usuario_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_workspace_membros_usuario_id"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_membros_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          ativo: boolean | null
          configuracoes: Json | null
          cor_tema: string | null
          data_de_atualizacao: string | null
          data_de_criacao: string
          descricao: string | null
          id: string
          logo_url: string | null
          nome: string
          nome_fantasia: string | null
          proprietario_id: string
          razao_social: string | null
        }
        Insert: {
          ativo?: boolean | null
          configuracoes?: Json | null
          cor_tema?: string | null
          data_de_atualizacao?: string | null
          data_de_criacao?: string
          descricao?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          nome_fantasia?: string | null
          proprietario_id: string
          razao_social?: string | null
        }
        Update: {
          ativo?: boolean | null
          configuracoes?: Json | null
          cor_tema?: string | null
          data_de_atualizacao?: string | null
          data_de_criacao?: string
          descricao?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          nome_fantasia?: string | null
          proprietario_id?: string
          razao_social?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_daily_user_stats: {
        Args: { target_date?: string }
        Returns: undefined
      }
      count_group_members: {
        Args: { group_id: number }
        Returns: number
      }
      create_default_workspace_data: {
        Args: { workspace_id: string }
        Returns: undefined
      }
      create_workspace_atomic: {
        Args: { workspace_description?: string; workspace_name: string }
        Returns: string
      }
      delete_workspace: {
        Args: { confirmation_name: string; workspace_id: string }
        Returns: boolean
      }
      generate_salt: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_custom_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_workspace: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_workspace_ids: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_workspace_members: {
        Args: { target_workspace_id: string }
        Returns: {
          ativo: boolean
          data_de_atualizacao: string
          data_de_entrada: string
          grupo_de_usuario_cor: string
          grupo_de_usuario_icone: string
          grupo_de_usuario_id: number
          grupo_de_usuario_nome: string
          id: string
          papel: string
          tipo_de_usuario_nome: string
          usuario_email: string
          usuario_grupo_de_usuario_id: number
          usuario_id: string
          usuario_nome: string
          usuario_tipo_de_usuario_id: number
          usuario_username: string
          usuario_workspace_ativo_id: string
          workspace_id: string
        }[]
      }
      get_workspace_stats: {
        Args: { target_workspace_id: string }
        Returns: {
          active_members: number
          members_without_group: number
          total_groups: number
          total_members: number
        }[]
      }
      hash_password: {
        Args: { password: string; salt: string }
        Returns: string
      }
      is_mentor_master: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_workspace_active: {
        Args: { workspace_id: string }
        Returns: boolean
      }
      is_workspace_admin: {
        Args: { workspace_id: string }
        Returns: boolean
      }
      is_workspace_admin_specific: {
        Args: { target_workspace_id: string }
        Returns: boolean
      }
      is_workspace_owner: {
        Args: { usuario_id: string; workspace_id: string }
        Returns: boolean
      }
      refresh_expired_google_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      set_current_user_id: {
        Args: { user_id: string }
        Returns: undefined
      }
      verify_password: {
        Args:
          | { hash: string; password: string }
          | { hash: string; password: string; salt: string }
        Returns: boolean
      }
    }
    Enums: {
      categoria_ticket:
        | "tecnico"
        | "funcionalidade"
        | "bug"
        | "conta"
        | "integracao"
        | "outro"
      papel_workspace: "admin" | "membro" | "colaborador" | "gestor"
      prioridade_feedback: "baixa" | "media" | "alta"
      prioridade_tarefa: "baixa" | "media" | "alta"
      prioridade_ticket: "baixa" | "media" | "alta" | "critica"
      status_feedback: "aberto" | "analisando" | "fechado"
      status_tarefa:
        | "criada"
        | "em_andamento"
        | "concluida"
        | "arquivada"
        | "assumida"
        | "executando"
        | "validacao"
      status_ticket:
        | "aberto"
        | "em_andamento"
        | "aguardando_resposta"
        | "resolvido"
        | "fechado"
      tipo_anexo: "arquivo" | "link"
      tipo_feedback: "sugestao" | "problema" | "melhoria" | "outro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      categoria_ticket: [
        "tecnico",
        "funcionalidade",
        "bug",
        "conta",
        "integracao",
        "outro",
      ],
      papel_workspace: ["admin", "membro", "colaborador", "gestor"],
      prioridade_feedback: ["baixa", "media", "alta"],
      prioridade_tarefa: ["baixa", "media", "alta"],
      prioridade_ticket: ["baixa", "media", "alta", "critica"],
      status_feedback: ["aberto", "analisando", "fechado"],
      status_tarefa: [
        "criada",
        "em_andamento",
        "concluida",
        "arquivada",
        "assumida",
        "executando",
        "validacao",
      ],
      status_ticket: [
        "aberto",
        "em_andamento",
        "aguardando_resposta",
        "resolvido",
        "fechado",
      ],
      tipo_anexo: ["arquivo", "link"],
      tipo_feedback: ["sugestao", "problema", "melhoria", "outro"],
    },
  },
} as const
