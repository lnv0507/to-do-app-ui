"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod/v4"
import { CalendarIcon, Plus } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useTodoStore } from "@/lib/todo-store"
import type { Todo, Priority } from "@/types/todo"

const schema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(300).optional(),
  priority: z.enum(["low", "medium", "high"]),
  category: z.string().min(1, "Category is required"),
  dueDate: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const CATEGORIES = ["Design", "Engineering", "DevOps", "Docs", "Management", "Research", "Marketing", "Other"]

interface TodoFormProps {
  todo?: Todo
  trigger?: React.ReactNode
  onClose?: () => void
}

export function TodoForm({ todo, trigger, onClose }: TodoFormProps) {
  const [open, setOpen] = React.useState(false)
  const addTodo = useTodoStore((s) => s.addTodo)
  const updateTodo = useTodoStore((s) => s.updateTodo)

  const isEdit = !!todo

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: todo?.title ?? "",
      description: todo?.description ?? "",
      priority: todo?.priority ?? "medium",
      category: todo?.category ?? "",
      dueDate: todo?.dueDate ? format(new Date(todo.dueDate), "yyyy-MM-dd") : "",
    },
  })

  const priority = watch("priority")
  const category = watch("category")

  const onSubmit = (data: FormValues) => {
    if (isEdit && todo) {
      updateTodo(todo.id, {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      })
    } else {
      addTodo({
        title: data.title,
        description: data.description,
        priority: data.priority as Priority,
        category: data.category,
        completed: false,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      })
    }
    reset()
    setOpen(false)
    onClose?.()
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) onClose?.() }}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <Plus className="size-4" />
            Add Task
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-0 sm:max-w-md">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{isEdit ? "Edit Task" : "New Task"}</SheetTitle>
          <SheetDescription>
            {isEdit ? "Update the task details below." : "Fill in the details to create a new task."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-y-auto">
          <div className="flex flex-col gap-5 px-6 py-5 flex-1">
            {/* Title */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g. Design new landing page"
                {...register("title")}
                aria-invalid={!!errors.title}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                rows={3}
                placeholder="Add more context..."
                {...register("description")}
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 resize-none dark:bg-input/30"
              />
            </div>

            {/* Priority + Category row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setValue("priority", v as Priority)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 High</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="low">🟢 Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setValue("category", v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-xs text-destructive">{errors.category.message}</p>
                )}
              </div>
            </div>

            {/* Due Date */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="dueDate">
                <CalendarIcon className="size-3.5" />
                Due Date
              </Label>
              <Input
                id="dueDate"
                type="date"
                {...register("dueDate")}
                className="w-full"
              />
            </div>
          </div>

          <SheetFooter className="px-6 py-4 border-t gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setOpen(false); onClose?.() }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? "Save Changes" : "Create Task"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
