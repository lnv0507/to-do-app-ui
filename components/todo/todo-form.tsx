"use client"

import * as React from "react"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod/v4"
import { ImagePlus, Plus, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

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
import * as api from "@/lib/todo-api"
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
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onClose?: () => void
}

export function TodoForm({ todo, trigger, open: controlledOpen, onOpenChange, onClose }: TodoFormProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | undefined>(todo?.imageUrl)
  const [previewObjectUrl, setPreviewObjectUrl] = React.useState<string | null>(null)
  const [removeImage, setRemoveImage] = React.useState(false)
  const [isUploadingImage, setIsUploadingImage] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const addTodo = useTodoStore((s) => s.addTodo)
  const updateTodo = useTodoStore((s) => s.updateTodo)
  const setTodoImage = useTodoStore((s) => s.setTodoImage)
  const syncTodoById = useTodoStore((s) => s.syncTodoById)

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

  // Reset form when opening with todo data
  React.useEffect(() => {
    if (open && todo) {
      reset({
        title: todo.title,
        description: todo.description ?? "",
        priority: todo.priority,
        category: todo.category,
        dueDate: todo.dueDate ? format(new Date(todo.dueDate), "yyyy-MM-dd") : "",
      })
      setSelectedFile(null)
      setPreviewUrl(todo.imageUrl)
      setRemoveImage(false)
      setIsUploadingImage(false)
      setUploadProgress(0)
    } else if (open && !todo) {
      reset({
        title: "",
        description: "",
        priority: "medium",
        category: "",
        dueDate: "",
      })
      setSelectedFile(null)
      setPreviewUrl(undefined)
      setRemoveImage(false)
      setIsUploadingImage(false)
      setUploadProgress(0)
    }
  }, [open, todo, reset])

  React.useEffect(() => {
    if (!open && previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl)
      setPreviewObjectUrl(null)
    }
  }, [open, previewObjectUrl])

  React.useEffect(() => {
    return () => {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl)
      }
    }
  }, [previewObjectUrl])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Vui long chon file anh hop le")
      event.target.value = ""
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kich thuoc anh khong duoc vuot qua 5MB")
      event.target.value = ""
      return
    }

    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl)
    }
    const objectUrl = URL.createObjectURL(file)
    setSelectedFile(file)
    setRemoveImage(false)
    setPreviewObjectUrl(objectUrl)
    setPreviewUrl(objectUrl)
  }

  const onSubmit = async (data: FormValues) => {
    try {
      const shouldUploadImage = !!selectedFile
      setIsUploadingImage(shouldUploadImage)
      setUploadProgress(shouldUploadImage ? 0 : 100)

      if (isEdit && todo) {
        await updateTodo(todo.id, {
          title: data.title,
          description: data.description,
          priority: data.priority as Priority,
          category: data.category,
          completed: todo.completed,
          imageUrl: todo.imageUrl,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        })

        if (removeImage && todo.imageUrl) {
          await api.deleteTodoImage(todo.id)
          setTodoImage(todo.id, undefined)
          await syncTodoById(todo.id)
        }

        if (selectedFile) {
          const imageUrl = await api.uploadTodoImage(todo.id, selectedFile, setUploadProgress)
          setTodoImage(todo.id, imageUrl)
          await syncTodoById(todo.id)
        }
      } else {
        const createdTodo = await addTodo({
          title: data.title,
          description: data.description || undefined,
          priority: data.priority as Priority,
          category: data.category,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        })

        if (selectedFile) {
          const imageUrl = await api.uploadTodoImage(createdTodo.id, selectedFile, setUploadProgress)
          setTodoImage(createdTodo.id, imageUrl)
          await syncTodoById(createdTodo.id)
        }
      }
      reset()
      setOpen(false)
      onClose?.()
      toast.success(isEdit ? "Task da duoc cap nhat" : "Task da duoc tao")
    } catch (error) {
      console.error("Failed to save todo:", error)
      toast.error(error instanceof Error ? error.message : "Khong the luu task")
    } finally {
      setIsUploadingImage(false)
      setUploadProgress(0)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) onClose?.() }}>
      {controlledOpen === undefined && (
        <SheetTrigger asChild>
          {trigger || (
            <Button className="gap-2">
              <Plus className="size-4" />
              Add Task
            </Button>
          )}
        </SheetTrigger>
      )}
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
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                {...register("dueDate")}
                className="w-full"
              />
            </div>

            {/* Image */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="image">Image</Label>
              <div className="rounded-lg border border-dashed bg-muted/20 p-3">
                {previewUrl && !removeImage ? (
                  <div className="relative h-36 w-full overflow-hidden rounded-md border bg-background">
                    {previewUrl.startsWith("blob:") ? (
                      // next/image does not reliably handle blob URLs from file inputs.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt="Task preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={previewUrl}
                        alt="Task preview"
                        fill
                        sizes="(max-width: 640px) 100vw, 448px"
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex h-20 items-center justify-center gap-2 rounded-md border border-dashed bg-background text-sm text-muted-foreground">
                    <ImagePlus className="size-4" />
                    Chua co anh duoc chon
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileChange}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Ho tro JPEG, PNG, GIF, WEBP. Dung luong toi da 5MB.
                </p>
                {selectedFile && (
                  <p className="mt-1 text-xs font-medium text-foreground">
                    Da chon: {selectedFile.name}
                  </p>
                )}
              </div>

              {isUploadingImage && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-foreground">Dang upload anh: {uploadProgress}%</p>
                  <div className="h-2 w-full overflow-hidden rounded bg-muted">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              {isEdit && todo?.imageUrl && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-fit gap-2 text-destructive"
                  onClick={() => {
                    setSelectedFile(null)
                    setPreviewUrl(undefined)
                    setRemoveImage(true)
                    setUploadProgress(0)
                  }}
                >
                  <Trash2 className="size-4" />
                  Xoa anh hien tai
                </Button>
              )}
            </div>
          </div>

          <SheetFooter className="px-6 py-4 border-t gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setOpen(false); onClose?.() }}
              disabled={isSubmitting || isUploadingImage}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploadingImage}>
              {isUploadingImage ? "Uploading image..." : isEdit ? "Save Changes" : "Create Task"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
