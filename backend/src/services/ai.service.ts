// ============================================================
// Acuity Invest — AI Service (Google Gemini Integration)
// THE CORE SERVICE
// ============================================================

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { SubscriptionTier, InsightResponse, EnrichedPortfolio } from '../types';
import { buildSystemPrompt, buildUserMessage } from '../prompts/insights.prompt';
import { enrichPortfolio } from './portfolio.service';
import { getMarketMovers, ExchangeKey } from './market.service';
import { createInsightLog, updateInsightLogResponse } from '../models/insight.model';
import { AppError } from '../middleware/errorHandler.middleware';
import { getLangfuse, evaluateWithJudge } from './langfuse.service';

// Initialize the Gemini client
let geminiModel: GenerativeModel | null = null;

function getGeminiModel(systemPrompt: string): GenerativeModel {
  if (!config.geminiApiKey) {
    throw new AppError(
      'Gemini API key is not configured. Set GEMINI_API_KEY in your .env file.',
      503
    );
  }
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  return genAI.getGenerativeModel({
    model: config.geminiModel,
    systemInstruction: systemPrompt,
    generationConfig: {
      maxOutputTokens: config.maxTokens,
      temperature: 0.7,
    },
  });
}

/**
 * Parse the AI response to extract the scratchpad and visible insights.
 * The scratchpad is wrapped in <scratchpad>...</scratchpad> tags.
 */
function parseAIResponse(rawResponse: string): { scratchpad: string; insights: string } {
  const scratchpadRegex = /<scratchpad>([\s\S]*?)<\/scratchpad>/i;
  const match = rawResponse.match(scratchpadRegex);

  let scratchpad = '';
  let insights = rawResponse;

  if (match) {
    scratchpad = match[1].trim();
    // Remove the scratchpad from the visible response
    insights = rawResponse.replace(scratchpadRegex, '').trim();
  }

  return { scratchpad, insights };
}

/**
 * Generate AI-powered portfolio insights.
 *
 * This is the main function that:
 * 1. Enriches the portfolio with live market data
 * 2. Constructs the system and user prompts
 * 3. Calls the Gemini API
 * 4. Parses and returns the response
 * 5. Logs the query for audit
 */
export async function generateInsights(
  userId: string,
  portfolioId: string,
  query: string,
  tier: SubscriptionTier
): Promise<InsightResponse> {
  const insightId = uuidv4();

  try {
    // Step 1: Start Langfuse trace (early, so spans can attach to it)
    const langfuse = getLangfuse();
    const trace = langfuse?.trace({
      id: insightId,
      name: 'generate-insights',
      userId,
      input: { query, tier, portfolioId },
    });

    // Step 2: Enrich portfolio with live market data + fetch market movers
    const enrichSpan = trace?.span({ name: 'data-enrichment', input: { portfolioId, userId } });
    console.log(`[AI] Enriching portfolio ${portfolioId} and fetching market movers (all exchanges)...`);
    const allExchanges: ExchangeKey[] = ['US', 'BRUSSELS', 'AMSTERDAM', 'BERLIN'];
    const [enrichedPortfolio, ...moverResults] = await Promise.all([
      enrichPortfolio(portfolioId, userId),
      ...allExchanges.map(ex =>
        getMarketMovers(ex).catch((err) => {
          console.warn(`[AI] Failed to fetch ${ex} market movers (non-fatal):`, err.message);
          return null;
        })
      ),
    ]);
    const marketMovers = moverResults.filter(Boolean) as import('./market.service').MarketMovers[];
    enrichSpan?.end({
      output: {
        holdingsCount: enrichedPortfolio.holdings.length,
        totalValue: enrichedPortfolio.total_value,
        marketMoversCount: marketMovers.length,
        exchanges: allExchanges,
      },
    });

    if (enrichedPortfolio.holdings.length === 0) {
      throw new AppError(
        'Portfolio has no holdings. Add holdings before requesting insights.',
        400
      );
    }

    // Step 3: Build the prompts
    const promptSpan = trace?.span({ name: 'prompt-building', input: { tier } });
    const systemPrompt = buildSystemPrompt(tier);
    const userMessage = buildUserMessage(enrichedPortfolio, query, tier, marketMovers.length > 0 ? marketMovers : null);
    promptSpan?.end({
      output: {
        systemPromptLength: systemPrompt.length,
        userMessageLength: userMessage.length,
      },
    });

    console.log(`[AI] Calling Gemini API (model: ${config.geminiModel})...`);

    // Step 4: Create the audit log entry (before API call)
    createInsightLog(insightId, userId, portfolioId, query, null, tier);

    // Update trace metadata now that we have enrichment data
    trace?.update({
      metadata: {
        holdingsCount: enrichedPortfolio.holdings.length,
        totalValue: enrichedPortfolio.total_value,
        marketMoversExchanges: allExchanges,
      },
    });

    const generation = trace?.generation({
      name: 'gemini-insight-generation',
      model: config.geminiModel,
      input: { systemPrompt: systemPrompt.substring(0, 200) + '...', userMessage: userMessage.substring(0, 500) + '...' },
      metadata: {
        maxTokens: config.maxTokens,
        temperature: 0.7,
      },
    });

    // Step 5: Call Gemini API
    const model = getGeminiModel(systemPrompt);
    const result = await model.generateContent(userMessage);
    const response = result.response;

    // Step 6: Extract text from response
    const rawText = response.text();

    if (!rawText) {
      generation?.end({ output: 'EMPTY_RESPONSE', level: 'ERROR' });
      throw new AppError('AI returned an empty response', 502);
    }

    // Step 7: Parse the response (extract scratchpad vs. visible insights)
    const parseSpan = trace?.span({ name: 'response-parsing', input: { rawTextLength: rawText.length } });
    const { scratchpad, insights } = parseAIResponse(rawText);
    parseSpan?.end({
      output: {
        scratchpadLength: scratchpad.length,
        insightsLength: insights.length,
      },
    });

    // Extract token usage from Gemini response
    const usageMetadata = response.usageMetadata;

    // End the Langfuse generation with output and token usage
    generation?.end({
      output: insights.substring(0, 1000),
      usage: {
        input: usageMetadata?.promptTokenCount ?? 0,
        output: usageMetadata?.candidatesTokenCount ?? 0,
        total: usageMetadata?.totalTokenCount ?? 0,
        unit: 'TOKENS',
      },
      metadata: {
        scratchpadLength: scratchpad.length,
        insightsLength: insights.length,
      },
    });

    // Step 8: Update the audit log with the response
    updateInsightLogResponse(insightId, insights);

    // Update trace output
    trace?.update({
      output: { insightsLength: insights.length, scratchpadLength: scratchpad.length },
    });

    console.log(
      `[AI] Insight generated successfully. Scratchpad: ${scratchpad.length} chars, Insights: ${insights.length} chars`
    );

    // Step 9: Run LLM-as-a-Judge evaluation (async, non-blocking)
    evaluateWithJudge({
      traceId: insightId,
      query,
      response: insights,
      tier,
      model: config.geminiModel,
    }).catch((err) => {
      console.warn('[AI] LLM-as-a-Judge evaluation failed (non-fatal):', err.message);
    });

    return {
      id: insightId,
      query,
      response: insights,
      tier,
      created_at: new Date().toISOString(),
      scratchpad: config.isDev ? scratchpad : undefined, // Only expose scratchpad in dev
      insights,
    };
  } catch (error) {
    // If the error is already an AppError, re-throw it
    if (error instanceof AppError) {
      throw error;
    }

    // Handle Gemini API errors
    const err = error as Error & { status?: number; code?: string };
    console.error(`[AI] Gemini API Error: ${err.message}`);

    // Log error to Langfuse trace
    const langfuseOnError = getLangfuse();
    langfuseOnError?.trace({
      id: insightId,
      name: 'generate-insights',
      userId,
      output: { error: err.message },
      metadata: { errorType: err.constructor.name },
      tags: ['error'],
    });

    if (err.message?.includes('API key')) {
      throw new AppError('AI service authentication failed. Check API key.', 503);
    }
    if (err.status === 429 || err.message?.includes('quota') || err.message?.includes('rate')) {
      throw new AppError('AI service rate limit exceeded. Please try again later.', 429);
    }
    if (err.message?.includes('SAFETY')) {
      throw new AppError('AI response was blocked by safety filters. Please rephrase your query.', 400);
    }

    // Generic error
    console.error('[AI] Unexpected error:', error);
    throw new AppError('Failed to generate insights. Please try again later.', 500);
  }
}
