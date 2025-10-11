import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useEffectiveUser } from '@/hooks/use-effective-user'

interface UserProductivity {
  id: string
  nome: string
  totalTasks: number
  completedTasks: number
  completionRate: number
}

interface ProductivityRankingProps {
  dateRange?: { from: Date; to: Date }
}

export function ProductivityRanking({ dateRange }: ProductivityRankingProps) {
  const { usuario } = useEffectiveUser()
  const [ranking, setRanking] = useState<UserProductivity[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (usuario?.empresa_id) {
      loadProductivityRanking()
    }
  }, [usuario?.empresa_id, dateRange])

  const loadProductivityRanking = async () => {
    if (!usuario?.empresa_id) return
    
    setLoading(true)
    try {
      const from = dateRange?.from || (() => {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return weekAgo
      })()
      const to = dateRange?.to || new Date()

      const { data: tarefas, error } = await supabase
        .from('tarefas')
        .select(`
          id,
          status,
          updated_at,
          tarefas_responsaveis(
            usuarios:usuario_id(id, nome)
          )
        `)
        .eq('empresa_id', usuario.empresa_id)
        .eq('arquivada', false)
        .gte('updated_at', from.toISOString())
        .lte('updated_at', to.toISOString())

      if (error) throw error

      // Processar dados para calcular produtividade por usuário
      const userStats: { [userId: string]: UserProductivity } = {}

      tarefas?.forEach(tarefa => {
        tarefa.tarefas_responsaveis?.forEach((resp: any) => {
          if (resp.usuarios) {
            const userId = resp.usuarios.id
            
            if (!userStats[userId]) {
              userStats[userId] = {
                id: resp.usuarios.id,
                nome: resp.usuarios.nome,
                totalTasks: 0,
                completedTasks: 0,
                completionRate: 0
              }
            }

            userStats[userId].totalTasks++
            
            if (tarefa.status === 'concluida' || tarefa.status === 'aprovada') {
              userStats[userId].completedTasks++
            }
          }
        })
      })

      // Calcular taxa de conclusão e ordenar
      const rankingArray = Object.values(userStats)
        .map(user => ({
          ...user,
          completionRate: user.totalTasks > 0 ? Math.round((user.completedTasks / user.totalTasks) * 100) : 0
        }))
        .sort((a, b) => {
          // Ordenar por taxa de conclusão, depois por número de tarefas completadas
          if (b.completionRate !== a.completionRate) {
            return b.completionRate - a.completionRate
          }
          return b.completedTasks - a.completedTasks
        })
        .slice(0, 5) // Top 5

      setRanking(rankingArray)

    } catch (error) {
      console.error('Error loading productivity ranking:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (nome: string): string => {
    return nome
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRankingBadgeColor = (index: number): string => {
    switch (index) {
      case 0: return "bg-yellow-500 text-white" // Ouro
      case 1: return "bg-gray-400 text-white"   // Prata
      case 2: return "bg-amber-600 text-white"  // Bronze
      default: return "bg-kanban-completed text-white"
    }
  }

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Ranking de Produtividade
          </CardTitle>
          <p className="text-sm text-muted-foreground">Os colaboradores mais produtivos da semana</p>
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
          Ranking de Produtividade
        </CardTitle>
        <p className="text-sm text-muted-foreground">Os colaboradores mais produtivos da semana</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ranking.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhum dado de produtividade encontrado para esta semana.
            </p>
          ) : (
            ranking.map((user, index) => (
              <div key={user.id} className="flex items-center gap-4 p-4 bg-background/50 rounded-lg">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{index + 1}</span>
                </div>
                <div className="w-10 h-10 bg-sidebar-accent rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-sidebar-accent-foreground">
                    {getInitials(user.nome)}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-card-foreground">{user.nome}</h4>
                  <p className="text-sm text-muted-foreground">
                    {user.completedTasks} de {user.totalTasks} tarefas aprovadas
                  </p>
                </div>
                <Badge className={getRankingBadgeColor(index)}>
                  {user.completionRate}%
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}