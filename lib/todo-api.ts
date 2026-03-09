import type { Todo, Priority } from "@/types/todo"

// Configure your API base URL here
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

// Backend priority enum (uppercase)
type ApiPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

// API response type that matches your actual Spring Boot backend
interface ApiTodo {
  id: number
  title: string
  description?: string
  completed: boolean
  priority: ApiPriority
  specification: string | null  // Backend uses 'specification' not 'category'
  createdAt: string
  updatedAt: string
  dueDate?: string  // Try camelCase first
  due_date?: string  // Also check snake_case
}

// Transform frontend priority to backend format
function toApiPriority(priority: Priority): ApiPriority {
  const map: Record<Priority, ApiPriority> = {
    low: "LOW",
    medium: "MEDIUM",
    high: "HIGH",
  }
  return map[priority]
}

// Transform backend priority to frontend format
function fromApiPriority(priority: ApiPriority): Priority {
  const map: Record<ApiPriority, Priority> = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    CRITICAL: "high", // Map CRITICAL to high for now
  }
  return map[priority]
}

// Transform API response to frontend Todo type
function transformApiTodo(apiTodo: ApiTodo): Todo {
  // Convert dd/MM/yyyy to ISO format for frontend
  let dueDate: string | undefined
  const dueDateValue = apiTodo.dueDate || apiTodo.due_date  // Check both camelCase and snake_case
  if (dueDateValue) {
    const [day, month, year] = dueDateValue.split('/')
    dueDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  return {
    id: String(apiTodo.id),  // Convert number to string
    title: apiTodo.title,
    description: apiTodo.description,
    completed: apiTodo.completed,
    priority: fromApiPriority(apiTodo.priority),
    category: apiTodo.specification || "Other",  // Map specification -> category
    createdAt: apiTodo.createdAt,
    updatedAt: apiTodo.updatedAt,
    dueDate: dueDate,
  }
}

// Convert ISO date (yyyy-MM-dd) to dd/MM/yyyy format for backend
function formatDateForBackend(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

// GET /api/tasks - Fetch all tasks
export async function fetchTodos(): Promise<Todo[]> {
  const response = await fetch(`${API_BASE_URL}/api/tasks`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to fetch todos: ${response.statusText} - ${errorText}`)
  }

  const data: ApiTodo[] = await response.json()
  return data.map(transformApiTodo)
}

// GET /api/tasks/{id} - Fetch single task
export async function fetchTodoById(id: string): Promise<Todo> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to fetch todo: ${response.statusText} - ${errorText}`)
  }

  const data: ApiTodo = await response.json()
  return transformApiTodo(data)
}

// POST /api/tasks - Create new task
export async function createTodo(
  todo: Omit<Todo, "id" | "createdAt" | "updatedAt" | "completed">
): Promise<Todo> {
  // Build API payload with required fields and transform priority to uppercase
  const cleanTodo: {
    title: string
    priority: ApiPriority
    specification: string  // Backend uses 'specification' not 'category'
    description?: string
    due_date?: string  // Try snake_case to match @Column name
  } = {
    title: todo.title,
    priority: toApiPriority(todo.priority),
    specification: todo.category,  // Map category -> specification
  }
  
  if (todo.description) cleanTodo.description = todo.description
  
  // Handle dueDate: convert format or omit if not set
  if (todo.dueDate) {
    const dateOnly = todo.dueDate.split('T')[0]  // Extract yyyy-MM-dd from ISO string
    cleanTodo.due_date = formatDateForBackend(dateOnly)
  }

  const response = await fetch(`${API_BASE_URL}/api/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cleanTodo),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to create todo: ${response.statusText} - ${errorText}`)
  }

  const data: ApiTodo = await response.json()
  return transformApiTodo(data)
}

// PUT /api/tasks/{id} - Update task
// Note: Spring Boot expects the full todo object, not partial updates
export async function updateTodo(
  id: string,
  todo: Omit<Todo, "id" | "createdAt" | "updatedAt">
): Promise<Todo> {
  // Build API payload with all fields and transform priority to uppercase
  const cleanTodo: {
    title: string
    completed: boolean
    priority: ApiPriority
    specification: string  // Backend uses 'specification' not 'category'
    description?: string
    due_date?: string | null  // Try snake_case to match @Column(name = "due_date")
  } = {
    title: todo.title,
    completed: todo.completed,
    priority: toApiPriority(todo.priority),
    specification: todo.category,  // Map category -> specification
  }
  
  if (todo.description) cleanTodo.description = todo.description
  
  // Handle dueDate: convert format or set null to clear
  if (todo.dueDate) {
    const dateOnly = todo.dueDate.split('T')[0]  // Extract yyyy-MM-dd from ISO string
    console.log("updateTodo - converting dueDate:", dateOnly)
    cleanTodo.due_date = formatDateForBackend(dateOnly)
    console.log("updateTodo - formatted due_date:", cleanTodo.due_date)
  } else {
    console.log("updateTodo - clearing dueDate (setting to null)")
    cleanTodo.due_date = null  // Explicitly set null to clear the date
  }

  console.log("updateTodo - final payload:", JSON.stringify(cleanTodo, null, 2))

  const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cleanTodo),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to update todo: ${response.statusText} - ${errorText}`)
  }

  const data: ApiTodo = await response.json()
  console.log("updateTodo - backend response:", data)
  console.log("updateTodo - backend response dueDate field:", data.dueDate)
  console.log("updateTodo - full response keys:", Object.keys(data))
  return transformApiTodo(data)
}

// DELETE /api/tasks/{id} - Delete task
export async function deleteTodo(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to delete todo: ${response.statusText} - ${errorText}`)
  }
}

// Helper: Toggle todo completion status
export async function toggleTodoCompletion(todo: Todo): Promise<Todo> {
  return updateTodo(todo.id, {
    title: todo.title,
    description: todo.description,
    completed: !todo.completed,
    priority: todo.priority,
    category: todo.category,
    dueDate: todo.dueDate,
  })
}
