"use client"

import { cn } from "@/lib/utils"

interface HeatmapData {
  label: string
  value: number
  maxValue: number
}

interface HeatmapProps {
  data: HeatmapData[]
  className?: string
}

export function Heatmap({ data, className }: HeatmapProps) {
  const getColor = (value: number, maxValue: number) => {
    const percentage = value / maxValue
    if (percentage >= 0.8) return "bg-error/80"
    if (percentage >= 0.6) return "bg-warning/80"
    if (percentage >= 0.4) return "bg-accent/80"
    return "bg-success/80"
  }

  return (
    <div className={cn("space-y-2", className)}>
      {data.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-foreground">{item.label}</span>
            <span className="text-xs text-muted-foreground">{item.value}h</span>
          </div>
          <div className="w-full h-6 bg-muted rounded-md overflow-hidden">
            <div
              className={cn("h-full transition-all", getColor(item.value, item.maxValue))}
              style={{ width: `${(item.value / item.maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
