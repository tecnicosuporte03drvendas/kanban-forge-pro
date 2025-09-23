export const getDateStatus = (dateString: string) => {
  const dueDate = new Date(dateString)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  
  // Reset time to compare only dates
  dueDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  tomorrow.setHours(0, 0, 0, 0)
  
  if (dueDate < today) {
    return { status: 'overdue', className: 'text-destructive', label: 'Atrasada' }
  } else if (dueDate.getTime() === today.getTime() || dueDate.getTime() === tomorrow.getTime()) {
    return { status: 'urgent', className: 'text-yellow-600', label: 'Urgente' }
  } else {
    return { status: 'normal', className: 'text-muted-foreground', label: 'Normal' }
  }
}

export const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  })
}

export const isOverdue = (dateString: string) => {
  const dueDate = new Date(dateString)
  const today = new Date()
  dueDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return dueDate < today
}