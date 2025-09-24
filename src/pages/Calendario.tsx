import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users } from "lucide-react"
import { getDateStatus } from "@/utils/date-utils"

const Calendario = () => {
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
          <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Criar Evento
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-6 pt-12 pb-6 bg-gradient-kanban">
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
                    <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
                      Semana
                    </Button>
                    <Button variant="outline" size="sm">
                      Mês
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Próximos Eventos
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