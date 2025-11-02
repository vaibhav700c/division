"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from 'swr'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import PageHeader from "@/components/layout/page-header"
import { tasksApi } from "@/lib/api-client"
import type { Task } from "@/types"
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, RefreshCw } from "lucide-react"

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Fetch real tasks from API
  const { data: tasks = [], error: tasksError, isLoading: tasksLoading, mutate: mutateTasks } = useSWR(
    'tasks',
    () => tasksApi.getAll(),
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  )

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task: Task) => {
      // Check multiple date fields to find relevant tasks
      const dateToCheck = date.toDateString()
      
      // Check scheduled date
      if (task.scheduledAt) {
        const scheduledDate = new Date(task.scheduledAt).toDateString()
        if (scheduledDate === dateToCheck) return true
      }
      
      // Check if task was created on this date (for tasks without specific scheduling)
      if (task.createdAt) {
        const createdDate = new Date(task.createdAt).toDateString()
        if (createdDate === dateToCheck) return true
      }
      
      // Check if task was updated on this date (for ongoing work)
      if (task.updatedAt) {
        const updatedDate = new Date(task.updatedAt).toDateString()
        if (updatedDate === dateToCheck) return true
      }
      
      // For tasks in progress, show them for the next few days as well
      if (task.status === 'IN_PROGRESS' || task.status === 'ASSIGNED') {
        const today = new Date()
        const taskDate = date
        const daysDiff = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        // Show in-progress tasks for the next 7 days
        if (daysDiff >= 0 && daysDiff <= 7) {
          return true
        }
      }
      
      return false
    })
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i)

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" })

  // Get tasks for current month
  const getTasksForMonth = () => {
    return tasks.filter((task: Task) => {
      const currentMonth = currentDate.getMonth()
      const currentYear = currentDate.getFullYear()
      
      // Check scheduled date
      if (task.scheduledAt) {
        const taskDate = new Date(task.scheduledAt)
        if (taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear) {
          return true
        }
      }
      
      // Check created date
      if (task.createdAt) {
        const createdDate = new Date(task.createdAt)
        if (createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear) {
          return true
        }
      }
      
      // Include active tasks that span into this month
      if (task.status === 'IN_PROGRESS' || task.status === 'ASSIGNED' || task.status === 'PENDING_APPROVAL') {
        return true
      }
      
      return false
    })
  }

  const monthTasks = getTasksForMonth()

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
        title="Calendar" 
        description="View scheduled tasks and deadlines"
      >
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => mutateTasks()}
          disabled={tasksLoading}
          className="gap-2"
        >
          {tasksLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
        <Link href="/tasks/new">
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </Link>
        <Link href="/tasks">
          <Button variant="primary" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            View Tasks
          </Button>
        </Link>
      </PageHeader>

      {/* Content */}
      <section className="container py-8">
        {/* Error State */}
        {tasksError && (
          <Card className="border-destructive/50 bg-destructive/5 mb-6">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">
                Failed to load tasks: {tasksError.message}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => mutateTasks()}
                className="mt-3"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {tasksLoading && (
          <Card className="mb-6">
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Loading Calendar</h3>
                <p className="text-muted-foreground">Fetching your scheduled tasks...</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {!tasksLoading && (
            <>
              {/* Month Summary */}
              <div className="lg:col-span-3 mb-4">
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {monthName} - {monthTasks.length} tasks scheduled
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {monthTasks.filter(t => t.status === 'COMPLETED').length} completed, {' '}
                          {monthTasks.filter(t => t.status === 'IN_PROGRESS').length} in progress, {' '}
                          {monthTasks.filter(t => t.priority === 'URGENT').length} urgent
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(priority => {
                          const count = monthTasks.filter(t => t.priority === priority).length
                          return count > 0 ? (
                            <Badge key={priority} variant={getPriorityColor(priority)} className="text-xs">
                              {priority}: {count}
                            </Badge>
                          ) : null
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Calendar */}
              <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{monthName}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={goToToday}>
                      Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={previousMonth}>
                      <ChevronLeft className="h-4 w-4" />
                      Prev
                    </Button>
                    <Button variant="outline" size="sm" onClick={nextMonth}>
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-2">
                  {emptyDays.map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}
                  {days.map((day) => {
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                    const tasksForDay = getTasksForDate(date)
                    const isSelected = selectedDate && selectedDate.getDate() === day
                    const isToday = new Date().toDateString() === date.toDateString()

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(date)}
                        className={`aspect-square p-2 rounded-lg border-2 transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/10"
                            : isToday
                              ? "border-green-500 bg-green-50 text-green-800 font-bold"
                              : tasksForDay.length > 0
                                ? "border-warning/50 bg-warning/5 hover:border-warning"
                                : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className={`text-sm font-medium ${isToday ? 'text-green-800' : 'text-foreground'}`}>
                          {day}
                        </div>
                        {tasksForDay.length > 0 && (
                          <div className={`text-xs mt-1 ${isToday ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {tasksForDay.length} task{tasksForDay.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Date Tasks */}
          <div className="space-y-4">
            {/* Legend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Calendar Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 bg-green-50 border-2 border-green-500 rounded"></div>
                  <span>Today</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 bg-warning/5 border-2 border-warning/50 rounded"></div>
                  <span>Has tasks</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 bg-primary/10 border-2 border-primary rounded"></div>
                  <span>Selected date</span>
                </div>
              </CardContent>
            </Card>

            {/* Selected Date Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedDate ? selectedDate.toLocaleDateString() : "Select a date"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDate ? (
                  <div className="space-y-3">
                    {getTasksForDate(selectedDate).length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground mb-3">No tasks for this date</p>
                        <Link href="/tasks/new">
                          <Button variant="outline" size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Task
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      getTasksForDate(selectedDate).map((task: Task) => {
                        // Determine the relationship between task and selected date
                        const selectedDateStr = selectedDate.toDateString()
                        let dateRelation = ''
                        
                        if (task.scheduledAt && new Date(task.scheduledAt).toDateString() === selectedDateStr) {
                          dateRelation = 'Scheduled'
                        } else if (task.createdAt && new Date(task.createdAt).toDateString() === selectedDateStr) {
                          dateRelation = 'Created'
                        } else if (task.updatedAt && new Date(task.updatedAt).toDateString() === selectedDateStr) {
                          dateRelation = 'Updated'
                        } else if (task.status === 'IN_PROGRESS' || task.status === 'ASSIGNED') {
                          dateRelation = 'In Progress'
                        }
                        
                        return (
                          <Link key={task.id} href={`/tasks/${task.id}`}>
                            <div className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                              <div className="flex items-start justify-between mb-2">
                                <p className="text-sm font-medium text-foreground">{task.title}</p>
                                {dateRelation && (
                                  <Badge variant="info" className="text-xs ml-2">
                                    {dateRelation}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                                  {task.priority}
                                </Badge>
                                {task.estimatedHours && (
                                  <Badge variant="info" className="text-xs">
                                    {task.estimatedHours}h
                                  </Badge>
                                )}
                                <Badge variant="default" className="text-xs">
                                  {task.status.replace('_', ' ')}
                                </Badge>
                              </div>
                              {task.assignedTo && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Assigned to: {task.assignedTo.name}
                                </p>
                              )}
                              {task.scheduledAt && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Scheduled: {new Date(task.scheduledAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </Link>
                        )
                      })
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">Select a date to view tasks</p>
                    <p className="text-xs text-muted-foreground">
                      Total active tasks: {tasks.filter(t => t.status !== 'COMPLETED').length}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Tasks Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Active Tasks Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['IN_PROGRESS', 'ASSIGNED', 'PENDING_APPROVAL'].map(status => {
                    const statusTasks = tasks.filter(t => t.status === status)
                    return statusTasks.length > 0 ? (
                      <div key={status} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                          {status.replace('_', ' ').toLowerCase()}:
                        </span>
                        <Badge variant="info" className="text-xs">
                          {statusTasks.length}
                        </Badge>
                      </div>
                    ) : null
                  })}
                  <div className="pt-2 border-t">
                    <Link href="/tasks">
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        View All Tasks
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
