"use client"

import * as React from "react"
import Image from "next/image"
import { format, isPast, isToday } from "date-fns"
import {
  CalendarIcon,
  Pencil,
  Trash2,
  MoreHorizontal,
  GripVertical,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTodoStore } from "@/lib/todo-store"
import { TodoForm } from "./todo-form"
import type { Todo } from "@/types/todo"
import { cn } from "@/lib/utils"

const PRIORITY_CONFIG = {
  high: { label: "High", className: "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800 dark:text-rose-400" },
  medium: { label: "Medium", className: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800 dark:text-amber-400" },
  low: { label: "Low", className: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800 dark:text-emerald-400" },
}

interface TodoItemProps {
  todo: Todo
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
}

export function TodoItem({ todo, dragHandleProps }: TodoItemProps) {
  const [editOpen, setEditOpen] = React.useState(false)
  const toggleTodo = useTodoStore((s) => s.toggleTodo)
  const deleteTodo = useTodoStore((s) => s.deleteTodo)

  const priority = PRIORITY_CONFIG[todo.priority] || PRIORITY_CONFIG.medium

  const dueDateInfo = React.useMemo(() => {
    if (!todo.dueDate) return null
    const date = new Date(todo.dueDate)
    const overdue = !todo.completed && isPast(date) && !isToday(date)
    const dueToday = !todo.completed && isToday(date)
    return { formatted: format(date, "MMM d, yyyy"), overdue, dueToday }
  }, [todo.dueDate, todo.completed])

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-xl border bg-card px-4 py-3.5 shadow-xs transition-all duration-200",
        "hover:shadow-md hover:border-border/80",
        todo.completed && "opacity-60"
      )}
    >
      {/* Drag Handle */}
      <button
        {...dragHandleProps}
        className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors touch-none"
        aria-label="Drag to reorder"
        tabIndex={-1}
      >
        <GripVertical className="size-4" />
      </button>

      {/* Checkbox */}
      <div className="mt-0.5 shrink-0">
        <Checkbox
          checked={todo.completed}
          onCheckedChange={async () => {
            try {
              await toggleTodo(todo.id)
            } catch (error) {
              console.error("Failed to toggle todo:", error)
            }
          }}
          aria-label={`Mark "${todo.title}" as ${todo.completed ? "incomplete" : "complete"}`}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm font-medium leading-snug wrap-break-word",
              todo.completed && "line-through text-muted-foreground"
            )}
          >
            {todo.title}
          </p>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="opacity-0 group-hover:opacity-100 shrink-0 transition-opacity"
                aria-label="Task actions"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="size-3.5 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={async () => {
                try {
                  await toggleTodo(todo.id)
                } catch (error) {
                  console.error("Failed to toggle todo:", error)
                }
              }}>
                <Checkbox
                  checked={todo.completed}
                  className="size-3.5 mr-2 pointer-events-none"
                />
                {todo.completed ? "Mark Active" : "Mark Done"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={async () => {
                  try {
                    await deleteTodo(todo.id)
                  } catch (error) {
                    console.error("Failed to delete todo:", error)
                  }
                }}
              >
                <Trash2 className="size-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {todo.description && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
            {todo.description}
          </p>
        )}

        {todo.imageUrl && (
          <div className="relative mt-2 h-32 w-full max-w-xs overflow-hidden rounded-lg border bg-muted/20 shadow-xs">
            <Image
              src={todo.imageUrl}
              alt={todo.title}
              fill
              sizes="(max-width: 640px) 100vw, 320px"
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Meta row */}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={cn("text-xs px-2 py-0 h-5 font-medium border", priority.className)}>
            {priority.label}
          </Badge>
          <Badge variant="secondary" className="text-xs px-2 py-0 h-5">
            {todo.category}
          </Badge>
          {dueDateInfo && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs",
                dueDateInfo.overdue
                  ? "text-destructive"
                  : dueDateInfo.dueToday
                  ? "text-amber-500"
                  : "text-muted-foreground"
              )}
            >
              <CalendarIcon className="size-3" />
              {dueDateInfo.overdue
                ? `Overdue · ${dueDateInfo.formatted}`
                : dueDateInfo.dueToday
                ? "Due today"
                : dueDateInfo.formatted}
            </span>
          )}
        </div>
      </div>

      {/* Edit form */}
      <TodoForm 
        todo={todo} 
        open={editOpen} 
        onOpenChange={setEditOpen}
        onClose={() => setEditOpen(false)} 
      />
    </div>
  )
}
