"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import PageHeader from "@/components/layout/page-header"
import { mockTasks, mockApprovals, mockUsers } from "@/lib/mock-data"
import { TrendingUp, Calendar, FileText } from "lucide-react"

export default function DashboardPage() {
  const pendingApprovals = mockApprovals.filter((a) => a.status === "PENDING")
  const inProgressTasks = mockTasks.filter((t) => t.status === "IN_PROGRESS")
  const completedTasks = mockTasks.filter((t) => t.status === "COMPLETED")

  const totalHours = mockTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)
  const completedHours = mockTasks.reduce((sum, t) => sum + (t.loggedHours || 0), 0)
  const completionPercentage = (completedHours / totalHours) * 100

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

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
      LOW: "success",
      MEDIUM: "info",
      HIGH: "warning",
      URGENT: "error",
    }
    return colors[priority] || "default"
  }

  return (
    <main className="min-h-screen bg-background">
      <PageHeader 
        title="Dashboard" 
        description="Team overview and quick actions"
      >
        <Link href="/calendar">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </Button>
        </Link>
        <Link href="/mom">
          <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 gap-2">
            <FileText className="h-4 w-4" />
            Meeting Minutes
          </Button>
        </Link>
        <Link href="/tasks">
          <Button variant="primary" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            View Tasks
          </Button>
        </Link>
      </PageHeader>

      {/* Content */}
      <section className="container py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{mockTasks.length}</div>
              <p className="text-xs text-muted-foreground mt-1">{inProgressTasks.length} in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{pendingApprovals.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{Math.round(completionPercentage)}%</div>
              <Progress value={completionPercentage} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{mockUsers.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active users</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* In Progress Tasks */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>In Progress Tasks</CardTitle>
                  <Link href="/tasks">
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inProgressTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tasks in progress</p>
                  ) : (
                    inProgressTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-medium text-foreground">{task.title}</p>
                          <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{task.estimatedHours}h estimated</span>
                          <Link href={`/tasks/${task.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Approvals */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Pending Approvals</CardTitle>
                  <Link href="/approvals">
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingApprovals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No pending approvals</p>
                  ) : (
                    pendingApprovals.map((approval) => {
                      const task = mockTasks.find((t) => t.id === approval.taskId)
                      return (
                        <div key={approval.id} className="p-3 border border-border rounded-lg">
                          <p className="text-sm font-medium text-foreground">{task?.title}</p>
                          <Badge variant="warning" className="text-xs mt-2">
                            Pending
                          </Badge>
                          <Link href={`/approvals/${approval.id}`}>
                            <Button variant="ghost" size="sm" className="w-full mt-2">
                              Review
                            </Button>
                          </Link>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/tasks">
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm font-medium text-foreground">Tasks</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/approvals">
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm font-medium text-foreground">Approvals</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/calendar">
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm font-medium text-foreground">Calendar</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/ai/suggestions">
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm font-medium text-foreground">AI Suggestions</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
