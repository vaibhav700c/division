"use client"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import useSWR from 'swr'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { tasksApi, usersApi, approvalsApi } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"
import { Edit, Save, X } from "lucide-react"

export default function TaskDetailPage() {
  const params = useParams()
  const taskId = params.id as string
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editData, setEditData] = useState<{
    title?: string;
    description?: string;
    priority?: string;
    estimatedHours?: number;
    status?: string;
  }>({})

  // Fetch real data from API
  const { data: task, error: taskError, isLoading: taskLoading, mutate: mutateTask } = useSWR(
    taskId ? `task-${taskId}` : null,
    () => tasksApi.getById(taskId)
  )

  const { data: users = [] } = useSWR('users', () => usersApi.getAll())
  
  const { data: approvals = [] } = useSWR('approvals', () => approvalsApi.getAll())

  const handleEditStart = () => {
    setEditData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      estimatedHours: task.estimatedHours,
      status: task.status
    })
    setIsEditing(true)
  }

  const handleEditCancel = () => {
    setIsEditing(false)
    setEditData({})
  }

  const handleEditSave = async () => {
    setIsSaving(true)
    try {
      await tasksApi.update(taskId, editData)
      await mutateTask()
      setIsEditing(false)
      setEditData({})
      toast({
        title: "Task Updated",
        description: "Task has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (taskLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading task...</p>
          </div>
        </div>
      </main>
    )
  }

  if (taskError || !task) {
    return (
      <main className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container flex items-center gap-4 py-4">
            <Link href="/tasks">
              <Button variant="ghost">← Back to Tasks</Button>
            </Link>
          </div>
        </header>
        <section className="container py-12">
          <Empty className="border border-border">
            <EmptyHeader>
              <EmptyTitle>Task not found</EmptyTitle>
              <EmptyDescription>The task you're looking for doesn't exist.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href="/tasks">
                <Button variant="primary">Back to Tasks</Button>
              </Link>
            </EmptyContent>
          </Empty>
        </section>
      </main>
    )
  }

  const approval = approvals.find((a: any) => a.taskId === taskId)
  const creator = users.find((u: any) => u.id === task.createdBy)
  const assignee = users.find((u: any) => u.id === task.assignedToId)
  const completionPercentage = task.actualHours ? (task.actualHours / task.estimatedHours) * 100 : 0

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
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between py-4">
          <Link href="/tasks">
            <Button variant="ghost">← Back to Tasks</Button>
          </Link>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleEditCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleEditSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleEditStart}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="primary">Update Status</Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Header */}
            <Card className={isEditing ? "ring-2 ring-blue-200 bg-blue-50/30" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
                          <Input
                            value={editData.title || ''}
                            onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                            className="text-2xl font-bold"
                            placeholder="Task title"
                          />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-600">Status</label>
                            <Select 
                              value={editData.status || task.status} 
                              onValueChange={(value) => setEditData(prev => ({ ...prev, status: value }))}
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DRAFT">Draft</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-600">Priority</label>
                            <Select 
                              value={editData.priority || task.priority} 
                              onValueChange={(value) => setEditData(prev => ({ ...prev, priority: value }))}
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="LOW">Low</SelectItem>
                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                <SelectItem value="HIGH">High</SelectItem>
                                <SelectItem value="URGENT">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-600">Estimated Hours</label>
                            <Input
                              type="number"
                              value={editData.estimatedHours || ''}
                              onChange={(e) => setEditData(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) || 0 }))}
                              className="w-24"
                              min="0"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <CardTitle className="text-3xl mb-4">{task.title}</CardTitle>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant={getStatusColor(task.status)}>{task.status}</Badge>
                          <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
                          <Badge variant="default">{task.estimatedHours}h estimated</Badge>
                          {task.tags?.map((tag: string) => (
                            <Badge key={tag} variant="info">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Description</h3>
                  {isEditing ? (
                    <Textarea
                      value={editData.description || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Task description"
                      rows={4}
                      className="resize-none"
                    />
                  ) : (
                    <p className="text-foreground">{task.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Progress */}
            {task.actualHours !== undefined && (
              <Card>
                <CardHeader>
                  <CardTitle>Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Hours Logged</span>
                      <span className="text-sm text-muted-foreground">
                        {task.actualHours} / {task.estimatedHours}h
                      </span>
                    </div>
                    <Progress value={Math.min(completionPercentage, 100)} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Approval Status */}
            {approval && (
              <Card>
                <CardHeader>
                  <CardTitle>Approval Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge variant={approval.status === "PENDING" ? "warning" : "success"}>{approval.status}</Badge>
                  </div>
                  {approval.rejectionReason && (
                    <div>
                      <span className="text-sm font-medium">Rejection Reason</span>
                      <p className="text-sm text-muted-foreground mt-1">{approval.rejectionReason}</p>
                    </div>
                  )}
                  {approval.comments && (
                    <div>
                      <span className="text-sm font-medium">Comments</span>
                      <p className="text-sm text-muted-foreground mt-1">{approval.comments}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignee */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assigned To</CardTitle>
              </CardHeader>
              <CardContent>
                {assignee && (
                  <div className="flex items-center gap-3">
                    <Avatar
                      size="md"
                      initials={assignee.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    />
                    <div>
                      <p className="font-medium text-foreground">{assignee.name}</p>
                      <p className="text-xs text-muted-foreground">{assignee.email}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Creator */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Created By</CardTitle>
              </CardHeader>
              <CardContent>
                {creator && (
                  <div className="flex items-center gap-3">
                    <Avatar
                      size="md"
                      initials={creator.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    />
                    <div>
                      <p className="font-medium text-foreground">{creator.name}</p>
                      <p className="text-xs text-muted-foreground">{creator.email}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Created</p>
                  <p className="text-sm text-foreground">{new Date(task.createdAt).toLocaleDateString()}</p>
                </div>
                {task.scheduledTime && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Scheduled</p>
                    <p className="text-sm text-foreground">{new Date(task.scheduledTime).toLocaleDateString()}</p>
                  </div>
                )}
                {task.dueDate && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Due Date</p>
                    <p className="text-sm text-foreground">{new Date(task.dueDate).toLocaleDateString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Estimates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Time Estimates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Estimated Hours</p>
                  <p className="text-sm text-foreground">{task.estimatedHours}h</p>
                </div>
                {task.actualHours !== undefined && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Actual Hours</p>
                    <p className="text-sm text-foreground">{task.actualHours}h</p>
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
