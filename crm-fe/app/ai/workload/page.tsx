"use client"

import { useState } from "react"
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { teamsApi, workloadApi, healthApi } from "@/lib/api-client"
import { RefreshCcw, Users, Clock, AlertTriangle, TrendingUp, Activity } from "lucide-react"

export default function WorkloadPage() {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")

  // Health check
  const { data: health, error: healthError } = useSWR(
    'health',
    () => healthApi.check(),
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
    }
  )

  // Teams data
  const { data: teams = [], error: teamsError, isLoading: teamsLoading } = useSWR(
    'teams',
    () => teamsApi.getAll(),
    {
      refreshInterval: 60000,
    }
  )

  // Workload data
  const { 
    data: workloadScores = [], 
    error: workloadError, 
    isLoading: workloadLoading, 
    mutate: mutateWorkload 
  } = useSWR(
    selectedTeamId ? ['workload', selectedTeamId] : null,
    () => workloadApi.getTeamWorkload(selectedTeamId),
    {
      refreshInterval: 10000,
      revalidateOnFocus: true,
    }
  )

  // Workload stats
  const { 
    data: workloadStats, 
    error: statsError, 
    isLoading: statsLoading 
  } = useSWR(
    selectedTeamId ? ['workload-stats', selectedTeamId] : null,
    () => workloadApi.getTeamStats(selectedTeamId),
    {
      refreshInterval: 10000,
    }
  )

  const getScoreColor = (score: number) => {
    if (score >= 80) return "error"
    if (score >= 60) return "warning"
    if (score >= 40) return "default"
    return "success"
  }

  const getScoreLevel = (score: number) => {
    if (score >= 80) return "High Load"
    if (score >= 60) return "Medium Load"
    if (score >= 40) return "Light Load"
    return "Available"
  }

  if (healthError) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Backend Connection Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">
              Unable to connect to the backend API. Please ensure the backend server is running on port 8000.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workload Analysis</h1>
          <p className="text-muted-foreground">
            Monitor team workload and identify potential bottlenecks
          </p>
        </div>
        <div className="flex items-center gap-2">
          {health && (
            <Badge variant="success" className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Backend Connected
            </Badge>
          )}
          <Button 
            onClick={() => mutateWorkload()} 
            variant="outline" 
            size="sm"
            disabled={!selectedTeamId}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Team Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Team</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a team to analyze" />
            </SelectTrigger>
            <SelectContent>
              {teamsLoading ? (
                <SelectItem value="loading" disabled>Loading teams...</SelectItem>
              ) : teamsError ? (
                <SelectItem value="error" disabled>Error loading teams</SelectItem>
              ) : teams.length === 0 ? (
                <SelectItem value="empty" disabled>No teams found</SelectItem>
              ) : (
                teams.map((team: any) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name} ({team.members?.length || 0} members)
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Workload Stats */}
      {selectedTeamId && workloadStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workloadStats.totalMembers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workloadStats.averageScore.toFixed(1)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workloadStats.totalEstimatedHours}h</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workloadStats.totalOverdueTasks}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Workload Scores */}
      {selectedTeamId && (
        <Card>
          <CardHeader>
            <CardTitle>Team Member Workload</CardTitle>
          </CardHeader>
          <CardContent>
            {workloadLoading || statsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-muted-foreground">Loading workload data...</p>
                </div>
              </div>
            ) : workloadError || statsError ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-700 mb-2">Failed to load workload data</h3>
                <p className="text-gray-600 mb-4">
                  {workloadError?.message || statsError?.message || "An error occurred"}
                </p>
                <Button onClick={() => mutateWorkload()} variant="outline">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : workloadScores.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No workload data</h3>
                <p className="text-gray-600">No team members found or no tasks assigned.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workloadScores.map((member: any) => (
                  <div 
                    key={member.userId} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{member.userName}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{member.openEstimatedHours}h open work</span>
                        <span>{member.overdueCount} overdue tasks</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Workload Score</div>
                        <div className="text-lg font-bold">{member.score}</div>
                      </div>
                      <Badge variant={getScoreColor(member.score) as any}>
                        {getScoreLevel(member.score)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}