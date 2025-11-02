import { renderHook, act } from "@testing-library/react"
import { useApprovals } from "@/hooks/useApprovals"

describe("useApprovals", () => {
  it("should initialize with empty approvals", () => {
    const { result } = renderHook(() => useApprovals())
    expect(result.current.approvals).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("should handle approval status update", async () => {
    const { result } = renderHook(() => useApprovals())

    await act(async () => {
      await result.current.updateApprovalStatus("approval-1", "APPROVED")
    })

    expect(result.current.isLoading).toBe(false)
  })

  it("should handle approval escalation", async () => {
    const { result } = renderHook(() => useApprovals())

    await act(async () => {
      await result.current.escalateApproval("approval-1")
    })

    expect(result.current.isLoading).toBe(false)
  })
})
