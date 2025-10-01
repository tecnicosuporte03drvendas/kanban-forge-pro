import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, Clock, Users } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useEffectiveUser } from '@/hooks/use-effective-user'
import { isOverdue } from "@/utils/date-utils"

interface TaskStatsData {
  validated: number
  executing: number
  overdue: number
  completionRate: number
}

export function TaskStats() {
  const { usuario } = useEffectiveUser()
  const [stats, setStats] = useState<TaskStatsData>({
    validated: 0,
    executing: 0,
    overdue: 0,
    completionRate: 0
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (usuario?.empresa_id) {
      loadStats()
    }
  }, [usuario?.empresa_id])

  const loadStats = async () => {
    if (!usuario?.empresa_id) return
    
    setLoading(true)
    try {
      const { data: tarefas, error } = await supabase
        .from('tarefas')
        .select('status, data_conclusao')
        .eq('empresa_id', usuario.empresa_id)
        .eq('arquivada', false)

      if (error) throw error

      const total = tarefas?.length || 0
      const validated = tarefas?.filter(t => t.status === 'validada').length || 0
      const executing = tarefas?.filter(t => t.status === 'executando').length || 0
      const completed = tarefas?.filter(t => t.status === 'concluida' || t.status === 'validada').length || 0
      const overdue = tarefas?.filter(t => isOverdue(t.data_conclusao)).length || 0

      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

      setStats({
        validated,
        executing,
        overdue,
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
      title: "Em Execução", 
      value: loading ? "..." : stats.executing.toString(),
      subtitle: "tarefas ativas",
      icon: Clock,
      color: "text-kanban-executing",
      bgColor: "bg-yellow-500/10"
    },
    {
      title: "Atrasadas",
      value: loading ? "..." : stats.overdue.toString(),
      subtitle: "fora do prazo",
      icon: TrendingUp,
      color: "text-destructive",
      bgColor: "bg-red-500/10"
    },
    {
      title: "Tarefas Validadas",
      value: loading ? "..." : stats.validated.toString(),
      subtitle: "tarefas validadas",
      icon: BarChart3,
      color: "text-kanban-validated",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "Taxa de Conclusão",
      value: loading ? "..." : `${stats.completionRate}%`,
      subtitle: "taxa de sucesso",
      icon: Users,
      color: "text-kanban-completed",
      bgColor: "bg-green-500/10"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsConfig.map((stat, index) => {
        const IconComponent = stat.icon
        return (
          <Card key={index} className="border-border bg-card hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}