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
  viewMode?: 'geral' | 'individual' | 'equipe'
  userId?: string
}

export function StatusDistribution({ dateRange, viewMode = 'geral', userId }: StatusDistributionProps) {
  const { usuario } = useEffectiveUser()
  const [statusData, setStatusData] = useState<StatusData[]>([])
  const [loading, setLoading] = useState(false)

  // Colaboradores não devem ver este componente
  if (usuario?.tipo_usuario === 'colaborador') {
    return null
  }

  useEffect(() => {
    if (usuario?.empresa_id) {
      loadStatusData()
    }
  }, [usuario?.empresa_id, dateRange, viewMode, userId])

  const loadStatusData = async () => {
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
        .select('status, data_conclusao, created_at')
        .eq('empresa_id', usuario.empresa_id)
        .eq('arquivada', false)

      // Filtrar por tarefas específicas se viewMode não for 'geral'
      if (viewMode !== 'geral' && tarefasIds.length > 0) {
        query = query.in('id', tarefasIds)
      } else if (viewMode !== 'geral' && tarefasIds.length === 0) {
        // Se não encontrou tarefas, retornar dados vazios
        setStatusData([])
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

      // Contar por status na ordem solicitada
      const statusCount = {
        criada: tarefas?.filter(t => t.status === 'criada').length || 0,
        aceita: tarefas?.filter(t => t.status === 'aceita').length || 0,
        executando: tarefas?.filter(t => t.status === 'executando').length || 0,
        concluida: tarefas?.filter(t => t.status === 'concluida').length || 0,
        aprovada: tarefas?.filter(t => t.status === 'aprovada').length || 0,
        atrasada: tarefas?.filter(t => t.status !== 'concluida' && t.status !== 'aprovada' && isOverdue(t.data_conclusao)).length || 0,
        vencendo: tarefas?.filter(t => t.status !== 'concluida' && t.status !== 'aprovada' && isDueToday(t.data_conclusao)).length || 0
      }

      const statusConfig = [
        { 
          status: 'Criada', 
          count: statusCount.criada,
          color: 'bg-kanban-created'
        },
        { 
          status: 'Aceitas', 
          count: statusCount.aceita,
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
          count: statusCount.aprovada,
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