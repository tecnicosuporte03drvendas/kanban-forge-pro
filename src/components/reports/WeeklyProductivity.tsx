import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useEffectiveUser } from '@/hooks/use-effective-user'
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface WeeklyData {
  day: string
  value: number
}

export function WeeklyProductivity() {
  const { usuario } = useEffectiveUser()
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (usuario?.empresa_id) {
      loadWeeklyData()
    }
  }, [usuario?.empresa_id])

  const loadWeeklyData = async () => {
    if (!usuario?.empresa_id) return
    
    setLoading(true)
    try {
      const now = new Date()
      const weekStart = startOfWeek(now, { locale: ptBR })
      const weekEnd = endOfWeek(now, { locale: ptBR })
      
      // Buscar tarefas criadas ou validadas nesta semana
      const { data: tarefas, error } = await supabase
        .from('tarefas')
        .select('created_at, status, updated_at')
        .eq('empresa_id', usuario.empresa_id)
        .eq('arquivada', false)
        .or(`created_at.gte.${weekStart.toISOString()},and(status.eq.validada,updated_at.gte.${weekStart.toISOString()})`)

      if (error) throw error

      // Criar array para os 7 dias da semana
      const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })
      
      const weeklyStats = daysOfWeek.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd')
        
        // Contar tarefas criadas neste dia
        const createdCount = tarefas?.filter(tarefa => 
          tarefa.created_at.startsWith(dayStr)
        ).length || 0
        
        // Contar tarefas validadas neste dia
        const validatedCount = tarefas?.filter(tarefa => 
          tarefa.status === 'validada' && tarefa.updated_at.startsWith(dayStr)
        ).length || 0
        
        return {
          day: format(day, 'EEE', { locale: ptBR }).charAt(0).toUpperCase() + format(day, 'EEE', { locale: ptBR }).slice(1),
          value: createdCount + validatedCount
        }
      })
      
      setWeeklyData(weeklyStats)

    } catch (error) {
      console.error('Error loading weekly productivity:', error)
    } finally {
      setLoading(false)
    }
  }

  const maxValue = Math.max(...weeklyData.map(item => item.value), 1)

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Produtividade Semanal</CardTitle>
          <p className="text-sm text-muted-foreground">Tarefas criadas ou validadas nos últimos 7 dias</p>
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
        <CardTitle>Produtividade Semanal</CardTitle>
        <p className="text-sm text-muted-foreground">Tarefas criadas ou validadas nos últimos 7 dias</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {weeklyData.map((item, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-12 text-sm font-medium text-muted-foreground">{item.day}</div>
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
                />
              </div>
              <div className="w-8 text-sm font-medium text-card-foreground">{item.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}