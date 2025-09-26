import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users, Video, CheckSquare } from "lucide-react"
import { getDateStatus } from "@/utils/date-utils"
import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

interface CalendarEvent {
  id: string
  title: string
  time: string
  type: "task" | "meeting"
  priority: "alta" | "media" | "baixa" | "urgente"
  dueDate: string
  team: string
  teamColor: string
  assignee: string
  status: string
}

const Calendario = () => {
  const { usuario } = useAuth()
  const [viewMode, setViewMode] = useState<'dia' | 'semana' | 'mes'>('semana')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date()) // Data atual da visualização
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  
  const currentDate = new Date()
  
  // Carregar tarefas da empresa
  useEffect(() => {
    if (usuario?.empresa_id) {
      loadTasks()
    }
  }, [usuario?.empresa_id])

  const loadTasks = async () => {
    if (!usuario?.empresa_id) return
    
    setLoading(true)
    try {
      const { data: tarefas, error } = await supabase
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
        .order('data_conclusao', { ascending: true })

      if (error) throw error

      // Transform tasks to calendar events
      const calendarEvents: CalendarEvent[] = tarefas?.map((tarefa: any) => {
        const responsaveis = tarefa.tarefas_responsaveis || []
        const usuarios = responsaveis.filter((r: any) => r.usuarios).map((r: any) => r.usuarios)
        const equipes = responsaveis.filter((r: any) => r.equipes).map((r: any) => r.equipes)
        
        let assignee = 'Não atribuído'
        let team = 'Sem equipe'
        let teamColor = 'bg-gray-500'
        
        if (usuarios.length > 1) {
          assignee = `${usuarios.length} Responsáveis`
        } else if (usuarios.length > 0) {
          assignee = usuarios[0].nome
        }
        
        if (equipes.length > 0) {
          team = equipes[0].nome
          teamColor = 'bg-blue-500'
        }

        // Extract time from horario_conclusao or use default
        const time = tarefa.horario_conclusao || '18:00:00'
        const timeFormatted = time.substring(0, 5) // HH:MM

        return {
          id: tarefa.id,
          title: tarefa.titulo,
          time: timeFormatted,
          type: 'task',
          priority: tarefa.prioridade,
          dueDate: tarefa.data_conclusao,
          team,
          teamColor,
          assignee,
          status: tarefa.status
        }
      }) || []

      setEvents(calendarEvents)
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  // Navegação
  const navigatePrevious = () => {
    const newDate = new Date(currentViewDate)
    
    if (viewMode === 'dia') {
      newDate.setDate(newDate.getDate() - 1)
    } else if (viewMode === 'semana') {
      newDate.setDate(newDate.getDate() - 7)
    } else if (viewMode === 'mes') {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    
    setCurrentViewDate(newDate)
    setSelectedDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentViewDate)
    
    if (viewMode === 'dia') {
      newDate.setDate(newDate.getDate() + 1)
    } else if (viewMode === 'semana') {
      newDate.setDate(newDate.getDate() + 7)
    } else if (viewMode === 'mes') {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    
    setCurrentViewDate(newDate)
    setSelectedDate(newDate)
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentViewDate(today)
    setSelectedDate(today)
  }

  const getNavigationTitle = () => {
    if (viewMode === 'dia') {
      return currentViewDate.toLocaleDateString("pt-BR", { 
        weekday: "long", 
        day: "numeric", 
        month: "long", 
        year: "numeric" 
      })
    } else if (viewMode === 'semana') {
      const startOfWeek = new Date(currentViewDate)
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)
      
      return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} de ${startOfWeek.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`
    } else {
      return currentViewDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    }
  }
  
  // Calculate week dates based on currentViewDate
  const getWeekDates = () => {
    const startOfWeek = new Date(currentViewDate)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek)
      date.setDate(date.getDate() + i)
      return date
    })
  }

  const getEventColor = (priority: string) => {
    switch (priority) {
      case "alta": return "bg-priority-high text-white"
      case "urgente": return "bg-priority-high text-white"
      case "media": return "bg-priority-medium text-white"
      case "baixa": return "bg-priority-low text-white"
      default: return "bg-muted text-muted-foreground"
    }
  }

  // Função para renderizar visualização do dia
  const renderDayView = () => {
    const today = currentViewDate
    const dayName = today.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    const todayStr = today.toISOString().split('T')[0]
    const todayEvents = events.filter(event => event.dueDate === todayStr)
    
    return (
      <div className="space-y-4">
        <div className="text-center border-b border-border pb-4">
          <h3 className="text-2xl font-bold text-card-foreground capitalize mb-2">{dayName}</h3>
          <p className="text-muted-foreground">
            {loading ? 'Carregando tarefas...' : `${todayEvents.length} tarefa(s) agendada(s)`}
          </p>
        </div>
        
        <div className="max-h-[600px] overflow-y-auto">
          <div className="space-y-1">
            {Array.from({ length: 24 }, (_, hour) => {
              const hourEvents = todayEvents.filter(event => {
                const eventHour = parseInt(event.time.split(':')[0])
                return eventHour === hour
              })
              
              return (
                <div key={hour} className="flex hover:bg-accent/30 transition-colors rounded-lg">
                  <div className="w-20 flex-shrink-0 text-sm text-muted-foreground font-medium py-3 px-3 border-r border-border/20">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  <div className="flex-1 min-h-[60px] p-3 relative">
                    {hourEvents.map((event, index) => (
                      <div key={index} className={`mb-2 p-3 rounded-r border-l-4 ${
                        event.priority === 'alta' || event.priority === 'urgente'
                          ? 'bg-priority-high/10 border-priority-high'
                          : event.priority === 'media'
                          ? 'bg-priority-medium/10 border-priority-medium'
                          : 'bg-primary/10 border-primary'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className={`font-semibold text-sm ${
                              event.priority === 'alta' || event.priority === 'urgente'
                                ? 'text-priority-high'
                                : event.priority === 'media'
                                ? 'text-priority-medium'
                                : 'text-primary'
                            }`}>
                              {event.time}
                            </div>
                            <div className="font-medium text-card-foreground">{event.title}</div>
                            <div className="text-xs text-muted-foreground mt-1">{event.team} • {event.assignee}</div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Badge className={`${
                              event.priority === 'alta' || event.priority === 'urgente'
                                ? 'bg-priority-high text-white'
                                : event.priority === 'media'
                                ? 'bg-priority-medium text-white'
                                : 'bg-primary text-primary-foreground'
                            }`}>
                              {event.priority.charAt(0).toUpperCase() + event.priority.slice(1)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {event.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                    {hourEvents.length === 0 && (
                      <button className="w-full h-full text-left opacity-0 hover:opacity-100 transition-opacity">
                        <div className="text-xs text-muted-foreground hover:text-primary">
                          + Adicionar agendamento às {hour.toString().padStart(2, '0')}:00
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Função para renderizar visualização da semana
  const renderWeekView = () => {
    const weekDates = getWeekDates()
    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-4 mb-4">
          {weekDays.map((day, index) => {
            const currentWeekDate = weekDates[index]
            const dayEvents = events.filter(event => 
              event.dueDate === currentWeekDate.toISOString().split('T')[0]
            )
            
            return (
              <div key={day} className="text-center">
                <div className="text-sm font-medium text-muted-foreground mb-2">{day}</div>
                <div className={`text-lg font-semibold p-2 rounded-lg relative cursor-pointer hover:bg-accent/30 ${
                  currentWeekDate.toDateString() === currentDate.toDateString()
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-card-foreground'
                }`}
                onClick={() => {
                  setViewMode('dia')
                  setCurrentViewDate(currentWeekDate)
                  setSelectedDate(currentWeekDate)
                }}>
                  {currentWeekDate.getDate()}
                  {dayEvents.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                      {dayEvents.length}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-7 gap-4 mt-8" style={{ minHeight: "400px" }}>
          {Array.from({ length: 24 }, (_, hour) => {
            return (
              <div key={hour} className="col-span-7 border-b border-border/20 py-2">
                <div className="flex">
                  <div className="w-16 text-xs text-muted-foreground">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  <div className="flex-1 grid grid-cols-7 gap-1">
                    {weekDates.map((weekDate, dayIndex) => {
                      const dateStr = weekDate.toISOString().split('T')[0]
                      const dayHourEvents = events.filter(event => 
                        event.dueDate === dateStr && parseInt(event.time.split(':')[0]) === hour
                      )
                      
                      return (
                        <div key={dayIndex} className="min-h-[40px]">
                          {dayHourEvents.map((event, eventIndex) => (
                            <div
                              key={eventIndex}
                              className={`text-xs p-1 rounded border mb-1 cursor-pointer hover:opacity-80 ${
                                event.priority === 'alta' || event.priority === 'urgente'
                                  ? 'bg-priority-high/20 border-priority-high/30 text-priority-high'
                                  : event.priority === 'media'
                                  ? 'bg-priority-medium/20 border-priority-medium/30 text-priority-medium'
                                  : 'bg-primary/20 border-primary/30 text-primary'
                              }`}
                              title={`${event.title} - ${event.assignee}`}
                            >
                              <div className="font-medium truncate">{event.time}</div>
                              <div className="truncate">{event.title}</div>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Função para renderizar visualização do mês
  const renderMonthView = () => {
    const firstDayOfMonth = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), 1)
    const startDate = new Date(firstDayOfMonth)
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay())
    
    const weeks = []
    let currentWeek = []
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      
      currentWeek.push(currentDate)
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }

    const hasEvents = (date: Date) => {
      const dateStr = date.toISOString().split('T')[0]
      return events.some(event => event.dueDate === dateStr)
    }

    const getEventsForDate = (date: Date) => {
      const dateStr = date.toISOString().split('T')[0]
      return events.filter(event => event.dueDate === dateStr)
    }

    return (
      <div className="space-y-6">
        {/* Grid do calendário */}
        <div className="bg-background rounded-lg border border-border overflow-hidden">
          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 bg-muted/30">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
              <div key={day} className="p-4 text-center font-semibold text-muted-foreground border-r border-border last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Semanas do mês */}
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-t border-border">
              {week.map((date, dayIndex) => {
                const isCurrentMonth = date.getMonth() === currentViewDate.getMonth()
                const isToday = date.toDateString() === currentDate.toDateString()
                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
                const dayEvents = getEventsForDate(date)
                
                return (
                  <div
                    key={dayIndex}
                    className={`min-h-[120px] p-2 border-r border-border last:border-r-0 cursor-pointer hover:bg-accent/30 transition-colors ${
                      !isCurrentMonth ? 'bg-muted/10 text-muted-foreground' : ''
                    } ${isSelected ? 'bg-primary/10 ring-2 ring-primary/20' : ''}`}
                    onClick={() => {
                      setSelectedDate(date)
                      setCurrentViewDate(date)
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${
                        isToday 
                          ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs' 
                          : isCurrentMonth ? 'text-card-foreground' : 'text-muted-foreground'
                      }`}>
                        {date.getDate()}
                      </span>
                      {hasEvents(date) && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                    
                    {/* Agendamentos do dia */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event, eventIndex) => (
                        <div
                          key={eventIndex}
                          className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${
                            event.priority === 'alta' || event.priority === 'urgente'
                              ? 'bg-priority-high/20 text-priority-high border-l-2 border-priority-high' 
                              : event.priority === 'media' 
                              ? 'bg-priority-medium/20 text-priority-medium border-l-2 border-priority-medium'
                              : 'bg-primary/20 text-primary border-l-2 border-primary'
                          }`}
                        >
                          <div className="font-medium">{event.time}</div>
                          <div className="truncate">{event.title}</div>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground font-medium">
                          +{dayEvents.length - 2} mais
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        
        {/* Agendamentos do dia selecionado */}
        {selectedDate && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="font-bold text-lg text-card-foreground mb-4">
              Agendamentos para {selectedDate.toLocaleDateString("pt-BR", { 
                weekday: "long",
                day: "numeric", 
                month: "long", 
                year: "numeric" 
              })}
            </h4>
            <div className="space-y-3">
              {getEventsForDate(selectedDate).length > 0 ? (
                getEventsForDate(selectedDate).map((event) => (
                  <div key={event.id} className="p-4 border border-border rounded-lg bg-background/50 hover:bg-background/80 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{event.time}</span>
                        </div>
                        <div>
                          <h5 className="font-semibold text-card-foreground">{event.title}</h5>
                          <p className="text-sm text-muted-foreground">{event.assignee}</p>
                        </div>
                        <Badge className={`${event.teamColor} text-white border-0`}>
                          {event.team}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge className={`${getEventColor(event.priority)}`}>
                          {event.priority.charAt(0).toUpperCase() + event.priority.slice(1)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum agendamento para este dia</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar agendamento
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
              <p className="text-muted-foreground">
                {loading 
                  ? 'Carregando agenda...' 
                  : `${events.length} tarefa(s) agendada(s)`
                }
              </p>
            </div>
          </div>
          
          {/* Controles de navegação */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={navigatePrevious}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="text-center min-w-[200px]">
                <h2 className="text-lg font-semibold text-foreground capitalize">
                  {getNavigationTitle()}
                </h2>
              </div>
              
              <Button variant="outline" size="sm" onClick={navigateNext}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoje
            </Button>
            
            {/* Seletor de visualização */}
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'dia' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('dia')}
                className="text-xs"
              >
                Dia
              </Button>
              <Button
                variant={viewMode === 'semana' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('semana')}
                className="text-xs"
              >
                Semana
              </Button>
              <Button
                variant={viewMode === 'mes' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('mes')}
                className="text-xs"
              >
                Mês
              </Button>
            </div>

            <Button 
              className="bg-primary hover:bg-primary-hover text-primary-foreground"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Agendamento
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 bg-gradient-kanban">
        <div className="max-w-7xl mx-auto">
          {viewMode === 'dia' && renderDayView()}
          {viewMode === 'semana' && renderWeekView()}
          {viewMode === 'mes' && renderMonthView()}
        </div>
      </div>

      {/* Modal placeholder for future use */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-muted-foreground">Funcionalidade em desenvolvimento...</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Calendario