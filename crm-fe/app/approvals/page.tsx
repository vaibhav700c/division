"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select } from "@/components/ui/select"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { ModernFilterBar } from "@/components/filters/modern-filter-bar"
import PageHeader from "@/components/layout/page-header"
import { mockApprovals, mockTasks, mockUsers } from "@/lib/mock-data"
import type { ApprovalStatus } from "@/types"
import { CheckCircle, XCircle, Clock, AlertTriangle, FileCheck, Plus } from "lucide-react"

export default function ApprovalsPage() {
  const [approvals] = useState(mockApprovals)
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")

  const filteredApprovals = approvals.filter((approval) => {
    const matchesStatus = statusFilters.size === 0 || statusFilters.has(approval.status)
    const matchesSearch = 
      searchQuery === "" || 
      mockTasks
        .find((t) => t.id === approval.taskId)
        ?.title.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      getRequesterName(approval.requestedBy)
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Status filter options with counts and icons
  const statusOptions = [
    {
      label: "Pending",
      value: "PENDING",
      icon: Clock,
      count: approvals.filter(a => a.status === "PENDING").length,
    },
    {
      label: "Approved", 
      value: "APPROVED",
      icon: CheckCircle,
      count: approvals.filter(a => a.status === "APPROVED").length,
    },
    {
      label: "Rejected",
      value: "REJECTED", 
      icon: XCircle,
      count: approvals.filter(a => a.status === "REJECTED").length,
    },
    {
      label: "Escalated",
      value: "ESCALATED",
      icon: AlertTriangle,
      count: approvals.filter(a => a.status === "ESCALATED").length,
    },
  ]

  const filterConfigs = [
    {
      key: "status",
      title: "Status",
      options: statusOptions,
      selectedValues: statusFilters, 
      onSelectionChange: setStatusFilters,
    },
  ]

  const getStatusColor = (status: ApprovalStatus) => {
    const colors: Record<ApprovalStatus, "default" | "success" | "warning" | "error" | "info"> = {
      PENDING: "warning",
      APPROVED: "success",
      REJECTED: "error",
      ESCALATED: "info",
    }
    return colors[status]
  }

  const getTaskTitle = (taskId: string) => {
    return mockTasks.find((t) => t.id === taskId)?.title || "Unknown Task"
  }

  const getRequesterName = (userId: string) => {
    return mockUsers.find((u) => u.id === userId)?.name || "Unknown"
  }

  const getRequesterInitials = (userId: string) => {
    const user = mockUsers.find((u) => u.id === userId)
    return user
      ? user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
      : "?"
  }

  return (
    <main className="min-h-screen bg-background">
      <PageHeader 
        title="Approvals" 
        description="Review and manage task approvals"
      >
        <Link href="/tasks">
          <Button variant="outline" className="gap-2">
            <FileCheck className="h-4 w-4" />
            View Tasks
          </Button>
        </Link>
        <Link href="/mom">
          <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 gap-2">
            📝 Meeting Minutes
          </Button>
        </Link>
      </PageHeader>

      <section className="border-b border-border bg-gradient-to-b from-muted/50 to-background">
        <div className="container py-6">
          <ModernFilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            placeholder="Search approvals, tasks, or requesters..."
            filters={filterConfigs}
            totalItems={approvals.length}
            filteredItems={filteredApprovals.length}
            onResetFilters={() => {
              setStatusFilters(new Set())
            }}
          />
        </div>
      </section>

      {/* Approvals Table */}
      <section className="container py-8">
        {filteredApprovals.length === 0 ? (
          <Empty className="border border-border">
            <EmptyHeader>
              <EmptyTitle>No approvals found</EmptyTitle>
              <EmptyDescription>
                {statusFilters.size > 0 || searchQuery
                  ? "Try adjusting your filters or search query"
                  : "All tasks are approved or no pending approvals"}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApprovals.map((approval) => (
                  <TableRow key={approval.id}>
                    <TableCell className="font-medium text-foreground">{getTaskTitle(approval.taskId)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(approval.status)}>{approval.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar size="sm" initials={getRequesterInitials(approval.requestedBy)} />
                        <span className="text-sm">{getRequesterName(approval.requestedBy)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {approval.approvedBy ? (
                        <div className="flex items-center gap-2">
                          <Avatar
                            size="sm"
                            initials={
                              mockUsers
                                .find((u) => u.id === approval.approvedBy)
                                ?.name.split(" ")
                                .map((n) => n[0])
                                .join("") || "?"
                            }
                          />
                          <span className="text-sm">{mockUsers.find((u) => u.id === approval.approvedBy)?.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(approval.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link href={`/approvals/${approval.id}`}>
                        <Button variant="ghost" size="sm">
                          Review
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>
    </main>
  )
}
