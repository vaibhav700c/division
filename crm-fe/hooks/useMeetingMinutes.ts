"use client"

import { useState, useCallback } from "react"
import useSWR from 'swr'
import { aiApi } from "@/lib/api-client"
import type { MeetingMinutes } from "@/types"

interface UseMeetingMinutesReturn {
  minutes: MeetingMinutes[]
  isLoading: boolean
  error: string | null
  mutate: () => void
  generateMinutes: (data: {
    transcript: string
    meetingType?: string
    attendees?: string[]
    date?: string
  }) => Promise<MeetingMinutes>
  getMinutes: (id: string) => Promise<MeetingMinutes>
}

export function useMeetingMinutes(teamId?: string): UseMeetingMinutesReturn {
  const [error, setError] = useState<string | null>(null)
  
  const { data: minutes = [], isLoading, mutate } = useSWR(
    teamId ? ['meeting-minutes', teamId] : null,
    // For now, return empty array as backend doesn't have history endpoint
    () => Promise.resolve([]),
    {
      onError: (err) => setError(err.message)
    }
  )

  const generateMinutes = useCallback(async (data: {
    transcript: string
    meetingType?: string
    attendees?: string[]
    date?: string
  }): Promise<MeetingMinutes> => {
    setError(null)
    try {
      const result = await aiApi.generateMinutes({
        transcript: data.transcript,
        meetingTitle: data.meetingType,
        teamId
      })
      mutate() // Refresh the history
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate meeting minutes"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [mutate, teamId])

  const getMinutes = useCallback(async (id: string): Promise<MeetingMinutes> => {
    setError(null)
    try {
      // For now, simulate getting meeting minutes by ID
      const result = await aiApi.generateMinutes({
        transcript: `Meeting minutes for ID: ${id}`,
        meetingTitle: "Retrieved Meeting",
        teamId
      })
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch meeting minutes"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [teamId])

  return {
    minutes,
    isLoading,
    error,
    mutate,
    generateMinutes,
    getMinutes
  }
}
