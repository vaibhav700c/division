import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Workload score calculation result for a team member
 */
export interface WorkloadScore {
  /** User ID */
  userId: string;
  /** User name for reference */
  userName: string;
  /** Sum of estimated hours for non-completed assigned tasks */
  openEstimatedHours: number;
  /** Count of overdue tasks (scheduledAt < now and status != COMPLETED) */
  overdueCount: number;
  /** Composite workload score (0-100, higher = more workload) */
  score: number;
}

/**
 * Computes workload scores for all team members based on their assigned tasks.
 * 
 * The workload score is calculated as follows:
 * - Base score: Sum of estimated hours for non-completed tasks
 * - Penalty: Overdue tasks count * 2 (each overdue task adds 2 points)
 * - Final score: Normalized to 0-100 scale using min(100, Math.round((base + penalty) * 5))
 * 
 * @param teamId - The ID of the team to analyze
 * @returns Promise resolving to array of workload scores sorted by score (descending)
 * 
 * @example
 * ```typescript
 * const workloadScores = await computeWorkloadScores('team-123');
 * console.log(workloadScores[0]); // Highest workload team member
 * ```
 */
export async function computeWorkloadScores(
  teamId: string
): Promise<WorkloadScore[]> {
  try {
    // Get all team members with their assigned tasks
    const teamMembers = await prisma.user.findMany({
      where: {
        teamId: teamId,
      },
      include: {
        assignedTasks: {
          where: {
            status: {
              in: ['PENDING_APPROVAL', 'IN_PROGRESS', 'DRAFT']
            }
          },
          select: {
            id: true,
            estimatedHours: true,
            scheduledAt: true,
            status: true,
          }
        }
      }
    });

    const now = new Date();
    const workloadScores: WorkloadScore[] = [];

    for (const member of teamMembers) {
      // Calculate open estimated hours (sum of non-completed tasks)
      const openEstimatedHours = member.assignedTasks
        .filter((task: any) => task.status !== 'COMPLETED')
        .reduce((sum: number, task: any) => sum + (task.estimatedHours || 0), 0);

      // Calculate overdue count
      const overdueCount = member.assignedTasks
        .filter((task: any) => 
          task.scheduledAt && 
          task.scheduledAt < now && 
          task.status !== 'COMPLETED'
        ).length;

      // Calculate composite score
      const base = openEstimatedHours;
      const penalty = overdueCount * 2;
      const score = Math.min(100, Math.round((base + penalty) * 5));

      workloadScores.push({
        userId: member.id,
        userName: member.name,
        openEstimatedHours,
        overdueCount,
        score
      });
    }

    // Sort by score descending (highest workload first)
    return workloadScores.sort((a, b) => b.score - a.score);

  } catch (error) {
    throw new Error(`Failed to compute workload scores for team ${teamId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets workload distribution statistics for a team
 * 
 * @param teamId - The ID of the team to analyze
 * @returns Promise resolving to workload statistics
 */
export async function getWorkloadStats(teamId: string) {
  const scores = await computeWorkloadScores(teamId);
  
  if (scores.length === 0) {
    return {
      totalMembers: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      totalEstimatedHours: 0,
      totalOverdueTasks: 0
    };
  }

  const totalEstimatedHours = scores.reduce((sum, s) => sum + s.openEstimatedHours, 0);
  const totalOverdueTasks = scores.reduce((sum, s) => sum + s.overdueCount, 0);
  const averageScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;

  return {
    totalMembers: scores.length,
    averageScore: Math.round(averageScore * 100) / 100,
    highestScore: scores[0]?.score || 0,
    lowestScore: scores[scores.length - 1]?.score || 0,
    totalEstimatedHours,
    totalOverdueTasks
  };
}

/**
 * Identifies team members who are overloaded based on configurable thresholds
 * 
 * @param teamId - The ID of the team to analyze
 * @param scoreThreshold - Score threshold above which a member is considered overloaded (default: 50)
 * @param hoursThreshold - Hours threshold above which a member is considered overloaded (default: 40)
 * @returns Promise resolving to array of overloaded team members
 */
export async function getOverloadedMembers(
  teamId: string, 
  scoreThreshold: number = 50,
  hoursThreshold: number = 40
): Promise<WorkloadScore[]> {
  const scores = await computeWorkloadScores(teamId);
  
  return scores.filter(member => 
    member.score >= scoreThreshold || 
    member.openEstimatedHours >= hoursThreshold
  );
}