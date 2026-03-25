"use client"

import * as React from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { CSS } from "@dnd-kit/utilities"
import { CheckCircle2, Heart, InboxIcon } from "lucide-react"

import { useTodoStore } from "@/lib/todo-store"
import { TodoItem } from "./todo-item"
import type { Todo } from "@/types/todo"

type TodoListMode = "all" | "favorites"

function SortableTodoItem({ todo }: { todo: Todo }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: todo.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <TodoItem todo={todo} dragHandleProps={{ ...attributes, ...listeners } as React.HTMLAttributes<HTMLButtonElement>} />
    </div>
  )
}

interface TodoListProps {
  mode?: TodoListMode
}

export function TodoList({ mode = "all" }: TodoListProps) {
  const getFilteredTodos = useTodoStore((s) => s.getFilteredTodos)
  const todos = useTodoStore((s) => s.todos)

  const filteredTodos = getFilteredTodos()
  const filtered = mode === "favorites"
    ? filteredTodos.filter((todo) => !!todo.isFavorite)
    : filteredTodos

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    // Reorder in the global todos array
    const allIds = useTodoStore.getState().todos.map((t) => t.id)
    const oldIndex = allIds.indexOf(active.id as string)
    const newIndex = allIds.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...useTodoStore.getState().todos]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)
    useTodoStore.setState({ todos: reordered })
  }

  if (filtered.length === 0) {
    const hasCompletedAll =
      todos.length > 0 && todos.every((t) => t.completed)

    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/30 py-16 text-center">
        {mode === "favorites" ? (
          <>
            <Heart className="size-10 text-rose-400" />
            <div>
              <p className="font-semibold">No favorite tasks yet</p>
              <p className="text-sm text-muted-foreground mt-1">Tap the heart icon on any task card to save it here.</p>
            </div>
          </>
        ) : hasCompletedAll ? (
          <>
            <CheckCircle2 className="size-10 text-emerald-500" />
            <div>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">All tasks completed! 🎉</p>
              <p className="text-sm text-muted-foreground mt-1">Great job! Add more tasks to keep going.</p>
            </div>
          </>
        ) : (
          <>
            <InboxIcon className="size-10 text-muted-foreground/50" />
            <div>
              <p className="font-semibold">No tasks found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or add a new task.</p>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={filtered.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {filtered.map((todo) => (
            <SortableTodoItem key={todo.id} todo={todo} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
