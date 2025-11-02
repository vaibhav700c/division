"use client"

import { useCallback, useState } from "react"
import type { User } from "@/types"

// TODO: Replace with actual NextAuth session hook
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      // TODO: Call /api/auth/signin endpoint
      console.log("Login attempt:", email)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      // TODO: Call /api/auth/signout endpoint
      setUser(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed")
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { user, isLoading, error, login, logout }
}
