"use client"

import { RefreshCcw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTodoStore } from "@/lib/todo-store"
import { TodoForm } from "./todo-form"
import { NotificationBell } from "./notification-bell"
import { cn } from "@/lib/utils"

export function TodoHeader() {
  const fetchTodos = useTodoStore((s) => s.fetchTodos)
  const isLoading = useTodoStore((s) => s.isLoading)
  const clearCompleted = useTodoStore((s) => s.clearCompleted)
  const todos = useTodoStore((s) => s.todos)
  const hasCompleted = todos.some((t) => t.completed)

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Tasks</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Organize, prioritize and track your work.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fetchTodos()}
          disabled={isLoading}
          className="h-9 w-9"
          title="Refresh tasks"
        >
          <RefreshCcw className={cn("size-4", isLoading && "animate-spin")} />
        </Button>
        <NotificationBell />
        {hasCompleted && (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await clearCompleted()
              } catch (error) {
                console.error("Failed to clear completed todos:", error)
              }
            }}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
            <span className="hidden sm:inline">Clear Completed</span>
          </Button>
        )}
        <TodoForm />
      </div>
    </div>
  )
}
