export type Priority = "low" | "medium" | "high"
export type Status = "all" | "active" | "completed"

export interface Todo {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: Priority
  category: string
  createdAt: string
  updatedAt: string
  dueDate?: string
}

export interface TodoFilters {
  status: Status
  priority: Priority | "all"
  category: string
  search: string
}
