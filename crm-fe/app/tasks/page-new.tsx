"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from 'swr'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { ModernFilterBar } from "@/components/filters/modern-filter-bar"
import { tasksApi, usersApi } from "@/lib/api-client"
import { 
  FileText, 
  UserCheck, 
  Zap, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Trophy,
  Circle,
  AlertCircle,
  AlertTriangle,
  Flame,
  Plus,
  RefreshCcw
} from "lucide-react"

export default function TasksPage() {
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set())
  const [priorityFilters, setPriorityFilters] = useState<Set<string>>(new Set())
  const [teamFilters, setTeamFilters] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch tasks and users from API
  const { data: tasks = [], error: tasksError, isLoading: tasksLoading, mutate: mutateTasks } = useSWR(
    'tasks',
    () => tasksApi.getAll(),
    {
      refreshInterval: 10000, // Refresh every 10 seconds
      revalidateOnFocus: true,
    }
  )

  const { data: users = [], error: usersError } = useSWR(
    'users', 
    () => usersApi.getAll(),
    {
      refreshInterval: 60000, // Refresh every minute
    }
  )

  const filteredTasks = tasks.filter((task: any) => {
    const matchesStatus = statusFilters.size === 0 || statusFilters.has(task.status)
    const matchesPriority = priorityFilters.size === 0 || priorityFilters.has(task.priority)
    const matchesTeam = teamFilters.size === 0 || (task.team && teamFilters.has(task.team.id))
    const matchesSearch =
      searchQuery === "" ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.assignedTo && task.assignedTo.name.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesStatus && matchesPriority && matchesTeam && matchesSearch
  })

  // Status filter options with counts and icons
  const statusOptions = [
    {
      label: "Draft",
      value: "DRAFT",
      icon: FileText,
      count: tasks.filter((t: any) => t.status === "DRAFT").length,
      color: "gray" as const,
    },
    {
      label: "Pending Approval",
      value: "PENDING_APPROVAL",
      icon: Clock,
      count: tasks.filter((t: any) => t.status === "PENDING_APPROVAL").length,
      color: "orange" as const,
    },
    {
      label: "Approved",
      value: "APPROVED",
      icon: CheckCircle,
      count: tasks.filter((t: any) => t.status === "APPROVED").length,
      color: "green" as const,
    },
    {
      label: "In Progress",
      value: "IN_PROGRESS",
      icon: Zap,
      count: tasks.filter((t: any) => t.status === "IN_PROGRESS").length,
      color: "blue" as const,
    },
    {
      label: "Completed",
      value: "COMPLETED",
      icon: Trophy,
      count: tasks.filter((t: any) => t.status === "COMPLETED").length,
      color: "green" as const,
    },
    {
      label: "Rejected",
      value: "REJECTED",
      icon: XCircle,
      count: tasks.filter((t: any) => t.status === "REJECTED").length,
      color: "red" as const,
    },
  ]

  // Priority filter options with counts and icons
  const priorityOptions = [
    {
      label: "Low",
      value: "LOW",
      icon: Circle,
      count: tasks.filter((t: any) => t.priority === "LOW").length,
      color: "gray" as const,
    },
    {
      label: "Medium",
      value: "MEDIUM",
      icon: AlertCircle,
      count: tasks.filter((t: any) => t.priority === "MEDIUM").length,
      color: "yellow" as const,
    },
    {
      label: "High",
      value: "HIGH",
      icon: AlertTriangle,
      count: tasks.filter((t: any) => t.priority === "HIGH").length,
      color: "orange" as const,
    },
    {
      label: "Urgent",
      value: "URGENT",
      icon: Flame,
      count: tasks.filter((t: any) => t.priority === "URGENT").length,
      color: "red" as const,
    },
  ]

  // Team filter options
  const teamOptions = Array.from(
    new Set(tasks.filter((t: any) => t.team).map((t: any) => t.team.id))
  ).map((teamId) => {
    const task = tasks.find((t: any) => t.team?.id === teamId)
    return {
      label: task?.team?.name || teamId,
      value: teamId,
      count: tasks.filter((t: any) => t.team?.id === teamId).length,
      color: "blue" as const,
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT": return "gray"
      case "PENDING_APPROVAL": return "orange"
      case "APPROVED": return "green"
      case "IN_PROGRESS": return "blue"
      case "COMPLETED": return "green"
      case "REJECTED": return "red"
      default: return "gray"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW": return "gray"
      case "MEDIUM": return "yellow"
      case "HIGH": return "orange"
      case "URGENT": return "red"
      default: return "gray"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DRAFT": return FileText
      case "PENDING_APPROVAL": return Clock
      case "APPROVED": return CheckCircle
      case "IN_PROGRESS": return Zap
      case "COMPLETED": return Trophy
      case "REJECTED": return XCircle
      default: return Circle
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "LOW": return Circle
      case "MEDIUM": return AlertCircle
      case "HIGH": return AlertTriangle
      case "URGENT": return Flame
      default: return Circle
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not scheduled"
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (tasksError || usersError) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center h-96">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Failed to load tasks</h3>
          <p className="text-gray-600 mb-4">
            {tasksError?.message || usersError?.message || "An error occurred while loading tasks"}
          </p>
          <Button onClick={() => { mutateTasks(); }} variant="outline">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track team tasks across projects
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => mutateTasks()} variant="outline" size="sm">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/tasks/new">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <ModernFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search tasks, descriptions, or assignees..."
        filters={[
          {
            key: "status",
            label: "Status",
            options: statusOptions,
            selectedValues: statusFilters,
            onChange: setStatusFilters,
          },
          {
            key: "priority",
            label: "Priority",
            options: priorityOptions,
            selectedValues: priorityFilters,
            onChange: setPriorityFilters,
          },
          ...(teamOptions.length > 0 ? [{
            key: "team",
            label: "Team",
            options: teamOptions,
            selectedValues: teamFilters,
            onChange: setTeamFilters,
          }] : []),
        ]}
        resultsCount={filteredTasks.length}
        totalCount={tasks.length}
      />

      {/* Tasks Table */}
      <Card>
        {tasksLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Loading tasks...</p>
            </div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No tasks found</EmptyTitle>
              <EmptyDescription>
                {tasks.length === 0 
                  ? "Get started by creating your first task."
                  : "Try adjusting your filters or search criteria."
                }
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/tasks/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Estimated Hours</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task: any) => {
                const StatusIcon = getStatusIcon(task.status)
                const PriorityIcon = getPriorityIcon(task.priority)
                
                return (
                  <TableRow key={task.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link href={`/tasks/${task.id}`} className="block">
                        <div className="space-y-1">
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {task.description}
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {task.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <img src={task.assignedTo.avatar || "/placeholder-user.jpg"} alt={task.assignedTo.name} />
                          </Avatar>
                          <span className="text-sm">{task.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(task.status) as any} className="flex items-center gap-1 w-fit">
                        <StatusIcon className="h-3 w-3" />
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(task.priority) as any} className="flex items-center gap-1 w-fit">
                        <PriorityIcon className="h-3 w-3" />
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.team ? (
                        <span className="text-sm">{task.team.name}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">No team</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {task.estimatedHours ? `${task.estimatedHours}h` : "Not set"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatDate(task.scheduledAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(task.createdAt)}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}