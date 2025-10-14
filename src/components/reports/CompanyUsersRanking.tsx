import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useEffectiveUser } from '@/hooks/use-effective-user'

interface UserProductivity {
  id: string
  nome: string
  totalTasks: number
  completedTasks: number
  completionRate: number
}

interface CompanyUsersRankingProps {
  dateRange?: { from: Date; to: Date }
  userId?: string
}

export function CompanyUsersRanking({ dateRange, userId }: CompanyUsersRankingProps) {
  const { usuario } = useEffectiveUser()
  const [ranking, setRanking] = useState<UserProductivity[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (usuario?.empresa_id) {
      loadUsersRanking()
    }
  }, [usuario?.empresa_id, dateRange])

  const loadUsersRanking = async () => {
    if (!usuario?.empresa_id) return
    
    setLoading(true)
    try {
      const from = dateRange?.from || (() => {
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        return weekStart
      })()
      const to = dateRange?.to || new Date()

      const { data: tarefas, error } = await supabase
        .from('tarefas')
        .select(`
          id,
          status,
          created_at,
          tarefas_responsaveis(
            usuarios:usuario_id(id, nome)
          )
        `)
        .eq('empresa_id', usuario.empresa_id)
        .eq('arquivada', false)
        .gte('created_at', from.toISOString())
        .lte('created_at', to.toISOString())

      if (error) throw error

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

      const rankingArray = Object.values(userStats)
        .map(user => ({
          ...user,
          completionRate: user.totalTasks > 0 ? Math.round((user.completedTasks / user.totalTasks) * 100) : 0
        }))
        .sort((a, b) => {
          if (b.completionRate !== a.completionRate) {
            return b.completionRate - a.completionRate
          }
          return b.completedTasks - a.completedTasks
        })

      setRanking(rankingArray)

    } catch (error) {
      console.error('Error loading users ranking:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankingColor = (position: number): string => {
    if (position === 1) return "bg-yellow-500 text-white"
    if (position === 2) return "bg-gray-400 text-white"
    if (position === 3) return "bg-amber-600 text-white"
    return "bg-primary text-primary-foreground"
  }

  const getInitials = (nome: string): string => {
    return nome
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <Card className="border-border bg-card h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="w-4 h-4" />
            Ranking da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-6 h-6 bg-muted rounded"></div>
                <div className="w-8 h-8 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                  <div className="h-2 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (ranking.length === 0) {
    return (
      <Card className="border-border bg-card h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="w-4 h-4" />
            Ranking da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Sem dados de ranking no período selecionado.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="w-4 h-4" />
          Ranking da Empresa
        </CardTitle>
        <p className="text-xs text-muted-foreground">Usuários mais produtivos</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {ranking.map((user, index) => {
            const isCurrentUser = user.id === userId
            return (
              <div 
                key={user.id} 
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isCurrentUser 
                    ? 'bg-primary/20 ring-2 ring-primary/50' 
                    : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                <Badge className={getRankingColor(index + 1)} variant="secondary">
                  #{index + 1}
                </Badge>
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">
                    {getInitials(user.nome)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-card-foreground truncate">
                    {user.nome}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {user.completedTasks}/{user.totalTasks} concluídas
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-primary">
                    {user.completionRate}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}