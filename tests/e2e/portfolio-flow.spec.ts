// ============================================================
// Acuity Invest — E2E: Full Portfolio Management Flow
// Playwright test specs for portfolio CRUD operations
// ============================================================

import { test, expect } from '@playwright/test';

// --------------- Test Data ---------------

const testUser = {
  email: 'e2e-test@acuityinvest.com',
  password: 'TestPassword123!',
  name: 'E2E Test User',
};

const testPortfolio = {
  name: 'E2E Growth Portfolio',
  accountType: 'INDIVIDUAL',
};

const testHolding = {
  ticker: 'AAPL',
  name: 'Apple Inc.',
  shares: '50',
  avgCost: '150.00',
};

// --------------- Helper Functions ---------------

async function loginUser(page: any) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', testUser.email);
  await page.fill('[data-testid="password-input"]', testUser.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('**/dashboard');
}

// --------------- Tests ---------------

test.describe('Portfolio Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('should display the dashboard after login', async ({ page }) => {
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-header"]')).toContainText('Dashboard');
  });

  // --- Portfolio Creation ---

  test.describe('Portfolio Creation', () => {
    test('should create a new portfolio', async ({ page }) => {
      await page.click('[data-testid="create-portfolio-btn"]');

      // Fill portfolio creation form
      await page.fill('[data-testid="portfolio-name-input"]', testPortfolio.name);
      await page.selectOption('[data-testid="account-type-select"]', testPortfolio.accountType);
      await page.click('[data-testid="submit-portfolio-btn"]');

      // Verify portfolio appears in the list
      await expect(page.locator(`text=${testPortfolio.name}`)).toBeVisible();
    });

    test('should show validation error for empty portfolio name', async ({ page }) => {
      await page.click('[data-testid="create-portfolio-btn"]');
      await page.click('[data-testid="submit-portfolio-btn"]');

      await expect(page.locator('[data-testid="form-error"]')).toContainText('name is required');
    });

    test('should show error when FREE user tries to create second portfolio', async ({ page }) => {
      // Assuming user already has one portfolio
      await page.click('[data-testid="create-portfolio-btn"]');
      await page.fill('[data-testid="portfolio-name-input"]', 'Second Portfolio');
      await page.click('[data-testid="submit-portfolio-btn"]');

      await expect(page.locator('[data-testid="tier-limit-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="tier-limit-error"]')).toContainText('limit reached');
    });
  });

  // --- Portfolio Viewing ---

  test.describe('Portfolio Viewing', () => {
    test('should display portfolio details when clicking on a portfolio', async ({ page }) => {
      await page.click(`text=${testPortfolio.name}`);

      await expect(page.locator('[data-testid="portfolio-detail"]')).toBeVisible();
      await expect(page.locator('[data-testid="portfolio-name"]')).toContainText(testPortfolio.name);
      await expect(page.locator('[data-testid="holdings-table"]')).toBeVisible();
    });

    test('should display portfolio summary metrics', async ({ page }) => {
      await page.click(`text=${testPortfolio.name}`);

      await expect(page.locator('[data-testid="total-value"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-gain-loss"]')).toBeVisible();
      await expect(page.locator('[data-testid="day-change"]')).toBeVisible();
    });
  });

  // --- Holding Management ---

  test.describe('Holding Management', () => {
    test.beforeEach(async ({ page }) => {
      await page.click(`text=${testPortfolio.name}`);
    });

    test('should add a new holding to the portfolio', async ({ page }) => {
      await page.click('[data-testid="add-holding-btn"]');

      await page.fill('[data-testid="ticker-input"]', testHolding.ticker);
      await page.fill('[data-testid="holding-name-input"]', testHolding.name);
      await page.fill('[data-testid="shares-input"]', testHolding.shares);
      await page.fill('[data-testid="avg-cost-input"]', testHolding.avgCost);
      await page.click('[data-testid="submit-holding-btn"]');

      // Verify holding appears in the table
      await expect(page.locator(`[data-testid="holding-row-${testHolding.ticker}"]`)).toBeVisible();
      await expect(page.locator(`[data-testid="ticker-${testHolding.ticker}"]`)).toContainText('AAPL');
    });

    test('should show validation error for invalid ticker format', async ({ page }) => {
      await page.click('[data-testid="add-holding-btn"]');
      await page.fill('[data-testid="ticker-input"]', 'invalid');
      await page.click('[data-testid="submit-holding-btn"]');

      await expect(page.locator('[data-testid="ticker-error"]')).toContainText('uppercase');
    });

    test('should show error for duplicate ticker', async ({ page }) => {
      await page.click('[data-testid="add-holding-btn"]');
      await page.fill('[data-testid="ticker-input"]', testHolding.ticker);
      await page.fill('[data-testid="shares-input"]', '10');
      await page.fill('[data-testid="avg-cost-input"]', '200');
      await page.click('[data-testid="submit-holding-btn"]');

      await expect(page.locator('[data-testid="form-error"]')).toContainText('already exists');
    });

    test('should update holding shares', async ({ page }) => {
      await page.click(`[data-testid="edit-holding-${testHolding.ticker}"]`);
      await page.fill('[data-testid="shares-input"]', '100');
      await page.click('[data-testid="save-holding-btn"]');

      await expect(page.locator(`[data-testid="holding-row-${testHolding.ticker}"]`)).toContainText('100');
    });

    test('should delete a holding', async ({ page }) => {
      await page.click(`[data-testid="delete-holding-${testHolding.ticker}"]`);

      // Confirm deletion
      await page.click('[data-testid="confirm-delete-btn"]');

      await expect(page.locator(`[data-testid="holding-row-${testHolding.ticker}"]`)).not.toBeVisible();
    });
  });

  // --- Portfolio Deletion ---

  test.describe('Portfolio Deletion', () => {
    test('should delete a portfolio and return to dashboard', async ({ page }) => {
      await page.click(`text=${testPortfolio.name}`);
      await page.click('[data-testid="delete-portfolio-btn"]');

      // Confirm deletion
      await page.click('[data-testid="confirm-delete-btn"]');

      // Should redirect to dashboard
      await page.waitForURL('**/dashboard');
      await expect(page.locator(`text=${testPortfolio.name}`)).not.toBeVisible();
    });
  });

  // --- Holdings Table Sorting ---

  test.describe('Holdings Table Sorting', () => {
    test('should sort holdings by ticker', async ({ page }) => {
      await page.click(`text=${testPortfolio.name}`);
      await page.click('[data-testid="sort-ticker"]');

      const firstRow = page.locator('[data-testid^="holding-row-"]').first();
      await expect(firstRow).toBeVisible();
    });

    test('should sort holdings by market value', async ({ page }) => {
      await page.click(`text=${testPortfolio.name}`);
      await page.click('[data-testid="sort-market-value"]');

      await expect(page.locator('[data-testid="holdings-table"]')).toBeVisible();
    });
  });
});
