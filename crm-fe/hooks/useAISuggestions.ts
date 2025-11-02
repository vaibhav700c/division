"use client"

import { useState, useCallback } from "react"
import useSWR from 'swr'
import { aiApi } from "@/lib/api-client"
import type { TaskAssignmentSuggestion } from "@/types"

interface UseAISuggestionsReturn {
  suggestions: TaskAssignmentSuggestion[]
  isLoading: boolean
  error: string | null
  mutate: () => void
  generateSuggestion: (data: {
    title: string
    description?: string
    teamId: string
    candidateUserIds?: string[]
    priority?: string
    estimatedHours?: number
  }) => Promise<TaskAssignmentSuggestion>
}

export function useAISuggestions(teamId?: string): UseAISuggestionsReturn {
  const [error, setError] = useState<string | null>(null)
  const [localSuggestions, setLocalSuggestions] = useState<TaskAssignmentSuggestion[]>([])
  
  const { data: suggestions = [], isLoading, mutate } = useSWR(
    teamId ? ['ai-suggestions-history', teamId] : null,
    () => [], // We'll manage suggestions locally for now
    {
      onError: (err) => setError(err.message),
      revalidateOnFocus: false,
      refreshInterval: 0,
    }
  )

  const generateSuggestion = useCallback(async (data: {
    title: string
    description?: string
    teamId: string
    candidateUserIds?: string[]
    priority?: string
    estimatedHours?: number
  }) => {
    try {
      setError(null)
      const response = await aiApi.suggestAssignment(data)
      
      // Transform the API response to match our expected format
      const suggestion: TaskAssignmentSuggestion = {
        id: `suggestion-${Date.now()}`,
        title: data.title,
        description: data.description || "",
        suggestedPriority: response.suggestedPriority || data.priority || "MEDIUM",
        suggestedEstimatedHours: response.suggestedEstimatedHours || data.estimatedHours || 8,
        teamId: data.teamId,
        recommendations: response.recommendations.map((rec: any) => ({
          userId: rec.userId,
          userName: rec.userName || `User ${rec.userId.slice(-4)}`,
          reason: rec.reason,
          score: rec.score,
          workloadScore: rec.workloadScore || 0.8,
          estimatedHours: rec.estimatedHours || data.estimatedHours || 8
        })),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      // Add to our local suggestions list
      setLocalSuggestions(prev => [suggestion, ...prev])
      
      return suggestion
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [])

  return {
    suggestions: localSuggestions,
    isLoading,
    error,
    mutate,
    generateSuggestion
  }
}
