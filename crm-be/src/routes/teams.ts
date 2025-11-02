import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/teams
 * Get all teams
 */
router.get('/', async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        },
        _count: {
          select: {
            members: true,
            tasks: true,
          }
        }
      }
    });

    res.json({
      success: true,
      data: teams,
      meta: {
        totalTeams: teams.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ 
      error: 'Failed to fetch teams',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/teams/:id
 * Get a specific team
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            assignedTo: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json({
      success: true,
      data: team,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ 
      error: 'Failed to fetch team',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/teams
 * Create a new team
 */
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Team name is required' });
    }

    const team = await prisma.team.create({
      data: {
        name,
        description,
      },
      include: {
        members: true,
        _count: {
          select: {
            members: true,
            tasks: true,
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: team,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ 
      error: 'Failed to create team',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;