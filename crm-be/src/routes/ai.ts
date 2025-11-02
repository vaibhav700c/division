import { Router, Request, Response } from 'express';
import { aiTaskAssignmentService, TaskAssignmentRequest } from '../services/aiTaskAssignment';
import { aiSuggestionsRateLimit, getRateLimitHeaders } from '../utils/rateLimiter';

const router = Router();

/**
 * POST /api/ai/suggest-assignment
 * Generate AI-powered task assignment suggestions
 */
router.post('/suggest-assignment', async (req: Request, res: Response) => {
  try {
    // Get client IP for rate limiting
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Check rate limit
    const rateLimitResult = aiSuggestionsRateLimit.check(clientIP);
    
    // Set rate limit headers
    res.set(getRateLimitHeaders(rateLimitResult.remaining, rateLimitResult.resetTime));
    
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Maximum 10 AI suggestions per minute. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      });
    }

    // Validate request body
    const { title, description, teamId, candidateUserIds } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Title is required and must be a non-empty string'
      });
    }

    if (!teamId || typeof teamId !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'TeamId is required and must be a string'
      });
    }

    if (description && typeof description !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Description must be a string if provided'
      });
    }

    if (candidateUserIds && (!Array.isArray(candidateUserIds) || !candidateUserIds.every(id => typeof id === 'string'))) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'CandidateUserIds must be an array of strings if provided'
      });
    }

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'Service configuration error',
        message: 'OpenAI API key is not configured'
      });
    }

    // Prepare request
    const request: TaskAssignmentRequest = {
      title: title.trim(),
      description: description?.trim(),
      teamId,
      candidateUserIds: candidateUserIds?.length > 0 ? candidateUserIds : undefined,
    };

    // Generate AI suggestion
    try {
      const suggestion = await aiTaskAssignmentService.generateSuggestion(request);
      
      res.json({
        success: true,
        data: suggestion,
        meta: {
          timestamp: new Date().toISOString(),
          rateLimit: {
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime
          }
        }
      });
    } catch (aiError) {
      console.error('AI Service Error:', aiError);
      
      // Handle specific AI service errors
      if (aiError instanceof Error) {
        if (aiError.message.includes('Team with ID') && aiError.message.includes('not found')) {
          return res.status(404).json({
            error: 'Team not found',
            message: `Team with ID ${teamId} was not found`
          });
        }
        
        if (aiError.message.includes('No team members found')) {
          return res.status(400).json({
            error: 'No assignable members',
            message: 'No team members available for assignment'
          });
        }
        
        if (aiError.message.includes('No response from OpenAI') || 
            aiError.message.includes('Failed to parse JSON')) {
          return res.status(502).json({
            error: 'AI service error',
            message: 'The AI service returned an invalid response. This might be a temporary issue.',
            details: process.env.NODE_ENV === 'development' ? aiError.message : undefined
          });
        }
        
        if (aiError.message.includes('Invalid')) {
          return res.status(502).json({
            error: 'AI response validation failed',
            message: 'The AI service returned data in an unexpected format.',
            details: process.env.NODE_ENV === 'development' ? aiError.message : undefined
          });
        }
      }
      
      // Generic AI service error
      return res.status(502).json({
        error: 'AI service unavailable',
        message: 'The AI suggestion service is temporarily unavailable. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? aiError : undefined
      });
    }
  } catch (error) {
    console.error('Suggest Assignment Route Error:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing your request',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * GET /api/ai/suggest-assignment/history
 * Get recent assignment suggestions for a team
 */
router.get('/suggest-assignment/history', async (req: Request, res: Response) => {
  try {
    const { teamId, limit = '10' } = req.query;

    if (!teamId || typeof teamId !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'TeamId query parameter is required'
      });
    }

    const limitNum = parseInt(limit as string, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Limit must be a number between 1 and 50'
      });
    }

    // This would require importing PrismaClient, but since we have issues with that,
    // we'll create a simple response for now
    res.json({
      success: true,
      data: [],
      meta: {
        timestamp: new Date().toISOString(),
        message: 'History feature coming soon'
      }
    });
  } catch (error) {
    console.error('Suggestion History Route Error:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while fetching suggestion history'
    });
  }
});

/**
 * POST /api/ai/generate-minutes
 * Generate AI-powered meeting minutes from transcript
 */
router.post('/generate-minutes', async (req: Request, res: Response) => {
  try {
    // Get client IP for rate limiting
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Check rate limit
    const rateLimitResult = aiSuggestionsRateLimit.check(clientIP);
    
    // Set rate limit headers
    res.set(getRateLimitHeaders(rateLimitResult.remaining, rateLimitResult.resetTime));
    
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Maximum 10 AI requests per minute. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      });
    }

    // Validate request body
    const { transcript, meetingTitle, teamId } = req.body;
    const userId = req.headers['x-dev-user'] as string;

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Transcript is required and must be a non-empty string'
      });
    }

    if (!userId) {
      return res.status(400).json({
        error: 'Missing authentication',
        message: 'X-DEV-USER header is required'
      });
    }

    if (transcript.length > 50000) {
      return res.status(400).json({
        error: 'Transcript too long',
        message: 'Transcript must be less than 50,000 characters'
      });
    }

    console.log(`📝 Generating meeting minutes for ${userId}, teamId: ${teamId}, title: "${meetingTitle}"`);

    // Initialize variables that will be used throughout
    let teamMembers: any[] = [];
    let workloadScores: any = {};
    let aiMinutes: any = null;
    let aiError: string | null = null;

    // Try to generate minutes with AI
    try {
      // Import OpenAI and Prisma here to avoid module loading issues
      const OpenAI = require('openai');
      const { PrismaClient } = require('@prisma/client');
      const { computeWorkloadScores } = require('../utils/workload');
      
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      const prisma = new PrismaClient();

      // Get team members and their workload scores for suggestions
      if (teamId) {
        try {
          teamMembers = await prisma.user.findMany({
            where: { teamId: teamId },
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          });
          
          if (teamMembers.length > 0) {
            workloadScores = await computeWorkloadScores(teamMembers.map((m: any) => m.id));
          }
        } catch (error: any) {
          console.warn('⚠️ Could not fetch team members for workload analysis:', error.message);
        }
      }

      // Create team context for AI
      const teamContext = teamMembers.length > 0 ? 
        `Available team members for task assignment: ${teamMembers.map((member: any) => 
          `${member.name} (${member.id}) - workload score: ${(workloadScores as any)[member.id] || 'unknown'}`
        ).join(', ')}` : '';

      const systemPrompt = `You are an AI assistant that generates structured meeting minutes from transcripts. 

${teamContext ? `Team context: ${teamContext}` : ''}

Analyze the transcript and produce STRICT JSON only with these exact fields:
- title: Meeting title (infer from content if not provided)
- summary: 3-6 sentence summary of key discussion points
- actionItems: Array of {description, ownerSuggestion (userId from team context or null if no suitable person), dueDate (YYYY-MM-DD format or null)}
- decisions: Array of key decisions made
- rawModelNotes: Additional notes or observations

${teamContext ? 'When suggesting owners for action items, prefer team members with lower workload scores.' : 'For ownerSuggestion, use null since no team context is available.'}

Output only valid JSON. No markdown, no explanations, no text outside the JSON block.`;

      console.log('🤖 Calling OpenAI for meeting minutes generation...');
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcript }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('Empty response from OpenAI');
      }

      try {
        aiMinutes = JSON.parse(aiResponse);
        console.log('✅ Successfully parsed AI-generated minutes');
      } catch (parseError) {
        console.error('❌ Failed to parse AI response as JSON:', parseError);
        throw new Error('Invalid JSON response from AI');
      }

      // Validate required fields
      if (!aiMinutes.title || !aiMinutes.summary || !Array.isArray(aiMinutes.actionItems)) {
        throw new Error('AI response missing required fields');
      }

      // Save meeting transcript to database
      try {
        const savedTranscript = await prisma.meetingTranscript.create({
          data: {
            title: meetingTitle || aiMinutes.title || 'Meeting Transcript',
            content: transcript,
            meetingDate: new Date(),
            createdById: userId,
            duration: null,
            location: null
          },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        });

        console.log(`💾 Saved meeting transcript ${savedTranscript.id}`);
        
        // Add transcript ID to response
        aiMinutes.transcriptId = savedTranscript.id;
        
      } catch (dbError: any) {
        console.error('❌ Failed to save meeting transcript:', dbError.message);
        // Continue even if DB save fails
      }

    } catch (error: any) {
      console.error('❌ AI Minutes Generation Error:', error.message);
      aiError = error.message;
      
      // Provide fallback response when AI fails
      const fallbackTitle = meetingTitle || 'Meeting Minutes';
      aiMinutes = {
        title: fallbackTitle,
        summary: 'AI processing unavailable. Please review the transcript manually to extract key points, action items, and decisions.',
        actionItems: [],
        decisions: [],
        rawModelNotes: `AI generation failed: ${error.message}. Transcript length: ${transcript.length} characters.`,
        fallback: true
      };
    }

    // Enhance action items with team member names if we have them
    if (aiMinutes.actionItems && Array.isArray(aiMinutes.actionItems)) {
      const teamMembersMap = teamMembers.reduce((map: any, member: any) => {
        map[member.id] = member;
        return map;
      }, {});

      aiMinutes.actionItems = aiMinutes.actionItems.map((item: any) => ({
        ...item,
        ownerName: item.ownerSuggestion && teamMembersMap[item.ownerSuggestion] 
          ? teamMembersMap[item.ownerSuggestion].name 
          : null,
        workloadScore: item.ownerSuggestion && (workloadScores as any)[item.ownerSuggestion] 
          ? (workloadScores as any)[item.ownerSuggestion] 
          : null
      }));
    }

    res.json({
      success: true,
      data: {
        minutes: aiMinutes,
        metadata: {
          transcriptLength: transcript.length,
          teamMembersAnalyzed: teamMembers.length,
          workloadScoresAvailable: Object.keys(workloadScores).length,
          aiProcessingFailed: !!aiError,
          fallbackUsed: aiMinutes.fallback || false
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        aiModel: 'gpt-4o-mini',
        processingTimeMs: Date.now() - Date.now() // Would need start time for accurate measurement
      }
    });

  } catch (error: any) {
    console.error('Meeting Minutes Route Error:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while generating meeting minutes',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;