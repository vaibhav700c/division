import { jest } from '@jest/globals';
import { computeWorkloadScores, getWorkloadStats, getOverloadedMembers, WorkloadScore } from '../src/utils/workload';

// Mock Prisma Client
const mockPrismaClient = {
  user: {
    findMany: jest.fn(),
  },
  $disconnect: jest.fn(),
};

// Mock the Prisma import
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
}));

describe('Workload Analysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await mockPrismaClient.$disconnect();
  });

  describe('computeWorkloadScores', () => {
    it('should calculate workload scores correctly for team members', async () => {
      const mockTeamData = [
        {
          id: 'user1',
          name: 'John Doe',
          teamId: 'team1',
          assignedTasks: [
            {
              id: 'task1',
              estimatedHours: 8.0,
              scheduledAt: new Date('2025-10-15T09:00:00Z'), // overdue
              status: 'IN_PROGRESS',
            },
            {
              id: 'task2',
              estimatedHours: 4.0,
              scheduledAt: new Date('2025-10-20T09:00:00Z'), // not overdue
              status: 'PENDING_APPROVAL',
            },
          ],
        },
        {
          id: 'user2',
          name: 'Jane Smith',
          teamId: 'team1',
          assignedTasks: [
            {
              id: 'task3',
              estimatedHours: 12.0,
              scheduledAt: new Date('2025-10-14T09:00:00Z'), // overdue
              status: 'IN_PROGRESS',
            },
            {
              id: 'task4',
              estimatedHours: 6.0,
              scheduledAt: new Date('2025-10-13T09:00:00Z'), // overdue
              status: 'DRAFT',
            },
          ],
        },
        {
          id: 'user3',
          name: 'Bob Johnson',
          teamId: 'team1',
          assignedTasks: [],
        },
      ];

      mockPrismaClient.user.findMany.mockResolvedValue(mockTeamData);

      const result = await computeWorkloadScores('team1');

      expect(result).toHaveLength(3);
      
      // Jane Smith should have highest score (18 hours + 2 overdue * 2 = 22 * 5 = 110, capped at 100)
      expect(result[0]).toEqual({
        userId: 'user2',
        userName: 'Jane Smith',
        openEstimatedHours: 18.0,
        overdueCount: 2,
        score: 100, // (18 + 2*2) * 5 = 110, capped at 100
      });

      // John Doe should have medium score (12 hours + 1 overdue * 2 = 14 * 5 = 70)
      expect(result[1]).toEqual({
        userId: 'user1',
        userName: 'John Doe',
        openEstimatedHours: 12.0,
        overdueCount: 1,
        score: 70,
      });

      // Bob Johnson should have lowest score (0 hours + 0 overdue = 0)
      expect(result[2]).toEqual({
        userId: 'user3',
        userName: 'Bob Johnson',
        openEstimatedHours: 0,
        overdueCount: 0,
        score: 0,
      });

      expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith({
        where: { teamId: 'team1' },
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
    });

    it('should handle team members with no assigned tasks', async () => {
      const mockTeamData = [
        {
          id: 'user1',
          name: 'John Doe',
          teamId: 'team1',
          assignedTasks: [],
        },
      ];

      mockPrismaClient.user.findMany.mockResolvedValue(mockTeamData);

      const result = await computeWorkloadScores('team1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        userId: 'user1',
        userName: 'John Doe',
        openEstimatedHours: 0,
        overdueCount: 0,
        score: 0,
      });
    });

    it('should handle null/undefined estimated hours', async () => {
      const mockTeamData = [
        {
          id: 'user1',
          name: 'John Doe',
          teamId: 'team1',
          assignedTasks: [
            {
              id: 'task1',
              estimatedHours: null,
              scheduledAt: new Date('2025-10-20T09:00:00Z'),
              status: 'IN_PROGRESS',
            },
            {
              id: 'task2',
              estimatedHours: undefined,
              scheduledAt: new Date('2025-10-20T09:00:00Z'),
              status: 'PENDING_APPROVAL',
            },
          ],
        },
      ];

      mockPrismaClient.user.findMany.mockResolvedValue(mockTeamData);

      const result = await computeWorkloadScores('team1');

      expect(result[0].openEstimatedHours).toBe(0);
      expect(result[0].score).toBe(0);
    });

    it('should exclude completed tasks from calculations', async () => {
      const mockTeamData = [
        {
          id: 'user1',
          name: 'John Doe',
          teamId: 'team1',
          assignedTasks: [
            {
              id: 'task1',
              estimatedHours: 8.0,
              scheduledAt: new Date('2025-10-15T09:00:00Z'),
              status: 'COMPLETED', // Should be excluded
            },
            {
              id: 'task2',
              estimatedHours: 4.0,
              scheduledAt: new Date('2025-10-15T09:00:00Z'),
              status: 'IN_PROGRESS', // Should be included
            },
          ],
        },
      ];

      mockPrismaClient.user.findMany.mockResolvedValue(mockTeamData);

      const result = await computeWorkloadScores('team1');

      expect(result[0].openEstimatedHours).toBe(4.0);
      expect(result[0].overdueCount).toBe(1);
    });

    it('should throw error when database operation fails', async () => {
      const mockError = new Error('Database connection failed');
      mockPrismaClient.user.findMany.mockRejectedValue(mockError);

      await expect(computeWorkloadScores('team1')).rejects.toThrow(
        'Failed to compute workload scores for team team1: Database connection failed'
      );
    });
  });

  describe('getWorkloadStats', () => {
    it('should return correct statistics for team workload', async () => {
      const mockTeamData = [
        {
          id: 'user1',
          name: 'John Doe',
          teamId: 'team1',
          assignedTasks: [
            {
              id: 'task1',
              estimatedHours: 10.0,
              scheduledAt: new Date('2025-10-15T09:00:00Z'),
              status: 'IN_PROGRESS',
            },
          ],
        },
        {
          id: 'user2',
          name: 'Jane Smith',
          teamId: 'team1',
          assignedTasks: [
            {
              id: 'task2',
              estimatedHours: 20.0,
              scheduledAt: new Date('2025-10-14T09:00:00Z'),
              status: 'PENDING_APPROVAL',
            },
          ],
        },
      ];

      mockPrismaClient.user.findMany.mockResolvedValue(mockTeamData);

      const result = await getWorkloadStats('team1');

      expect(result).toEqual({
        totalMembers: 2,
        averageScore: 75, // (60 + 90) / 2 = 75
        highestScore: 90, // Jane: (20 + 1*2) * 5 = 110, capped at 100
        lowestScore: 60, // John: (10 + 1*2) * 5 = 60
        totalEstimatedHours: 30,
        totalOverdueTasks: 2,
      });
    });

    it('should handle empty team', async () => {
      mockPrismaClient.user.findMany.mockResolvedValue([]);

      const result = await getWorkloadStats('team1');

      expect(result).toEqual({
        totalMembers: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        totalEstimatedHours: 0,
        totalOverdueTasks: 0,
      });
    });
  });

  describe('getOverloadedMembers', () => {
    it('should identify overloaded members based on score threshold', async () => {
      const mockTeamData = [
        {
          id: 'user1',
          name: 'John Doe',
          teamId: 'team1',
          assignedTasks: [
            {
              id: 'task1',
              estimatedHours: 15.0, // High hours
              scheduledAt: new Date('2025-10-20T09:00:00Z'),
              status: 'IN_PROGRESS',
            },
          ],
        },
        {
          id: 'user2',
          name: 'Jane Smith',
          teamId: 'team1',
          assignedTasks: [
            {
              id: 'task2',
              estimatedHours: 5.0, // Low hours
              scheduledAt: new Date('2025-10-20T09:00:00Z'),
              status: 'PENDING_APPROVAL',
            },
          ],
        },
      ];

      mockPrismaClient.user.findMany.mockResolvedValue(mockTeamData);

      const result = await getOverloadedMembers('team1', 50, 40);

      expect(result).toHaveLength(1);
      expect(result[0].userName).toBe('John Doe');
      expect(result[0].score).toBe(75); // 15 * 5 = 75
    });

    it('should identify overloaded members based on hours threshold', async () => {
      const mockTeamData = [
        {
          id: 'user1',
          name: 'John Doe',
          teamId: 'team1',
          assignedTasks: [
            {
              id: 'task1',
              estimatedHours: 45.0, // Above 40 hours threshold
              scheduledAt: new Date('2025-10-20T09:00:00Z'),
              status: 'IN_PROGRESS',
            },
          ],
        },
      ];

      mockPrismaClient.user.findMany.mockResolvedValue(mockTeamData);

      const result = await getOverloadedMembers('team1', 1000, 40); // High score threshold, low hours threshold

      expect(result).toHaveLength(1);
      expect(result[0].openEstimatedHours).toBe(45.0);
    });
  });
});