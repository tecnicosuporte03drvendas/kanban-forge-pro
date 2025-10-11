import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useEffectiveUser } from '@/hooks/use-effective-user'
import { isOverdue, parseLocalDate } from "@/utils/date-utils"

const isDueToday = (dateString: string) => {
  const dueDate = parseLocalDate(dateString)
  const today = new Date()
  dueDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return dueDate.getTime() === today.getTime()
}

interface StatusData {
  status: string
  count: number
  percentage: number
  color: string
}

interface StatusDistributionProps {
  dateRange?: { from: Date; to: Date }
}

export function StatusDistribution({ dateRange }: StatusDistributionProps) {
  const { usuario } = useEffectiveUser()
  const [statusData, setStatusData] = useState<StatusData[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (usuario?.empresa_id) {
      loadStatusData()
    }
  }, [usuario?.empresa_id, dateRange])

  const loadStatusData = async () => {
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

      // Contar por status na ordem solicitada
      const statusCount = {
        criada: tarefas?.filter(t => t.status === 'criada').length || 0,
        assumida: tarefas?.filter(t => t.status === 'assumida').length || 0,
        executando: tarefas?.filter(t => t.status === 'executando').length || 0,
        concluida: tarefas?.filter(t => t.status === 'concluida').length || 0,
        validada: tarefas?.filter(t => t.status === 'validada').length || 0,
        atrasada: tarefas?.filter(t => t.status !== 'concluida' && t.status !== 'validada' && isOverdue(t.data_conclusao)).length || 0,
        vencendo: tarefas?.filter(t => t.status !== 'concluida' && t.status !== 'validada' && isDueToday(t.data_conclusao)).length || 0
      }

      const statusConfig = [
        { 
          status: 'Criada', 
          count: statusCount.criada,
          color: 'bg-kanban-created'
        },
        { 
          status: 'Aceitas', 
          count: statusCount.assumida,
          color: 'bg-kanban-assigned'
        },
        { 
          status: 'Em Execução', 
          count: statusCount.executando,
          color: 'bg-kanban-executing'
        },
        { 
          status: 'Concluídas', 
          count: statusCount.concluida,
          color: 'bg-kanban-completed'
        },
        { 
          status: 'Aprovadas', 
          count: statusCount.validada,
          color: 'bg-kanban-validated'
        },
        { 
          status: 'Atrasadas', 
          count: statusCount.atrasada,
          color: 'bg-destructive'
        },
        { 
          status: 'Vencendo Hoje', 
          count: statusCount.vencendo,
          color: 'bg-yellow-600'
        }
      ]

      const dataWithPercentages = statusConfig.map(item => ({
        ...item,
        percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
      }))

      setStatusData(dataWithPercentages)

    } catch (error) {
      console.error('Error loading status distribution:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Distribuição por Status</CardTitle>
          <p className="text-sm text-muted-foreground">Visão geral do status das tarefas</p>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando dados...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Distribuição por Status</CardTitle>
        <p className="text-sm text-muted-foreground">Visão geral do status das tarefas</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {statusData.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 ${item.color} rounded-full`}></div>
                <span className="text-sm font-medium">{item.status}</span>
                <span className="text-xs text-muted-foreground">({item.count})</span>
              </div>
              <Badge variant="secondary" className="text-xs">{item.percentage}%</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}