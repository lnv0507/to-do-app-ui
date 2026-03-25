import { create } from "zustand"
import type { Todo, TodoFilters } from "@/types/todo"
import * as api from "./todo-api"

interface TodoStore {
  todos: Todo[]
  filters: TodoFilters
  isLoading: boolean
  error: string | null

  // API Actions
  fetchTodos: () => Promise<void>
  addTodo: (todo: Omit<Todo, "id" | "createdAt" | "updatedAt" | "completed">) => Promise<Todo>
  updateTodo: (id: string, todo: Omit<Todo, "id" | "createdAt" | "updatedAt">) => Promise<Todo>
  deleteTodo: (id: string) => Promise<void>
  toggleTodo: (id: string) => Promise<void>
  clearCompleted: () => Promise<void>
  setTodoImage: (id: string, imageUrl?: string) => void
  syncTodoById: (id: string) => Promise<void>

  // Favorites
  toggleFavorite: (id: string) => Promise<void>
  isFavorite: (id: string) => boolean
  getFavoriteTodos: () => Todo[]

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

export const useTodoStore = create<TodoStore>()((set, get) => ({
  todos: [],
  filters: defaultFilters,
  isLoading: false,
  error: null,

      // Fetch all todos from API
      fetchTodos: async () => {
        set({ isLoading: true, error: null })
        try {
          const todos = await api.fetchTodos()
          set({ todos, isLoading: false })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to fetch todos",
            isLoading: false 
          })
        }
      },

      // Add new todo via API
      addTodo: async (todo) => {
        set({ isLoading: true, error: null })
        try {
          const newTodo = await api.createTodo(todo)
          set((state) => ({ 
            todos: [newTodo, ...state.todos],
            isLoading: false 
          }))
          return newTodo
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to create todo",
            isLoading: false 
          })
          throw error
        }
      },

      // Update todo via API
      updateTodo: async (id, todoData) => {
        set({ isLoading: true, error: null })
        try {
          const updatedTodo = await api.updateTodo(id, todoData)
          set((state) => ({
            todos: state.todos.map((t) => t.id === id ? updatedTodo : t),
            isLoading: false
          }))
          return updatedTodo
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to update todo",
            isLoading: false 
          })
          throw error
        }
      },

      // Delete todo via API
      deleteTodo: async (id) => {
        set({ isLoading: true, error: null })
        try {
          await api.deleteTodo(id)
          set((state) => ({ 
            todos: state.todos.filter((t) => t.id !== id),
            isLoading: false 
          }))
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to delete todo",
            isLoading: false 
          })
          throw error
        }
      },

      // Toggle todo completion via API
      toggleTodo: async (id) => {
        const todo = get().todos.find((t) => t.id === id)
        if (!todo) return

        set({ isLoading: true, error: null })
        try {
          const updatedTodo = await api.toggleTodoCompletion(todo)
          set((state) => ({
            todos: state.todos.map((t) => t.id === id ? updatedTodo : t),
            isLoading: false
          }))
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to toggle todo",
            isLoading: false 
          })
          throw error
        }
      },

      // Clear completed todos via API
      clearCompleted: async () => {
        const completedIds = get().todos.filter((t) => t.completed).map((t) => t.id)
        set({ isLoading: true, error: null })
        try {
          await Promise.all(completedIds.map((id) => api.deleteTodo(id)))
          set((state) => ({ 
            todos: state.todos.filter((t) => !t.completed),
            isLoading: false 
          }))
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to clear completed todos",
            isLoading: false 
          })
          throw error
        }
      },

      setTodoImage: (id, imageUrl) => {
        set((state) => ({
          todos: state.todos.map((t) => t.id === id ? { ...t, imageUrl } : t),
        }))
      },

      syncTodoById: async (id) => {
        try {
          const syncedTodo = await api.fetchTodoById(id)
          set((state) => ({
            todos: state.todos.map((t) => t.id === id ? syncedTodo : t),
          }))
        } catch (error) {
          // Keep optimistic UI state if sync fails.
          console.error("Failed to sync todo by id:", error)
        }
      },

      toggleFavorite: async (id) => {
        const todo = get().todos.find((t) => t.id === id)
        if (!todo) return

        const optimisticFavorite = !todo.isFavorite
        set((state) => ({
          todos: state.todos.map((t) => t.id === id ? { ...t, isFavorite: optimisticFavorite } : t),
        }))

        try {
          const updatedTodo = await api.toggleTodoFavorite(todo)
          set((state) => ({
            todos: state.todos.map((t) => t.id === id ? updatedTodo : t),
          }))
        } catch (error) {
          set((state) => ({
            todos: state.todos.map((t) => t.id === id ? { ...t, isFavorite: todo.isFavorite } : t),
            error: error instanceof Error ? error.message : "Failed to toggle favorite",
          }))
          throw error
        }
      },

      isFavorite: (id) => {
        return !!get().todos.find((t) => t.id === id)?.isFavorite
      },

      getFavoriteTodos: () => {
        const { todos } = get()
        return todos.filter((todo) => !!todo.isFavorite)
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
}))
