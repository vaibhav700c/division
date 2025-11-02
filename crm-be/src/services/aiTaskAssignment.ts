import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const prisma = new PrismaClient();

export interface TaskAssignmentRequest {
  title: string;
  description?: string;
  teamId: string;
  candidateUserIds?: string[];
  requestedById?: string;
}

export interface UserRecommendation {
  userId: string;
  score: number;
  reason: string;
}

export interface TaskAssignmentSuggestion {
  recommendations: UserRecommendation[];
  suggestedPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  suggestedEstimatedHours: number;
}

export class AITaskAssignmentService {
  private async getTeamContext(teamId: string, candidateUserIds?: string[]) {
    // Get team members with their current workload
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
              }
            },
            _count: {
              select: {
                assignedTasks: {
                  where: {
                    status: {
                      in: ['PENDING_APPROVAL', 'IN_PROGRESS', 'DRAFT']
                    }
                  }
                }
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

  private buildSystemPrompt(team: any): string {
    const teamMembersInfo = team.members.map((member: any) => {
      const totalHours = member.assignedTasks.reduce((sum: number, task: any) => sum + (task.estimatedHours || 0), 0);
      const overdueCount = member.assignedTasks.filter((task: any) => 
        task.scheduledAt && task.scheduledAt < new Date() && task.status !== 'COMPLETED'
      ).length;

      return {
        userId: member.id,
        name: member.name,
        role: member.role,
        currentWorkload: {
          totalHours,
          activeTasks: member._count.assignedTasks,
          overdueCount,
          recentTasks: member.assignedTasks.slice(0, 3).map((task: any) => ({
            title: task.title,
            priority: task.priority,
            status: task.status
          }))
        }
      };
    });

    return `You are an AI task assignment assistant for a project management system. Your job is to analyze team members and suggest the best assignment for a new task.

TEAM: ${team.name}
TEAM MEMBERS DATA:
${JSON.stringify(teamMembersInfo, null, 2)}

INSTRUCTIONS:
1. Analyze the task requirements and team member capabilities
2. Consider current workload, skills, and availability
3. Provide recommendations with scores (0-100, higher = better fit)
4. Suggest realistic priority and time estimates
5. Give clear reasons for each recommendation

SCORING CRITERIA:
- Skills/Experience match (40 points)
- Current workload (30 points) - lower workload = higher score
- Role suitability (20 points)
- Availability (10 points) - fewer overdue tasks = higher score

PRIORITY GUIDELINES:
- LOW: Nice-to-have features, documentation, cleanup
- MEDIUM: Regular features, bug fixes, standard improvements  
- HIGH: Critical features, urgent fixes, deadline-driven work

ESTIMATED HOURS GUIDELINES:
- Consider task complexity from title/description
- Factor in typical development time for similar tasks
- Range: 1-40 hours (be realistic)

RESPONSE FORMAT:
You must respond with ONLY valid JSON in this exact format:
{
  "recommendations": [
    {
      "userId": "exact_user_id_from_team_data",
      "score": 85,
      "reason": "Strong backend experience, currently has light workload (12h), no overdue tasks. Perfect fit for this type of work."
    }
  ],
  "suggestedPriority": "MEDIUM",
  "suggestedEstimatedHours": 8
}

CRITICAL: 
- Use EXACT userIds from the team data provided (copy them exactly)
- Include ALL team members in recommendations (even with low scores)  
- Each userId must match exactly: ${teamMembersInfo.map((m: any) => m.userId).join(', ')}
- Scores must be numbers between 0-100
- Priority must be exactly "LOW", "MEDIUM", "HIGH", or "URGENT"
- Hours must be a number between 1-40
- Do not include any text outside the JSON response`;
  }

  private extractJsonFromResponse(response: string): any {
    // Try to parse the full response first
    try {
      return JSON.parse(response.trim());
    } catch (error) {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (innerError) {
          // Try to find JSON between ```json and ```
          const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (codeBlockMatch) {
            try {
              return JSON.parse(codeBlockMatch[1]);
            } catch (codeError) {
              throw new Error('Failed to parse JSON from OpenAI response');
            }
          }
        }
      }
      throw new Error('No valid JSON found in OpenAI response');
    }
  }

  private validateSuggestion(suggestion: any, teamMembers: any[]): TaskAssignmentSuggestion {
    console.log('🔍 Validating AI suggestion...');
    console.log('Raw AI response:', JSON.stringify(suggestion, null, 2));
    
    if (!suggestion.recommendations || !Array.isArray(suggestion.recommendations)) {
      throw new Error('Invalid recommendations format');
    }

    if (!['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(suggestion.suggestedPriority)) {
      throw new Error(`Invalid priority value: ${suggestion.suggestedPriority}`);
    }

    if (typeof suggestion.suggestedEstimatedHours !== 'number' || 
        suggestion.suggestedEstimatedHours < 1 || 
        suggestion.suggestedEstimatedHours > 40) {
      throw new Error('Invalid estimated hours');
    }

    const validUserIds = new Set(teamMembers.map(member => member.id));
    console.log('✅ Valid user IDs for team:', Array.from(validUserIds));
    
    const validatedRecommendations = suggestion.recommendations
      .filter((rec: any) => {
        console.log(`🔍 Checking userId: "${rec.userId}"`);
        const isValid = validUserIds.has(rec.userId);
        if (!isValid) {
          console.warn(`⚠️ Filtering out invalid userId: ${rec.userId}`);
          console.warn('Available userIds:', Array.from(validUserIds));
        }
        return isValid;
      })
      .map((rec: any) => {
      
      if (typeof rec.score !== 'number' || rec.score < 0 || rec.score > 100) {
        throw new Error(`Invalid score for user ${rec.userId}: ${rec.score}`);
      }

      if (!rec.reason || typeof rec.reason !== 'string') {
        throw new Error(`Invalid reason for user ${rec.userId}`);
      }

      return {
        userId: rec.userId,
        score: Math.round(rec.score),
        reason: rec.reason.trim()
      };
      });

    // Ensure we have at least one valid recommendation
    if (validatedRecommendations.length === 0) {
      console.warn('⚠️ No valid recommendations from AI, generating fallback...');
      // Generate a simple fallback recommendation
      const fallbackRecs = teamMembers.slice(0, 3).map((member: any, index: number) => ({
        userId: member.id,
        score: 80 - (index * 10),
        reason: `Team member available for assignment. Role: ${member.role}.`
      }));
      
      return {
        recommendations: fallbackRecs,
        suggestedPriority: suggestion.suggestedPriority || 'MEDIUM',
        suggestedEstimatedHours: Math.round(suggestion.suggestedEstimatedHours) || 8
      };
    }

    console.log(`✅ Validated ${validatedRecommendations.length} recommendations`);

    return {
      recommendations: validatedRecommendations.sort((a: any, b: any) => b.score - a.score),
      suggestedPriority: suggestion.suggestedPriority,
      suggestedEstimatedHours: Math.round(suggestion.suggestedEstimatedHours * 10) / 10
    };
  }  public async generateSuggestion(request: TaskAssignmentRequest): Promise<TaskAssignmentSuggestion> {
    try {
      // Get team context
      const team = await this.getTeamContext(request.teamId, request.candidateUserIds);
      
      if (team.members.length === 0) {
        throw new Error('No team members found for assignment');
      }

      // Build prompt
      const systemPrompt = this.buildSystemPrompt(team);
      const userPrompt = `TASK TO ASSIGN:
Title: ${request.title}
Description: ${request.description || 'No description provided'}

Please analyze this task and provide assignment recommendations for the team members.`;

      // Call OpenAI API
      console.log('🤖 Calling OpenAI API...');
      console.log('API Key present:', !!process.env.OPENAI_API_KEY);
      console.log('Team members count:', team.members.length);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const responseContent = completion.choices[0]?.message?.content || '';
      if (!responseContent) {
        throw new Error('No response content from OpenAI');
      }

      console.log('✅ OpenAI response received');
      console.log('Response length:', responseContent.length);

      // Extract and validate JSON
      const suggestion = this.extractJsonFromResponse(responseContent);
      const validatedSuggestion = this.validateSuggestion(suggestion, team.members);

      // Save to database
      await prisma.taskAssignmentSuggestion.create({
        data: {
          title: request.title,
          description: request.description,
          teamId: request.teamId,
          recommendations: JSON.stringify(validatedSuggestion.recommendations),
          suggestedPriority: validatedSuggestion.suggestedPriority,
          suggestedEstimatedHours: validatedSuggestion.suggestedEstimatedHours,
          candidateUserIds: request.candidateUserIds,
          requestedById: request.requestedById,
        }
      });

      console.log('✅ Suggestion saved to database');
      return validatedSuggestion;

    } catch (error: any) {
      console.error('❌ AI Task Assignment Error:', error.message);
      console.error('Error details:', {
        status: error.status,
        code: error.code,
        type: error.type
      });
      throw error;
    }
  }

  private getFallbackSuggestion(teamMembers: any[], task: any): TaskAssignmentSuggestion {
    // INTELLIGENT FALLBACK SYSTEM (when OpenAI is unavailable)
    
    // Skill keywords database for intelligent matching
    const skillKeywords = {
      'FRONTEND': ['react', 'vue', 'angular', 'javascript', 'typescript', 'css', 'html', 'ui', 'ux', 'component', 'interface', 'responsive'],
      'BACKEND': ['api', 'server', 'database', 'node', 'express', 'python', 'java', 'authentication', 'auth', 'endpoint', 'microservice'],
      'DATABASE': ['sql', 'mongodb', 'postgres', 'mysql', 'redis', 'database', 'schema', 'migration', 'query', 'data'],
      'DEVOPS': ['docker', 'kubernetes', 'aws', 'deploy', 'deployment', 'infrastructure', 'ci/cd', 'pipeline', 'monitoring'],
      'SECURITY': ['authentication', 'authorization', 'security', 'encryption', 'jwt', 'oauth', 'ssl', 'vulnerability'],
      'TESTING': ['test', 'testing', 'unit', 'integration', 'e2e', 'jest', 'cypress', 'automation', 'qa'],
      'MOBILE': ['mobile', 'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin', 'app'],
      'AI_ML': ['ai', 'machine learning', 'ml', 'nlp', 'recommendation', 'algorithm', 'data science', 'neural']
    };

    // Analyze task content for skills
    const taskContent = `${task.title} ${task.description || ''}`.toLowerCase();
    const requiredSkills: string[] = [];
    
    for (const [skill, keywords] of Object.entries(skillKeywords)) {
      const matches = keywords.filter(keyword => taskContent.includes(keyword));
      if (matches.length > 0) {
        requiredSkills.push(skill);
      }
    }

    // Generate intelligent recommendations
    const recommendations = teamMembers.map((member: any, index: number) => {
      // 1. Calculate workload score (40% weight)
      const currentHours = member.assignedTasks.reduce((total: number, memberTask: any) => 
        total + (memberTask.estimatedHours || 0), 0
      );
      const maxCapacity = 40;
      const utilization = currentHours / maxCapacity;
      const workloadScore = Math.max(20, Math.round((1 - utilization) * 100));
      
      // 2. Calculate skill match score (35% weight)
      let skillScore = 50; // Base score
      if (requiredSkills.length > 0) {
        const memberTaskContent = member.assignedTasks.map((t: any) => t.title.toLowerCase()).join(' ');
        let skillMatches = 0;
        
        for (const skill of requiredSkills) {
          const keywords = skillKeywords[skill as keyof typeof skillKeywords] || [];
          const hasSkill = keywords.some(keyword => memberTaskContent.includes(keyword));
          if (hasSkill) skillMatches++;
        }
        
        skillScore = (skillMatches / requiredSkills.length) * 90;
      }
      
      // Role bonus for skill score
      const roleBonus = {
        'TEAM_LEADER': 15,
        'SENIOR_DEVELOPER': 10,
        'TEAM_MEMBER': 0
      };
      skillScore += roleBonus[member.role as keyof typeof roleBonus] || 0;
      skillScore = Math.min(95, skillScore);
      
      // 3. Calculate availability score (25% weight)
      const now = new Date();
      const overdueTasks = member.assignedTasks.filter((memberTask: any) => 
        memberTask.scheduledAt && memberTask.scheduledAt < now && memberTask.status !== 'COMPLETED'
      );
      const highPriorityTasks = member.assignedTasks.filter((memberTask: any) => 
        memberTask.priority === 'HIGH' || memberTask.priority === 'URGENT'
      );
      const availabilityScore = Math.max(30, 100 - (overdueTasks.length * 20) - (highPriorityTasks.length * 10));
      
      // 4. Calculate final weighted score
      const finalScore = Math.round(
        workloadScore * 0.40 + 
        skillScore * 0.35 + 
        availabilityScore * 0.25
      );
      
      // 5. Generate intelligent reason
      let reason = '';
      if (requiredSkills.length > 0) {
        const memberTaskContent = member.assignedTasks.map((t: any) => t.title.toLowerCase()).join(' ');
        const hasRelevantExperience = requiredSkills.some(skill => {
          const keywords = skillKeywords[skill as keyof typeof skillKeywords] || [];
          return keywords.some(keyword => memberTaskContent.includes(keyword));
        });
        
        if (hasRelevantExperience) {
          reason = `Strong match: has experience with ${requiredSkills.join(', ').toLowerCase()}. `;
        } else {
          reason = `Limited experience with required skills (${requiredSkills.join(', ').toLowerCase()}). `;
        }
      } else {
        reason = 'Good general fit for this task. ';
      }
      
      // Add workload context
      if (utilization > 0.8) {
        reason += `Currently overloaded: ${currentHours}h of ${maxCapacity}h capacity used. `;
      } else if (utilization > 0.6) {
        reason += `Moderately busy: ${currentHours}h of ${maxCapacity}h capacity used. `;
      } else {
        reason += `Good availability: ${currentHours}h of ${maxCapacity}h capacity used. `;
      }
      
      // Add availability context
      if (overdueTasks.length > 0) {
        reason += `Has ${overdueTasks.length} overdue task(s) which may impact availability.`;
      } else if (highPriorityTasks.length > 0) {
        reason += `Currently handling ${highPriorityTasks.length} high-priority task(s).`;
      } else {
        reason += 'No blocking high-priority tasks.';
      }

      return {
        userId: member.id,
        score: Math.max(30, Math.min(95, finalScore)), // Ensure realistic range
        reason: reason.trim()
      };
    }).sort((a: any, b: any) => b.score - a.score);

    // Determine suggested priority based on content analysis
    const priorityKeywords = {
      'URGENT': ['urgent', 'critical', 'emergency', 'asap', 'immediate', 'hotfix', 'production', 'down', 'broken'],
      'HIGH': ['important', 'high', 'priority', 'deadline', 'release', 'milestone', 'launch', 'client', 'customer'],
      'LOW': ['nice to have', 'future', 'documentation', 'cleanup', 'minor', 'cosmetic', 'polish']
    };

    let suggestedPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM';
    for (const [priority, keywords] of Object.entries(priorityKeywords)) {
      if (keywords.some(keyword => taskContent.includes(keyword))) {
        suggestedPriority = priority as any;
        break;
      }
    }

    // Estimate hours based on complexity indicators
    const complexityKeywords = {
      'SIMPLE': ['fix', 'update', 'change', 'minor', 'simple', 'quick', 'small'],
      'COMPLEX': ['architecture', 'system', 'framework', 'migration', 'redesign', 'refactor', 'optimization', 'integration']
    };

    let estimatedHours = 8; // Default
    if (complexityKeywords.SIMPLE.some(keyword => taskContent.includes(keyword))) {
      estimatedHours = 4;
    } else if (complexityKeywords.COMPLEX.some(keyword => taskContent.includes(keyword))) {
      estimatedHours = 16;
    }

    // Adjust for skill requirements
    if (requiredSkills.includes('AI_ML') || requiredSkills.includes('SECURITY')) {
      estimatedHours = Math.round(estimatedHours * 1.5);
    }
    if (requiredSkills.length > 2) {
      estimatedHours = Math.round(estimatedHours * 1.2);
    }

    estimatedHours = Math.min(32, Math.max(2, estimatedHours));

    return {
      recommendations,
      suggestedPriority,
      suggestedEstimatedHours: estimatedHours
    };
  }
}

export const aiTaskAssignmentService = new AITaskAssignmentService();