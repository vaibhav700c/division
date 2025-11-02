"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockTasks } from "@/lib/mock-data"

export default function MapPage() {
  const tasksWithLocation = mockTasks.filter((task) => task.location?.address)

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
      LOW: "success",
      MEDIUM: "info",
      HIGH: "warning",
      URGENT: "error",
    }
    return colors[priority] || "default"
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
      DRAFT: "default",
      ASSIGNED: "info",
      IN_PROGRESS: "warning",
      PENDING_APPROVAL: "warning",
      APPROVED: "success",
      REJECTED: "error",
      COMPLETED: "success",
    }
    return colors[status] || "default"
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur">
        <div className="container py-4">
          <h1 className="text-2xl font-bold text-foreground">Location Map</h1>
          <p className="text-sm text-muted-foreground">View tasks by location</p>
        </div>
      </header>

      {/* Content */}
      <section className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Placeholder */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Task Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">Google Maps Integration</p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      To enable the map, create a server action that fetches map data using your API key securely
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Location List */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tasks by Location</CardTitle>
              </CardHeader>
              <CardContent>
                {tasksWithLocation.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks with locations</p>
                ) : (
                  <div className="space-y-3">
                    {tasksWithLocation.map((task) => (
                      <div key={task.id} className="p-3 border border-border rounded-lg">
                        <p className="text-sm font-medium text-foreground">{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{task.location?.address}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                            {task.priority}
                          </Badge>
                          <Badge variant={getStatusColor(task.status)} className="text-xs">
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}
