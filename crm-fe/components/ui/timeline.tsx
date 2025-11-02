"use client"

import { cn } from "@/lib/utils"

interface TimelineItem {
  id: string
  title: string
  description?: string
  timestamp: Date
  status: "completed" | "in-progress" | "pending"
}

interface TimelineProps {
  items: TimelineItem[]
  className?: string
}

export function Timeline({ items, className }: TimelineProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: "bg-success",
      "in-progress": "bg-warning",
      pending: "bg-muted",
    }
    return colors[status] || "bg-muted"
  }

  return (
    <div className={cn("space-y-4", className)}>
      {items.map((item, index) => (
        <div key={item.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={cn("w-3 h-3 rounded-full", getStatusColor(item.status))} />
            {index < items.length - 1 && <div className="w-0.5 h-12 bg-border mt-2" />}
          </div>
          <div className="pb-4">
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
            <p className="text-xs text-muted-foreground mt-2">{item.timestamp.toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
