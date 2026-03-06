"use client"

import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTodoStore } from "@/lib/todo-store"
import { TodoForm } from "./todo-form"

export function TodoHeader() {
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
        {hasCompleted && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearCompleted}
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
