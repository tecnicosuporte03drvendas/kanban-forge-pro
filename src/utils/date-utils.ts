export const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day) // month - 1 porque Date usa 0-11 para meses
}

export const getDateStatus = (dateString: string, taskStatus?: string, completionDate?: string) => {
  const dueDate = parseLocalDate(dateString)
  
  // Para tarefas concluídas ou aprovadas, verificar se foi entregue no prazo
  if ((taskStatus === 'concluida' || taskStatus === 'aprovada') && completionDate) {
    const completedDate = new Date(completionDate)
    completedDate.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)
    
    if (completedDate <= dueDate) {
      return { status: 'on-time', className: 'text-green-600', label: 'No prazo' }
    } else {
      return { status: 'late', className: 'text-red-600', label: 'Atrasada' }
    }
  }
  
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  
  // Reset time to compare only dates
  dueDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  tomorrow.setHours(0, 0, 0, 0)
  
  if (dueDate < today) {
    return { status: 'overdue', className: 'text-destructive', label: 'Atrasada' }
  } else if (dueDate.getTime() === today.getTime()) {
    return { status: 'urgent', className: 'text-yellow-600', label: 'Urgente' }
  } else if (dueDate.getTime() === tomorrow.getTime()) {
    return { status: 'normal', className: 'text-muted-foreground', label: 'Normal' }
  } else {
    return { status: 'normal', className: 'text-muted-foreground', label: 'Normal' }
  }
}

export const formatDate = (dateString: string) => {
  const date = parseLocalDate(dateString)
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  })
}

export const isOverdue = (dateString: string) => {
  const dueDate = parseLocalDate(dateString)
  const today = new Date()
  dueDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return dueDate < today
}