"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { mockApprovals, mockTasks, mockUsers } from "@/lib/mock-data"

export default function ApprovalDetailPage() {
  const params = useParams()
  const approvalId = params.id as string
  const [isLoading, setIsLoading] = useState(false)
  const [approvalStatus, setApprovalStatus] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ESCALATED">("PENDING")
  const [rejectionReason, setRejectionReason] = useState("")

  const approval = mockApprovals.find((a) => a.id === approvalId)
  const task = approval ? mockTasks.find((t) => t.id === approval.taskId) : null
  const requester = approval ? mockUsers.find((u) => u.id === approval.requestedBy) : null
  const approver = approval?.approvedBy ? mockUsers.find((u) => u.id === approval.approvedBy) : null

  if (!approval || !task || !requester) {
    return (
      <main className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container flex items-center gap-4 py-4">
            <Link href="/approvals">
              <Button variant="ghost">← Back to Approvals</Button>
            </Link>
          </div>
        </header>
        <section className="container py-12">
          <Empty className="border border-border">
            <EmptyHeader>
              <EmptyTitle>Approval not found</EmptyTitle>
              <EmptyDescription>The approval you're looking for doesn't exist.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href="/approvals">
                <Button variant="primary">Back to Approvals</Button>
              </Link>
            </EmptyContent>
          </Empty>
        </section>
      </main>
    )
  }

  const handleApprove = async () => {
    setIsLoading(true)
    try {
      console.log("Approving task:", task.id)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setApprovalStatus("APPROVED")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason")
      return
    }
    setIsLoading(true)
    try {
      console.log("Rejecting task:", task.id, "Reason:", rejectionReason)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setApprovalStatus("REJECTED")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEscalate = async () => {
    setIsLoading(true)
    try {
      console.log("Escalating approval:", approval.id)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setApprovalStatus("ESCALATED")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
      PENDING: "warning",
      APPROVED: "success",
      REJECTED: "error",
      ESCALATED: "info",
    }
    return colors[status] || "default"
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
      LOW: "success",
      MEDIUM: "info",
      HIGH: "warning",
      URGENT: "error",
    }
    return colors[priority] || "default"
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between py-4">
          <Link href="/approvals">
            <Button variant="ghost">← Back to Approvals</Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <section className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Information */}
            <Card>
              <CardHeader>
                <CardTitle>Task Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{task.title}</h3>
                  <div className="flex gap-2 flex-wrap mb-4">
                    <Badge variant={getStatusColor(task.status)}>{task.status}</Badge>
                    <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                  <p className="text-foreground">{task.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Estimated Hours</p>
                    <p className="text-sm text-foreground">{task.estimatedHours}h</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Due Date</p>
                    <p className="text-sm text-foreground">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Approval Status */}
            <Card>
              <CardHeader>
                <CardTitle>Approval Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Status</span>
                  <Badge variant={getStatusColor(approvalStatus)}>{approvalStatus}</Badge>
                </div>

                {approvalStatus === "PENDING" && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Rejection Reason (if rejecting)
                      </label>
                      <textarea
                        placeholder="Provide a reason for rejection..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="primary" onClick={handleApprove} isLoading={isLoading}>
                        Approve
                      </Button>
                      <Button variant="outline" onClick={handleReject} isLoading={isLoading}>
                        Reject
                      </Button>
                      <Button variant="ghost" onClick={handleEscalate} isLoading={isLoading}>
                        Escalate
                      </Button>
                    </div>
                  </div>
                )}

                {approvalStatus !== "PENDING" && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      This approval has been {approvalStatus.toLowerCase()}. No further actions available.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Requester */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Requested By</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar
                    size="md"
                    initials={requester.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  />
                  <div>
                    <p className="font-medium text-foreground">{requester.name}</p>
                    <p className="text-xs text-muted-foreground">{requester.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">{requester.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Approver (if approved) */}
            {approver && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Approved By</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar
                      size="md"
                      initials={approver.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    />
                    <div>
                      <p className="font-medium text-foreground">{approver.name}</p>
                      <p className="text-xs text-muted-foreground">{approver.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">{approver.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Requested</p>
                  <p className="text-sm text-foreground">{new Date(approval.createdAt).toLocaleDateString()}</p>
                </div>
                {approval.updatedAt && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Last Updated</p>
                    <p className="text-sm text-foreground">{new Date(approval.updatedAt).toLocaleDateString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comments */}
            {approval.comments && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground">{approval.comments}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
