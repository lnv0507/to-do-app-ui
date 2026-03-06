"use client"

import { Search, SlidersHorizontal, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTodoStore } from "@/lib/todo-store"
import type { Priority, Status } from "@/types/todo"

const PRIORITIES: { label: string; value: Priority | "all" }[] = [
  { label: "All Priorities", value: "all" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
]

const STATUSES: { label: string; value: Status }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
]

export function TodoFilters() {
  const filters = useTodoStore((s) => s.filters)
  const setFilter = useTodoStore((s) => s.setFilter)
  const resetFilters = useTodoStore((s) => s.resetFilters)
  const getCategories = useTodoStore((s) => s.getCategories)
  const categories = getCategories()

  const isFiltered =
    filters.status !== "all" ||
    filters.priority !== "all" ||
    filters.category !== "all" ||
    filters.search !== ""

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => setFilter({ search: e.target.value })}
            className="pl-9"
          />
          {filters.search && (
            <button
              onClick={() => setFilter({ search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Status */}
          <Select
            value={filters.status}
            onValueChange={(v) => setFilter({ status: v as Status })}
          >
            <SelectTrigger className="w-32.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority */}
          <Select
            value={filters.priority}
            onValueChange={(v) => setFilter({ priority: v as Priority | "all" })}
          >
            <SelectTrigger className="w-37.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category */}
          <Select
            value={filters.category}
            onValueChange={(v) => setFilter({ category: v })}
          >
            <SelectTrigger className="w-37.5">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Reset */}
          {isFiltered && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1.5">
              <X className="size-3.5" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Active filter badges */}
      {isFiltered && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <SlidersHorizontal className="size-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Filters:</span>
          {filters.status !== "all" && (
            <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => setFilter({ status: "all" })}>
              {filters.status}
              <X className="size-3" />
            </Badge>
          )}
          {filters.priority !== "all" && (
            <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => setFilter({ priority: "all" })}>
              {filters.priority}
              <X className="size-3" />
            </Badge>
          )}
          {filters.category !== "all" && (
            <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => setFilter({ category: "all" })}>
              {filters.category}
              <X className="size-3" />
            </Badge>
          )}
          {filters.search && (
            <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => setFilter({ search: "" })}>
              &quot;{filters.search}&quot;
              <X className="size-3" />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
