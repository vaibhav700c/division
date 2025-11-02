import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/approvals
 * Get all approval requests
 */
router.get('/', async (req, res) => {
  try {
    const { status, teamId } = req.query;

    const where: any = {};
    if (status) where.status = status as string;
    if (teamId) {
      where.task = {
        teamId: teamId as string
      };
    }

    const approvals = await prisma.approvalRequest.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
          }
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: approvals,
      meta: {
        totalApprovals: approvals.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching approvals:', error);
    res.status(500).json({ 
      error: 'Failed to fetch approval requests',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/approvals/:id
 * Get a specific approval request
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const approval = await prisma.approvalRequest.findUnique({
      where: { id },
      include: {
        task: true,
        requestedBy: true,
        approvedBy: true,
      }
    });

    if (!approval) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    res.json({
      success: true,
      data: approval,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching approval:', error);
    res.status(500).json({ 
      error: 'Failed to fetch approval request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/approvals
 * Create a new approval request
 */
router.post('/', async (req, res) => {
  try {
    const { taskId, requestedById, reason } = req.body;

    if (!taskId || !requestedById) {
      return res.status(400).json({ 
        error: 'Task ID and requester ID are required' 
      });
    }

    const approval = await prisma.approvalRequest.create({
      data: {
        taskId,
        requestedById,
        reason,
        status: 'PENDING'
      },
      include: {
        task: true,
        requestedBy: true,
      }
    });

    res.status(201).json({
      success: true,
      data: approval,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating approval:', error);
    res.status(500).json({ 
      error: 'Failed to create approval request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/approvals/:id/approve
 * Approve a pending approval request
 */
router.post('/:id/approve', async (req, res) => {
  const approvalId = req.params.id;
  const { comments } = req.body;
  
  // Get approver from header (in real app, this would come from auth middleware)
  const approverId = req.headers['x-dev-user'] as string;

  console.log(`✅ Approval request for approval ${approvalId} by user ${approverId}`);

  try {
    // Validate required fields
    if (!approverId) {
      return res.status(400).json({
        error: 'Missing authentication',
        message: 'X-DEV-USER header is required'
      });
    }

    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx: any) => {
      // Load approval request with related data
      const approval = await tx.approvalRequest.findUnique({
        where: { id: approvalId },
        include: {
          task: {
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
          },
          requestedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });

      if (!approval) {
        throw new Error(`Approval request with ID ${approvalId} not found`);
      }

      // Check if approval is already resolved
      if (approval.status !== 'PENDING') {
        throw new Error(`Approval request is already ${approval.status.toLowerCase()}`);
      }

      // Load approver information
      const approver = await tx.user.findUnique({
        where: { id: approverId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          teamId: true
        }
      });

      if (!approver) {
        throw new Error(`Approver with ID ${approverId} not found`);
      }

      // Validate approver has permission (team leader or admin)
      if (approver.role !== 'TEAM_LEADER' && approver.role !== 'ADMIN') {
        throw new Error(`User ${approver.name} does not have permission to approve requests. Must be TEAM_LEADER or ADMIN.`);
      }

      // Validate approver is in the same team as the task (unless admin)
      if (approver.role !== 'ADMIN' && approver.teamId !== approval.task.teamId) {
        throw new Error(`User ${approver.name} cannot approve requests for tasks outside their team`);
      }

      console.log(`✅ Validation passed: ${approver.name} (${approver.role}) approving assignment for task "${approval.task.title}"`);

      const previousStatus = approval.status;
      const now = new Date();

      // Update approval request
      const updatedApproval = await tx.approvalRequest.update({
        where: { id: approvalId },
        data: {
          status: 'APPROVED',
          approvedById: approverId,
          approvedAt: now,
          reason: comments ? `${approval.reason} | Approved: ${comments}` : approval.reason
        },
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
        }
      });

      // Update task status to IN_PROGRESS
      const updatedTask = await tx.task.update({
        where: { id: approval.taskId },
        data: {
          status: 'IN_PROGRESS',
          updatedAt: now
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

      console.log(`✅ Approval ${approvalId} approved by ${approver.name}, task ${approval.taskId} set to IN_PROGRESS`);

      return {
        approval: updatedApproval,
        task: updatedTask,
        approver,
        previousStatus
      };
    }, {
      timeout: 10000 // 10 second timeout
    });

    // Return success response
    res.status(200).json({
      success: true,
      data: {
        approval: result.approval,
        task: result.task,
        approver: result.approver,
        actionTaken: 'APPROVED'
      },
      meta: {
        timestamp: new Date().toISOString(),
        previousStatus: result.previousStatus
      }
    });

  } catch (error: any) {
    console.error(`❌ Approval error for approval ${approvalId}:`, error.message);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Resource not found',
        message: error.message
      });
    }

    if (error.message.includes('already') || error.message.includes('permission') || error.message.includes('cannot approve')) {
      return res.status(400).json({
        error: 'Invalid approval action',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Approval failed',
      message: 'An error occurred while processing the approval request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/approvals/:id/reject
 * Reject a pending approval request
 */
router.post('/:id/reject', async (req, res) => {
  const approvalId = req.params.id;
  const { rejectionReason, comments } = req.body;
  
  // Get approver from header
  const approverId = req.headers['x-dev-user'] as string;

  console.log(`❌ Rejection request for approval ${approvalId} by user ${approverId}`);

  try {
    // Validate required fields
    if (!approverId) {
      return res.status(400).json({
        error: 'Missing authentication',
        message: 'X-DEV-USER header is required'
      });
    }

    if (!rejectionReason && !comments) {
      return res.status(400).json({
        error: 'Missing rejection reason',
        message: 'rejectionReason or comments field is required for rejection'
      });
    }

    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx: any) => {
      // Load approval request with related data
      const approval = await tx.approvalRequest.findUnique({
        where: { id: approvalId },
        include: {
          task: {
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
          },
          requestedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });

      if (!approval) {
        throw new Error(`Approval request with ID ${approvalId} not found`);
      }

      // Check if approval is already resolved
      if (approval.status !== 'PENDING') {
        throw new Error(`Approval request is already ${approval.status.toLowerCase()}`);
      }

      // Load approver information
      const approver = await tx.user.findUnique({
        where: { id: approverId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          teamId: true
        }
      });

      if (!approver) {
        throw new Error(`Approver with ID ${approverId} not found`);
      }

      // Validate approver has permission
      if (approver.role !== 'TEAM_LEADER' && approver.role !== 'ADMIN') {
        throw new Error(`User ${approver.name} does not have permission to reject requests. Must be TEAM_LEADER or ADMIN.`);
      }

      // Validate approver is in the same team as the task (unless admin)
      if (approver.role !== 'ADMIN' && approver.teamId !== approval.task.teamId) {
        throw new Error(`User ${approver.name} cannot reject requests for tasks outside their team`);
      }

      console.log(`❌ Validation passed: ${approver.name} (${approver.role}) rejecting assignment for task "${approval.task.title}"`);

      const previousStatus = approval.status;
      const now = new Date();
      const finalReason = rejectionReason || comments || 'No reason provided';

      // Update approval request
      const updatedApproval = await tx.approvalRequest.update({
        where: { id: approvalId },
        data: {
          status: 'REJECTED',
          approvedById: approverId,
          approvedAt: now,
          reason: `${approval.reason} | Rejected: ${finalReason}`
        },
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
        }
      });

      // Update task status to REJECTED and revert assignment if needed
      const updatedTask = await tx.task.update({
        where: { id: approval.taskId },
        data: {
          status: 'REJECTED',
          updatedAt: now
          // Note: We keep the assignedToId as is, since the assignment was attempted
          // In a real system, you might want to revert to previous assignee or null
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

      console.log(`❌ Approval ${approvalId} rejected by ${approver.name}, task ${approval.taskId} set to REJECTED`);

      return {
        approval: updatedApproval,
        task: updatedTask,
        approver,
        previousStatus,
        rejectionReason: finalReason
      };
    }, {
      timeout: 10000 // 10 second timeout
    });

    // Return success response
    res.status(200).json({
      success: true,
      data: {
        approval: result.approval,
        task: result.task,
        approver: result.approver,
        actionTaken: 'REJECTED'
      },
      meta: {
        timestamp: new Date().toISOString(),
        previousStatus: result.previousStatus
      }
    });

  } catch (error: any) {
    console.error(`❌ Rejection error for approval ${approvalId}:`, error.message);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Resource not found',
        message: error.message
      });
    }

    if (error.message.includes('already') || error.message.includes('permission') || error.message.includes('cannot reject')) {
      return res.status(400).json({
        error: 'Invalid rejection action',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Rejection failed',
      message: 'An error occurred while processing the rejection request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;