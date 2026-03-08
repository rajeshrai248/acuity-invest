// ============================================================
// Acuity Invest — Insights Controller
// ============================================================

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiResponse, InsightResponse } from '../types';
import { generateInsights } from '../services/ai.service';
import { submitHumanAnnotation } from '../services/langfuse.service';
import { sanitizeString } from '../utils/validators';

/**
 * POST /api/v1/insights
 * Generate AI-powered portfolio insights.
 * This is the CORE endpoint of the platform.
 */
export async function generateInsightsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const tier = req.user!.tier;
    const { portfolio_id, query } = req.body;

    // Sanitize the query input
    const sanitizedQuery = sanitizeString(query);

    console.log(`[INSIGHTS] User ${userId} (${tier}) querying portfolio ${portfolio_id}: "${sanitizedQuery}"`);

    // Generate AI insights
    const insight = await generateInsights(userId, portfolio_id, sanitizedQuery, tier);

    const response: ApiResponse<InsightResponse> = {
      success: true,
      data: insight,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/insights/annotate
 * Submit a human annotation for a trace.
 */
export async function annotateInsightHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { trace_id, scores, comment } = req.body;
    const annotatorId = req.user!.userId;

    await submitHumanAnnotation({
      traceId: trace_id,
      scores,
      comment,
      annotatorId,
    });

    res.status(200).json({
      success: true,
      data: { message: 'Annotation submitted successfully', traceId: trace_id },
    });
  } catch (error) {
    next(error);
  }
}
