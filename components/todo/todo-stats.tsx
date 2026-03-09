"use client"

import { CheckCircle2, Circle, ListTodo, Flame } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTodoStore } from "@/lib/todo-store"

export function TodoStats() {
  const getStats = useTodoStore((s) => s.getStats)
  const stats = getStats()

  const percent =
    stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100)

  const cards = [
    {
      label: "Total Tasks",
      value: stats.total,
      icon: ListTodo,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Active",
      value: stats.active,
      icon: Circle,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "High Priority",
      value: stats.high,
      icon: Flame,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <Card key={label} className="py-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <div className={`rounded-lg p-2 ${bg}`}>
                <Icon className={`size-4 ${color}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight">
              {value}
            </p>
            {label === "Completed" && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{percent}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
