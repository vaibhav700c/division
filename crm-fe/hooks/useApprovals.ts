"use client"

import { useState, useCallback, useEffect } from "react"
import useSWR from 'swr'
import { approvalsApi } from "@/lib/api-client"
import type { ApprovalRequest, ApprovalStatus, ApprovalActionResponse } from "@/types"

interface UseApprovalsReturn {
  approvals: ApprovalRequest[]
  isLoading: boolean
  error: string | null
  mutate: () => void
  approveRequest: (approvalId: string, comments?: string) => Promise<ApprovalActionResponse>
  rejectRequest: (approvalId: string, rejectionReason?: string, comments?: string) => Promise<ApprovalActionResponse>
  createApprovalRequest: (taskId: string, requestedById: string, reason?: string) => Promise<ApprovalRequest>
}

export function useApprovals(filters?: { status?: string; teamId?: string }): UseApprovalsReturn {
  const [error, setError] = useState<string | null>(null)
  
  const { data: approvals = [], isLoading, mutate } = useSWR(
    ['approvals', filters],
    () => approvalsApi.getAll(filters),
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      onError: (err) => setError(err.message)
    }
  )

  const approveRequest = useCallback(async (approvalId: string, comments?: string): Promise<ApprovalActionResponse> => {
    setError(null)
    try {
      const result = await approvalsApi.approve(approvalId, comments)
      mutate() // Refresh the list
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to approve request"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [mutate])

  const rejectRequest = useCallback(async (approvalId: string, rejectionReason?: string, comments?: string): Promise<ApprovalActionResponse> => {
    setError(null)
    try {
      const result = await approvalsApi.reject(approvalId, rejectionReason, comments)
      mutate() // Refresh the list
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to reject request"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [mutate])

  const createApprovalRequest = useCallback(async (taskId: string, requestedById: string, reason?: string): Promise<ApprovalRequest> => {
    setError(null)
    try {
      const result = await approvalsApi.create({ taskId, requestedById, reason })
      mutate() // Refresh the list
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create approval request"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [mutate])

  return {
    approvals,
    isLoading,
    error,
    mutate,
    approveRequest,
    rejectRequest,
    createApprovalRequest
  }
}
