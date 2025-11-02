"use client"

import { renderHook, act } from "@testing-library/react"
import { useAuth } from "@/hooks/useAuth"

describe("useAuth", () => {
  it("should initialize with null user", () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.user).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("should handle login", async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.login("test@example.com", "password")
    })

    expect(result.current.isLoading).toBe(false)
  })

  it("should handle logout", async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBeNull()
  })
})
