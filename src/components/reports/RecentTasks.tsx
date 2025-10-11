import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useEffectiveUser } from '@/hooks/use-effective-user'
import { getDateStatus } from "@/utils/date-utils"
import type { Tarefa } from "@/types/task"

interface RecentTasksProps {
  dateRange?: { from: Date; to: Date }
}

export function RecentTasks({ dateRange }: RecentTasksProps) {
  const { usuario } = useEffectiveUser()
  const [recentTasks, setRecentTasks] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (usuario?.empresa_id) {
      loadRecentTasks()
    }
  }, [usuario?.empresa_id, dateRange])

  const loadRecentTasks = async () => {
    if (!usuario?.empresa_id) return
    
    setLoading(true)
    try {
      let query = supabase
        .from('tarefas')
        .select(`
          *,
          tarefas_responsaveis(
            usuarios:usuario_id(nome),
            equipes:equipe_id(nome)
          )
        `)
        .eq('empresa_id', usuario.empresa_id)
        .eq('arquivada', false)
        .order('updated_at', { ascending: false })
        .limit(5)

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString())
      }

      const { data: tarefas, error } = await query

      if (error) throw error

      setRecentTasks(tarefas || [])

    } catch (error) {
      console.error('Error loading recent tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "validada": return "bg-kanban-validated"
      case "concluida": return "bg-kanban-completed"
      case "executando": return "bg-kanban-executing"
      case "assumida": return "bg-kanban-assigned"
      case "criada": return "bg-kanban-created"
      default: return "bg-muted"
    }
  }

  const getTeamInfo = (tarefa: Tarefa) => {
    const responsaveis = (tarefa as any).tarefas_responsaveis || []
    const usuarios = responsaveis.filter((r: any) => r.usuarios).map((r: any) => r.usuarios)
    const equipes = responsaveis.filter((r: any) => r.equipes).map((r: any) => r.equipes)
    
    if (equipes.length > 0) {
      return { name: equipes[0].nome, color: "bg-blue-500" }
    } else if (usuarios.length > 0) {
      return { name: usuarios[0].nome, color: "bg-green-500" }
    }
    
    return { name: "Não atribuído", color: "bg-gray-500" }
  }

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Tarefas Recentes</CardTitle>
          <p className="text-sm text-muted-foreground">Últimas atividades da equipe</p>
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
        <CardTitle>Tarefas Recentes</CardTitle>
        <p className="text-sm text-muted-foreground">Últimas atividades da equipe</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentTasks.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhuma tarefa recente encontrada.
          </p>
        ) : (
          recentTasks.map((task) => {
            const teamInfo = getTeamInfo(task)
            return (
              <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`}></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{task.titulo}</p>
                      <Badge className={`text-xs ${teamInfo.color} text-white border-0 px-2 py-1`}>
                        {teamInfo.name}
                      </Badge>
                    </div>
                    <p className={`text-xs ${getDateStatus(task.data_conclusao).className}`}>
                      Vencimento: {new Date(task.data_conclusao).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {task.status}
                </Badge>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}