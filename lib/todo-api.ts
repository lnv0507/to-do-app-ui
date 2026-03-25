import type { Todo, Priority, DueTaskNotification } from "@/types/todo"

// Configure your API base URL here
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

// Backend priority enum (uppercase)
type ApiPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

// API response type that matches your actual Spring Boot backend
interface ApiTodo {
  id: number
  title: string
  description?: string
  imageUrl?: string
  isFavorite?: boolean
  favorite?: boolean
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

// Convert dd/MM/yyyy (backend) → yyyy-MM-dd (frontend ISO)
function parseDdMmYyyy(raw: string): string {
  const [day, month, year] = raw.split('/')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

// Convert yyyy-MM-dd (frontend ISO) → dd/MM/yyyy (backend @JsonFormat)
function toBackendDate(iso: string): string {
  const [year, month, day] = iso.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

// Transform API response to frontend Todo type
function transformApiTodo(apiTodo: ApiTodo): Todo {
  // Backend serializes dueDate as dd/MM/yyyy via @JsonFormat
  const dueDateValue = apiTodo.dueDate || apiTodo.due_date
  const dueDate = dueDateValue
    ? (dueDateValue.includes('/') ? parseDdMmYyyy(dueDateValue) : dueDateValue.split('T')[0])
    : undefined

  return {
    id: String(apiTodo.id),
    title: apiTodo.title,
    description: apiTodo.description,
    imageUrl: apiTodo.imageUrl,
    isFavorite: apiTodo.isFavorite ?? apiTodo.favorite ?? false,
    completed: apiTodo.completed,
    priority: fromApiPriority(apiTodo.priority),
    category: apiTodo.specification || "Other",
    createdAt: apiTodo.createdAt,
    updatedAt: apiTodo.updatedAt,
    dueDate,
  }
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
    specification: string
    description?: string
    imageUrl?: string | null
    dueDate?: string
  } = {
    title: todo.title,
    priority: toApiPriority(todo.priority),
    specification: todo.category,
  }

  if (todo.description) cleanTodo.description = todo.description
  if (todo.imageUrl) cleanTodo.imageUrl = todo.imageUrl

  if (todo.dueDate) {
    cleanTodo.dueDate = toBackendDate(todo.dueDate)  // dd/MM/yyyy for @JsonFormat
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
  const cleanTodo: {
    title: string
    completed: boolean
    priority: ApiPriority
    specification: string
    description?: string
    imageUrl?: string | null
    dueDate?: string | null
  } = {
    title: todo.title,
    completed: todo.completed,
    priority: toApiPriority(todo.priority),
    specification: todo.category,
    imageUrl: todo.imageUrl ?? null,
  }

  if (todo.description) cleanTodo.description = todo.description

  if (todo.dueDate) {
    cleanTodo.dueDate = toBackendDate(todo.dueDate)  // dd/MM/yyyy for @JsonFormat
  } else {
    cleanTodo.dueDate = null  // clear the date
  }

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
    imageUrl: todo.imageUrl,
    isFavorite: todo.isFavorite,
    completed: !todo.completed,
    priority: todo.priority,
    category: todo.category,
    dueDate: todo.dueDate,
  })
}

// PATCH /api/tasks/{id}/favorite - Toggle favorite status
export async function toggleTodoFavorite(todo: Todo): Promise<Todo> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/${todo.id}/favorite`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ isFavorite: !todo.isFavorite }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to toggle favorite: ${response.statusText} - ${errorText}`)
  }

  const data: ApiTodo = await response.json()
  return transformApiTodo(data)
}

// POST /api/tasks/{id}/image - Upload task image to S3
export function uploadTodoImage(
  id: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", `${API_BASE_URL}/api/tasks/${id}/image`)

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return
      const percent = Math.round((event.loaded / event.total) * 100)
      onProgress(percent)
    }

    xhr.onerror = () => {
      reject(new Error("Failed to upload image: network error"))
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as { imageUrl?: string }
          if (!data.imageUrl) {
            reject(new Error("Upload response missing imageUrl"))
            return
          }
          resolve(data.imageUrl)
        } catch {
          reject(new Error("Failed to parse upload response"))
        }
        return
      }

      reject(new Error(`Failed to upload image: ${xhr.status} - ${xhr.responseText}`))
    }

    xhr.send(formData)
  })
}

// DELETE /api/tasks/{id}/image - Delete task image from S3
export async function deleteTodoImage(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/${id}/image`, {
    method: "DELETE",
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to delete image: ${response.statusText} - ${errorText}`)
  }
}

// Parse dueDate from backend regardless of format (dd/MM/yyyy or ISO yyyy-MM-dd)
function parseRawDueDate(apiTodo: ApiTodo): string {
  const raw = apiTodo.dueDate || apiTodo.due_date
  if (!raw) return ""
  // dd/MM/yyyy → yyyy-MM-dd
  if (raw.includes('/')) {
    const [day, month, year] = raw.split('/')
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  // ISO yyyy-MM-ddTHH:mm:ss or yyyy-MM-dd → take date part only
  return raw.split('T')[0]
}

// Transform a raw backend Task array (from REST or STOMP) into DueTaskNotification[]
export function transformDueTasksPayload(raw: unknown[]): DueTaskNotification[] {
  return (raw as ApiTodo[]).map((apiTodo) => {
    const todo = transformApiTodo(apiTodo)
    return {
      id: todo.id,
      title: todo.title,
      dueDate: parseRawDueDate(apiTodo), // read directly from raw to avoid transform loss
      priority: todo.priority,
      flag: false,
    }
  })
}

// GET /api/tasks/due - Fetch tasks that are due/upcoming for notifications
export async function fetchDueTasks(): Promise<DueTaskNotification[]> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/due`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  // 204 No Content = no due tasks
  if (response.status === 204) return []

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to fetch due tasks: ${response.statusText} - ${errorText}`)
  }

  const data: ApiTodo[] = await response.json()
  return transformDueTasksPayload(data)
}
