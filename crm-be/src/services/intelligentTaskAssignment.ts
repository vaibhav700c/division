import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TaskAssignmentRequest {
  title: string;
  description?: string;
  teamId: string;
  candidateUserIds?: string[];
  requestedById?: string;
  priority?: string;
  estimatedHours?: number;
}

export interface UserRecommendation {
  userId: string;
  score: number;
  reason: string;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  skillMatch: number;
  workloadScore: number;
  availabilityScore: number;
}

export interface TaskAssignmentSuggestion {
  recommendations: UserRecommendation[];
  suggestedPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  suggestedEstimatedHours: number;
  analysisInsights: string[];
}

export class IntelligentTaskAssignmentService {
  
  // Skill keywords database for intelligent matching
  private skillKeywords = {
    'FRONTEND': ['react', 'vue', 'angular', 'javascript', 'typescript', 'css', 'html', 'ui', 'ux', 'component', 'interface', 'responsive'],
    'BACKEND': ['api', 'server', 'database', 'node', 'express', 'python', 'java', 'authentication', 'auth', 'endpoint', 'microservice'],
    'DATABASE': ['sql', 'mongodb', 'postgres', 'mysql', 'redis', 'database', 'schema', 'migration', 'query', 'data'],
    'DEVOPS': ['docker', 'kubernetes', 'aws', 'deploy', 'deployment', 'infrastructure', 'ci/cd', 'pipeline', 'monitoring'],
    'SECURITY': ['authentication', 'authorization', 'security', 'encryption', 'jwt', 'oauth', 'ssl', 'vulnerability'],
    'TESTING': ['test', 'testing', 'unit', 'integration', 'e2e', 'jest', 'cypress', 'automation', 'qa'],
    'MOBILE': ['mobile', 'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin', 'app'],
    'AI_ML': ['ai', 'machine learning', 'ml', 'nlp', 'recommendation', 'algorithm', 'data science', 'neural']
  };

  // Priority keywords for intelligent priority detection
  private priorityKeywords = {
    'URGENT': ['urgent', 'critical', 'emergency', 'asap', 'immediate', 'hotfix', 'production', 'down', 'broken'],
    'HIGH': ['important', 'high', 'priority', 'deadline', 'release', 'milestone', 'launch', 'client', 'customer'],
    'MEDIUM': ['feature', 'enhancement', 'improvement', 'optimize', 'refactor', 'update'],
    'LOW': ['nice to have', 'future', 'documentation', 'cleanup', 'minor', 'cosmetic', 'polish']
  };

  // Complexity estimation based on task content
  private complexityKeywords = {
    'SIMPLE': ['fix', 'update', 'change', 'minor', 'simple', 'quick', 'small'],
    'MEDIUM': ['implement', 'create', 'add', 'build', 'develop', 'integrate'],
    'COMPLEX': ['architecture', 'system', 'framework', 'migration', 'redesign', 'refactor', 'optimization'],
    'VERY_COMPLEX': ['platform', 'infrastructure', 'security overhaul', 'complete rewrite', 'microservices']
  };

  private async getTeamContext(teamId: string, candidateUserIds?: string[]) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: candidateUserIds ? { id: { in: candidateUserIds } } : {},
          include: {
            assignedTasks: {
              where: {
                status: {
                  in: ['PENDING_APPROVAL', 'IN_PROGRESS', 'DRAFT']
                }
              },
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                estimatedHours: true,
                scheduledAt: true,
                createdAt: true,
              }
            },
            createdTasks: {
              select: {
                id: true,
                title: true,
                priority: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 10
            },
            _count: {
              select: {
                assignedTasks: {
                  where: {
                    status: {
                      in: ['PENDING_APPROVAL', 'IN_PROGRESS', 'DRAFT']
                    }
                  }
                },
                createdTasks: true
              }
            }
          }
        }
      }
    });

    if (!team) {
      throw new Error(`Team with ID ${teamId} not found`);
    }

    return team;
  }

  private analyzeTaskContent(title: string, description?: string): {
    skillsRequired: string[];
    complexity: 'SIMPLE' | 'MEDIUM' | 'COMPLEX' | 'VERY_COMPLEX';
    suggestedPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    estimatedHours: number;
    insights: string[];
  } {
    const content = `${title} ${description || ''}`.toLowerCase();
    const insights: string[] = [];
    
    // Analyze required skills
    const skillsRequired: string[] = [];
    for (const [skill, keywords] of Object.entries(this.skillKeywords)) {
      const matches = keywords.filter(keyword => content.includes(keyword));
      if (matches.length > 0) {
        skillsRequired.push(skill);
        insights.push(`Requires ${skill.toLowerCase()} skills (detected: ${matches.join(', ')})`);
      }
    }

    // Analyze complexity
    let complexity: 'SIMPLE' | 'MEDIUM' | 'COMPLEX' | 'VERY_COMPLEX' = 'MEDIUM';
    let maxMatches = 0;
    for (const [level, keywords] of Object.entries(this.complexityKeywords)) {
      const matches = keywords.filter(keyword => content.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        complexity = level as any;
      }
    }

    // Analyze priority
    let suggestedPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM';
    let maxPriorityMatches = 0;
    for (const [priority, keywords] of Object.entries(this.priorityKeywords)) {
      const matches = keywords.filter(keyword => content.includes(keyword)).length;
      if (matches > maxPriorityMatches) {
        maxPriorityMatches = matches;
        suggestedPriority = priority as any;
      }
    }

    // Estimate hours based on complexity and content
    const baseHours = {
      'SIMPLE': 2,
      'MEDIUM': 8,
      'COMPLEX': 20,
      'VERY_COMPLEX': 40
    };

    let estimatedHours = baseHours[complexity];
    
    // Adjust based on skill complexity
    if (skillsRequired.includes('AI_ML') || skillsRequired.includes('SECURITY')) {
      estimatedHours *= 1.5;
      insights.push('Time adjusted upward for specialized domain');
    }
    
    if (skillsRequired.length > 2) {
      estimatedHours *= 1.2;
      insights.push('Multi-disciplinary task requires additional coordination time');
    }

    estimatedHours = Math.min(40, Math.max(1, Math.round(estimatedHours)));

    return {
      skillsRequired,
      complexity,
      suggestedPriority,
      estimatedHours,
      insights
    };
  }

  private calculateSkillMatch(taskSkills: string[], memberTasks: any[], memberRole: string): {
    score: number;
    explanation: string;
  } {
    if (taskSkills.length === 0) {
      return { score: 50, explanation: 'No specific skills detected' };
    }

    // Analyze member's historical tasks for skill evidence
    const memberTaskContent = memberTasks.map(task => task.title.toLowerCase()).join(' ');
    let skillMatches = 0;
    const matchedSkills: string[] = [];

    for (const skill of taskSkills) {
      const keywords = this.skillKeywords[skill as keyof typeof this.skillKeywords] || [];
      const hasSkill = keywords.some(keyword => memberTaskContent.includes(keyword));
      if (hasSkill) {
        skillMatches++;
        matchedSkills.push(skill.toLowerCase());
      }
    }

    // Role-based skill assumptions
    const roleSkillBonus = {
      'TEAM_LEADER': 10,
      'SENIOR_DEVELOPER': 8,
      'TEAM_MEMBER': 0
    };

    const baseScore = (skillMatches / taskSkills.length) * 80;
    const roleBonus = roleSkillBonus[memberRole as keyof typeof roleSkillBonus] || 0;
    const finalScore = Math.min(95, baseScore + roleBonus);

    const explanation = matchedSkills.length > 0 
      ? `Strong match: has experience with ${matchedSkills.join(', ')}`
      : `Limited evidence of required skills (${taskSkills.join(', ').toLowerCase()})`;

    return { score: finalScore, explanation };
  }

  private calculateWorkloadScore(member: any): {
    score: number;
    explanation: string;
  } {
    const currentHours = member.assignedTasks.reduce((total: number, task: any) => 
      total + (task.estimatedHours || 0), 0
    );
    
    const maxCapacity = 40; // Assume 40 hours per week capacity
    const utilization = currentHours / maxCapacity;
    
    // Score inversely related to utilization
    const score = Math.max(10, Math.round((1 - utilization) * 90));
    
    const explanation = utilization > 0.8 
      ? `Overloaded: ${currentHours}h of ${maxCapacity}h capacity used`
      : utilization > 0.6
      ? `Busy: ${currentHours}h of ${maxCapacity}h capacity used`
      : `Available: ${currentHours}h of ${maxCapacity}h capacity used`;

    return { score, explanation };
  }

  private calculateAvailabilityScore(member: any): {
    score: number;
    explanation: string;
  } {
    const now = new Date();
    const overdueTasks = member.assignedTasks.filter((task: any) => 
      task.scheduledAt && task.scheduledAt < now && task.status !== 'COMPLETED'
    );
    
    const highPriorityTasks = member.assignedTasks.filter((task: any) => 
      task.priority === 'HIGH' || task.priority === 'URGENT'
    );

    const score = Math.max(20, 100 - (overdueTasks.length * 25) - (highPriorityTasks.length * 10));
    
    let explanation = 'Fully available';
    if (overdueTasks.length > 0) {
      explanation = `${overdueTasks.length} overdue task(s) may impact availability`;
    } else if (highPriorityTasks.length > 0) {
      explanation = `${highPriorityTasks.length} high-priority task(s) in queue`;
    }

    return { score, explanation };
  }

  public async generateIntelligentSuggestion(request: TaskAssignmentRequest): Promise<TaskAssignmentSuggestion> {
    try {
      // Get team context
      const team = await this.getTeamContext(request.teamId, request.candidateUserIds);
      
      if (team.members.length === 0) {
        throw new Error('No team members found for assignment');
      }

      // Analyze the task
      const taskAnalysis = this.analyzeTaskContent(request.title, request.description);
      
      // Generate recommendations for each team member
      const recommendations: UserRecommendation[] = team.members.map(member => {
        const skillMatch = this.calculateSkillMatch(
          taskAnalysis.skillsRequired, 
          [...member.assignedTasks, ...member.createdTasks],
          member.role
        );
        
        const workloadScore = this.calculateWorkloadScore(member);
        const availabilityScore = this.calculateAvailabilityScore(member);
        
        // Weighted final score
        const finalScore = Math.round(
          skillMatch.score * 0.4 + 
          workloadScore.score * 0.35 + 
          availabilityScore.score * 0.25
        );

        // Determine confidence level
        let confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
        if (finalScore >= 85) confidenceLevel = 'HIGH';
        else if (finalScore < 60) confidenceLevel = 'LOW';

        // Generate intelligent reason
        const reason = `${skillMatch.explanation}. ${workloadScore.explanation}. ${availabilityScore.explanation}`;

        return {
          userId: member.id,
          score: finalScore,
          reason,
          confidenceLevel,
          skillMatch: skillMatch.score,
          workloadScore: workloadScore.score,
          availabilityScore: availabilityScore.score
        };
      }).sort((a, b) => b.score - a.score);

      // Compile insights
      const analysisInsights = [
        ...taskAnalysis.insights,
        `Analyzed ${team.members.length} team members`,
        `Task complexity: ${taskAnalysis.complexity.toLowerCase()}`,
        `Top recommendation confidence: ${recommendations[0]?.confidenceLevel || 'N/A'}`
      ];

      // Save to database
      await prisma.taskAssignmentSuggestion.create({
        data: {
          title: request.title,
          description: request.description,
          teamId: request.teamId,
          recommendations: JSON.stringify(recommendations),
          suggestedPriority: taskAnalysis.suggestedPriority,
          suggestedEstimatedHours: taskAnalysis.estimatedHours,
          candidateUserIds: request.candidateUserIds,
          requestedById: request.requestedById,
        }
      });

      return {
        recommendations,
        suggestedPriority: taskAnalysis.suggestedPriority,
        suggestedEstimatedHours: taskAnalysis.estimatedHours,
        analysisInsights
      };

    } catch (error) {
      console.error('Intelligent Task Assignment Error:', error);
      throw error;
    }
  }
}

export const intelligentTaskAssignmentService = new IntelligentTaskAssignmentService();