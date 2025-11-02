"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from 'swr'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { tasksApi, usersApi, teamsApi } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export function TaskForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    estimatedHours: 8,
    teamId: "",
    assignedToId: "",
  })

  // Fetch real data from API
  const { data: teams = [], error: teamsError } = useSWR('teams', () => teamsApi.getAll())
  const { data: users = [], error: usersError } = useSWR('users', () => usersApi.getAll())

  // Filter users by selected team
  const teamMembers = formData.teamId 
    ? users.filter((user: any) => user.teamId === formData.teamId)
    : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Task title is required.",
        variant: "destructive",
      })
      return
    }

    if (!formData.teamId) {
      toast({
        title: "Validation Error", 
        description: "Please select a team.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Get a user ID for createdById (use first user from selected team or first available user)
      const createdById = teamMembers.length > 0 ? teamMembers[0].id : users[0]?.id
      
      if (!createdById) {
        throw new Error("No users available")
      }

      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        estimatedHours: formData.estimatedHours,
        teamId: formData.teamId,
        createdById: createdById,
        ...(formData.assignedToId && { assignedToId: formData.assignedToId })
      }

      await tasksApi.create(taskData)
      
      toast({
        title: "Task Created",
        description: "Task has been created successfully.",
      })
      
      router.push("/tasks")
    } catch (error: any) {
      console.error("Error creating task:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create task.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (teamsError || usersError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Failed to load teams and users data.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Task</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
            />
          </div>

          {/* Team Selection */}
          <div className="space-y-2">
            <Label>Team *</Label>
            <Select 
              value={formData.teamId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, teamId: value, assignedToId: "" }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team: any) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name} - {team.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignment (Optional) */}
          {formData.teamId && teamMembers.length > 0 && (
            <div className="space-y-2">
              <Label>Assign to (Optional)</Label>
              <Select 
                value={formData.assignedToId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, assignedToId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Leave unassigned or select a team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Leave unassigned</SelectItem>
                  {teamMembers.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} - {user.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">🟢 Low</SelectItem>
                <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
                <SelectItem value="HIGH">🟠 High</SelectItem>
                <SelectItem value="URGENT">🔴 Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estimated Hours */}
          <div className="space-y-2">
            <Label htmlFor="estimatedHours">Estimated Hours</Label>
            <Input
              id="estimatedHours"
              type="number"
              min="1"
              max="200"
              value={formData.estimatedHours}
              onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) || 8 }))}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Task...
                </>
              ) : (
                "Create Task"
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push("/tasks")}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
