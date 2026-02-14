// ============================================================
// Acuity Invest — Langfuse Observability Service
// Provides tracing, scoring, and LLM-as-a-Judge evaluation
// ============================================================

import Langfuse from 'langfuse';
import { config } from '../config';

let langfuseClient: Langfuse | null = null;

/**
 * Get or initialize the singleton Langfuse client.
 * Returns null if Langfuse is not configured.
 */
export function getLangfuse(): Langfuse | null {
  if (!config.langfuseEnabled) {
    return null;
  }

  if (!langfuseClient) {
    langfuseClient = new Langfuse({
      secretKey: config.langfuseSecretKey,
      publicKey: config.langfusePublicKey,
      baseUrl: config.langfuseBaseUrl,
    });
    console.log('[Langfuse] Client initialized successfully.');
  }

  return langfuseClient;
}

/**
 * Flush all pending Langfuse events.
 * Call this on graceful shutdown.
 */
export async function flushLangfuse(): Promise<void> {
  if (langfuseClient) {
    await langfuseClient.flushAsync();
    console.log('[Langfuse] Flushed all pending events.');
  }
}

/**
 * Shutdown the Langfuse client (flush + close).
 */
export async function shutdownLangfuse(): Promise<void> {
  if (langfuseClient) {
    await langfuseClient.shutdownAsync();
    langfuseClient = null;
    console.log('[Langfuse] Client shut down.');
  }
}

// ============================================================
// LLM-as-a-Judge Evaluation
// ============================================================

const JUDGE_SYSTEM_PROMPT = `You are an expert evaluator of AI-generated financial portfolio insights. You will be given:
1. The user's original query
2. The AI-generated response (insights)
3. The subscription tier (FREE or PREMIUM)

Score the response on the following dimensions. For each dimension, provide an integer score from 1-5 and a brief justification.

## Scoring Dimensions

### 1. Accuracy (1-5)
- Are all numbers, percentages, and figures consistent with the data?
- Does the response avoid fabricating information?
- Are calculations plausible?

### 2. Relevance (1-5)
- Does the response directly address the user's query?
- Is the analysis focused on what was asked?
- Does it avoid unnecessary tangents?

### 3. Compliance (1-5)
- Does it include a disclaimer?
- Does it avoid giving direct buy/sell/hold advice?
- Does it frame insights as informational, not advisory?
- Does it follow the subscription tier rules?

### 4. Clarity (1-5)
- Is the response well-structured with proper markdown?
- Are numbers formatted for readability?
- Is the language clear and professional?

### 5. Depth (1-5)
- Does the analysis provide meaningful insights (not just restating raw data)?
- Does the depth match the subscription tier (PREMIUM should be more detailed)?
- Are there actionable observations (without being advice)?

## Response Format
You MUST respond with ONLY a valid JSON object, no markdown code fences:
{
  "accuracy": { "score": <1-5>, "reason": "<brief justification>" },
  "relevance": { "score": <1-5>, "reason": "<brief justification>" },
  "compliance": { "score": <1-5>, "reason": "<brief justification>" },
  "clarity": { "score": <1-5>, "reason": "<brief justification>" },
  "depth": { "score": <1-5>, "reason": "<brief justification>" },
  "overall": <1-5>,
  "summary": "<one sentence overall assessment>"
}`;

export interface JudgeScores {
  accuracy: { score: number; reason: string };
  relevance: { score: number; reason: string };
  compliance: { score: number; reason: string };
  clarity: { score: number; reason: string };
  depth: { score: number; reason: string };
  overall: number;
  summary: string;
}

/**
 * Run LLM-as-a-Judge evaluation on an insight response.
 * Uses a separate Gemini call to score the output, then logs scores to Langfuse.
 */
export async function evaluateWithJudge(params: {
  traceId: string;
  query: string;
  response: string;
  tier: string;
  model: string;
}): Promise<JudgeScores | null> {
  const langfuse = getLangfuse();
  if (!langfuse) return null;

  try {
    // Dynamically import Gemini to avoid circular deps
    const { GoogleGenerativeAI } = await import('@google/generative-ai');

    if (!config.geminiApiKey) {
      console.warn('[Langfuse Judge] No Gemini API key — skipping evaluation.');
      return null;
    }

    const genAI = new GoogleGenerativeAI(config.geminiApiKey);
    const judgeModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: JUDGE_SYSTEM_PROMPT,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.1, // Low temp for consistent scoring
      },
    });

    const judgePrompt = `## User Query
${params.query}

## Subscription Tier
${params.tier}

## AI Response to Evaluate
${params.response}`;

    // Create a separate Langfuse generation for the judge call
    const judgeTrace = langfuse.trace({
      id: `${params.traceId}-judge`,
      name: 'llm-as-a-judge',
      metadata: {
        parentTraceId: params.traceId,
        evaluatedModel: params.model,
      },
    });

    const judgeGeneration = judgeTrace.generation({
      name: 'judge-evaluation',
      model: 'gemini-2.0-flash',
      input: judgePrompt,
      metadata: { purpose: 'llm-as-a-judge-scoring' },
    });

    const result = await judgeModel.generateContent(judgePrompt);
    const rawJudgeText = result.response.text();

    // Extract token usage from judge response
    const judgeUsage = result.response.usageMetadata;

    judgeGeneration.end({
      output: rawJudgeText,
      usage: {
        input: judgeUsage?.promptTokenCount ?? 0,
        output: judgeUsage?.candidatesTokenCount ?? 0,
        total: judgeUsage?.totalTokenCount ?? 0,
        unit: 'TOKENS',
      },
    });

    // Parse scores
    const cleanedText = rawJudgeText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const scores: JudgeScores = JSON.parse(cleanedText);

    // Log individual dimension scores to the ORIGINAL trace
    const trace = langfuse.trace({ id: params.traceId });

    const dimensions = ['accuracy', 'relevance', 'compliance', 'clarity', 'depth'] as const;
    for (const dim of dimensions) {
      trace.score({
        name: dim,
        value: scores[dim].score,
        comment: scores[dim].reason,
      });
    }

    // Overall score
    trace.score({
      name: 'overall-quality',
      value: scores.overall,
      comment: scores.summary,
    });

    console.log(
      `[Langfuse Judge] Scores — accuracy: ${scores.accuracy.score}, relevance: ${scores.relevance.score}, ` +
        `compliance: ${scores.compliance.score}, clarity: ${scores.clarity.score}, depth: ${scores.depth.score}, ` +
        `overall: ${scores.overall}`
    );

    return scores;
  } catch (error) {
    console.error('[Langfuse Judge] Evaluation failed (non-fatal):', (error as Error).message);
    return null;
  }
}
