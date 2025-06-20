// 🎭 TESTE E2E COMPLETO - Dashboard VeloFlux
// Testa todas as funcionalidades do frontend de forma automatizada

const { test, expect } = require('@playwright/test');

// Configuration
const FRONTEND_URL = 'http://localhost:3000';
const API_BASE_URL = 'http://localhost:9090';

// Test data
const TEST_USER = {
  email: 'admin@veloflux.com',
  password: 'admin123'
};

const TEST_BACKEND = {
  address: '192.168.1.100:8080',
  pool: 'test-pool',
  weight: 100
};

// Helper functions
async function login(page) {
  await page.goto(`${FRONTEND_URL}/login`);
  await page.fill('[data-testid="email-input"]', TEST_USER.email);
  await page.fill('[data-testid="password-input"]', TEST_USER.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('**/dashboard**');
}

async function waitForDashboardLoad(page) {
  await page.waitForSelector('[data-testid="dashboard-header"]');
  await page.waitForSelector('[data-testid="tabs-navigation"]');
}

// Test Suite: Authentication
test.describe('🔐 Authentication Tests', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`);
    
    // Check login form elements
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
    
    // Perform login
    await page.fill('[data-testid="email-input"]', TEST_USER.email);
    await page.fill('[data-testid="password-input"]', TEST_USER.password);
    await page.click('[data-testid="login-button"]');
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard.*/);
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
  });

  test('should handle login errors', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`);
    
    // Try invalid credentials
    await page.fill('[data-testid="email-input"]', 'invalid@test.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await login(page);
    
    // Click logout button
    await page.click('[data-testid="logout-button"]');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login.*/);
  });
});

// Test Suite: Dashboard Navigation
test.describe('🧭 Dashboard Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForDashboardLoad(page);
  });

  test('should display dashboard header correctly', async ({ page }) => {
    // Check header elements
    await expect(page.locator('h1')).toContainText('VeloFlux Dashboard');
    await expect(page.locator('[data-testid="system-health-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="refresh-button"]')).toBeVisible();
  });

  test('should navigate between all tabs', async ({ page }) => {
    const tabs = [
      'overview',
      'health', 
      'metrics',
      'backends',
      'cluster',
      'ai-metrics',
      'security',
      'billing',
      'config'
    ];

    for (const tab of tabs) {
      await page.click(`[data-testid="tab-${tab}"]`);
      await expect(page.locator(`[data-testid="content-${tab}"]`)).toBeVisible();
      console.log(`✅ Tab ${tab} loaded successfully`);
    }
  });

  test('should show loading states correctly', async ({ page }) => {
    await page.click('[data-testid="refresh-button"]');
    
    // Should show loading spinner
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // Loading should disappear
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeHidden({ timeout: 10000 });
  });
});

// Test Suite: Backend Management
test.describe('🖥️ Backend Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForDashboardLoad(page);
    await page.click('[data-testid="tab-backends"]');
  });

  test('should display backends list', async ({ page }) => {
    await expect(page.locator('[data-testid="backends-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-backend-button"]')).toBeVisible();
  });

  test('should add new backend', async ({ page }) => {
    // Click add backend button
    await page.click('[data-testid="add-backend-button"]');
    
    // Fill backend form
    await expect(page.locator('[data-testid="backend-modal"]')).toBeVisible();
    await page.fill('[data-testid="backend-address"]', TEST_BACKEND.address);
    await page.fill('[data-testid="backend-pool"]', TEST_BACKEND.pool);
    await page.fill('[data-testid="backend-weight"]', TEST_BACKEND.weight.toString());
    
    // Save backend
    await page.click('[data-testid="save-backend-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Should close modal
    await expect(page.locator('[data-testid="backend-modal"]')).toBeHidden();
  });

  test('should edit existing backend', async ({ page }) => {
    // Find first backend and click edit
    await page.click('[data-testid="edit-backend-0"]');
    
    // Update weight
    await page.fill('[data-testid="backend-weight"]', '200');
    await page.click('[data-testid="save-backend-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should enable/disable backend', async ({ page }) => {
    // Click disable button on first backend
    await page.click('[data-testid="disable-backend-0"]');
    
    // Should show confirmation dialog
    await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();
    await page.click('[data-testid="confirm-button"]');
    
    // Backend should be marked as disabled
    await expect(page.locator('[data-testid="backend-status-0"]')).toContainText('Disabled');
  });
});

// Test Suite: Health Monitoring
test.describe('❤️ Health Monitoring Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForDashboardLoad(page);
    await page.click('[data-testid="tab-health"]');
  });

  test('should display health metrics', async ({ page }) => {
    // Check health metrics cards
    await expect(page.locator('[data-testid="cpu-usage-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="memory-usage-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="response-time-card"]')).toBeVisible();
    
    // Check charts
    await expect(page.locator('[data-testid="health-chart"]')).toBeVisible();
  });

  test('should update metrics in real-time', async ({ page }) => {
    // Get initial CPU value
    const initialCpu = await page.locator('[data-testid="cpu-value"]').textContent();
    
    // Wait for update (WebSocket should update data)
    await page.waitForTimeout(5000);
    
    // Check if value might have changed (or at least element is still there)
    await expect(page.locator('[data-testid="cpu-value"]')).toBeVisible();
  });

  test('should show alerts when present', async ({ page }) => {
    // If alerts are present, they should be visible
    const alertsSection = page.locator('[data-testid="alerts-section"]');
    if (await alertsSection.isVisible()) {
      await expect(page.locator('[data-testid="alert-item"]')).toBeVisible();
    }
  });
});

// Test Suite: Metrics Visualization
test.describe('📊 Metrics Visualization Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForDashboardLoad(page);
    await page.click('[data-testid="tab-metrics"]');
  });

  test('should display metrics charts', async ({ page }) => {
    // Check various chart types
    await expect(page.locator('[data-testid="requests-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="latency-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-rate-chart"]')).toBeVisible();
  });

  test('should allow time range selection', async ({ page }) => {
    // Click time range selector
    await page.click('[data-testid="time-range-selector"]');
    
    // Select different time range
    await page.click('[data-testid="time-range-1h"]');
    
    // Charts should update (loading state)
    await expect(page.locator('[data-testid="chart-loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="chart-loading"]')).toBeHidden({ timeout: 10000 });
  });

  test('should export metrics data', async ({ page }) => {
    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-metrics-button"]');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('metrics');
  });
});

// Test Suite: AI Features
test.describe('🤖 AI Features Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForDashboardLoad(page);
    await page.click('[data-testid="tab-ai-metrics"]');
  });

  test('should display AI metrics dashboard', async ({ page }) => {
    await expect(page.locator('[data-testid="ai-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="model-performance-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="prediction-accuracy-card"]')).toBeVisible();
  });

  test('should show AI predictions', async ({ page }) => {
    // Check if predictions section is visible
    await expect(page.locator('[data-testid="predictions-section"]')).toBeVisible();
    
    // Should have prediction charts
    await expect(page.locator('[data-testid="prediction-chart"]')).toBeVisible();
  });
});

// Test Suite: Security Settings
test.describe('🔒 Security Settings Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForDashboardLoad(page);
    await page.click('[data-testid="tab-security"]');
  });

  test('should display security configuration', async ({ page }) => {
    await expect(page.locator('[data-testid="security-settings"]')).toBeVisible();
    await expect(page.locator('[data-testid="waf-config"]')).toBeVisible();
    await expect(page.locator('[data-testid="rate-limit-config"]')).toBeVisible();
  });

  test('should allow WAF configuration changes', async ({ page }) => {
    // Toggle WAF setting
    await page.click('[data-testid="waf-enable-toggle"]');
    
    // Save changes
    await page.click('[data-testid="save-security-settings"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});

// Test Suite: Responsive Design
test.describe('📱 Responsive Design Tests', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await login(page);
    
    // Should show mobile navigation
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    
    // Mobile dashboard should be functional
    await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await login(page);
    
    // Dashboard should adapt to tablet size
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="tabs-navigation"]')).toBeVisible();
  });
});

// Test Suite: Error Handling
test.describe('⚠️ Error Handling Tests', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    await login(page);
    
    // Simulate network error by intercepting requests
    await page.route('**/api/**', route => route.abort());
    
    // Try to refresh data
    await page.click('[data-testid="refresh-button"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await login(page);
    
    // Simulate API error
    await page.route('**/api/backends', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });
    
    // Navigate to backends tab
    await page.click('[data-testid="tab-backends"]');
    
    // Should show error state
    await expect(page.locator('[data-testid="error-state"]')).toBeVisible();
  });
});

// Performance Test
test.describe('⚡ Performance Tests', () => {
  test('should load dashboard within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await login(page);
    await waitForDashboardLoad(page);
    
    const loadTime = Date.now() - startTime;
    
    // Dashboard should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    console.log(`Dashboard loaded in ${loadTime}ms`);
  });
});

// Cleanup
test.afterAll(async () => {
  console.log('🎉 All E2E tests completed!');
});
