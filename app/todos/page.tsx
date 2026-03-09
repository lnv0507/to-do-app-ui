"use client"

import { useEffect } from "react"
import { CheckSquare } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { TodoHeader } from "@/components/todo/todo-header"
import { TodoStats } from "@/components/todo/todo-stats"
import { TodoFilters } from "@/components/todo/todo-filters"
import { TodoList } from "@/components/todo/todo-list"
import { useTodoStore } from "@/lib/todo-store"

export default function TodosPage() {
  const fetchTodos = useTodoStore((state) => state.fetchTodos)
  const isLoading = useTodoStore((state) => state.isLoading)
  const error = useTodoStore((state) => state.error)

  // Fetch todos on component mount
  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])
  return (
    <div className="min-h-screen bg-background">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <CheckSquare className="size-5 text-primary" />
            <span>TodoApp</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="flex flex-col gap-8">
          {/* Header */}
          <TodoHeader />

          {/* Stats */}
          <TodoStats />

          {/* Filters */}
          <div className="rounded-xl border bg-card px-5 py-4 shadow-xs">
            <TodoFilters />
          </div>

          {/* List */}
          <div className="flex flex-col gap-3">
            {isLoading && !error ? (
              <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
                Loading tasks...
              </div>
            ) : (
              <TodoList />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
