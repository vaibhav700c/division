export type UserRole = "ADMIN" | "TEAM_LEADER" | "TEAM_MEMBER"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  teamId: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export interface Team {
  id: string
  name: string
  description?: string
  members: User[]
  createdAt: Date
  updatedAt: Date
}

export type TaskStatus =
  | "DRAFT"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED"

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "ESCALATED"

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assignedTo?: User
  assignedToId?: string
  createdBy: User
  createdById: string
  team?: Team
  teamId: string
  estimatedHours?: number
  loggedHours?: number
  workloadScore?: number
  scheduledAt?: Date
  location?: string
  attachments?: string[]
  timeLogs?: TimeLog[]
  approvalRequests?: ApprovalRequest[]
  createdAt: Date
  updatedAt: Date
}

export interface ApprovalRequest {
  id: string
  taskId: string
  task?: Task
  status: ApprovalStatus
  reason?: string
  requestedBy: User
  requestedById: string
  approvedBy?: User
  approvedById?: string
  approvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface TimeLog {
  id: string
  taskId: string
  task?: Task
  userId: string
  user: User
  hoursSpent: number
  description?: string
  startTime: Date
  endTime: Date
  createdAt: Date
  updatedAt: Date
}

export interface WorkloadScore {
  userId: string
  userName: string
  openEstimatedHours: number
  overdueCount: number
  score: number
}

export interface WorkloadStats {
  totalMembers: number
  averageScore: number
  highestScore: number
  lowestScore: number
  totalEstimatedHours: number
  totalOverdueTasks: number
}

export interface TaskAssignmentSuggestion {
  id: string
  title: string
  description?: string
  teamId: string
  recommendations: Array<{
    userId: string
    userName: string
    score: number
    reason: string
    workloadScore?: number
    estimatedHours?: number
  }>
  suggestedPriority: string
  suggestedEstimatedHours: number
  candidateUserIds?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface MeetingMinutes {
  title: string
  summary: string
  actionItems: Array<{
    description: string
    ownerSuggestion?: string
    ownerName?: string
    workloadScore?: number
    dueDate?: string
  }>
  decisions: string[]
  rawModelNotes?: string
  transcriptId?: string
  fallback?: boolean
}

export interface MeetingTranscript {
  id: string
  title: string
  content: string
  meetingDate: Date
  location?: string
  duration?: number
  createdBy: User
  createdById: string
  createdAt: Date
  updatedAt: Date
}

// Assignment related types
export interface AssignmentRequest {
  taskId: string
  assignedToId: string
  reason?: string
  requestApproval?: boolean
}

export interface AutoAssignmentRequest {
  mode: 'ai' | 'balanced' | 'min-load'
  candidateUserIds?: string[]
}

export interface AssignmentHistory {
  id: string
  status: ApprovalStatus
  reason?: string
  createdAt: Date
  approvedAt?: Date
  requestedBy: User
  approvedBy?: User
}

export interface TimeLogRequest {
  startTime?: string
  endTime?: string
  durationHours?: number
  notes?: string
  autoDetected?: boolean
  completeIfDone?: boolean
}

export interface AIGenerateMinutesRequest {
  transcript: string
  meetingTitle?: string
  teamId?: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: {
    timestamp: string
    [key: string]: any
  }
  error?: string
  message?: string
}

export interface TaskAssignmentResponse {
  task: Task
  assignedUser: User
  approvalRequest?: ApprovalRequest
  assignmentType: 'direct' | 'pending-approval'
  previousAssignee?: User
}

export interface TimeLogResponse {
  timeLog: TimeLog
  task: Task
  loggedBy: User
  summary: {
    durationLogged: number
    totalLoggedHours: number
    estimatedHours?: number
    remainingHours?: number
    statusChanged: boolean
    completionPercentage?: number
    autoCompleted: boolean
  }
}

export interface ApprovalActionResponse {
  approval: ApprovalRequest
  task: Task
  approver: User
  actionTaken: 'APPROVED' | 'REJECTED'
}

export interface WorkloadData {
  userId: string
  userName: string
  totalHours: number
  completedHours: number
  pendingHours: number
  burnoutRisk: "LOW" | "MEDIUM" | "HIGH"
}
