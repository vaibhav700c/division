"use client"

import { useState, useCallback } from "react"
import useSWR from 'swr'
import { tasksApi } from "@/lib/api-client"
import type { Task, TaskAssignmentResponse, TimeLogResponse, AssignmentHistory } from "@/types"

interface UseTasksReturn {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  mutate: () => void
  autoAssignTask: (taskId: string, mode?: 'ai' | 'balanced' | 'min-load', candidateUserIds?: string[]) => Promise<TaskAssignmentResponse>
  manualAssignTask: (taskId: string, assignedToId: string, reason?: string, requestApproval?: boolean) => Promise<TaskAssignmentResponse>
  logTime: (taskId: string, timeData: {
    startTime?: string
    endTime?: string
    durationHours?: number
    notes?: string
    autoDetected?: boolean
    completeIfDone?: boolean
  }) => Promise<TimeLogResponse>
  getAssignmentHistory: (taskId: string) => Promise<AssignmentHistory[]>
  createTask: (taskData: {
    title: string
    description: string
    status?: string
    priority?: string
    estimatedHours?: number
    scheduledAt?: string
    assignedToId?: string
    createdById: string
    teamId?: string
  }) => Promise<Task>
  updateTask: (taskId: string, updates: Partial<{
    title: string
    description: string
    status: string
    priority: string
    estimatedHours: number
    scheduledAt: string
    assignedToId: string
  }>) => Promise<Task>
}

export function useTasks(filters?: { 
  teamId?: string
  status?: string
  assignedToId?: string
  priority?: string 
}): UseTasksReturn {
  const [error, setError] = useState<string | null>(null)
  
  const { data: tasks = [], isLoading, mutate } = useSWR(
    ['tasks', filters],
    () => tasksApi.getAll(filters),
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      onError: (err) => setError(err.message)
    }
  )

  const autoAssignTask = useCallback(async (
    taskId: string, 
    mode: 'ai' | 'balanced' | 'min-load' = 'ai', 
    candidateUserIds?: string[]
  ): Promise<TaskAssignmentResponse> => {
    setError(null)
    try {
      const result = await tasksApi.autoAssign(taskId, mode, candidateUserIds)
      mutate() // Refresh the list
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to auto-assign task"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [mutate])

  const manualAssignTask = useCallback(async (
    taskId: string, 
    assignedToId: string, 
    reason?: string, 
    requestApproval: boolean = false
  ): Promise<TaskAssignmentResponse> => {
    setError(null)
    try {
      const result = await tasksApi.manualAssign(taskId, assignedToId, reason, requestApproval)
      mutate() // Refresh the list
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to assign task"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [mutate])

  const logTime = useCallback(async (taskId: string, timeData: {
    startTime?: string
    endTime?: string
    durationHours?: number
    notes?: string
    autoDetected?: boolean
    completeIfDone?: boolean
  }): Promise<TimeLogResponse> => {
    setError(null)
    try {
      const result = await tasksApi.logTime(taskId, timeData)
      mutate() // Refresh the list to show updated logged hours
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to log time"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [mutate])

  const getAssignmentHistory = useCallback(async (taskId: string): Promise<AssignmentHistory[]> => {
    setError(null)
    try {
      const result = await tasksApi.getAssignmentHistory(taskId)
      return result.assignmentHistory || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get assignment history"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const createTask = useCallback(async (taskData: {
    title: string
    description: string
    status?: string
    priority?: string
    estimatedHours?: number
    scheduledAt?: string
    assignedToId?: string
    createdById: string
    teamId?: string
  }): Promise<Task> => {
    setError(null)
    try {
      const result = await tasksApi.create(taskData)
      mutate() // Refresh the list
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create task"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [mutate])

  const updateTask = useCallback(async (taskId: string, updates: Partial<{
    title: string
    description: string
    status: string
    priority: string
    estimatedHours: number
    scheduledAt: string
    assignedToId: string
  }>): Promise<Task> => {
    setError(null)
    try {
      const result = await tasksApi.update(taskId, updates)
      mutate() // Refresh the list
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update task"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [mutate])

  return {
    tasks,
    isLoading,
    error,
    mutate,
    autoAssignTask,
    manualAssignTask,
    logTime,
    getAssignmentHistory,
    createTask,
    updateTask
  }
}

// Hook for getting a single task by ID
export function useTask(taskId: string) {
  const [error, setError] = useState<string | null>(null)
  
  const { data: task, isLoading, mutate } = useSWR(
    taskId ? ['task', taskId] : null,
    () => tasksApi.getById(taskId),
    {
      onError: (err) => setError(err.message)
    }
  )

  return {
    task,
    isLoading,
    error,
    mutate
  }
}