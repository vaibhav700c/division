import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Approval } from "@/types"

interface ApprovalCardProps {
  approval: Approval
  taskTitle: string
  requesterName: string
  requesterInitials: string
}

export function ApprovalCard({ approval, taskTitle, requesterName, requesterInitials }: ApprovalCardProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
      PENDING: "warning",
      APPROVED: "success",
      REJECTED: "error",
      ESCALATED: "info",
    }
    return colors[status] || "default"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{taskTitle}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Avatar size="sm" initials={requesterInitials} />
              <span className="text-sm text-muted-foreground">{requesterName}</span>
            </div>
          </div>
          <Badge variant={getStatusColor(approval.status)}>{approval.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Requested {new Date(approval.createdAt).toLocaleDateString()}
          </span>
          <Link href={`/approvals/${approval.id}`}>
            <Button variant="ghost" size="sm">
              Review
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
