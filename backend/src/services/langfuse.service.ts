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
2. The source data provided to the AI (portfolio holdings with live market data)
3. The AI-generated response (insights)
4. The subscription tier (FREE or PREMIUM)

Score the response on the following dimensions. For each dimension, provide an integer score from 1-5 and a brief justification.

## Scoring Dimensions

### 1. Accuracy (1-5)
- Cross-check every number, percentage, and figure in the response against the SOURCE DATA.
- Score 5 only if all figures match the source data exactly (or within normal rounding).
- Score 1-2 if numbers are fabricated or significantly differ from the source data.
- Does the response avoid making up information not in the source data?

### 2. Groundedness (1-5)
- Is every factual claim in the response traceable back to the SOURCE DATA?
- Does the response avoid introducing facts (prices, tickers, percentages) not present in the source data?
- Score 5 if all claims are fully grounded in the provided context.
- Score 1-2 if the response invents holdings, prices, or market facts.

### 3. Relevance (1-5)
- Does the response directly address the user's query?
- Is the analysis focused on what was asked?
- Does it avoid unnecessary tangents?

### 4. Compliance (1-5)
- Does it include a disclaimer?
- Does it avoid giving direct buy/sell/hold advice?
- Does it frame insights as informational, not advisory?
- Does it follow the subscription tier rules?

### 5. Clarity (1-5)
- Is the response well-structured with proper markdown?
- Are numbers formatted for readability?
- Is the language clear and professional?

### 6. Depth (1-5)
- Does the analysis provide meaningful insights (not just restating raw data)?
- Does the depth match the subscription tier (PREMIUM should be more detailed)?
- Are there actionable observations (without being advice)?

## Response Format
You MUST respond with ONLY a valid JSON object, no markdown code fences:
{
  "accuracy": { "score": <1-5>, "reason": "<brief justification>" },
  "groundedness": { "score": <1-5>, "reason": "<brief justification>" },
  "relevance": { "score": <1-5>, "reason": "<brief justification>" },
  "compliance": { "score": <1-5>, "reason": "<brief justification>" },
  "clarity": { "score": <1-5>, "reason": "<brief justification>" },
  "depth": { "score": <1-5>, "reason": "<brief justification>" },
  "overall": <1-5>,
  "summary": "<one sentence overall assessment>"
}`;

export interface JudgeScores {
  accuracy: { score: number; reason: string };
  groundedness: { score: number; reason: string };
  relevance: { score: number; reason: string };
  compliance: { score: number; reason: string };
  clarity: { score: number; reason: string };
  depth: { score: number; reason: string };
  overall: number;
  summary: string;
}

/**
 * Run LLM-as-a-Judge evaluation on an insight response.
 *
 * Prefers Claude (Anthropic) as the judge to avoid same-model bias when
 * Gemini generated the response. Falls back to Gemini if no Anthropic key.
 * Passes portfolioContext (source data) so the judge can verify numbers.
 */
export async function evaluateWithJudge(params: {
  traceId: string;
  query: string;
  response: string;
  tier: string;
  model: string;
  portfolioContext: string; // The full user message with portfolio + market data
}): Promise<JudgeScores | null> {
  const langfuse = getLangfuse();
  if (!langfuse) return null;

  const judgePrompt = `## User Query
${params.query}

## Subscription Tier
${params.tier}

## Source Data (Portfolio Holdings + Live Market Data)
${params.portfolioContext}

## AI Response to Evaluate
${params.response}`;

  // Create a separate Langfuse trace for the judge call
  const judgeTrace = langfuse.trace({
    id: `${params.traceId}-judge`,
    name: 'llm-as-a-judge',
    metadata: {
      parentTraceId: params.traceId,
      evaluatedModel: params.model,
    },
  });

  try {
    let rawJudgeText: string;
    let judgeModelName: string;
    let inputTokens = 0;
    let outputTokens = 0;

    if (config.anthropicApiKey) {
      // ── Claude judge (preferred: different model family = less same-model bias) ──
      const { Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
      judgeModelName = 'claude-haiku-4-5-20251001';

      const judgeGeneration = judgeTrace.generation({
        name: 'judge-evaluation',
        model: judgeModelName,
        input: judgePrompt,
        metadata: { purpose: 'llm-as-a-judge-scoring', judgeFamily: 'anthropic' },
      });

      const message = await anthropic.messages.create({
        model: judgeModelName,
        max_tokens: 1024,
        temperature: 0.1,
        system: JUDGE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: judgePrompt }],
      });

      rawJudgeText = message.content[0].type === 'text' ? message.content[0].text : '';
      inputTokens = message.usage.input_tokens;
      outputTokens = message.usage.output_tokens;

      judgeGeneration.end({
        output: rawJudgeText,
        usage: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens, unit: 'TOKENS' },
      });
    } else {
      // ── Gemini fallback (same model family as generator — less ideal) ──
      if (!config.geminiApiKey) {
        console.warn('[Langfuse Judge] No judge API key (Anthropic or Gemini) — skipping evaluation.');
        return null;
      }

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(config.geminiApiKey);
      judgeModelName = config.geminiModel;

      const geminiJudge = genAI.getGenerativeModel({
        model: judgeModelName,
        systemInstruction: JUDGE_SYSTEM_PROMPT,
        generationConfig: { maxOutputTokens: 1024, temperature: 0.1 },
      });

      const judgeGeneration = judgeTrace.generation({
        name: 'judge-evaluation',
        model: judgeModelName,
        input: judgePrompt,
        metadata: { purpose: 'llm-as-a-judge-scoring', judgeFamily: 'google', warning: 'same-model-bias' },
      });

      const result = await geminiJudge.generateContent(judgePrompt);
      rawJudgeText = result.response.text();
      const usage = result.response.usageMetadata;
      inputTokens = usage?.promptTokenCount ?? 0;
      outputTokens = usage?.candidatesTokenCount ?? 0;

      judgeGeneration.end({
        output: rawJudgeText,
        usage: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens, unit: 'TOKENS' },
      });
    }

    // Parse scores
    const cleanedText = rawJudgeText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const scores: JudgeScores = JSON.parse(cleanedText);

    // Log individual dimension scores to the ORIGINAL trace
    const trace = langfuse.trace({ id: params.traceId });

    const dimensions = ['accuracy', 'groundedness', 'relevance', 'compliance', 'clarity', 'depth'] as const;
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
      `[Langfuse Judge] Model: ${judgeModelName} | ` +
        `accuracy: ${scores.accuracy.score}, groundedness: ${scores.groundedness.score}, ` +
        `relevance: ${scores.relevance.score}, compliance: ${scores.compliance.score}, ` +
        `clarity: ${scores.clarity.score}, depth: ${scores.depth.score}, overall: ${scores.overall}`
    );

    return scores;
  } catch (error) {
    console.error('[Langfuse Judge] Evaluation failed (non-fatal):', (error as Error).message);
    return null;
  }
}
