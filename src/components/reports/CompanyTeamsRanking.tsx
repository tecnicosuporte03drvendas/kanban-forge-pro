import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useEffectiveUser } from '@/hooks/use-effective-user'

interface TeamProductivity {
  id: string
  nome: string
  totalTasks: number
  completedTasks: number
  completionRate: number
  memberCount: number
}

interface CompanyTeamsRankingProps {
  dateRange?: { from: Date; to: Date }
}

export function CompanyTeamsRanking({ dateRange }: CompanyTeamsRankingProps) {
  const { usuario } = useEffectiveUser()
  const [ranking, setRanking] = useState<TeamProductivity[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (usuario?.empresa_id) {
      loadTeamsRanking()
    }
  }, [usuario?.empresa_id, dateRange])

  const loadTeamsRanking = async () => {
    if (!usuario?.empresa_id) return
    
    setLoading(true)
    try {
      const from = dateRange?.from || (() => {
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        return weekStart
      })()
      const to = dateRange?.to || new Date()

      const { data: allTeams } = await supabase
        .from('equipes')
        .select('id, nome')
        .eq('empresa_id', usuario.empresa_id)

      if (!allTeams || allTeams.length === 0) {
        setRanking([])
        setLoading(false)
        return
      }

      const teamStats: TeamProductivity[] = []

      for (const team of allTeams) {
        const { data: members } = await supabase
          .from('usuarios_equipes')
          .select('usuario_id')
          .eq('equipe_id', team.id)

        const memberCount = members?.length || 0

        const { data: teamTasksData } = await supabase
          .from('tarefas_responsaveis')
          .select(`
            tarefa_id,
            tarefas!inner(
              id,
              status,
              created_at,
              empresa_id
            )
          `)
          .eq('equipe_id', team.id)
          .eq('tarefas.empresa_id', usuario.empresa_id)
          .gte('tarefas.created_at', from.toISOString())
          .lte('tarefas.created_at', to.toISOString())

        const totalTasks = teamTasksData?.length || 0
        const completedTasks = teamTasksData?.filter(
          (t: any) => t.tarefas.status === 'concluida' || t.tarefas.status === 'aprovada'
        ).length || 0

        teamStats.push({
          id: team.id,
          nome: team.nome,
          totalTasks,
          completedTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          memberCount
        })
      }

      const rankingArray = teamStats
        .sort((a, b) => {
          if (b.completionRate !== a.completionRate) {
            return b.completionRate - a.completionRate
          }
          return b.completedTasks - a.completedTasks
        })

      setRanking(rankingArray)

    } catch (error) {
      console.error('Error loading teams ranking:', error)
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

  if (loading) {
    return (
      <Card className="border-border bg-card h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4" />
            Ranking de Equipes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-6 h-6 bg-muted rounded"></div>
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
            <Users className="w-4 h-4" />
            Ranking de Equipes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Sem equipes cadastradas ou sem dados no período.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="w-4 h-4" />
          Ranking de Equipes
        </CardTitle>
        <p className="text-xs text-muted-foreground">Equipes mais produtivas</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {ranking.map((team, index) => (
            <div 
              key={team.id} 
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all"
            >
              <Badge className={getRankingColor(index + 1)} variant="secondary">
                #{index + 1}
              </Badge>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-card-foreground truncate">
                  {team.nome}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {team.memberCount} membros • {team.completedTasks}/{team.totalTasks} concluídas
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-primary">
                  {team.completionRate}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}