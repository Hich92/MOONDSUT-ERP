import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir:   './tests',
  fullyParallel: false,
  retries:   1,
  timeout:   30_000,
  workers:   1,

  reporter: [
    ['json', { outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT_NAME || '/results/latest.json' }],
    ['list'],
  ],

  use: {
    baseURL:            process.env.BASE_URL || 'https://portal.moondust.cloud',
    headless:           true,
    ignoreHTTPSErrors:  true,
    screenshot:         'only-on-failure',
    video:              'off',
    actionTimeout:      15_000,
    navigationTimeout:  20_000,
  },

  projects: [
    {
      name: 'chromium',
      use:  { ...devices['Desktop Chrome'] },
    },
  ],
})
