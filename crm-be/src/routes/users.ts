import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/users
 * Get all users with optional team filtering
 */
router.get('/', async (req, res) => {
  try {
    const { teamId } = req.query;

    const users = await prisma.user.findMany({
      where: teamId ? { teamId: teamId as string } : {},
      include: {
        team: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            assignedTasks: true,
            createdTasks: true,
          }
        }
      }
    });

    res.json({
      success: true,
      data: users,
      meta: {
        totalUsers: users.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/users/:id
 * Get a specific user
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        team: true,
        assignedTasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            estimatedHours: true,
            scheduledAt: true,
          }
        },
        createdTasks: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: user,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;