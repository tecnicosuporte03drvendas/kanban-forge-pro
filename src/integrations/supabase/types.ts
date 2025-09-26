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
      empresas: {
        Row: {
          ativa: boolean | null
          cnpj: string | null
          created_at: string | null
          criado_por: string
          id: string
          nome_fantasia: string
          razao_social: string
          updated_at: string | null
        }
        Insert: {
          ativa?: boolean | null
          cnpj?: string | null
          created_at?: string | null
          criado_por: string
          id?: string
          nome_fantasia: string
          razao_social: string
          updated_at?: string | null
        }
        Update: {
          ativa?: boolean | null
          cnpj?: string | null
          created_at?: string | null
          criado_por?: string
          id?: string
          nome_fantasia?: string
          razao_social?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_empresas_criado_por"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      equipes: {
        Row: {
          created_at: string
          criado_por: string
          descricao: string | null
          empresa_id: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          criado_por: string
          descricao?: string | null
          empresa_id: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          criado_por?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas: {
        Row: {
          created_at: string
          criado_por: string
          data_conclusao: string
          descricao: string | null
          empresa_id: string
          horario_conclusao: string
          id: string
          prioridade: Database["public"]["Enums"]["prioridade_tarefa"]
          status: Database["public"]["Enums"]["status_tarefa"]
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          criado_por: string
          data_conclusao: string
          descricao?: string | null
          empresa_id: string
          horario_conclusao?: string
          id?: string
          prioridade?: Database["public"]["Enums"]["prioridade_tarefa"]
          status?: Database["public"]["Enums"]["status_tarefa"]
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          criado_por?: string
          data_conclusao?: string
          descricao?: string | null
          empresa_id?: string
          horario_conclusao?: string
          id?: string
          prioridade?: Database["public"]["Enums"]["prioridade_tarefa"]
          status?: Database["public"]["Enums"]["status_tarefa"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas_anexos: {
        Row: {
          created_at: string
          id: string
          nome: string
          tamanho: number | null
          tarefa_id: string
          tipo: string
          url: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          tamanho?: number | null
          tarefa_id: string
          tipo: string
          url: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          tamanho?: number | null
          tarefa_id?: string
          tipo?: string
          url?: string
          usuario_id?: string
        }
        Relationships: []
      }
      tarefas_atividades: {
        Row: {
          acao: string
          created_at: string
          descricao: string | null
          id: string
          tarefa_id: string
          usuario_id: string
        }
        Insert: {
          acao: string
          created_at?: string
          descricao?: string | null
          id?: string
          tarefa_id: string
          usuario_id: string
        }
        Update: {
          acao?: string
          created_at?: string
          descricao?: string | null
          id?: string
          tarefa_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_atividades_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_atividades_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas_checklist_itens: {
        Row: {
          checklist_id: string
          concluido: boolean
          created_at: string
          id: string
          item: string
          updated_at: string
        }
        Insert: {
          checklist_id: string
          concluido?: boolean
          created_at?: string
          id?: string
          item: string
          updated_at?: string
        }
        Update: {
          checklist_id?: string
          concluido?: boolean
          created_at?: string
          id?: string
          item?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_checklist_itens_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "tarefas_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas_checklists: {
        Row: {
          created_at: string
          id: string
          tarefa_id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          tarefa_id: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          tarefa_id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_checklists_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas_comentarios: {
        Row: {
          comentario: string
          created_at: string
          id: string
          tarefa_id: string
          usuario_id: string
        }
        Insert: {
          comentario: string
          created_at?: string
          id?: string
          tarefa_id: string
          usuario_id: string
        }
        Update: {
          comentario?: string
          created_at?: string
          id?: string
          tarefa_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_comentarios_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_comentarios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas_responsaveis: {
        Row: {
          created_at: string
          equipe_id: string | null
          id: string
          tarefa_id: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          equipe_id?: string | null
          id?: string
          tarefa_id: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          equipe_id?: string | null
          id?: string
          tarefa_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_responsaveis_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_responsaveis_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_responsaveis_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean | null
          celular: string
          created_at: string | null
          email: string
          empresa_id: string | null
          funcao_empresa: string | null
          id: string
          nome: string
          senha_hash: string
          tipo_usuario: Database["public"]["Enums"]["tipo_usuario"]
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          celular?: string
          created_at?: string | null
          email: string
          empresa_id?: string | null
          funcao_empresa?: string | null
          id?: string
          nome: string
          senha_hash: string
          tipo_usuario: Database["public"]["Enums"]["tipo_usuario"]
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          celular?: string
          created_at?: string | null
          email?: string
          empresa_id?: string | null
          funcao_empresa?: string | null
          id?: string
          nome?: string
          senha_hash?: string
          tipo_usuario?: Database["public"]["Enums"]["tipo_usuario"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios_equipes: {
        Row: {
          created_at: string
          equipe_id: string
          id: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          equipe_id: string
          id?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          equipe_id?: string
          id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_equipes_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_equipes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      prioridade_tarefa: "baixa" | "media" | "alta" | "urgente"
      status_tarefa:
        | "criada"
        | "assumida"
        | "executando"
        | "concluida"
        | "validada"
      tipo_usuario: "master" | "proprietario" | "gestor" | "colaborador"
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
      prioridade_tarefa: ["baixa", "media", "alta", "urgente"],
      status_tarefa: [
        "criada",
        "assumida",
        "executando",
        "concluida",
        "validada",
      ],
      tipo_usuario: ["master", "proprietario", "gestor", "colaborador"],
    },
  },
} as const
