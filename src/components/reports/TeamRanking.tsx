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
  position: number
  memberCount: number
}

interface TeamRankingProps {
  dateRange?: { from: Date; to: Date }
  userId?: string
}

export function TeamRanking({ dateRange, userId }: TeamRankingProps) {
  const { usuario } = useEffectiveUser()
  const [userTeams, setUserTeams] = useState<TeamProductivity[]>([])
  const [loading, setLoading] = useState(false)

  const targetUserId = userId || usuario?.id

  useEffect(() => {
    if (usuario?.empresa_id && targetUserId) {
      loadTeamRanking()
    }
  }, [usuario?.empresa_id, targetUserId, dateRange])

  const loadTeamRanking = async () => {
    if (!usuario?.empresa_id || !targetUserId) return
    
    setLoading(true)
    try {
      const from = dateRange?.from || (() => {
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        return weekStart
      })()
      const to = dateRange?.to || new Date()

      // Buscar equipes do usuário
      const { data: userTeamsData } = await supabase
        .from('usuarios_equipes')
        .select('equipe_id, equipes(id, nome)')
        .eq('usuario_id', targetUserId)

      if (!userTeamsData || userTeamsData.length === 0) {
        setUserTeams([])
        setLoading(false)
        return
      }

      const teamIds = userTeamsData.map(ut => ut.equipe_id)

      // Buscar todas as equipes da empresa para ranking
      const { data: allTeams } = await supabase
        .from('equipes')
        .select('id, nome')
        .eq('empresa_id', usuario.empresa_id)

      if (!allTeams) {
        setUserTeams([])
        setLoading(false)
        return
      }

      // Buscar tarefas de todas as equipes
      const teamStats: { [teamId: string]: Omit<TeamProductivity, 'position'> } = {}

      for (const team of allTeams) {
        // Contar membros da equipe
        const { data: members } = await supabase
          .from('usuarios_equipes')
          .select('usuario_id')
          .eq('equipe_id', team.id)

        const memberCount = members?.length || 0

        // Buscar tarefas da equipe
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

        teamStats[team.id] = {
          id: team.id,
          nome: team.nome,
          totalTasks,
          completedTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          memberCount
        }
      }

      // Ordenar equipes
      const rankingArray = Object.values(teamStats)
        .sort((a, b) => {
          if (b.completionRate !== a.completionRate) {
            return b.completionRate - a.completionRate
          }
          return b.completedTasks - a.completedTasks
        })
        .map((team, index) => ({
          ...team,
          position: index + 1
        }))

      // Filtrar apenas as equipes do usuário
      const userTeamsRanking = rankingArray.filter(team => teamIds.includes(team.id))

      setUserTeams(userTeamsRanking)

    } catch (error) {
      console.error('Error loading team ranking:', error)
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
            <Users className="w-4 h-4" />
            Ranking da Equipe
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

  if (userTeams.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4" />
            Ranking da Equipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Você não faz parte de nenhuma equipe.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="w-4 h-4" />
          Ranking da Equipe
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {userTeams.map(team => (
            <div key={team.id} className="bg-gradient-to-r from-primary/10 to-transparent p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-sm font-medium text-card-foreground">{team.nome}</h4>
                  <p className="text-xs text-muted-foreground">{team.memberCount} membros</p>
                </div>
                <Badge className={`${getRankingColor(team.position)} bg-transparent border`}>
                  #{team.position}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Taxa de Conclusão</span>
                <span className="text-xl font-bold text-primary">{team.completionRate}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {team.completedTasks} de {team.totalTasks} tarefas concluídas
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}