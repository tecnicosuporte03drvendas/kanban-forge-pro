import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, UserCheck, Clock, CheckCircle2, AlertCircle, ThumbsUp, TrendingUp } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useEffectiveUser } from '@/hooks/use-effective-user'
import { isOverdue } from "@/utils/date-utils"

interface TaskStatsData {
  created: number
  accepted: number
  executing: number
  completed: number
  overdue: number
  approved: number
  completionRate: number
  total: number
  averageCompletionHours: number
}

interface TaskStatsProps {
  dateRange?: { from: Date; to: Date }
  viewMode?: 'geral' | 'individual' | 'equipe'
  userId?: string
}

export function TaskStats({ dateRange, viewMode = 'geral', userId }: TaskStatsProps) {
  const { usuario } = useEffectiveUser()
  const [stats, setStats] = useState<TaskStatsData>({
    created: 0,
    accepted: 0,
    executing: 0,
    completed: 0,
    overdue: 0,
    approved: 0,
    completionRate: 0,
    total: 0,
    averageCompletionHours: 0
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (usuario?.empresa_id) {
      loadStats()
    }
  }, [usuario?.empresa_id, dateRange, viewMode, userId])

  const loadStats = async () => {
    if (!usuario?.empresa_id) return
    
    setLoading(true)
    try {
      let tarefasIds: string[] = []

      // Filtrar com base no viewMode
      if (viewMode === 'individual' && userId) {
        // Apenas tarefas do usuário
        const { data: userTasks } = await supabase
          .from('tarefas_responsaveis')
          .select('tarefa_id')
          .eq('usuario_id', userId)

        tarefasIds = userTasks?.map(t => t.tarefa_id) || []
      } else if (viewMode === 'equipe' && userId) {
        // Apenas tarefas das equipes do usuário
        const { data: userTeams } = await supabase
          .from('usuarios_equipes')
          .select('equipe_id')
          .eq('usuario_id', userId)

        const teamIds = userTeams?.map(ut => ut.equipe_id) || []

        if (teamIds.length > 0) {
          const { data: teamTasks } = await supabase
            .from('tarefas_responsaveis')
            .select('tarefa_id')
            .in('equipe_id', teamIds)
          
          tarefasIds = teamTasks?.map(t => t.tarefa_id) || []
        }
      }

      let query = supabase
        .from('tarefas')
        .select('status, data_conclusao, created_at, tempo_gasto_minutos, tempo_inicio, tempo_fim')
        .eq('empresa_id', usuario.empresa_id)
        .eq('arquivada', false)

      // Filtrar por tarefas específicas se viewMode não for 'geral'
      if (viewMode !== 'geral' && tarefasIds.length > 0) {
        query = query.in('id', tarefasIds)
      } else if (viewMode !== 'geral' && tarefasIds.length === 0) {
        // Se não encontrou tarefas, retornar stats vazios
        setStats({
          created: 0,
          accepted: 0,
          executing: 0,
          completed: 0,
          overdue: 0,
          approved: 0,
          completionRate: 0,
          total: 0,
          averageCompletionHours: 0
        })
        setLoading(false)
        return
      }

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString())
      }

      const { data: tarefas, error } = await query

      if (error) throw error

      const total = tarefas?.length || 0
      const created = tarefas?.filter(t => t.status === 'criada').length || 0
      const accepted = tarefas?.filter(t => t.status === 'aceita').length || 0
      const executing = tarefas?.filter(t => t.status === 'executando').length || 0
      const completed = tarefas?.filter(t => t.status === 'concluida').length || 0
      const approved = tarefas?.filter(t => t.status === 'aprovada').length || 0
      const overdue = tarefas?.filter(t => isOverdue(t.data_conclusao) && t.status !== 'concluida' && t.status !== 'aprovada').length || 0

      const totalCompleted = completed + approved
      const completionRate = total > 0 ? Math.round((totalCompleted / total) * 100) : 0

      // Calcular média horária de conclusão (apenas tarefas concluídas/aprovadas)
      const completedTasks = tarefas?.filter(t => (t.status === 'concluida' || t.status === 'aprovada') && t.tempo_gasto_minutos) || []
      const totalMinutes = completedTasks.reduce((sum, t) => sum + (t.tempo_gasto_minutos || 0), 0)
      const averageCompletionHours = completedTasks.length > 0 ? Number((totalMinutes / completedTasks.length / 60).toFixed(1)) : 0

      setStats({
        created,
        accepted,
        executing,
        completed,
        overdue,
        approved,
        completionRate,
        total,
        averageCompletionHours
      })

    } catch (error) {
      console.error('Error loading task stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const isCollaborator = usuario?.tipo_usuario === 'colaborador'

  // Configuração para colaboradores (5 cards principais)
  const collaboratorStatsConfig = [
    {
      title: "Minhas Tarefas", 
      value: loading ? "..." : stats.total.toString(),
      subtitle: "atribuídas a mim/equipe",
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Atrasadas",
      value: loading ? "..." : stats.overdue.toString(),
      subtitle: "fora do prazo",
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-red-500/10"
    },
    {
      title: "Concluídas",
      value: loading ? "..." : stats.completed.toString(),
      subtitle: "tarefas finalizadas",
      icon: CheckCircle2,
      color: "text-kanban-completed",
      bgColor: "bg-green-500/10"
    },
    {
      title: "Taxa de Conclusão",
      value: loading ? "..." : `${stats.completionRate}%`,
      subtitle: "taxa de sucesso",
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Média de Conclusão",
      value: loading ? "..." : `${stats.averageCompletionHours}h`,
      subtitle: "tempo médio/tarefa",
      icon: Clock,
      color: "text-kanban-executing",
      bgColor: "bg-yellow-500/10"
    }
  ]

  // Configuração para administradores (7 cards detalhados)
  const adminStatsConfig = [
    {
      title: "Criadas", 
      value: loading ? "..." : stats.created.toString(),
      subtitle: "tarefas criadas",
      icon: FileText,
      color: "text-kanban-created",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Aceitas",
      value: loading ? "..." : stats.accepted.toString(),
      subtitle: "tarefas aceitas",
      icon: UserCheck,
      color: "text-kanban-assigned",
      bgColor: "bg-cyan-500/10"
    },
    {
      title: "Em Execução", 
      value: loading ? "..." : stats.executing.toString(),
      subtitle: "tarefas ativas",
      icon: Clock,
      color: "text-kanban-executing",
      bgColor: "bg-yellow-500/10"
    },
    {
      title: "Concluídas",
      value: loading ? "..." : stats.completed.toString(),
      subtitle: "tarefas concluídas",
      icon: CheckCircle2,
      color: "text-kanban-completed",
      bgColor: "bg-green-500/10"
    },
    {
      title: "Atrasadas",
      value: loading ? "..." : stats.overdue.toString(),
      subtitle: "fora do prazo",
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-red-500/10"
    },
    {
      title: "Aprovadas",
      value: loading ? "..." : stats.approved.toString(),
      subtitle: "tarefas validadas",
      icon: ThumbsUp,
      color: "text-kanban-validated",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "Taxa de Conclusão",
      value: loading ? "..." : `${stats.completionRate}%`,
      subtitle: "taxa de sucesso",
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10"
    }
  ]

  const statsConfig = isCollaborator ? collaboratorStatsConfig : adminStatsConfig
  const gridCols = isCollaborator ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-5" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7"

  return (
    <div className={`grid ${gridCols} gap-2`}>
      {statsConfig.map((stat, index) => {
        const IconComponent = stat.icon
        return (
          <Card key={index} className="border-border bg-card hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 px-2 pt-2">
              <CardTitle className="text-[10px] font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-1 rounded ${stat.bgColor}`}>
                <IconComponent className={`h-2.5 w-2.5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="px-2 pb-2 pt-1">
              <div className="flex flex-col gap-0">
                <div className="text-lg font-bold text-card-foreground">{stat.value}</div>
                <p className="text-[9px] text-muted-foreground leading-tight">{stat.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}