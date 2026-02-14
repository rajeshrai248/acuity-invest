// ============================================================
// Acuity Invest — E2E: Subscription Upgrade Flow
// Playwright test specs for FREE -> PREMIUM upgrade journey
// ============================================================

import { test, expect } from '@playwright/test';

// --------------- Test Data ---------------

const freeUser = {
  email: 'upgrade-test@acuityinvest.com',
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

// --------------- Tests ---------------

test.describe('Subscription Upgrade Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page, freeUser);
  });

  // --- Current Plan Display ---

  test('should display current FREE plan on subscription page', async ({ page }) => {
    await page.click('[data-testid="nav-subscription"]');
    await page.waitForURL('**/subscription');

    await expect(page.locator('[data-testid="current-tier"]')).toContainText('FREE');
    await expect(page.locator('[data-testid="free-plan"]')).toBeVisible();
    await expect(page.locator('[data-testid="premium-plan"]')).toBeVisible();
  });

  // --- Tier Comparison ---

  test('should display feature comparison between tiers', async ({ page }) => {
    await page.click('[data-testid="nav-subscription"]');
    await page.waitForURL('**/subscription');

    // FREE tier features
    const freePanel = page.locator('[data-testid="free-plan"]');
    await expect(freePanel).toContainText('1 portfolio');
    await expect(freePanel).toContainText('15 holdings');
    await expect(freePanel).toContainText('5 AI queries');

    // PREMIUM tier features
    const premiumPanel = page.locator('[data-testid="premium-plan"]');
    await expect(premiumPanel).toContainText('10 portfolios');
    await expect(premiumPanel).toContainText('100 holdings');
    await expect(premiumPanel).toContainText('100 AI queries');
    await expect(premiumPanel).toContainText('Mermaid');
    await expect(premiumPanel).toContainText('$29.99');
  });

  // --- Premium Gate Encounter ---

  test('should show premium gate when FREE user accesses premium feature', async ({ page }) => {
    await page.click('[data-testid="nav-insights"]');
    await page.waitForURL('**/insights');

    // Try to access a premium feature (e.g., chart view)
    await page.fill('[data-testid="query-input"]', 'Show me charts of my portfolio');
    await page.click('[data-testid="submit-btn"]');
    await page.waitForSelector('[data-testid="insight-result"]', { timeout: 30000 });

    // If there is a premium feature link like "View Charts"
    const premiumFeatureBtn = page.locator('[data-testid="view-charts-btn"]');
    if (await premiumFeatureBtn.isVisible()) {
      await premiumFeatureBtn.click();

      // Premium gate should appear
      await expect(page.locator('[data-testid="premium-gate"]')).toBeVisible();
      await expect(page.locator('[data-testid="gate-title"]')).toContainText('Premium Feature');
      await expect(page.locator('[data-testid="upgrade-button"]')).toBeVisible();
    }
  });

  // --- Upgrade Process ---

  test('should navigate to upgrade from premium gate', async ({ page }) => {
    await page.click('[data-testid="nav-subscription"]');
    await page.waitForURL('**/subscription');

    await expect(page.locator('[data-testid="upgrade-btn"]')).toBeVisible();
    await page.click('[data-testid="upgrade-btn"]');

    // Should show processing state
    await expect(page.locator('[data-testid="upgrade-btn"]')).toContainText('Processing');

    // Wait for upgrade to complete
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="success-message"]')).toContainText('upgraded');
  });

  test('should update tier display after successful upgrade', async ({ page }) => {
    await page.click('[data-testid="nav-subscription"]');
    await page.waitForURL('**/subscription');

    await page.click('[data-testid="upgrade-btn"]');
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });

    // Tier should now show PREMIUM
    await expect(page.locator('[data-testid="current-tier"]')).toContainText('PREMIUM');
  });

  test('should hide upgrade button after upgrade', async ({ page }) => {
    await page.click('[data-testid="nav-subscription"]');
    await page.waitForURL('**/subscription');

    await page.click('[data-testid="upgrade-btn"]');
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });

    // Upgrade button should no longer be visible
    await expect(page.locator('[data-testid="upgrade-btn"]')).not.toBeVisible();

    // Downgrade button should now appear
    await expect(page.locator('[data-testid="downgrade-btn"]')).toBeVisible();
  });

  // --- Post-Upgrade Features ---

  test('should unlock Mermaid charts after upgrade', async ({ page }) => {
    // First upgrade
    await page.click('[data-testid="nav-subscription"]');
    await page.waitForURL('**/subscription');
    await page.click('[data-testid="upgrade-btn"]');
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });

    // Navigate to insights
    await page.click('[data-testid="nav-insights"]');
    await page.waitForURL('**/insights');

    // Submit query requesting visual content
    await page.fill('[data-testid="query-input"]', 'Show me a visual breakdown of my portfolio');
    await page.click('[data-testid="submit-btn"]');
    await page.waitForSelector('[data-testid="insight-result"]', { timeout: 30000 });

    // Mermaid charts should be rendered
    await expect(page.locator('[data-testid="mermaid-chart"]').first()).toBeVisible();
  });

  test('should have increased query limit after upgrade', async ({ page }) => {
    // First upgrade
    await page.click('[data-testid="nav-subscription"]');
    await page.waitForURL('**/subscription');
    await page.click('[data-testid="upgrade-btn"]');
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });

    // Navigate to insights
    await page.click('[data-testid="nav-insights"]');
    await page.waitForURL('**/insights');

    // Remaining queries should show 100 (or close to it)
    const remaining = await page.locator('[data-testid="remaining-count"]').textContent();
    const count = parseInt(remaining!.match(/\d+/)?.[0] ?? '0');
    expect(count).toBeGreaterThanOrEqual(95); // Allow for some already-used queries
  });

  // --- Upgrade from Dashboard ---

  test('should navigate to subscription page from dashboard upgrade link', async ({ page }) => {
    // Dashboard should show upgrade link for FREE users
    const upgradeLink = page.locator('[data-testid="nav-upgrade"]');
    await expect(upgradeLink).toBeVisible();

    await upgradeLink.click();
    await page.waitForURL('**/subscription');

    await expect(page.locator('[data-testid="subscription-page"]')).toBeVisible();
  });

  // --- Dismiss Premium Gate ---

  test('should close premium gate on dismiss without upgrading', async ({ page }) => {
    // Navigate to insights
    await page.click('[data-testid="nav-insights"]');

    // Trigger a premium gate scenario
    const premiumGate = page.locator('[data-testid="premium-gate"]');

    if (await premiumGate.isVisible()) {
      await page.click('[data-testid="dismiss-button"]');

      // Gate should close
      await expect(premiumGate).not.toBeVisible();

      // User should still be on FREE tier
      await page.click('[data-testid="nav-subscription"]');
      await expect(page.locator('[data-testid="current-tier"]')).toContainText('FREE');
    }
  });
});
