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
}

interface TaskStatsProps {
  dateRange?: { from: Date; to: Date }
}

export function TaskStats({ dateRange }: TaskStatsProps) {
  const { usuario } = useEffectiveUser()
  const [stats, setStats] = useState<TaskStatsData>({
    created: 0,
    accepted: 0,
    executing: 0,
    completed: 0,
    overdue: 0,
    approved: 0,
    completionRate: 0
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (usuario?.empresa_id) {
      loadStats()
    }
  }, [usuario?.empresa_id, dateRange])

  const loadStats = async () => {
    if (!usuario?.empresa_id) return
    
    setLoading(true)
    try {
      let query = supabase
        .from('tarefas')
        .select('status, data_conclusao, created_at')
        .eq('empresa_id', usuario.empresa_id)
        .eq('arquivada', false)

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
      const approved = tarefas?.filter(t => t.status === 'validada').length || 0
      const overdue = tarefas?.filter(t => isOverdue(t.data_conclusao) && t.status !== 'concluida' && t.status !== 'validada').length || 0

      const totalCompleted = completed + approved
      const completionRate = total > 0 ? Math.round((totalCompleted / total) * 100) : 0

      setStats({
        created,
        accepted,
        executing,
        completed,
        overdue,
        approved,
        completionRate
      })

    } catch (error) {
      console.error('Error loading task stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statsConfig = [
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

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
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