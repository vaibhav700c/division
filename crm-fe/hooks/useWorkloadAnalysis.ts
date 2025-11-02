"use client"

import { useState, useCallback } from "react"
import useSWR from 'swr'
import { workloadApi } from '@/lib/api-client'

interface TeamWorkloadUser {
  userId: string
  userName: string
  openEstimatedHours: number
  overdueCount: number
  taskCount: number
  capacity: number
  score: number
}

interface UserWorkloadDetails {
  userId: string
  userName: string
  workloadScore: number
  openEstimatedHours: number
  overdueCount: number
  skillScore?: number
  availabilityScore?: number
  taskCount: number
  capacity: number
  details: {
    openTasks: Array<{
      id: string
      title: string
      estimatedHours?: number
      priority: string
      dueDate?: string
    }>
    upcomingDeadlines: Array<{
      taskId: string
      taskTitle: string
      dueDate: string
      priority: string
    }>
  }
}

interface WorkloadStats {
  totalMembers: number
  averageScore: number
  highestScore: number
  lowestScore: number
  totalEstimatedHours: number
  totalOverdueTasks: number
}

export function useWorkloadAnalysis(teamId?: string) {
  const [error, setError] = useState<string | null>(null)

  const { 
    data: teamWorkload = [], 
    error: workloadError, 
    isLoading: isLoadingWorkload,
    mutate: mutateWorkload
  } = useSWR<TeamWorkloadUser[]>(
    teamId ? ['workload', teamId] : null,
    () => workloadApi.getTeamWorkload(teamId!),
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      onError: (error: any) => {
        console.error('Workload API Error:', error)
        setError(error?.message || 'Failed to load workload data')
      }
    }
  )

  const { 
    data: workloadStats, 
    error: statsError,
    isLoading: isLoadingStats,
    mutate: mutateStats
  } = useSWR<WorkloadStats>(
    teamId ? ['workload-stats', teamId] : null,
    () => workloadApi.getTeamStats(teamId!),
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      onError: (error: any) => {
        console.error('Workload Stats API Error:', error)
        setError(error?.message || 'Failed to load workload stats')
      }
    }
  )

  const getUserWorkload = useCallback(async (userId: string): Promise<UserWorkloadDetails> => {
    setError(null)
    try {
      return await workloadApi.getUserWorkload(userId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch user workload"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const computeWorkloadScore = useCallback(async (data: {
    openEstimatedHours: number
    overdueCount: number
    skillScore?: number
    availabilityScore?: number
  }): Promise<number> => {
    setError(null)
    try {
      return await workloadApi.computeWorkloadScore(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to compute workload score"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const getOverloadedMembers = useCallback(async (scoreThreshold = 50, hoursThreshold = 40) => {
    if (!teamId) return []
    setError(null)
    try {
      return await workloadApi.getOverloadedMembers(teamId, scoreThreshold, hoursThreshold)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get overloaded members"
      setError(errorMessage)
      console.error('Error getting overloaded members:', err)
      return []
    }
  }, [teamId])

  const refresh = useCallback(() => {
    mutateWorkload()
    mutateStats()
  }, [mutateWorkload, mutateStats])

  return {
    teamWorkload,
    workloadStats: workloadStats || {
      totalMembers: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      totalEstimatedHours: 0,
      totalOverdueTasks: 0
    },
    getUserWorkload,
    computeWorkloadScore,
    getOverloadedMembers,
    isLoading: isLoadingWorkload || isLoadingStats,
    error: error || workloadError || statsError,
    refresh
  }
}
