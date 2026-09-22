import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: './tests',
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Keep local browser and in-page database work below machine saturation. */
    workers: process.env.CI ? 1 : 4,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: 'list',
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('')`. The dev server binds to a
         * random OS-assigned port (`--port 0`); the actual port is captured from its stdout
         * by `webServer.wait` below and passed here via env var so multiple test runs can
         * use the dev server concurrently without port collisions. */
        baseURL: `http://localhost:${process.env.DEV_SERVER_PORT ?? 3000}`,

        reducedMotion: 'reduce',

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium', use: { ...devices['Desktop Chrome'] } 
        },

        /* Test against mobile viewports. */
        // {
        //   name: 'Mobile Chrome',
        //   use: { ...devices['Pixel 5'] },
        // },
        // {
        //   name: 'Mobile Safari',
        //   use: { ...devices['iPhone 12'] },
        // },

        /* Test against branded browsers. */
        // {
        //   name: 'Microsoft Edge',
        //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
        // },
        // {
        //   name: 'Google Chrome',
        //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
        // },
    ],

    /* Run your local dev server before starting the tests */
    webServer: {
        command: 'npm run playwright-dev',
        /* The dev server logs "[dev] ready http://host:<port>" once it's listening on its
         * random port; capture that port instead of polling a fixed URL. */
        wait: {
            stdout: /\[dev\] ready http:\/\/[^:]+:(?<dev_server_port>\d+)/,
        },
        stdout: 'pipe',
        reuseExistingServer: !process.env.CI,
    },
});
