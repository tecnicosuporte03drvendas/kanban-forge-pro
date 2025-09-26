import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { isOverdue } from "@/utils/date-utils"

interface StatusData {
  status: string
  count: number
  percentage: number
  color: string
}

export function StatusDistribution() {
  const { usuario } = useAuth()
  const [statusData, setStatusData] = useState<StatusData[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (usuario?.empresa_id) {
      loadStatusData()
    }
  }, [usuario?.empresa_id])

  const loadStatusData = async () => {
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
      
      if (total === 0) {
        setStatusData([])
        return
      }

      // Contar por status
      const statusCount = {
        validada: tarefas?.filter(t => t.status === 'validada').length || 0,
        concluida: tarefas?.filter(t => t.status === 'concluida').length || 0,
        executando: tarefas?.filter(t => t.status === 'executando').length || 0,
        assumida: tarefas?.filter(t => t.status === 'assumida').length || 0,
        criada: tarefas?.filter(t => t.status === 'criada').length || 0,
        atrasada: tarefas?.filter(t => isOverdue(t.data_conclusao)).length || 0
      }

      const statusConfig = [
        { 
          status: 'Validada', 
          count: statusCount.validada,
          color: 'bg-kanban-validated'
        },
        { 
          status: 'Concluída', 
          count: statusCount.concluida,
          color: 'bg-kanban-completed'
        },
        { 
          status: 'Em Execução', 
          count: statusCount.executando,
          color: 'bg-kanban-executing'
        },
        { 
          status: 'Assumida', 
          count: statusCount.assumida,
          color: 'bg-kanban-assigned'
        },
        { 
          status: 'Criada', 
          count: statusCount.criada,
          color: 'bg-kanban-created'
        },
        { 
          status: 'Atrasada', 
          count: statusCount.atrasada,
          color: 'bg-destructive'
        }
      ]

      const dataWithPercentages = statusConfig
        .filter(item => item.count > 0)
        .map(item => ({
          ...item,
          percentage: Math.round((item.count / total) * 100)
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
        <div className="space-y-4">
          {statusData.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma tarefa encontrada.
            </p>
          ) : (
            statusData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 ${item.color} rounded-full`}></div>
                  <span className="text-sm font-medium">{item.status}</span>
                  <span className="text-xs text-muted-foreground">({item.count})</span>
                </div>
                <Badge variant="secondary">{item.percentage}%</Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}