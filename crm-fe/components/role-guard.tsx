import type { ReactNode } from "react"
import type { UserRole } from "@/types"

interface RoleGuardProps {
  allowed: UserRole[]
  children: ReactNode
  fallback?: ReactNode
  userRole?: UserRole
}

export function RoleGuard({ allowed, children, fallback, userRole = "TEAM_MEMBER" }: RoleGuardProps) {
  if (!allowed.includes(userRole)) {
    return fallback ? <>{fallback}</> : <AccessDenied />
  }

  return <>{children}</>
}

function AccessDenied() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    </div>
  )
}
