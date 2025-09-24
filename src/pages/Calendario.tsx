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
import { useState } from "react"

const Calendario = () => {
  const [viewMode, setViewMode] = useState<'dia' | 'semana' | 'mes'>('semana')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const currentDate = new Date()
  const currentMonth = currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  
  // Simulated calendar data
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - date.getDay() + i)
    return date
  })

  const events = [
    {
      id: "1",
      title: "Reunião de Vendas",
      time: "09:00",
      type: "meeting",
      priority: "alta",
      dueDate: "2025-01-20",
      team: "Vendas",
      teamColor: "bg-blue-500",
      assignee: "Sergio Ricardo"
    },
    {
      id: "2",
      title: "Apresentação Proposta ABC",
      time: "14:30",
      type: "presentation",
      priority: "alta",
      dueDate: "2025-01-22",
      team: "Comercial",
      teamColor: "bg-green-500",
      assignee: "Ana Silva"
    },
    {
      id: "3",
      title: "Follow-up Clientes",
      time: "16:00", 
      type: "task",
      priority: "media",
      dueDate: "2025-01-25",
      team: "Marketing",
      teamColor: "bg-purple-500",
      assignee: "João Santos"
    }
  ]

  const getEventColor = (priority: string) => {
    switch (priority) {
      case "alta": return "bg-priority-high text-white"
      case "media": return "bg-priority-medium text-white"
      case "baixa": return "bg-priority-low text-white"
      default: return "bg-muted text-muted-foreground"
    }
  }

  // Função para renderizar visualização do dia
  const renderDayView = () => {
    const today = selectedDate || currentDate
    const dayName = today.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    
    return (
      <div className="space-y-4">
        <div className="text-center border-b border-border pb-4">
          <h3 className="text-2xl font-bold text-card-foreground capitalize mb-2">{dayName}</h3>
          <p className="text-muted-foreground">Clique em um horário para adicionar um agendamento</p>
        </div>
        
        <div className="max-h-[600px] overflow-y-auto">
          <div className="space-y-1">
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="flex hover:bg-accent/30 transition-colors rounded-lg">
                <div className="w-20 flex-shrink-0 text-sm text-muted-foreground font-medium py-3 px-3 border-r border-border/20">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 min-h-[60px] p-3 relative">
                  {hour === 9 && (
                    <div className="bg-primary/10 border-l-4 border-primary rounded-r p-3 mb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-primary text-sm">09:00 - 10:00</div>
                          <div className="font-medium text-card-foreground">Reunião de Vendas</div>
                          <div className="text-xs text-muted-foreground mt-1">Equipe de Vendas • Sala de reuniões</div>
                        </div>
                        <Badge className="bg-primary text-primary-foreground">Alta</Badge>
                      </div>
                    </div>
                  )}
                  {hour === 14 && (
                    <div className="bg-priority-high/10 border-l-4 border-priority-high rounded-r p-3 mb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-priority-high text-sm">14:30 - 16:00</div>
                          <div className="font-medium text-card-foreground">Apresentação Proposta ABC</div>
                          <div className="text-xs text-muted-foreground mt-1">Comercial • Cliente ABC Corp</div>
                        </div>
                        <Badge className="bg-priority-high text-white">Urgente</Badge>
                      </div>
                    </div>
                  )}
                  {hour === 16 && (
                    <div className="bg-priority-medium/10 border-l-4 border-priority-medium rounded-r p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-priority-medium text-sm">16:00 - 17:00</div>
                          <div className="font-medium text-card-foreground">Follow-up Clientes</div>
                          <div className="text-xs text-muted-foreground mt-1">Marketing • Ligações de retorno</div>
                        </div>
                        <Badge className="bg-priority-medium text-white">Média</Badge>
                      </div>
                    </div>
                  )}
                  {![9, 14, 16].includes(hour) && (
                    <button className="w-full h-full text-left opacity-0 hover:opacity-100 transition-opacity">
                      <div className="text-xs text-muted-foreground hover:text-primary">
                        + Adicionar agendamento às {hour.toString().padStart(2, '0')}:00
                      </div>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Função para renderizar visualização da semana
  const renderWeekView = () => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-4 mb-4">
          {weekDays.map((day, index) => (
            <div key={day} className="text-center">
              <div className="text-sm font-medium text-muted-foreground mb-2">{day}</div>
              <div className={`text-lg font-semibold p-2 rounded-lg ${
                index === new Date().getDay() 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-card-foreground'
              }`}>
                {dates[index].getDate()}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-4 mt-8" style={{ minHeight: "400px" }}>
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="col-span-7 border-b border-border/20 py-2">
              <div className="flex">
                <div className="w-16 text-xs text-muted-foreground">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 grid grid-cols-7 gap-1">
                  {hour === 9 && (
                    <div className="col-span-2 bg-primary/10 border border-primary/20 rounded p-1">
                      <div className="text-xs font-medium text-primary">09:00 - Reunião de Vendas</div>
                    </div>
                  )}
                  {hour === 14 && (
                    <div className="col-span-3 col-start-4 bg-priority-high/10 border border-priority-high/20 rounded p-1">
                      <div className="text-xs font-medium text-priority-high">14:30 - Apresentação Proposta ABC</div>
                    </div>
                  )}
                  {hour === 16 && (
                    <div className="col-span-2 col-start-6 bg-priority-medium/10 border border-priority-medium/20 rounded p-1">
                      <div className="text-xs font-medium text-priority-medium">16:00 - Follow-up Clientes</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Função para renderizar visualização do mês
  const renderMonthView = () => {
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
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
      return ['2025-01-20', '2025-01-22', '2025-01-25'].some(eventDate => 
        new Date(eventDate).toDateString() === date.toDateString()
      )
    }

    const getEventsForDate = (date: Date) => {
      return events.filter(event => 
        new Date(event.dueDate).toDateString() === date.toDateString()
      )
    }

    return (
      <div className="space-y-6">
        {/* Cabeçalho do mês */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-card-foreground capitalize mb-2">
            {today.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </h3>
        </div>

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
                const isCurrentMonth = date.getMonth() === today.getMonth()
                const isToday = date.toDateString() === today.toDateString()
                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
                const dayEvents = getEventsForDate(date)
                
                return (
                  <div
                    key={dayIndex}
                    className={`min-h-[120px] p-2 border-r border-border last:border-r-0 cursor-pointer hover:bg-accent/30 transition-colors ${
                      !isCurrentMonth ? 'bg-muted/10 text-muted-foreground' : ''
                    } ${isSelected ? 'bg-primary/10 ring-2 ring-primary/20' : ''}`}
                    onClick={() => setSelectedDate(date)}
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
                          className={`text-xs p-1 rounded truncate ${
                            event.priority === 'alta' 
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
                  <div key={event.id} className="p-4 border border-border rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
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
                      <Badge className={`${getEventColor(event.priority)}`}>
                        {event.priority.charAt(0).toUpperCase() + event.priority.slice(1)}
                      </Badge>
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
              <p className="text-muted-foreground">Visualize suas tarefas, reuniões e lembretes</p>
            </div>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Criar Agendamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Novo Agendamento</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="reuniao" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="reuniao" className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Reunião
                  </TabsTrigger>
                  <TabsTrigger value="tarefa" className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    Tarefa
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="reuniao" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="reuniao-titulo">Título da Reunião</Label>
                    <Input id="reuniao-titulo" placeholder="Ex: Reunião de vendas" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reuniao-data">Data</Label>
                      <Input id="reuniao-data" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reuniao-hora">Horário</Label>
                      <Input id="reuniao-hora" type="time" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reuniao-participantes">Participantes</Label>
                    <Input id="reuniao-participantes" placeholder="Digite os nomes dos participantes" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reuniao-local">Local/Link</Label>
                    <Input id="reuniao-local" placeholder="Sala de reuniões ou link da videoconferência" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reuniao-descricao">Descrição</Label>
                    <Textarea id="reuniao-descricao" placeholder="Descrição da reunião..." />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={() => setIsModalOpen(false)}>
                      Criar Reunião
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="tarefa" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="tarefa-titulo">Título da Tarefa</Label>
                    <Input id="tarefa-titulo" placeholder="Ex: Preparar relatório mensal" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tarefa-data">Data de Vencimento</Label>
                      <Input id="tarefa-data" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tarefa-prioridade">Prioridade</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a prioridade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tarefa-responsavel">Responsável</Label>
                    <Input id="tarefa-responsavel" placeholder="Nome do responsável" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tarefa-equipe">Equipe</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a equipe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vendas">Vendas</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="comercial">Comercial</SelectItem>
                        <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tarefa-descricao">Descrição</Label>
                    <Textarea id="tarefa-descricao" placeholder="Descrição da tarefa..." />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={() => setIsModalOpen(false)}>
                      Criar Tarefa
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 bg-gradient-kanban">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <CardTitle className="text-xl font-bold text-card-foreground capitalize">
                      {currentMonth}
                    </CardTitle>
                    <Button variant="outline" size="sm">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant={viewMode === 'dia' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => setViewMode('dia')}
                      className={viewMode === 'dia' ? 'bg-primary text-primary-foreground' : ''}
                    >
                      Dia
                    </Button>
                    <Button 
                      variant={viewMode === 'semana' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => setViewMode('semana')}
                      className={viewMode === 'semana' ? 'bg-primary text-primary-foreground' : ''}
                    >
                      Semana
                    </Button>
                    <Button 
                      variant={viewMode === 'mes' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => setViewMode('mes')}
                      className={viewMode === 'mes' ? 'bg-primary text-primary-foreground' : ''}
                    >
                      Mês
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === 'dia' && renderDayView()}
                {viewMode === 'semana' && renderWeekView()}
                {viewMode === 'mes' && renderMonthView()}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Próximos Agendamentos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="p-3 border border-border rounded-lg bg-background/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm text-card-foreground">{event.title}</h4>
                          <Badge className={`text-xs ${event.teamColor} text-white border-0 px-2 py-1`}>
                            {event.team}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {event.time}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {event.assignee}
                          </span>
                          <span className={`${getDateStatus(event.dueDate).className}`}>
                            {new Date(event.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                          </span>
                        </div>
                      </div>
                      <Badge className={`text-xs ${getEventColor(event.priority)}`}>
                        {event.priority.charAt(0).toUpperCase() + event.priority.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Conectar Google Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto">
                    <CalendarIcon className="w-6 h-6 text-yellow-600" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Google Calendar desconectado. Você está vendo apenas tarefas e lembretes locais.
                  </p>
                  <Button size="sm" className="bg-primary hover:bg-primary-hover text-primary-foreground">
                    Conectar Google Calendar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendario;