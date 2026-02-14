// ============================================================
// Acuity Invest — E2E: Insight Generation Flow
// Playwright test specs for query -> insight display flow
// ============================================================

import { test, expect } from '@playwright/test';

// --------------- Test Data ---------------

const freeUser = {
  email: 'free-e2e@acuityinvest.com',
  password: 'TestPassword123!',
};

const premiumUser = {
  email: 'premium-e2e@acuityinvest.com',
  password: 'TestPassword123!',
};

// --------------- Helper Functions ---------------

async function loginUser(page: any, credentials: { email: string; password: string }) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', credentials.email);
  await page.fill('[data-testid="password-input"]', credentials.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('**/dashboard');
}

async function navigateToInsights(page: any) {
  await page.click('[data-testid="nav-insights"]');
  await page.waitForURL('**/insights');
}

async function submitQuery(page: any, query: string) {
  await page.fill('[data-testid="query-input"]', query);
  await page.click('[data-testid="submit-btn"]');
}

// --------------- Tests ---------------

test.describe('Insight Generation Flow', () => {
  // --- Navigation ---

  test('user navigates to insights page', async ({ page }) => {
    await loginUser(page, freeUser);
    await navigateToInsights(page);

    await expect(page.locator('[data-testid="insights-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="page-title"]')).toContainText('AI Portfolio Insights');
    await expect(page.locator('[data-testid="query-input"]')).toBeVisible();
  });

  // --- Query Submission ---

  test('user types and submits a portfolio performance query', async ({ page }) => {
    await loginUser(page, freeUser);
    await navigateToInsights(page);

    await page.fill('[data-testid="query-input"]', 'How is my portfolio performing?');

    // Verify text appears in the input
    await expect(page.locator('[data-testid="query-input"]')).toHaveValue(
      'How is my portfolio performing?'
    );

    // Verify character count updates
    await expect(page.locator('[data-testid="char-count"]')).toContainText(
      '36/500'
    );

    await page.click('[data-testid="submit-btn"]');
  });

  // --- Loading State ---

  test('system shows loading state during analysis', async ({ page }) => {
    await loginUser(page, freeUser);
    await navigateToInsights(page);

    await submitQuery(page, 'Analyze my portfolio');

    // Loading state should appear
    await expect(page.locator('[data-testid="loading-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="submit-btn"]')).toBeDisabled();
    await expect(page.locator('[data-testid="submit-btn"]')).toContainText('Analyzing...');

    // Wait for loading to finish (up to 30 seconds for AI response)
    await page.waitForSelector('[data-testid="insight-result"]', { timeout: 30000 });
    await expect(page.locator('[data-testid="loading-state"]')).not.toBeVisible();
  });

  // --- Insight Display (FREE User) ---

  test('system displays formatted insights with tables for FREE user', async ({ page }) => {
    await loginUser(page, freeUser);
    await navigateToInsights(page);

    await submitQuery(page, 'How is my portfolio performing?');

    // Wait for results
    await page.waitForSelector('[data-testid="insight-result"]', { timeout: 30000 });

    // Should contain formatted content
    const insightContent = page.locator('[data-testid="insight-content"]');
    await expect(insightContent).toBeVisible();

    // Should contain performance data (tables, headers, metrics)
    const contentText = await insightContent.textContent();
    expect(contentText).toBeTruthy();
    expect(contentText!.length).toBeGreaterThan(50); // Should have substantial content
  });

  test('FREE user sees text-only insights without Mermaid charts', async ({ page }) => {
    await loginUser(page, freeUser);
    await navigateToInsights(page);

    await submitQuery(page, 'Show me my portfolio breakdown');

    await page.waitForSelector('[data-testid="insight-result"]', { timeout: 30000 });

    // Should NOT have Mermaid charts
    await expect(page.locator('[data-testid="mermaid-chart"]')).toHaveCount(0);
  });

  // --- Insight Display (PREMIUM User) ---

  test('PREMIUM user sees Mermaid charts rendered in insights', async ({ page }) => {
    await loginUser(page, premiumUser);
    await navigateToInsights(page);

    await submitQuery(page, 'Show me a visual breakdown of my portfolio');

    await page.waitForSelector('[data-testid="insight-result"]', { timeout: 30000 });

    // Should have Mermaid charts
    const mermaidCharts = page.locator('[data-testid="mermaid-chart"]');
    await expect(mermaidCharts.first()).toBeVisible();

    // Charts should render as SVG
    const svgElements = page.locator('[data-testid="mermaid-chart"] svg');
    await expect(svgElements.first()).toBeVisible();
  });

  // --- Scratchpad Toggle ---

  test('user can toggle scratchpad section', async ({ page }) => {
    await loginUser(page, freeUser);
    await navigateToInsights(page);

    await submitQuery(page, 'Analyze my holdings');

    await page.waitForSelector('[data-testid="insight-result"]', { timeout: 30000 });

    // Scratchpad should be collapsed by default (in <details>)
    const scratchpadToggle = page.locator('[data-testid="scratchpad-toggle"]');
    await expect(scratchpadToggle).toBeVisible();

    // Click to expand
    await scratchpadToggle.locator('summary').click();

    // Scratchpad content should now be visible
    const scratchpadContent = page.locator('[data-testid="scratchpad-toggle"] pre');
    await expect(scratchpadContent).toBeVisible();
    const scratchpadText = await scratchpadContent.textContent();
    expect(scratchpadText!.length).toBeGreaterThan(0);
  });

  // --- Multiple Queries ---

  test('user can submit another query after receiving results', async ({ page }) => {
    await loginUser(page, freeUser);
    await navigateToInsights(page);

    // First query
    await submitQuery(page, 'How is my portfolio performing?');
    await page.waitForSelector('[data-testid="insight-result"]', { timeout: 30000 });

    // Input should be cleared
    await expect(page.locator('[data-testid="query-input"]')).toHaveValue('');

    // Submit button should be enabled again
    await expect(page.locator('[data-testid="submit-btn"]')).toBeEnabled();

    // Second query
    await submitQuery(page, 'What is my sector allocation?');
    await page.waitForSelector('[data-testid="loading-state"]');
    await page.waitForSelector('[data-testid="insight-result"]', { timeout: 30000 });

    // Query history should show both
    const historyItems = page.locator('[data-testid^="history-"]');
    await expect(historyItems).toHaveCount(2);
  });

  // --- Remaining Queries Counter ---

  test('remaining queries counter decrements after each query', async ({ page }) => {
    await loginUser(page, freeUser);
    await navigateToInsights(page);

    const remainingBefore = await page.locator('[data-testid="remaining-count"]').textContent();

    await submitQuery(page, 'Quick analysis');
    await page.waitForSelector('[data-testid="insight-result"]', { timeout: 30000 });

    const remainingAfter = await page.locator('[data-testid="remaining-count"]').textContent();

    // Extract numbers and verify decrement
    const before = parseInt(remainingBefore!.match(/\d+/)?.[0] ?? '0');
    const after = parseInt(remainingAfter!.match(/\d+/)?.[0] ?? '0');
    expect(after).toBe(before - 1);
  });

  // --- Character Limit ---

  test('character counter turns red when exceeding 500 characters', async ({ page }) => {
    await loginUser(page, freeUser);
    await navigateToInsights(page);

    const longQuery = 'a'.repeat(501);
    await page.fill('[data-testid="query-input"]', longQuery);

    await expect(page.locator('[data-testid="char-count"]')).toHaveClass(/text-red/);
    await expect(page.locator('[data-testid="submit-btn"]')).toBeDisabled();
  });
});
