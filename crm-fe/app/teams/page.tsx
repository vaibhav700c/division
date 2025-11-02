"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import PageHeader from "@/components/layout/page-header"
import { mockTeams } from "@/lib/mock-data"
import { BarChart3, Users as UsersIcon } from "lucide-react"

export default function TeamsPage() {
  const getRoleColor = (role: string) => {
    const colors: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
      ADMIN: "error",
      TEAM_LEADER: "warning",
      TEAM_MEMBER: "info",
    }
    return colors[role] || "default"
  }

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
  }

  return (
    <main className="min-h-screen bg-background">
      <PageHeader 
        title="Teams" 
        description="Manage and view team members"
      >
        <Link href="/ai/workload">
          <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50 gap-2">
            <BarChart3 className="h-4 w-4" />
            Workload Analysis
          </Button>
        </Link>
        <Link href="/tasks">
          <Button variant="outline" className="gap-2">
            <UsersIcon className="h-4 w-4" />
            View Tasks
          </Button>
        </Link>
      </PageHeader>

      {/* Teams Grid */}
      <section className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mockTeams.map((team) => (
            <Card key={team.id} className="overflow-hidden">
              <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{team.name}</h2>
                    <p className="text-sm text-muted-foreground">{team.description}</p>
                  </div>
                  <Badge variant="info">{team.members.length} members</Badge>
                </div>
              </div>

              {/* Team Members */}
              <div className="divide-y divide-border">
                {team.members.map((member) => (
                  <div key={member.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar size="md" initials={getUserInitials(member.name)} />
                        <div>
                          <p className="font-medium text-foreground">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <Badge variant={getRoleColor(member.role)} className="text-xs">
                        {member.role === "TEAM_LEADER" ? "Leader" : member.role === "TEAM_MEMBER" ? "Member" : "Admin"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Team Stats */}
              <div className="p-4 bg-muted/30 border-t border-border">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {team.members.filter((m) => m.role === "TEAM_LEADER").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Leaders</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {team.members.filter((m) => m.role === "TEAM_MEMBER").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Members</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{team.members.length}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}
