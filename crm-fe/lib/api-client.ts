const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

// Get current user ID (in a real app, this would come from auth context)
const getCurrentUserId = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('currentUserId') || 'cmgulzxku0003xubn1s7l4oun' // Default to Harshith
  }
  return 'cmgulzxku0003xubn1s7l4oun'
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>
  includeAuth?: boolean
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    timestamp: string;
    [key: string]: any;
  };
  error?: string;
  message?: string;
}

export async function apiCall<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, includeAuth = true, ...fetchOptions } = options

  let url = `${API_BASE_URL}${endpoint}`

  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value))
    })
    url += `?${searchParams.toString()}`
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...((fetchOptions.headers as Record<string, string>) || {}),
  }

  // Add auth header for backend endpoints that need it
  if (includeAuth) {
    (headers as Record<string, string>)['X-DEV-USER'] = getCurrentUserId()
  }

  try {
    const response = await fetch(url, {
      headers,
      ...fetchOptions,
    })

    const result: ApiResponse<T> = await response.json()

    if (!response.ok) {
      throw new Error(result.error || `API Error: ${response.status} ${response.statusText}`)
    }

    if (!result.success) {
      throw new Error(result.error || result.message || 'API request failed')
    }

    return result.data
  } catch (error) {
    console.error('API Call Error:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Unknown API error occurred')
  }
}

// Teams API
export const teamsApi = {
  getAll: () => apiCall<any[]>('/teams'),
  getById: (id: string) => apiCall<any>(`/teams/${id}`),
  create: (data: { name: string; description?: string }) => 
    apiCall<any>('/teams', {
      method: 'POST',
      body: JSON.stringify(data)
    })
}

// Users API
export const usersApi = {
  getAll: (teamId?: string) => 
    apiCall<any[]>('/users', { params: teamId ? { teamId } : {} }),
  getById: (id: string) => apiCall<any>(`/users/${id}`)
}

// Tasks API
export const tasksApi = {
  getAll: (filters?: { teamId?: string; status?: string; assignedToId?: string; priority?: string }) => 
    apiCall<any[]>('/tasks', { params: filters || {} }),
  getById: (id: string) => apiCall<any>(`/tasks/${id}`),
  create: (data: {
    title: string;
    description: string;
    status?: string;
    priority?: string;
    estimatedHours?: number;
    scheduledAt?: string;
    assignedToId?: string;
    createdById: string;
    teamId?: string;
  }) => 
    apiCall<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  update: (id: string, data: Partial<{
    title: string;
    description: string;
    status: string;
    priority: string;
    estimatedHours: number;
    scheduledAt: string;
    assignedToId: string | null;
  }>) => 
    apiCall<any>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  
  // New endpoints for task assignment and time logging
  autoAssign: (taskId: string, mode: 'ai' | 'balanced' | 'min-load' = 'ai', candidateUserIds?: string[]) =>
    apiCall<any>(`/tasks/${taskId}/auto-assign`, {
      method: 'POST',
      body: JSON.stringify({ mode, candidateUserIds })
    }),
  
  manualAssign: (taskId: string, assignedToId: string, reason?: string, requestApproval: boolean = false) =>
    apiCall<any>(`/tasks/${taskId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assignedToId, reason, requestApproval })
    }),
  
  getAssignmentHistory: (taskId: string) =>
    apiCall<any>(`/tasks/${taskId}/assignment-history`),
  
  logTime: (taskId: string, data: {
    startTime?: string;
    endTime?: string;
    durationHours?: number;
    notes?: string;
    autoDetected?: boolean;
    completeIfDone?: boolean;
  }) =>
    apiCall<any>(`/tasks/${taskId}/log-time`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
}

// Updated Approvals API with new endpoints
export const approvalsApi = {
  getAll: (filters?: { status?: string; teamId?: string }) => 
    apiCall<any[]>('/approvals', { params: filters || {} }),
  getById: (id: string) => apiCall<any>(`/approvals/${id}`),
  create: (data: { taskId: string; requestedById: string; reason?: string }) => 
    apiCall<any>('/approvals', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  // Updated approve/reject endpoints
  approve: (id: string, comments?: string) => 
    apiCall<any>(`/approvals/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comments })
    }),
  reject: (id: string, rejectionReason?: string, comments?: string) => 
    apiCall<any>(`/approvals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason, comments })
    })
}

// AI API
export const aiApi = {
  suggestAssignment: (data: {
    title: string;
    description?: string;
    teamId: string;
    candidateUserIds?: string[];
    priority?: string;
    estimatedHours?: number;
  }) =>
    apiCall<any>('/ai/suggest-assignment', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  getSuggestionsHistory: (teamId: string, limit: number = 10) =>
    apiCall<any[]>('/ai/suggest-assignment/history', {
      params: { teamId, limit }
    }),
  
  generateMinutes: (data: {
    transcript: string;
    meetingTitle?: string;
    teamId?: string;
  }) =>
    apiCall<any>('/ai/generate-minutes', {
      method: 'POST',
      body: JSON.stringify(data)
    })
}

// Workload API
export const workloadApi = {
  getTeamWorkload: (teamId: string) => 
    apiCall<Array<{
      userId: string;
      userName: string;
      openEstimatedHours: number;
      overdueCount: number;
      taskCount: number;
      capacity: number;
      score: number;
    }>>(`/workload/${teamId}`),
  
  getUserWorkload: (userId: string) => 
    apiCall<{
      userId: string;
      userName: string;
      workloadScore: number;
      openEstimatedHours: number;
      overdueCount: number;
      skillScore?: number;
      availabilityScore?: number;
      taskCount: number;
      capacity: number;
      details: {
        openTasks: Array<{
          id: string;
          title: string;
          estimatedHours?: number;
          priority: string;
          dueDate?: string;
        }>;
        upcomingDeadlines: Array<{
          taskId: string;
          taskTitle: string;
          dueDate: string;
          priority: string;
        }>;
      };
    }>(`/workload/user/${userId}`),
  
  computeWorkloadScore: (data: {
    openEstimatedHours: number;
    overdueCount: number;
    skillScore?: number;
    availabilityScore?: number;
  }) => 
    apiCall<number>('/workload/compute-score', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  getTeamStats: (teamId: string) => 
    apiCall<{
      totalMembers: number;
      averageScore: number;
      highestScore: number;
      lowestScore: number;
      totalEstimatedHours: number;
      totalOverdueTasks: number;
    }>(`/workload/${teamId}/stats`),
  
  getOverloadedMembers: (teamId: string, scoreThreshold?: number, hoursThreshold?: number) => 
    apiCall<Array<{
      userId: string;
      userName: string;
      openEstimatedHours: number;
      overdueCount: number;
      taskCount: number;
      capacity: number;
      score: number;
    }>>(`/workload/${teamId}/overloaded`, {
      params: {
        ...(scoreThreshold && { scoreThreshold }),
        ...(hoursThreshold && { hoursThreshold })
      }
    })
}

// Health check
export const healthApi = {
  check: () => fetch(`${API_BASE_URL.replace('/api', '')}/health`).then(res => res.json())
}

// Utility functions for common operations
export const setCurrentUserId = (userId: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentUserId', userId)
  }
}

export const getCurrentUserIdValue = getCurrentUserId
