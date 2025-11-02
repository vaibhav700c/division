import { Router } from 'express';
import { computeWorkloadScores, getWorkloadStats, getOverloadedMembers } from '../utils/workload';

const router = Router();

/**
 * GET /api/workload/:teamId
 * Get workload scores for all team members
 */
router.get('/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    const workloadScores = await computeWorkloadScores(teamId);
    
    res.json({
      success: true,
      data: workloadScores,
      meta: {
        totalMembers: workloadScores.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching workload scores:', error);
    res.status(500).json({ 
      error: 'Failed to fetch workload scores',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/workload/:teamId/stats
 * Get workload statistics for a team
 */
router.get('/:teamId/stats', async (req, res) => {
  try {
    const { teamId } = req.params;
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    const stats = await getWorkloadStats(teamId);
    
    res.json({
      success: true,
      data: stats,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching workload stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch workload statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/workload/:teamId/overloaded
 * Get overloaded team members
 */
router.get('/:teamId/overloaded', async (req, res) => {
  try {
    const { teamId } = req.params;
    const scoreThreshold = parseInt(req.query.scoreThreshold as string) || 50;
    const hoursThreshold = parseInt(req.query.hoursThreshold as string) || 40;
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    const overloadedMembers = await getOverloadedMembers(teamId, scoreThreshold, hoursThreshold);
    
    res.json({
      success: true,
      data: overloadedMembers,
      meta: {
        scoreThreshold,
        hoursThreshold,
        overloadedCount: overloadedMembers.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching overloaded members:', error);
    res.status(500).json({ 
      error: 'Failed to fetch overloaded members',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;