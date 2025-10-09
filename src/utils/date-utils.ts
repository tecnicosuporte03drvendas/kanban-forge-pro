export const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day) // month - 1 porque Date usa 0-11 para meses
}

export const getDateStatus = (dateString: string) => {
  const dueDate = parseLocalDate(dateString)
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