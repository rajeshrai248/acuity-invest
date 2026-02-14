// ============================================================
// Acuity Invest — AI Service Unit Tests
// Tests for Claude API integration, prompt construction, and response parsing
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --------------- Mock Data ---------------

const mockUser = {
  id: 'user-001',
  name: 'Alice Johnson',
  email: 'alice@example.com',
  subscription_tier: 'FREE' as const,
  created_at: '2025-01-15T10:00:00Z',
};

const mockPremiumUser = {
  ...mockUser,
  id: 'user-002',
  name: 'Bob Premium',
  email: 'bob@example.com',
  subscription_tier: 'PREMIUM' as const,
};

const mockEnrichedPortfolio = {
  portfolio: {
    id: 'portfolio-001',
    user_id: 'user-001',
    name: 'Growth Portfolio',
    account_type: 'INDIVIDUAL',
    base_currency: 'USD',
    created_at: '2025-01-15T10:00:00Z',
  },
  holdings: [
    {
      id: 'holding-001',
      portfolio_id: 'portfolio-001',
      ticker: 'AAPL',
      name: 'Apple Inc.',
      shares: 50,
      avg_cost: 150.0,
      purchase_date: '2024-06-01',
      current_price: 195.0,
      market_value: 9750.0,
      total_cost: 7500.0,
      gain_loss: 2250.0,
      gain_loss_percent: 30.0,
      day_change: 1.5,
      day_change_percent: 0.77,
    },
    {
      id: 'holding-002',
      portfolio_id: 'portfolio-001',
      ticker: 'MSFT',
      name: 'Microsoft Corporation',
      shares: 30,
      avg_cost: 300.0,
      purchase_date: '2024-07-15',
      current_price: 420.0,
      market_value: 12600.0,
      total_cost: 9000.0,
      gain_loss: 3600.0,
      gain_loss_percent: 40.0,
      day_change: -0.8,
      day_change_percent: -0.19,
    },
    {
      id: 'holding-003',
      portfolio_id: 'portfolio-001',
      ticker: 'PG',
      name: 'Procter & Gamble Co.',
      shares: 25,
      avg_cost: 170.0,
      purchase_date: '2024-03-10',
      current_price: 160.0,
      market_value: 4000.0,
      total_cost: 4250.0,
      gain_loss: -250.0,
      gain_loss_percent: -5.88,
      day_change: -0.3,
      day_change_percent: -0.19,
    },
  ],
  total_value: 26350.0,
  total_cost: 20750.0,
  total_gain_loss: 5600.0,
  total_gain_loss_percent: 26.99,
  day_change: 0.4,
  day_change_percent: 0.15,
};

const mockEmptyPortfolio = {
  portfolio: {
    id: 'portfolio-002',
    user_id: 'user-001',
    name: 'Empty Portfolio',
    account_type: 'INDIVIDUAL',
    base_currency: 'USD',
    created_at: '2025-02-01T10:00:00Z',
  },
  holdings: [],
  total_value: 0,
  total_cost: 0,
  total_gain_loss: 0,
  total_gain_loss_percent: 0,
  day_change: 0,
  day_change_percent: 0,
};

const mockClaudeSuccessResponse = {
  id: 'msg_01XFDUDYJgAACzvnptvVoYEL',
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'text',
      text: `<scratchpad>
Analyzing the portfolio composition:
- Heavy tech weighting (AAPL + MSFT = ~85% of portfolio)
- One defensive holding (PG) showing slight negative returns
- Overall portfolio is up ~27% which is strong performance
</scratchpad>

<insights>
## Portfolio Performance Overview

| Metric | Value |
|--------|-------|
| Total Value | $26,350.00 |
| Total Gain/Loss | +$5,600.00 (+27.0%) |
| Day Change | +0.15% |

### Key Observations

1. **Strong Tech Performance**: Your technology holdings (AAPL, MSFT) are driving the bulk of portfolio gains.
2. **Concentration Risk**: ~85% of portfolio value is in tech stocks.
3. **PG Underperformance**: Your defensive holding in Procter & Gamble is currently at a -5.88% loss.

### Sector Allocation

Your portfolio is heavily weighted toward the technology sector. Consider the risk implications of sector concentration.
</insights>`,
    },
  ],
  model: 'claude-sonnet-4-20250514',
  stop_reason: 'end_turn',
  usage: { input_tokens: 1200, output_tokens: 450 },
};

const mockClaudePremiumResponse = {
  ...mockClaudeSuccessResponse,
  content: [
    {
      type: 'text',
      text: `<scratchpad>
Portfolio analysis for PREMIUM user. Including visual charts.
</scratchpad>

<insights>
## Portfolio Performance Overview

| Ticker | Shares | Avg Cost | Current | Gain/Loss |
|--------|--------|----------|---------|-----------|
| AAPL | 50 | $150.00 | $195.00 | +30.0% |
| MSFT | 30 | $300.00 | $420.00 | +40.0% |
| PG | 25 | $170.00 | $160.00 | -5.88% |

\`\`\`mermaid
pie title Portfolio Allocation
    "AAPL" : 37
    "MSFT" : 48
    "PG" : 15
\`\`\`

\`\`\`mermaid
graph LR
    A[Total Value: $26,350] --> B[Gain: +$5,600]
    B --> C[Return: +27.0%]
\`\`\`
</insights>`,
    },
  ],
};

// --------------- Mock Modules ---------------

const mockAnthropicCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: mockAnthropicCreate,
    },
  })),
}));

// --------------- Import the Service Under Test ---------------
// We import after mocking to ensure mocks are in place.
// In a real project, the path would reflect the actual file location.

// Since the actual service file may not exist yet, we define the expected
// interface and test the contract the service must fulfill.

// Simulated AI Service that matches expected contract
class AIService {
  private anthropic: any;

  constructor() {
    const Anthropic = require('@anthropic-ai/sdk').default;
    this.anthropic = new Anthropic();
  }

  private buildSystemPrompt(
    enrichedPortfolio: typeof mockEnrichedPortfolio,
    tier: 'FREE' | 'PREMIUM'
  ): string {
    let prompt = `You are Acuity Invest's AI portfolio analyst. You provide data-driven portfolio insights.

CRITICAL RULES:
1. NEVER provide financial advice. Do NOT recommend buying, selling, or holding any securities.
2. NEVER suggest specific investment actions or strategies.
3. You may ONLY provide factual analysis, data summaries, and educational information.
4. If the user asks for financial advice, politely decline and explain you can only provide informational analysis.

Portfolio: ${enrichedPortfolio.portfolio.name}
Account Type: ${enrichedPortfolio.portfolio.account_type}
Total Value: $${enrichedPortfolio.total_value.toFixed(2)}
Total Cost: $${enrichedPortfolio.total_cost.toFixed(2)}
Total Gain/Loss: $${enrichedPortfolio.total_gain_loss.toFixed(2)} (${enrichedPortfolio.total_gain_loss_percent.toFixed(2)}%)

Holdings:
${enrichedPortfolio.holdings
  .map(
    (h) =>
      `- ${h.ticker} (${h.name}): ${h.shares} shares @ $${h.avg_cost.toFixed(2)} avg, current $${h.current_price.toFixed(2)}, gain/loss ${h.gain_loss_percent.toFixed(2)}%`
  )
  .join('\n')}

Wrap your thinking in <scratchpad> tags. Provide the final response in <insights> tags.`;

    if (tier === 'PREMIUM') {
      prompt += `\n\nThis is a PREMIUM user. Include Mermaid.js chart code blocks where relevant for data visualization (pie charts, bar charts, flow diagrams).`;
    }

    return prompt;
  }

  async generateInsight(
    enrichedPortfolio: typeof mockEnrichedPortfolio,
    query: string,
    tier: 'FREE' | 'PREMIUM'
  ) {
    // Validate query length
    if (!query || query.trim().length === 0) {
      throw new Error('Query cannot be empty');
    }
    if (query.length > 500) {
      throw new Error('Query exceeds maximum length of 500 characters');
    }

    // Check for financial advice requests
    const advicePatterns = [
      /should\s+i\s+(buy|sell|hold|invest)/i,
      /what\s+(stocks?|securities?|funds?)\s+should\s+i/i,
      /recommend/i,
      /which\s+(stocks?|etfs?)\s+to\s+(buy|sell)/i,
    ];

    for (const pattern of advicePatterns) {
      if (pattern.test(query)) {
        return {
          scratchpad: 'Financial advice query detected. Rejecting.',
          insights:
            'I appreciate your question, but I am unable to provide financial advice, including recommendations to buy, sell, or hold specific securities. I can help you analyze your portfolio data, understand performance metrics, and provide educational information about investment concepts. Please rephrase your question to focus on data analysis or educational topics.',
          rejected: true,
        };
      }
    }

    const systemPrompt = this.buildSystemPrompt(enrichedPortfolio, tier);

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: query }],
    });

    const text = response.content[0].text;

    // Parse scratchpad
    const scratchpadMatch = text.match(/<scratchpad>([\s\S]*?)<\/scratchpad>/);
    const scratchpad = scratchpadMatch ? scratchpadMatch[1].trim() : '';

    // Parse insights
    const insightsMatch = text.match(/<insights>([\s\S]*?)<\/insights>/);
    const insights = insightsMatch ? insightsMatch[1].trim() : text;

    return { scratchpad, insights, rejected: false };
  }
}

// --------------- Tests ---------------

describe('AIService', () => {
  let aiService: AIService;

  beforeEach(() => {
    vi.clearAllMocks();
    aiService = new AIService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- System Prompt Construction ---

  describe('System Prompt Construction', () => {
    it('should construct system prompt with correct portfolio data', async () => {
      mockAnthropicCreate.mockResolvedValue(mockClaudeSuccessResponse);

      await aiService.generateInsight(
        mockEnrichedPortfolio,
        'How is my portfolio performing?',
        'FREE'
      );

      const callArgs = mockAnthropicCreate.mock.calls[0][0];
      expect(callArgs.system).toContain('Growth Portfolio');
      expect(callArgs.system).toContain('$26350.00');
      expect(callArgs.system).toContain('$20750.00');
      expect(callArgs.system).toContain('AAPL');
      expect(callArgs.system).toContain('MSFT');
      expect(callArgs.system).toContain('PG');
    });

    it('should include subscription tier context in prompt for FREE users', async () => {
      mockAnthropicCreate.mockResolvedValue(mockClaudeSuccessResponse);

      await aiService.generateInsight(
        mockEnrichedPortfolio,
        'Summarize my portfolio',
        'FREE'
      );

      const callArgs = mockAnthropicCreate.mock.calls[0][0];
      // FREE tier should NOT contain Mermaid instructions
      expect(callArgs.system).not.toContain('Mermaid');
    });

    it('should include Mermaid instructions for PREMIUM tier', async () => {
      mockAnthropicCreate.mockResolvedValue(mockClaudePremiumResponse);

      await aiService.generateInsight(
        mockEnrichedPortfolio,
        'Show me a visual breakdown',
        'PREMIUM'
      );

      const callArgs = mockAnthropicCreate.mock.calls[0][0];
      expect(callArgs.system).toContain('PREMIUM');
      expect(callArgs.system).toContain('Mermaid');
    });

    it('should include customer query as user message', async () => {
      mockAnthropicCreate.mockResolvedValue(mockClaudeSuccessResponse);

      const query = 'How is my portfolio performing?';
      await aiService.generateInsight(mockEnrichedPortfolio, query, 'FREE');

      const callArgs = mockAnthropicCreate.mock.calls[0][0];
      expect(callArgs.messages).toEqual([{ role: 'user', content: query }]);
    });

    it('should include holding details with shares, avg_cost, and current_price', async () => {
      mockAnthropicCreate.mockResolvedValue(mockClaudeSuccessResponse);

      await aiService.generateInsight(
        mockEnrichedPortfolio,
        'Analyze my holdings',
        'FREE'
      );

      const callArgs = mockAnthropicCreate.mock.calls[0][0];
      expect(callArgs.system).toContain('50 shares');
      expect(callArgs.system).toContain('$150.00');
      expect(callArgs.system).toContain('$195.00');
      expect(callArgs.system).toContain('Apple Inc.');
      expect(callArgs.system).toContain('Microsoft Corporation');
      expect(callArgs.system).toContain('Procter & Gamble Co.');
    });

    it('should include the critical no-financial-advice rule in the system prompt', async () => {
      mockAnthropicCreate.mockResolvedValue(mockClaudeSuccessResponse);

      await aiService.generateInsight(
        mockEnrichedPortfolio,
        'Tell me about my portfolio',
        'FREE'
      );

      const callArgs = mockAnthropicCreate.mock.calls[0][0];
      expect(callArgs.system).toContain('NEVER provide financial advice');
      expect(callArgs.system).toContain('NEVER recommend buying, selling, or holding');
    });
  });

  // --- Claude API Call ---

  describe('Claude API Interaction', () => {
    it('should call Claude API with correct parameters', async () => {
      mockAnthropicCreate.mockResolvedValue(mockClaudeSuccessResponse);

      await aiService.generateInsight(
        mockEnrichedPortfolio,
        'Summarize my portfolio',
        'FREE'
      );

      expect(mockAnthropicCreate).toHaveBeenCalledTimes(1);
      const callArgs = mockAnthropicCreate.mock.calls[0][0];
      expect(callArgs.model).toBe('claude-sonnet-4-20250514');
      expect(callArgs.max_tokens).toBe(4096);
      expect(callArgs.system).toBeDefined();
      expect(callArgs.messages).toHaveLength(1);
    });

    it('should handle Claude API errors gracefully', async () => {
      mockAnthropicCreate.mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      await expect(
        aiService.generateInsight(
          mockEnrichedPortfolio,
          'Summarize my portfolio',
          'FREE'
        )
      ).rejects.toThrow('API rate limit exceeded');
    });

    it('should handle Claude API timeout', async () => {
      mockAnthropicCreate.mockRejectedValue(
        new Error('Request timed out after 30000ms')
      );

      await expect(
        aiService.generateInsight(
          mockEnrichedPortfolio,
          'Summarize my portfolio',
          'FREE'
        )
      ).rejects.toThrow('Request timed out');
    });

    it('should handle Claude API 500 error', async () => {
      mockAnthropicCreate.mockRejectedValue({
        status: 500,
        message: 'Internal Server Error',
      });

      await expect(
        aiService.generateInsight(
          mockEnrichedPortfolio,
          'Summarize my portfolio',
          'FREE'
        )
      ).rejects.toBeDefined();
    });
  });

  // --- Response Parsing ---

  describe('Response Parsing', () => {
    it('should parse scratchpad from response', async () => {
      mockAnthropicCreate.mockResolvedValue(mockClaudeSuccessResponse);

      const result = await aiService.generateInsight(
        mockEnrichedPortfolio,
        'Summarize my portfolio',
        'FREE'
      );

      expect(result.scratchpad).toBeDefined();
      expect(result.scratchpad).toContain('Analyzing the portfolio composition');
      expect(result.scratchpad).toContain('Heavy tech weighting');
    });

    it('should parse insights from response', async () => {
      mockAnthropicCreate.mockResolvedValue(mockClaudeSuccessResponse);

      const result = await aiService.generateInsight(
        mockEnrichedPortfolio,
        'Summarize my portfolio',
        'FREE'
      );

      expect(result.insights).toBeDefined();
      expect(result.insights).toContain('Portfolio Performance Overview');
      expect(result.insights).toContain('$26,350.00');
      expect(result.insights).toContain('Concentration Risk');
    });

    it('should parse Mermaid charts from PREMIUM response', async () => {
      mockAnthropicCreate.mockResolvedValue(mockClaudePremiumResponse);

      const result = await aiService.generateInsight(
        mockEnrichedPortfolio,
        'Show me charts',
        'PREMIUM'
      );

      expect(result.insights).toContain('```mermaid');
      expect(result.insights).toContain('pie title Portfolio Allocation');
    });

    it('should handle response without scratchpad tags gracefully', async () => {
      const noScratchpadResponse = {
        ...mockClaudeSuccessResponse,
        content: [
          {
            type: 'text',
            text: '<insights>Just the insights here.</insights>',
          },
        ],
      };
      mockAnthropicCreate.mockResolvedValue(noScratchpadResponse);

      const result = await aiService.generateInsight(
        mockEnrichedPortfolio,
        'Quick summary',
        'FREE'
      );

      expect(result.scratchpad).toBe('');
      expect(result.insights).toBe('Just the insights here.');
    });

    it('should handle response without insight tags by using full text', async () => {
      const noTagsResponse = {
        ...mockClaudeSuccessResponse,
        content: [
          {
            type: 'text',
            text: 'Here is a plain response without any tags.',
          },
        ],
      };
      mockAnthropicCreate.mockResolvedValue(noTagsResponse);

      const result = await aiService.generateInsight(
        mockEnrichedPortfolio,
        'Quick summary',
        'FREE'
      );

      expect(result.insights).toBe(
        'Here is a plain response without any tags.'
      );
    });
  });

  // --- Financial Advice Rejection ---

  describe('Financial Advice Rejection', () => {
    it('should reject queries asking "Should I sell my tech stocks?"', async () => {
      const result = await aiService.generateInsight(
        mockEnrichedPortfolio,
        'Should I sell my tech stocks?',
        'FREE'
      );

      expect(result.rejected).toBe(true);
      expect(result.insights).toContain('unable to provide financial advice');
      expect(mockAnthropicCreate).not.toHaveBeenCalled();
    });

    it('should reject queries asking "What stocks should I buy?"', async () => {
      const result = await aiService.generateInsight(
        mockEnrichedPortfolio,
        'What stocks should I buy?',
        'FREE'
      );

      expect(result.rejected).toBe(true);
      expect(result.insights).toContain('unable to provide financial advice');
      expect(mockAnthropicCreate).not.toHaveBeenCalled();
    });

    it('should reject queries asking for investment recommendations', async () => {
      const result = await aiService.generateInsight(
        mockEnrichedPortfolio,
        'Can you recommend some ETFs for me?',
        'FREE'
      );

      expect(result.rejected).toBe(true);
      expect(mockAnthropicCreate).not.toHaveBeenCalled();
    });

    it('should reject queries about holding specific stocks', async () => {
      const result = await aiService.generateInsight(
        mockEnrichedPortfolio,
        'Should I hold AAPL or invest more?',
        'FREE'
      );

      expect(result.rejected).toBe(true);
      expect(mockAnthropicCreate).not.toHaveBeenCalled();
    });

    it('should allow informational queries about portfolio performance', async () => {
      mockAnthropicCreate.mockResolvedValue(mockClaudeSuccessResponse);

      const result = await aiService.generateInsight(
        mockEnrichedPortfolio,
        'How is my portfolio performing this quarter?',
        'FREE'
      );

      expect(result.rejected).toBe(false);
      expect(mockAnthropicCreate).toHaveBeenCalled();
    });

    it('should allow educational queries about investment concepts', async () => {
      mockAnthropicCreate.mockResolvedValue(mockClaudeSuccessResponse);

      const result = await aiService.generateInsight(
        mockEnrichedPortfolio,
        'What is sector diversification and how does my portfolio compare?',
        'FREE'
      );

      expect(result.rejected).toBe(false);
      expect(mockAnthropicCreate).toHaveBeenCalled();
    });
  });

  // --- Edge Cases ---

  describe('Edge Cases', () => {
    it('should handle empty portfolio gracefully', async () => {
      mockAnthropicCreate.mockResolvedValue({
        ...mockClaudeSuccessResponse,
        content: [
          {
            type: 'text',
            text: '<scratchpad>Portfolio is empty.</scratchpad><insights>Your portfolio has no holdings. Add some securities to get started with analysis.</insights>',
          },
        ],
      });

      const result = await aiService.generateInsight(
        mockEmptyPortfolio,
        'Analyze my portfolio',
        'FREE'
      );

      expect(result.insights).toContain('no holdings');
      const callArgs = mockAnthropicCreate.mock.calls[0][0];
      expect(callArgs.system).toContain('$0.00');
    });

    it('should reject queries exceeding 500 characters', async () => {
      const longQuery = 'a'.repeat(501);

      await expect(
        aiService.generateInsight(mockEnrichedPortfolio, longQuery, 'FREE')
      ).rejects.toThrow('Query exceeds maximum length of 500 characters');
      expect(mockAnthropicCreate).not.toHaveBeenCalled();
    });

    it('should reject empty query', async () => {
      await expect(
        aiService.generateInsight(mockEnrichedPortfolio, '', 'FREE')
      ).rejects.toThrow('Query cannot be empty');
      expect(mockAnthropicCreate).not.toHaveBeenCalled();
    });

    it('should reject whitespace-only query', async () => {
      await expect(
        aiService.generateInsight(mockEnrichedPortfolio, '   ', 'FREE')
      ).rejects.toThrow('Query cannot be empty');
      expect(mockAnthropicCreate).not.toHaveBeenCalled();
    });

    it('should handle exactly 500 character query', async () => {
      mockAnthropicCreate.mockResolvedValue(mockClaudeSuccessResponse);
      const exactQuery = 'a'.repeat(500);

      await aiService.generateInsight(
        mockEnrichedPortfolio,
        exactQuery,
        'FREE'
      );

      expect(mockAnthropicCreate).toHaveBeenCalled();
    });
  });
});
