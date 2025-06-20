// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  // Test directory
  testDir: './e2e',
  
  // Maximum time one test can run for
  timeout: 30 * 1000,
  
  // Global test timeout
  globalTimeout: 10 * 60 * 1000,
  
  expect: {
    // Maximum time expect() should wait for the condition to be met
    timeout: 5000
  },
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: '../reports/playwright-report' }],
    ['json', { outputFile: '../reports/test-results.json' }],
    ['junit', { outputFile: '../reports/test-results.xml' }],
    process.env.CI ? ['github'] : ['list']
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Record video only when retrying
    video: 'retain-on-failure',
    
    // Take screenshot only when retrying
    screenshot: 'only-on-failure',
    
    // Browser context options
    contextOptions: {
      // Ignore HTTPS errors
      ignoreHTTPSErrors: true,
      
      // Accept downloads
      acceptDownloads: true,
      
      // Set viewport
      viewport: { width: 1280, height: 720 },
      
      // Extra HTTP headers
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9'
      }
    },
    
    // Global test data
    storageState: {
      cookies: [],
      origins: []
    }
  },

  // Configure projects for major browsers
  projects: [
    // Desktop Chrome
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Desktop Firefox
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // Desktop Safari
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile Chrome
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    // Mobile Safari
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // Tablet
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },
  ],

  // Web server configuration - start dev server before tests
  webServer: [
    {
      command: 'cd ../.. && npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000,
      env: {
        NODE_ENV: 'test'
      }
    },
    {
      command: 'cd ../../backend && go run cmd/main.go',
      url: 'http://localhost:9090/health',
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000,
      env: {
        ENV: 'test'
      }
    }
  ],

  // Test match patterns
  testMatch: [
    '**/*.spec.js',
    '**/*.test.js',
    '**/*.e2e.js'
  ],

  // Global setup
  globalSetup: './global-setup.js',
  
  // Global teardown
  globalTeardown: './global-teardown.js',
});
