import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AITaskAssignmentService } from '../services/aiTaskAssignment.js';
import { computeWorkloadScores } from '../utils/workload.js';

const router = Router();
const prisma = new PrismaClient();
const aiService = new AITaskAssignmentService();

/**
 * GET /api/tasks
 * Get all tasks with filtering options
 */
router.get('/', async (req, res) => {
  try {
    const { teamId, status, assignedToId, priority } = req.query;

    const where: any = {};
    if (teamId) where.teamId = teamId as string;
    if (status) where.status = status as string;
    if (assignedToId) where.assignedToId = assignedToId as string;
    if (priority) where.priority = priority as string;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          }
        },
        team: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            comments: true,
            timeLogs: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: tasks,
      meta: {
        totalTasks: tasks.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tasks',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/tasks/:id
 * Get a specific task
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: true,
        createdBy: true,
        team: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        timeLogs: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              }
            }
          },
          orderBy: {
            startTime: 'desc'
          }
        },
        approvalRequests: {
          include: {
            requestedBy: {
              select: {
                id: true,
                name: true,
              }
            },
            approvedBy: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      success: true,
      data: task,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ 
      error: 'Failed to fetch task',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/tasks
 * Create a new task
 */
router.post('/', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      status, 
      priority, 
      estimatedHours, 
      scheduledAt, 
      assignedToId, 
      createdById, 
      teamId 
    } = req.body;

    if (!title || !description || !createdById) {
      return res.status(400).json({ 
        error: 'Title, description, and createdById are required' 
      });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'DRAFT',
        priority: priority || 'MEDIUM',
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        assignedToId,
        createdById,
        teamId,
      },
      include: {
        assignedTo: true,
        createdBy: true,
        team: true,
      }
    });

    res.status(201).json({
      success: true,
      data: task,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ 
      error: 'Failed to create task',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/tasks/:id
 * Update a task
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      status, 
      priority, 
      estimatedHours, 
      scheduledAt, 
      assignedToId 
    } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (estimatedHours !== undefined) updateData.estimatedHours = parseFloat(estimatedHours);
    if (scheduledAt !== undefined) updateData.scheduledAt = new Date(scheduledAt);
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: true,
        createdBy: true,
        team: true,
      }
    });

    res.json({
      success: true,
      data: task,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating task:', error);
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(500).json({ 
      error: 'Failed to update task',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/tasks/:id/auto-assign
 * Automatically assign a task using different modes (AI, balanced, min-load)
 */
router.post('/:id/auto-assign', async (req, res) => {
  const taskId = req.params.id;
  const { mode, overrideApproval = false } = req.body;

  console.log(`🎯 Auto-assign request for task ${taskId} with mode: ${mode}, overrideApproval: ${overrideApproval}`);

  try {
    // Validate request
    if (!['ai', 'balanced', 'min-load'].includes(mode)) {
      return res.status(400).json({
        error: 'Invalid assignment mode',
        message: 'Mode must be one of: ai, balanced, min-load'
      });
    }

    // Use Prisma transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx: any) => {
      // Load task with team information
      const task = await tx.task.findUnique({
        where: { id: taskId },
        include: {
          team: {
            include: {
              members: {
                include: {
                  assignedTasks: {
                    where: {
                      status: {
                        in: ['PENDING_APPROVAL', 'IN_PROGRESS', 'DRAFT']
                      }
                    },
                    select: {
                      estimatedHours: true,
                      scheduledAt: true,
                      status: true,
                      title: true
                    }
                  }
                }
              }
            }
            },
            assignedTo: true
          }
        });      if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
      }

      if (!task.team) {
        throw new Error(`Task ${taskId} is not associated with a team`);
      }

      if (task.team.members.length === 0) {
        throw new Error(`Team ${task.team.name} has no members available for assignment`);
      }

      console.log(`📋 Task found: "${task.title}" in team "${task.team.name}" with ${task.team.members.length} members`);

      // Determine the best assignee based on mode
      let chosenUserId: string;
      let assignmentReason: string;

      switch (mode) {
        case 'ai': {
          console.log('🤖 Using AI assignment mode');
          try {
            const aiSuggestion = await aiService.generateSuggestion({
              title: task.title,
              description: task.description || undefined,
              teamId: task.team.id,
              requestedById: undefined
            });

            if (aiSuggestion.recommendations.length === 0) {
              throw new Error('AI service returned no recommendations');
            }

            const topRecommendation = aiSuggestion.recommendations[0];
            chosenUserId = topRecommendation.userId;
            assignmentReason = `AI Recommendation (Score: ${topRecommendation.score}): ${topRecommendation.reason}`;
            
            console.log(`🎯 AI selected user ${chosenUserId} with score ${topRecommendation.score}`);
          } catch (aiError: any) {
            console.warn(`⚠️  AI assignment failed: ${aiError.message}, falling back to balanced mode`);
            // Fallback to balanced mode if AI fails
            const workloadScores = await computeWorkloadScores(task.team.id);
            const minLoadMember = workloadScores.reduce((min: any, current: any) => 
              current.score < min.score ? current : min
            );
            chosenUserId = minLoadMember.userId;
            assignmentReason = `AI Fallback to Balanced: User has lowest workload score (${minLoadMember.score.toFixed(1)}) - ${minLoadMember.openEstimatedHours}h current load`;
          }
          break;
        }

        case 'balanced': {
          console.log('⚖️  Using balanced assignment mode');
          const workloadScores = await computeWorkloadScores(task.team.id);
          const minLoadMember = workloadScores.reduce((min: any, current: any) => 
            current.score < min.score ? current : min
          );
          chosenUserId = minLoadMember.userId;
          assignmentReason = `Balanced Assignment: User has lowest workload score (${minLoadMember.score.toFixed(1)}) representing ${minLoadMember.openEstimatedHours}h current workload`;
          
          console.log(`⚖️  Selected user ${chosenUserId} with workload score ${minLoadMember.score.toFixed(1)}`);
          break;
        }

        case 'min-load': {
          console.log('📊 Using minimum load assignment mode');
          const membersWithLoad = task.team.members.map((member: any) => {
            const totalHours = member.assignedTasks.reduce((sum: number, task: any) => 
              sum + (task.estimatedHours || 0), 0
            );
            return {
              userId: member.id,
              name: member.name,
              totalHours,
              taskCount: member.assignedTasks.length
            };
          });

          const minLoadMember = membersWithLoad.reduce((min: any, current: any) => 
            current.totalHours < min.totalHours ? current : min
          );

          chosenUserId = minLoadMember.userId;
          assignmentReason = `Minimum Load Assignment: User has lowest estimated hours (${minLoadMember.totalHours}h across ${minLoadMember.taskCount} tasks)`;
          
          console.log(`📊 Selected user ${chosenUserId} with ${minLoadMember.totalHours}h total load`);
          break;
        }

        default:
          throw new Error(`Unsupported assignment mode: ${mode}`);
      }

      // Verify the chosen user exists in the team
      const chosenUser = task.team.members.find((member: any) => member.id === chosenUserId);
      if (!chosenUser) {
        throw new Error(`Selected user ${chosenUserId} not found in team ${task.team.name}`);
      }

      console.log(`✅ Assignment target: ${chosenUser.name} (${chosenUser.email})`);

      // Update task assignment
      let approvalRequest = null;
      let updatedTaskStatus = task.status;

      if (overrideApproval) {
        // Direct assignment without approval
        updatedTaskStatus = 'IN_PROGRESS';
        console.log('🚀 Direct assignment - bypassing approval process');
      } else {
        // Create approval request
        approvalRequest = await tx.approvalRequest.create({
          data: {
            status: 'PENDING',
            reason: `Auto-assignment request for task "${task.title}" to ${chosenUser.name} (${assignmentReason})`,
            taskId: task.id,
            requestedById: chosenUserId
          }
        });
        
        console.log(`📋 Created approval request ${approvalRequest.id} for assignment`);
      }

      // Update the task
      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: {
          assignedToId: chosenUserId,
          status: updatedTaskStatus,
          updatedAt: new Date()
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          team: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      console.log(`✅ Task ${taskId} successfully assigned to ${chosenUser.name}`);

      return {
        task: updatedTask,
        assignedUser: chosenUser,
        approvalRequest,
        assignmentReason
      };
    }, {
      timeout: 15000 // 15 second timeout for the transaction
    });

    // Return success response
    res.status(200).json({
      success: true,
      data: result,
      meta: {
        mode,
        bypassedApproval: overrideApproval,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error(`❌ Auto-assign error for task ${taskId}:`, error.message);
    console.error('Error details:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Resource not found',
        message: error.message
      });
    }

    if (error.message.includes('no members') || error.message.includes('not associated')) {
      return res.status(400).json({
        error: 'Invalid task state',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Auto-assignment failed',
      message: 'An error occurred while processing the auto-assignment request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/tasks/:id/assign
 * Manually assign a task to a specific user with optional approval workflow
 */
router.post('/:id/assign', async (req, res) => {
  const taskId = req.params.id;
  const { assignedTo, message, requestApproval = false } = req.body;
  
  // Get actor from header (in real app, this would come from auth middleware)
  const actorId = req.headers['x-dev-user'] as string;

  console.log(`👤 Manual assign request for task ${taskId}: assignedTo=${assignedTo}, requestApproval=${requestApproval}, actor=${actorId}`);

  try {
    // Validate required fields
    if (!assignedTo) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'assignedTo field is required'
      });
    }

    if (!actorId) {
      return res.status(400).json({
        error: 'Missing authentication',
        message: 'X-DEV-USER header is required'
      });
    }

    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx: any) => {
      // Load task with current assignment and team info
      const task = await tx.task.findUnique({
        where: { id: taskId },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          team: {
            include: {
              members: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true
                }
              }
            }
          }
        }
      });

      if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
      }

      // Load actor information
      const actor = await tx.user.findUnique({
        where: { id: actorId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          teamId: true
        }
      });

      if (!actor) {
        throw new Error(`Actor with ID ${actorId} not found`);
      }

      // Validate assignee exists and is in the same team
      const assignee = task.team?.members.find((member: any) => member.id === assignedTo);
      if (!assignee) {
        throw new Error(`User ${assignedTo} is not a member of team ${task.team?.name || 'Unknown'}`);
      }

      console.log(`✅ Validation passed: Assigning task "${task.title}" to ${assignee.name} by ${actor.name}`);

      // Determine if approval is needed
      const needsApproval = requestApproval || (actor.role !== 'ADMIN' && actor.role !== 'TEAM_LEADER');
      
      let approvalRequest = null;
      let updatedTaskStatus = task.status;

      if (needsApproval) {
        // Create approval request
        approvalRequest = await tx.approvalRequest.create({
          data: {
            status: 'PENDING',
            reason: message || `Manual assignment request for task "${task.title}" to ${assignee.name} by ${actor.name}`,
            taskId: task.id,
            requestedById: actorId
          }
        });

        console.log(`📋 Created approval request ${approvalRequest.id} for manual assignment`);
      } else {
        // Direct assignment for admins/team leaders when not explicitly requesting approval
        updatedTaskStatus = task.status === 'DRAFT' ? 'IN_PROGRESS' : task.status;
        console.log(`🚀 Direct assignment by ${actor.role} - bypassing approval process`);
      }

      // Update the task assignment
      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: {
          assignedToId: assignedTo,
          status: updatedTaskStatus,
          updatedAt: new Date()
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          team: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      console.log(`✅ Task ${taskId} assigned to ${assignee.name} ${needsApproval ? '(pending approval)' : '(direct assignment)'}`);

      return {
        task: updatedTask,
        assignee,
        actor,
        approvalRequest,
        needsApproval,
        previousAssignee: task.assignedTo
      };
    }, {
      timeout: 10000 // 10 second timeout
    });

    // Return success response
    res.status(200).json({
      success: true,
      data: {
        task: result.task,
        assignee: result.assignee,
        actor: result.actor,
        approvalRequest: result.approvalRequest,
        assignmentInfo: {
          needsApproval: result.needsApproval,
          reason: message || 'Manual task assignment',
          previousAssignee: result.previousAssignee,
          assignmentType: 'MANUAL'
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestApproval: requestApproval,
        directAssignment: !result.needsApproval
      }
    });

  } catch (error: any) {
    console.error(`❌ Manual assign error for task ${taskId}:`, error.message);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Resource not found',
        message: error.message
      });
    }

    if (error.message.includes('not a member')) {
      return res.status(400).json({
        error: 'Invalid assignment',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Assignment failed',
      message: 'An error occurred while processing the assignment request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/tasks/:id/assignment-history
 * Get assignment history and current assignment details for a task
 */
router.get('/:id/assignment-history', async (req, res) => {
  const taskId = req.params.id;

  try {
    console.log(`📊 Getting assignment history for task ${taskId}`);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        team: {
          select: {
            id: true,
            name: true
          }
        },
        approvalRequests: {
          include: {
            requestedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            },
            approvedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        message: `Task with ID ${taskId} does not exist`
      });
    }

    res.json({
      success: true,
      data: {
        task: {
          id: task.id,
          title: task.title,
          status: task.status,
          currentAssignee: task.assignedTo,
          team: task.team
        },
        assignmentHistory: task.approvalRequests.map((request: any) => ({
          id: request.id,
          status: request.status,
          reason: request.reason,
          createdAt: request.createdAt,
          approvedAt: request.approvedAt,
          requestedBy: request.requestedBy,
          approvedBy: request.approvedBy
        }))
      },
      meta: {
        totalApprovalRequests: task.approvalRequests.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error(`❌ Error getting assignment history for task ${taskId}:`, error.message);
    
    res.status(500).json({
      error: 'Failed to get assignment history',
      message: 'An error occurred while retrieving assignment history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/tasks/:id/log-time
 * Log time spent on a task
 */
router.post('/:id/log-time', async (req, res) => {
  const taskId = req.params.id;
  const { 
    startTime, 
    endTime, 
    durationHours, 
    notes, 
    autoDetected = false,
    completeIfDone = false 
  } = req.body;
  
  // Get user from header (in real app, this would come from auth middleware)
  const userId = req.headers['x-dev-user'] as string;

  console.log(`⏰ Time log request for task ${taskId} by user ${userId}`);

  try {
    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        error: 'Missing authentication',
        message: 'X-DEV-USER header is required'
      });
    }

    // Validate time input and calculate actual start/end times
    let actualStartTime: Date;
    let actualEndTime: Date;
    let calculatedDuration: number;
    
    if (startTime && endTime) {
      actualStartTime = new Date(startTime);
      actualEndTime = new Date(endTime);
      
      if (isNaN(actualStartTime.getTime()) || isNaN(actualEndTime.getTime())) {
        return res.status(400).json({
          error: 'Invalid time format',
          message: 'startTime and endTime must be valid ISO 8601 dates'
        });
      }
      
      if (actualEndTime <= actualStartTime) {
        return res.status(400).json({
          error: 'Invalid time range',
          message: 'endTime must be after startTime'
        });
      }
      
      // Calculate duration in hours
      calculatedDuration = (actualEndTime.getTime() - actualStartTime.getTime()) / (1000 * 60 * 60);
      
    } else if (durationHours !== undefined) {
      if (typeof durationHours !== 'number' || durationHours <= 0) {
        return res.status(400).json({
          error: 'Invalid duration',
          message: 'durationHours must be a positive number'
        });
      }
      
      calculatedDuration = durationHours;
      
      // Create synthetic start/end times for the duration
      actualEndTime = new Date();
      actualStartTime = new Date(actualEndTime.getTime() - (durationHours * 60 * 60 * 1000));
      
    } else {
      return res.status(400).json({
        error: 'Missing time data',
        message: 'Either (startTime + endTime) or durationHours is required'
      });
    }

    // Round duration to 2 decimal places
    calculatedDuration = Math.round(calculatedDuration * 100) / 100;

    console.log(`⏰ Calculated duration: ${calculatedDuration} hours (${actualStartTime.toISOString()} to ${actualEndTime.toISOString()})`);

    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx: any) => {
      // Verify task exists and user can log time for it
      const task = await tx.task.findUnique({
        where: { id: taskId },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          team: {
            select: {
              id: true,
              name: true
            }
          },
          timeLogs: {
            select: {
              hoursSpent: true
            }
          }
        }
      });

      if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
      }

      // Verify user exists
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          teamId: true
        }
      });

      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // Validate user can log time for this task
      // Users can log time if they are:
      // 1. The assigned user
      // 2. A team leader in the same team
      // 3. An admin
      const canLogTime = 
        task.assignedToId === userId || 
        (user.role === 'TEAM_LEADER' && user.teamId === task.teamId) ||
        user.role === 'ADMIN';

      if (!canLogTime) {
        throw new Error(`User ${user.name} is not authorized to log time for this task`);
      }

      console.log(`✅ Validation passed: ${user.name} logging ${calculatedDuration}h for task "${task.title}"`);

      // Create time log entry
      const timeLog = await tx.timeLog.create({
        data: {
          taskId: taskId,
          userId: userId,
          startTime: actualStartTime,
          endTime: actualEndTime,
          hoursSpent: calculatedDuration,
          description: notes || null
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });

      // Calculate total logged hours for the task
      const currentLoggedHours = task.timeLogs.reduce((sum: number, log: any) => sum + log.hoursSpent, 0);
      const newTotalLoggedHours = currentLoggedHours + calculatedDuration;
      const roundedTotalHours = Math.round(newTotalLoggedHours * 100) / 100;

      console.log(`⏰ Total logged hours: ${roundedTotalHours}h (estimated: ${task.estimatedHours}h)`);

      // Determine if task should be completed
      let newStatus = task.status;
      if (completeIfDone && 
          task.estimatedHours && 
          roundedTotalHours >= task.estimatedHours && 
          task.status !== 'COMPLETED') {
        newStatus = 'COMPLETED';
        console.log(`✅ Task "${task.title}" marked as COMPLETED (${roundedTotalHours}h >= ${task.estimatedHours}h)`);
      }

      // Update task status if needed
      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: {
          status: newStatus,
          updatedAt: new Date()
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          team: {
            select: {
              id: true,
              name: true
            }
          },
          timeLogs: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      return {
        timeLog,
        task: updatedTask,
        user,
        previousLoggedHours: currentLoggedHours,
        totalLoggedHours: roundedTotalHours,
        statusChanged: task.status !== newStatus
      };
    }, {
      timeout: 10000 // 10 second timeout
    });

    // Return success response
    res.status(201).json({
      success: true,
      data: {
        timeLog: result.timeLog,
        task: result.task,
        loggedBy: result.user,
        summary: {
          durationLogged: calculatedDuration,
          totalLoggedHours: result.totalLoggedHours,
          estimatedHours: result.task.estimatedHours,
          remainingHours: result.task.estimatedHours ? 
            Math.max(0, result.task.estimatedHours - result.totalLoggedHours) : null,
          statusChanged: result.statusChanged,
          completionPercentage: result.task.estimatedHours ? 
            Math.min(100, Math.round((result.totalLoggedHours / result.task.estimatedHours) * 100)) : null,
          autoCompleted: result.statusChanged && result.task.status === 'COMPLETED'
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        timeCalculationMethod: startTime && endTime ? 'start-end-time' : 'duration-hours',
        autoDetected: autoDetected
      }
    });

  } catch (error: any) {
    console.error(`❌ Time log error for task ${taskId}:`, error.message);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Resource not found',
        message: error.message
      });
    }

    if (error.message.includes('not authorized') || error.message.includes('Invalid')) {
      return res.status(400).json({
        error: 'Invalid time log request',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Time logging failed',
      message: 'An error occurred while logging time',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;