import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 3210);
const baseURL = `http://127.0.0.1:${PORT}`;

/**
 * End-to-end tests run against the *mock* provider, so they are deterministic
 * and never depend on Mixcloud being up: the flows under test (paging, history,
 * view mode, the flight, the player) are provider-agnostic by design.
 *
 * `PLAYWRIGHT_CHROMIUM_PATH` is an escape hatch for environments that already
 * have a Chromium binary and cannot run `npx playwright install`.
 */
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
    launchOptions: executablePath ? { executablePath } : {},
  },
  webServer: {
    // `env` rather than an inline `VAR=value` prefix, so this runs on Windows too.
    command: `npx next start -p ${PORT}`,
    env: { SOUND_PROVIDER: 'mock' },
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
