import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Todo, TodoFilters } from "@/types/todo"

interface TodoStore {
  todos: Todo[]
  filters: TodoFilters

  // Actions
  addTodo: (todo: Omit<Todo, "id" | "createdAt" | "updatedAt">) => void
  updateTodo: (id: string, updates: Partial<Omit<Todo, "id" | "createdAt">>) => void
  deleteTodo: (id: string) => void
  toggleTodo: (id: string) => void
  clearCompleted: () => void

  // Filters
  setFilter: (filters: Partial<TodoFilters>) => void
  resetFilters: () => void

  // Computed
  getFilteredTodos: () => Todo[]
  getStats: () => {
    total: number
    completed: number
    active: number
    high: number
    medium: number
    low: number
  }
  getCategories: () => string[]
}

const defaultFilters: TodoFilters = {
  status: "all",
  priority: "all",
  category: "all",
  search: "",
}

const SEED_TODOS: Todo[] = [
  {
    id: "1",
    title: "Design the new dashboard layout",
    description: "Create wireframes and high-fidelity mockups for the admin dashboard.",
    completed: false,
    priority: "high",
    category: "Design",
    createdAt: new Date("2026-03-01").toISOString(),
    updatedAt: new Date("2026-03-01").toISOString(),
    dueDate: new Date("2026-03-10").toISOString(),
  },
  {
    id: "2",
    title: "Set up CI/CD pipeline",
    description: "Configure GitHub Actions for automated testing and deployment.",
    completed: true,
    priority: "high",
    category: "DevOps",
    createdAt: new Date("2026-03-02").toISOString(),
    updatedAt: new Date("2026-03-03").toISOString(),
  },
  {
    id: "3",
    title: "Write unit tests for auth module",
    description: "Achieve at least 85% coverage on the authentication service.",
    completed: false,
    priority: "medium",
    category: "Engineering",
    createdAt: new Date("2026-03-02").toISOString(),
    updatedAt: new Date("2026-03-02").toISOString(),
    dueDate: new Date("2026-03-12").toISOString(),
  },
  {
    id: "4",
    title: "Update project documentation",
    description: "Revise README and API docs to reflect recent changes.",
    completed: false,
    priority: "low",
    category: "Docs",
    createdAt: new Date("2026-03-03").toISOString(),
    updatedAt: new Date("2026-03-03").toISOString(),
  },
  {
    id: "5",
    title: "Conduct team retrospective",
    description: "Facilitate the sprint retrospective and capture action items.",
    completed: true,
    priority: "medium",
    category: "Management",
    createdAt: new Date("2026-03-04").toISOString(),
    updatedAt: new Date("2026-03-04").toISOString(),
  },
]

export const useTodoStore = create<TodoStore>()(
  persist(
    (set, get) => ({
      todos: SEED_TODOS,
      filters: defaultFilters,

      addTodo: (todo) => {
        const now = new Date().toISOString()
        const newTodo: Todo = {
          ...todo,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ todos: [newTodo, ...state.todos] }))
      },

      updateTodo: (id, updates) => {
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id
              ? { ...t, ...updates, updatedAt: new Date().toISOString() }
              : t
          ),
        }))
      },

      deleteTodo: (id) => {
        set((state) => ({ todos: state.todos.filter((t) => t.id !== id) }))
      },

      toggleTodo: (id) => {
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id
              ? { ...t, completed: !t.completed, updatedAt: new Date().toISOString() }
              : t
          ),
        }))
      },

      clearCompleted: () => {
        set((state) => ({ todos: state.todos.filter((t) => !t.completed) }))
      },

      setFilter: (filters) => {
        set((state) => ({ filters: { ...state.filters, ...filters } }))
      },

      resetFilters: () => {
        set({ filters: defaultFilters })
      },

      getFilteredTodos: () => {
        const { todos, filters } = get()
        return todos.filter((todo) => {
          if (filters.status === "active" && todo.completed) return false
          if (filters.status === "completed" && !todo.completed) return false
          if (filters.priority !== "all" && todo.priority !== filters.priority) return false
          if (filters.category !== "all" && todo.category !== filters.category) return false
          if (
            filters.search &&
            !todo.title.toLowerCase().includes(filters.search.toLowerCase()) &&
            !todo.description?.toLowerCase().includes(filters.search.toLowerCase())
          )
            return false
          return true
        })
      },

      getStats: () => {
        const { todos } = get()
        return {
          total: todos.length,
          completed: todos.filter((t) => t.completed).length,
          active: todos.filter((t) => !t.completed).length,
          high: todos.filter((t) => t.priority === "high" && !t.completed).length,
          medium: todos.filter((t) => t.priority === "medium" && !t.completed).length,
          low: todos.filter((t) => t.priority === "low" && !t.completed).length,
        }
      },

      getCategories: () => {
        const { todos } = get()
        return Array.from(new Set(todos.map((t) => t.category))).sort()
      },
    }),
    {
      name: "todo-store",
    }
  )
)
