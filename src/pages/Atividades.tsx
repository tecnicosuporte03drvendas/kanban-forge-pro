import { useState, useEffect } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Clock, CheckSquare, Users, FileText, Edit, Trash2, Archive, Calendar as CalendarIcon, Filter, X, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useEffectiveUser } from "@/hooks/use-effective-user"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Activity {
  id: string
  acao: string
  descricao: string | null
  created_at: string
  usuarios: {
    nome: string
  }
}

const Atividades = () => {
  const { usuario } = useEffectiveUser()
  const navigate = useNavigate()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("all")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  })
  const [users, setUsers] = useState<Array<{ id: string; nome: string }>>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 10

  useEffect(() => {
    if (usuario?.empresa_id) {
      loadActivities()
      loadUsers()
    }
  }, [usuario?.empresa_id, actionFilter, userFilter, dateRange, currentPage])

  const loadUsers = async () => {
    if (!usuario?.empresa_id) return

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome')
        .eq('empresa_id', usuario.empresa_id)
        .eq('ativo', true)
        .order('nome')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadActivities = async () => {
    if (!usuario?.empresa_id) return

    setLoading(true)
    try {
      let query = supabase
        .from('tarefas_atividades')
        .select(`
          id,
          acao,
          descricao,
          created_at,
          usuarios:usuario_id(nome)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      // Filtro por ação
      if (actionFilter !== 'all') {
        query = query.eq('acao', actionFilter)
      }

      // Filtro por usuário
      if (userFilter !== 'all') {
        query = query.eq('usuario_id', userFilter)
      }

      // Filtro por data
      if (dateRange.from) {
        query = query.gte('created_at', dateRange.from.toISOString())
      }
      if (dateRange.to) {
        const toDate = new Date(dateRange.to)
        toDate.setHours(23, 59, 59, 999)
        query = query.lte('created_at', toDate.toISOString())
      }

      // Paginação
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      setActivities(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'criar': return <FileText className="w-4 h-4" />
      case 'atualizar': return <Edit className="w-4 h-4" />
      case 'deletar': return <Trash2 className="w-4 h-4" />
      case 'arquivar': return <Archive className="w-4 h-4" />
      case 'assumir': return <CheckSquare className="w-4 h-4" />
      case 'concluir': return <CheckSquare className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'criar': return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      case 'atualizar': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
      case 'deletar': return 'bg-red-500/10 text-red-600 border-red-500/20'
      case 'arquivar': return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
      case 'assumir': return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20'
      case 'concluir': return 'bg-green-500/10 text-green-600 border-green-500/20'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const clearFilters = () => {
    setActionFilter("all")
    setUserFilter("all")
    setDateRange({ from: undefined, to: undefined })
    setSearchTerm("")
    setCurrentPage(1)
  }

  const filteredActivities = activities.filter(activity => {
    if (searchTerm && !activity.descricao?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    return true
  })

  const hasActiveFilters = actionFilter !== "all" || userFilter !== "all" || dateRange.from || dateRange.to || searchTerm

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="flex flex-col h-screen">
      <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <SidebarTrigger className="lg:hidden" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Histórico de Atividades</h1>
              <p className="text-muted-foreground">Acompanhe todas as ações realizadas na empresa</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6 bg-gradient-kanban">
        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Input
                  placeholder="Buscar na descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as ações</SelectItem>
                    <SelectItem value="criar">Criar</SelectItem>
                    <SelectItem value="atualizar">Atualizar</SelectItem>
                    <SelectItem value="deletar">Deletar</SelectItem>
                    <SelectItem value="arquivar">Arquivar</SelectItem>
                    <SelectItem value="assumir">Assumir</SelectItem>
                    <SelectItem value="concluir">Concluir</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuários</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                            {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                          </>
                        ) : (
                          format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                        )
                      ) : (
                        <span>Período</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                      numberOfMonths={2}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>

                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Limpar filtros
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>
                {totalCount} {totalCount === 1 ? 'atividade encontrada' : 'atividades encontradas'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-center py-8">Carregando atividades...</p>
              ) : filteredActivities.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhuma atividade encontrada.</p>
              ) : (
                <>
                  <div className="space-y-3">
                    {filteredActivities.map((activity) => (
                      <div 
                        key={activity.id} 
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${getActivityColor(activity.acao)}`}>
                            {getActivityIcon(activity.acao)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-card-foreground">{activity.descricao || activity.acao}</p>
                              <Badge variant="outline" className="text-xs">
                                {activity.acao}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="w-3 h-3" />
                              <span>{activity.usuarios.nome}</span>
                              <span>•</span>
                              <Clock className="w-3 h-3" />
                              <span>
                                {format(new Date(activity.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Página {currentPage} de {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Atividades
