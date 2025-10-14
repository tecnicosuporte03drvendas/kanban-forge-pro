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
  position: number
}

interface IndividualRankingProps {
  dateRange?: { from: Date; to: Date }
  userId?: string
}

export function IndividualRanking({ dateRange, userId }: IndividualRankingProps) {
  const { usuario } = useEffectiveUser()
  const [userRanking, setUserRanking] = useState<UserProductivity | null>(null)
  const [loading, setLoading] = useState(false)

  const targetUserId = userId || usuario?.id

  useEffect(() => {
    if (usuario?.empresa_id && targetUserId) {
      loadUserRanking()
    }
  }, [usuario?.empresa_id, targetUserId, dateRange])

  const loadUserRanking = async () => {
    if (!usuario?.empresa_id || !targetUserId) return
    
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

      // Processar dados para calcular produtividade por usuário
      const userStats: { [userId: string]: Omit<UserProductivity, 'position'> } = {}

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
          if (b.completionRate !== a.completionRate) {
            return b.completionRate - a.completionRate
          }
          return b.completedTasks - a.completedTasks
        })

      // Encontrar posição do usuário
      const userPosition = rankingArray.findIndex(user => user.id === targetUserId)
      
      if (userPosition !== -1) {
        setUserRanking({
          ...rankingArray[userPosition],
          position: userPosition + 1
        })
      } else {
        setUserRanking(null)
      }

    } catch (error) {
      console.error('Error loading user ranking:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankingColor = (position: number): string => {
    if (position === 1) return "text-yellow-500"
    if (position === 2) return "text-gray-400"
    if (position === 3) return "text-amber-600"
    return "text-primary"
  }

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="w-4 h-4" />
            Ranking na Empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!userRanking) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="w-4 h-4" />
            Ranking na Empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sem dados de ranking no período selecionado.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="w-4 h-4" />
          Ranking na Empresa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Sua posição</span>
            <Badge className={`${getRankingColor(userRanking.position)} bg-transparent border`}>
              #{userRanking.position}
            </Badge>
          </div>
          
          <div className="bg-gradient-to-r from-primary/10 to-transparent p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-card-foreground">Taxa de Conclusão</span>
              <span className="text-2xl font-bold text-primary">{userRanking.completionRate}%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {userRanking.completedTasks} de {userRanking.totalTasks} tarefas concluídas
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}