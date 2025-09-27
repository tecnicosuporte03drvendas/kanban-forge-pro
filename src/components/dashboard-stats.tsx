import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckSquare, Clock, Target, TrendingUp } from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useEffectiveUser } from "@/hooks/use-effective-user"

export function DashboardStats() {
  const { usuario } = useEffectiveUser()
  const [stats, setStats] = useState({
    total: 0,
    concluidas: 0,
    executando: 0,
    atrasadas: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (usuario?.empresa_id) {
      loadStats()
    }
  }, [usuario?.empresa_id])

  const loadStats = async () => {
    if (!usuario?.empresa_id) return

    try {
      // Get all tasks from company
      const { data: tarefas, error } = await supabase
        .from('tarefas')
        .select('status, data_conclusao')
        .eq('empresa_id', usuario.empresa_id)

      if (error) throw error

      const total = tarefas?.length || 0
      const concluidas = tarefas?.filter(t => t.status === 'concluida' || t.status === 'validada').length || 0
      const executando = tarefas?.filter(t => t.status === 'executando' || t.status === 'assumida').length || 0
      
      // Check overdue tasks
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const atrasadas = tarefas?.filter(t => {
        const dataVencimento = new Date(t.data_conclusao)
        dataVencimento.setHours(0, 0, 0, 0)
        return dataVencimento < hoje && (t.status !== 'concluida' && t.status !== 'validada')
      }).length || 0

      setStats({ total, concluidas, executando, atrasadas })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statsData = [
    {
      title: "Total de Tarefas",
      value: loading ? "..." : stats.total.toString(),
      description: "tarefas no workspace",
      icon: CheckSquare,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Concluídas",
      value: loading ? "..." : stats.concluidas.toString(),
      description: "tarefas finalizadas",
      icon: Target,
      color: "text-kanban-completed",
      bgColor: "bg-green-500/10"
    },
    {
      title: "Em Execução",
      value: loading ? "..." : stats.executando.toString(),
      description: "tarefas ativas",
      icon: Clock,
      color: "text-kanban-executing",
      bgColor: "bg-yellow-500/10"
    },
    {
      title: "Atrasadas",
      value: loading ? "..." : stats.atrasadas.toString(),
      description: "passaram do prazo",
      icon: TrendingUp,
      color: "text-destructive",
      bgColor: "bg-red-500/10"
    }
  ]
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => {
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
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}