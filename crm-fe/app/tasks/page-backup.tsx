"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import useSWR from 'swr'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { ModernFilterBar } from "@/components/filters/modern-filter-bar"
import { useAISuggestions } from "@/hooks/useAISuggestions"
import { tasksApi, usersApi, teamsApi } from "@/lib/api-client"
import type { Task, TaskStatus, TaskPriority } from "@/types"
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
  Brain,
  Star,
  Users,
  UserPlus,
  Play,
  Check
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function TasksPage() {
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set())
  const [priorityFilters, setPriorityFilters] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [activeSection, setActiveSection] = useState<'active' | 'completed'>('active')
  const [assigningTasks, setAssigningTasks] = useState<Set<string>>(new Set())
  const [completingTasks, setCompletingTasks] = useState<Set<string>>(new Set())
  const [unassigningTasks, setUnassigningTasks] = useState<Set<string>>(new Set())

  // Fetch real data from API with optimized caching
  const { data: tasks = [], error: tasksError, isLoading: tasksLoading, mutate: mutateTasks } = useSWR(
    'tasks',
    () => tasksApi.getAll(),
    {
      refreshInterval: 0, // Disable auto-refresh, only refresh on manual actions
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
    }
  )

  const { data: users = [], error: usersError } = useSWR(
    'users',
    () => usersApi.getAll(),
    {
      refreshInterval: 0, // Users don't change frequently
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  )

  const { data: teams = [], error: teamsError } = useSWR(
    'teams',
    () => teamsApi.getAll(),
    {
      refreshInterval: 0, // Teams change even less frequently
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
    }
  )

  const handleMarkCompleted = async (taskId: string) => {
    if (completingTasks.has(taskId)) return
    
    setCompletingTasks(prev => new Set(prev).add(taskId))
    
    // Optimistic update
    const currentTasks = tasks
    const optimisticTasks = currentTasks.map(task => 
      task.id === taskId 
        ? { ...task, status: 'COMPLETED' as TaskStatus }
        : task
    )
    
    try {
      // Update cache optimistically
      mutateTasks(optimisticTasks, false)
      
      // Make API call
      await tasksApi.update(taskId, { status: 'COMPLETED' })
      
      // Revalidate to ensure consistency
      mutateTasks()
      
      toast({
        title: "Task Completed",
        description: "Task has been marked as completed.",
      })
    } catch (error) {
      // Revert on error
      mutateTasks(currentTasks, false)
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive",
      })
    } finally {
      setCompletingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }
  }

  const handleAssignTask = async (taskId: string, userId: string) => {
    if (assigningTasks.has(taskId)) return
    
    setAssigningTasks(prev => new Set(prev).add(taskId))
    
    // Optimistic update - update UI immediately
    const currentTasks = tasks
    const optimisticTasks = currentTasks.map(task => 
      task.id === taskId 
        ? { ...task, assignedToId: userId, status: 'IN_PROGRESS' as TaskStatus }
        : task
    )
    
    try {
      // Update cache optimistically
      mutateTasks(optimisticTasks, false)
      
      // Make API call
      await tasksApi.update(taskId, { assignedToId: userId, status: 'IN_PROGRESS' })
      
      // Revalidate to ensure consistency
      mutateTasks()
      
      toast({
        title: "Task Assigned",
        description: "Task has been assigned successfully.",
      })
    } catch (error) {
      // Revert on error
      mutateTasks(currentTasks, false)
      toast({
        title: "Error",
        description: "Failed to assign task.",
        variant: "destructive",
      })
    } finally {
      setAssigningTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }
  }

  const handleUnassignTask = async (taskId: string) => {
    if (unassigningTasks.has(taskId)) return
    
    setUnassigningTasks(prev => new Set(prev).add(taskId))
    
    // Optimistic update
    const currentTasks = tasks
    const optimisticTasks = currentTasks.map(task => 
      task.id === taskId 
        ? { ...task, assignedToId: null, status: 'DRAFT' as TaskStatus }
        : task
    )
    
    try {
      // Update cache optimistically
      mutateTasks(optimisticTasks, false)
      
      // Make API call
      await tasksApi.update(taskId, { assignedToId: null, status: 'DRAFT' })
      
      // Revalidate to ensure consistency
      mutateTasks()
      
      toast({
        title: "Task Unassigned",
        description: "Task has been moved to unassigned.",
      })
    } catch (error) {
      // Revert on error
      mutateTasks(currentTasks, false)
      toast({
        title: "Error",
        description: "Failed to unassign task.",
        variant: "destructive",
      })
    } finally {
      setUnassigningTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }
  }

  const filteredTasks = tasks.filter((task: any) => {
    const matchesStatus = statusFilters.size === 0 || statusFilters.has(task.status)
    const matchesPriority = priorityFilters.size === 0 || priorityFilters.has(task.priority)
    const assigneeName = task.assignedToId ? (users.find((u: any) => u.id === task.assignedToId)?.name || "Unknown") : "Unassigned"
    const matchesSearch =
      searchQuery === "" ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assigneeName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesPriority && matchesSearch
  })

  // Split tasks by completion status
  const activeTasks = filteredTasks.filter((task: any) => task.status !== 'COMPLETED')
  const completedTasks = filteredTasks.filter((task: any) => task.status === 'COMPLETED')

  // Further split active tasks
  const unassignedTasks = activeTasks.filter((task: any) => !task.assignedToId)
  const assignedTasks = activeTasks.filter((task: any) => task.assignedToId)

  const currentTasks = activeSection === 'active' ? activeTasks : completedTasks

  // Status filter options with counts and icons
  const statusOptions = [
    { label: "Draft", value: "DRAFT", icon: FileText, count: tasks.filter((t: any) => t.status === "DRAFT").length },
    { label: "Pending Approval", value: "PENDING_APPROVAL", icon: Clock, count: tasks.filter((t: any) => t.status === "PENDING_APPROVAL").length },
    { label: "Approved", value: "APPROVED", icon: CheckCircle, count: tasks.filter((t: any) => t.status === "APPROVED").length },
    { label: "Rejected", value: "REJECTED", icon: XCircle, count: tasks.filter((t: any) => t.status === "REJECTED").length },
    { label: "In Progress", value: "IN_PROGRESS", icon: Zap, count: tasks.filter((t: any) => t.status === "IN_PROGRESS").length },
    { label: "Completed", value: "COMPLETED", icon: Trophy, count: tasks.filter((t: any) => t.status === "COMPLETED").length },
  ]

  // Priority filter options with counts and icons
  const priorityOptions = [
    { label: "Low", value: "LOW", icon: Circle, count: tasks.filter((t: any) => t.priority === "LOW").length },
    { label: "Medium", value: "MEDIUM", icon: AlertCircle, count: tasks.filter((t: any) => t.priority === "MEDIUM").length },
    { label: "High", value: "HIGH", icon: AlertTriangle, count: tasks.filter((t: any) => t.priority === "HIGH").length },
    { label: "Urgent", value: "URGENT", icon: Flame, count: tasks.filter((t: any) => t.priority === "URGENT").length },
  ]

  const filterConfigs = [
    {
      key: "status",
      title: "Status",
      options: statusOptions,
      selectedValues: statusFilters, 
      onSelectionChange: setStatusFilters,
    },
    {
      key: "priority",
      title: "Priority", 
      options: priorityOptions,
      selectedValues: priorityFilters,
      onSelectionChange: setPriorityFilters,
    },
  ]

  const TaskCard = ({ task }: { task: any }) => {
    const { generateSuggestion, isLoading: suggestionsLoading } = useAISuggestions()
    const [aiRecommendations, setAiRecommendations] = useState<any[]>([])
    const [showRecommendations, setShowRecommendations] = useState(false)
    const [loadingRecommendations, setLoadingRecommendations] = useState(false)
    const assignee = task.assignedToId ? users.find((u: any) => u.id === task.assignedToId) : null

    const getPriorityColor = (priority: string) => {
      switch (priority?.toLowerCase()) {
        case 'urgent': return 'text-red-600 bg-red-50 border-red-200'
        case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
        case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
        case 'low': return 'text-green-600 bg-green-50 border-green-200'
        default: return 'text-gray-600 bg-gray-50 border-gray-200'
      }
    }

    const getStatusColor = (status: string) => {
      switch (status?.toLowerCase()) {
        case 'completed': return 'text-green-700 bg-green-100 border-green-300'
        case 'in_progress': return 'text-blue-700 bg-blue-100 border-blue-300'
        case 'draft': return 'text-gray-700 bg-gray-100 border-gray-300'
        case 'pending_approval': return 'text-yellow-700 bg-yellow-100 border-yellow-300'
        case 'approved': return 'text-emerald-700 bg-emerald-100 border-emerald-300'
        case 'rejected': return 'text-red-700 bg-red-100 border-red-300'
        default: return 'text-gray-700 bg-gray-100 border-gray-300'
      }
    }

    const getAIRecommendations = async () => {
      if (aiRecommendations.length > 0) {
        setShowRecommendations(!showRecommendations)
        return
      }

      setLoadingRecommendations(true)
      try {
        const suggestion = await generateSuggestion({
          title: task.title,
          description: task.description,
          teamId: task.teamId,
          priority: task.priority,
          estimatedHours: task.estimatedHours,
          candidateUserIds: users.map((u: any) => u.id)
        })
        setAiRecommendations(suggestion.recommendations)
        setShowRecommendations(true)
      } catch (error) {
        console.error('Error getting AI recommendations:', error)
        toast({
          title: "AI Recommendations",
          description: "Unable to get AI recommendations at this time.",
          variant: "destructive",
        })
      } finally {
        setLoadingRecommendations(false)
      }
    }

    return (
      <Card className={`border border-border hover:shadow-lg transition-all duration-200 ${
        assigningTasks.has(task.id) || unassigningTasks.has(task.id) || completingTasks.has(task.id) 
          ? 'ring-2 ring-blue-200 bg-blue-50/30' 
          : 'hover:shadow-md'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
                {task.title}
                {(assigningTasks.has(task.id) || unassigningTasks.has(task.id) || completingTasks.has(task.id)) && (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Badge className={`text-xs px-2 py-1 ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </Badge>
              <Badge className={`text-xs px-2 py-1 ${getStatusColor(task.status)}`}>
                {task.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {assignee ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <img src={assignee.avatar || "/placeholder-user.jpg"} alt={assignee.name} />
                  </Avatar>
                  <span className="text-sm text-muted-foreground">{assignee.name}</span>
                  {unassigningTasks.has(task.id) && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600"></div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Unassigned</span>
                  {assigningTasks.has(task.id) && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {task.status !== 'COMPLETED' && task.assignedToId && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUnassignTask(task.id)}
                    disabled={unassigningTasks.has(task.id)}
                    className="text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    {unassigningTasks.has(task.id) ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600 mr-1"></div>
                    ) : (
                      <UserPlus className="h-4 w-4 mr-1" />
                    )}
                    Unassign
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkCompleted(task.id)}
                    disabled={completingTasks.has(task.id)}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    {completingTasks.has(task.id) ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600 mr-1"></div>
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    Complete
                  </Button>
                </>
              )}
              {!task.assignedToId && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={getAIRecommendations}
                    disabled={loadingRecommendations || assigningTasks.has(task.id)}
                    className="text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    {loadingRecommendations ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600 mr-1"></div>
                    ) : (
                      <Brain className="h-4 w-4 mr-1" />
                    )}
                    AI Suggest
                  </Button>
                  <Select 
                    onValueChange={(userId) => handleAssignTask(task.id, userId)}
                    disabled={assigningTasks.has(task.id)}
                  >
                    <SelectTrigger className={`w-32 h-8 ${assigningTasks.has(task.id) ? 'opacity-50' : ''}`}>
                      <SelectValue placeholder={assigningTasks.has(task.id) ? "Assigning..." : "Assign"} />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              <Link href={`/tasks/${task.id}`}>
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </Link>
            </div>
          </div>

          {/* AI Recommendations */}
          {!task.assignedToId && showRecommendations && aiRecommendations.length > 0 && (
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">AI Recommendations</span>
              </div>
              <div className="space-y-2">
                {aiRecommendations.slice(0, 3).map((rec, index) => {
                  const user = users.find((u: any) => u.id === rec.userId)
                  return (
                    <div
                      key={rec.userId}
                      className="flex items-center justify-between p-2 bg-purple-50 rounded-lg border border-purple-100"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-purple-700">#{index + 1}</span>
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        </div>
                        <Avatar className="h-6 w-6">
                          <img src={user?.avatar || "/placeholder-user.jpg"} alt={user?.name || rec.userName} />
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{user?.name || rec.userName}</p>
                          <p className="text-xs text-gray-600 line-clamp-1">{rec.reason}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-purple-700">
                            {Math.round(rec.score)}%
                          </div>
                          <div className="text-xs text-gray-500">{rec.estimatedHours}h</div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleAssignTask(task.id, rec.userId)
                          setShowRecommendations(false)
                        }}
                        disabled={assigningTasks.has(task.id)}
                        className={`ml-2 text-xs px-2 py-1 h-7 text-purple-700 border-purple-200 hover:bg-purple-100 ${
                          assigningTasks.has(task.id) ? 'opacity-50' : ''
                        }`}
                      >
                        {assigningTasks.has(task.id) ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                        ) : (
                          'Assign'
                        )}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (tasksLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        </div>
      </main>
    )
  }

  if (tasksError) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container py-12">
          <div className="text-center">
            <p className="text-destructive">Error loading tasks: {tasksError.message}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <CheckCircle className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Task Management</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Organize & track progress</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link href="/" className="text-foreground/60 transition-colors hover:text-foreground">
              Home
            </Link>
            <Link href="/teams" className="text-foreground/60 transition-colors hover:text-foreground">
              Teams
            </Link>
            <Link href="/mom" className="text-blue-400 transition-colors hover:text-blue-300">
              Meeting Minutes
            </Link>
            <Link href="/dashboard" className="text-foreground/60 transition-colors hover:text-foreground">
              Dashboard
            </Link>
          </nav>

          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => mutateTasks()}
              disabled={tasksLoading}
              className="hidden sm:inline-flex"
            >
              {tasksLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
              ) : (
                "🔄"
              )}
              Refresh
            </Button>
            <Link href="/tasks/new">
              <Button size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Section Tabs */}
      <section className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Button
                variant={activeSection === 'active' ? undefined : 'ghost'}
                size="sm"
                onClick={() => setActiveSection('active')}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Active Tasks ({activeTasks.length})
              </Button>
              <Button
                variant={activeSection === 'completed' ? undefined : 'ghost'}
                size="sm"
                onClick={() => setActiveSection('completed')}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Completed ({completedTasks.length})
              </Button>
            </div>
            
            <div className="w-full sm:w-auto">
              <ModernFilterBar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                placeholder="Search tasks..."
                filters={[
                  {
                    key: 'status',
                    title: 'Status',
                    options: [
                      { label: 'Todo', value: 'TODO' },
                      { label: 'In Progress', value: 'IN_PROGRESS' },
                      { label: 'Review', value: 'IN_REVIEW' },
                      { label: 'Completed', value: 'COMPLETED' }
                    ],
                    selectedValues: statusFilters,
                    onSelectionChange: setStatusFilters
                  },
                  {
                    key: 'priority',
                    title: 'Priority',
                    options: [
                      { label: 'High', value: 'HIGH' },
                      { label: 'Medium', value: 'MEDIUM' },
                      { label: 'Low', value: 'LOW' }
                    ],
                    selectedValues: priorityFilters,
                    onSelectionChange: setPriorityFilters
                  }
                ]}
                onResetFilters={() => {
                  setSearchQuery('')
                  setStatusFilters(new Set())
                  setPriorityFilters(new Set())
                }}
                className="w-full sm:w-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tasks Content */}
      <section className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {activeSection === 'active' ? (
            <div className="space-y-12">
              {/* Yet to be Assigned Section */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
                    <UserPlus className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Yet to be Assigned
                  </h2>
                  <Badge className="ml-auto">
                    {unassignedTasks.length}
                  </Badge>
                </div>
                {unassignedTasks.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {unassignedTasks.map((task: any) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-border rounded-lg">
                    <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No unassigned tasks</h3>
                    <p className="text-muted-foreground mb-4">All tasks have been assigned to team members</p>
                    <Link href="/tasks/new">
                      <Button>Create New Task</Button>
                    </Link>
                  </div>
                )}
              </div>
                                  </div>

              {/* Already Assigned Section */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Already Assigned
                  </h2>
                  <Badge className="ml-auto">
                    {assignedTasks.length}
                  </Badge>
                </div>
                {assignedTasks.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {assignedTasks.map((task: any) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-border rounded-lg">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No assigned tasks</h3>
                    <p className="text-muted-foreground">No tasks are currently assigned to team members</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Completed Tasks Section */
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                  <Trophy className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  Completed Tasks
                </h2>
                <Badge className="ml-auto">
                  {completedTasks.length}
                </Badge>
              </div>
              {completedTasks.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {completedTasks.map((task: any) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-border rounded-lg">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No completed tasks</h3>
                  <p className="text-muted-foreground">Tasks will appear here once they are completed</p>
                </div>
              )}
            </div>
          )}
        </div>
    </div>
  )
}
