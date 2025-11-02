"use client"

import { useState, useCallback } from "react"
import { tasksApi } from "@/lib/api-client"
import type { TimeLogResponse } from "@/types"

interface TimeLog {
  id: string
  taskId: string
  userId: string
  hoursLogged: number
  description?: string
  date: string
  createdAt: string
}

interface UseTimeLoggingReturn {
  isLoading: boolean
  error: string | null
  logTime: (data: {
    taskId: string
    hoursLogged: number
    description?: string
    date?: string
  }) => Promise<TimeLogResponse>
  startTimer: (taskId: string) => Promise<void>
  stopTimer: (taskId: string) => Promise<void>
  getTimeLogs: (taskId?: string, userId?: string) => Promise<TimeLog[]>
}

export function useTimeLogging(): UseTimeLoggingReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const logTime = useCallback(async (data: {
    taskId: string
    hoursLogged: number
    description?: string
    date?: string
  }): Promise<TimeLogResponse> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await tasksApi.logTime(data.taskId, {
        durationHours: data.hoursLogged,
        notes: data.description,
        autoDetected: false,
        completeIfDone: false
      })
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to log time"
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const startTimer = useCallback(async (taskId: string): Promise<void> => {
    setError(null)
    try {
      // Store start time in localStorage for timer functionality
      const startTime = new Date().toISOString()
      if (typeof window !== 'undefined') {
        localStorage.setItem(`timer_${taskId}`, startTime)
        localStorage.setItem('activeTimer', taskId)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to start timer"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const stopTimer = useCallback(async (taskId: string): Promise<void> => {
    setError(null)
    try {
      if (typeof window !== 'undefined') {
        const startTimeStr = localStorage.getItem(`timer_${taskId}`)
        if (startTimeStr) {
          const startTime = new Date(startTimeStr)
          const endTime = new Date()
          const hoursLogged = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
          
          // Automatically log the time
          await logTime({
            taskId,
            hoursLogged: Math.round(hoursLogged * 100) / 100, // Round to 2 decimal places
            description: `Auto-logged time from ${startTime.toLocaleTimeString()} to ${endTime.toLocaleTimeString()}`
          })
          
          // Clean up localStorage
          localStorage.removeItem(`timer_${taskId}`)
          localStorage.removeItem('activeTimer')
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to stop timer"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [logTime])

  const getTimeLogs = useCallback(async (taskId?: string, userId?: string): Promise<TimeLog[]> => {
    setError(null)
    try {
      // For now, return empty array as backend doesn't have this endpoint yet
      // This would be implemented as a new endpoint in the backend
      console.log('Getting time logs for:', { taskId, userId })
      return []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch time logs"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  return {
    isLoading,
    error,
    logTime,
    startTimer,
    stopTimer,
    getTimeLogs
  }
}