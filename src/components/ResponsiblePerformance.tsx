import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, User } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useEffectiveUser } from '@/hooks/use-effective-user'

interface ResponsibleUser {
  id: string
  nome: string
  email: string
  totalTasks: number
  completedTasks: number
  hoursWorked: number
}

export function ResponsiblePerformance() {
  const { usuario } = useEffectiveUser()
  const [responsibleUsers, setResponsibleUsers] = useState<ResponsibleUser[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (usuario?.empresa_id) {
      loadResponsibleUsers()
    }
  }, [usuario?.empresa_id])

  const loadResponsibleUsers = async () => {
    if (!usuario?.empresa_id) return
    
    setLoading(true)
    try {
      // Buscar todas as tarefas da empresa com responsáveis
      const { data: tarefas, error } = await supabase
        .from('tarefas')
        .select(`
          id,
          status,
          tempo_gasto_minutos,
          arquivada,
          tarefas_responsaveis(
            usuarios:usuario_id(id, nome, email)
          )
        `)
        .eq('empresa_id', usuario.empresa_id)
        .eq('arquivada', false)

      if (error) throw error

      // Processar dados para calcular estatísticas por usuário
      const userStats: { [userId: string]: ResponsibleUser } = {}

      tarefas?.forEach(tarefa => {
        tarefa.tarefas_responsaveis?.forEach((resp: any) => {
          if (resp.usuarios) {
            const userId = resp.usuarios.id
            
            if (!userStats[userId]) {
              userStats[userId] = {
                id: resp.usuarios.id,
                nome: resp.usuarios.nome,
                email: resp.usuarios.email,
                totalTasks: 0,
                completedTasks: 0,
                hoursWorked: 0
              }
            }

            userStats[userId].totalTasks++
            
            if (tarefa.status === 'concluida' || tarefa.status === 'aprovada') {
              userStats[userId].completedTasks++
            }

            if (tarefa.tempo_gasto_minutos) {
              userStats[userId].hoursWorked += tarefa.tempo_gasto_minutos / 60
            }
          }
        })
      })

      // Converter para array e ordenar por número de tarefas
      const usersArray = Object.values(userStats).sort((a, b) => b.totalTasks - a.totalTasks)
      setResponsibleUsers(usersArray)

    } catch (error) {
      console.error('Error loading responsible users:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCompletionPercentage = (completed: number, total: number): number => {
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Performance por Responsável
          </CardTitle>
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
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Performance por Responsável
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {responsibleUsers.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhum responsável com tarefas encontrado.
          </p>
        ) : (
          responsibleUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{user.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {user.totalTasks} tarefas • {user.hoursWorked.toFixed(1)}h trabalhadas
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-foreground">
                  {user.completedTasks}/{user.totalTasks} concluídas
                </p>
                <p className="text-xs text-muted-foreground">
                  {getCompletionPercentage(user.completedTasks, user.totalTasks)}% conclusão
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}