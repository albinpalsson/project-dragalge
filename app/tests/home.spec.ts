import { test, expect } from '@playwright/test';

test('start a new game and see it appear in the games list', async ({
    page,
}) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Games' })).toBeVisible();

    await page.getByRole('button', { name: 'Start New Game' }).click();
    await page.getByLabel('Version').selectOption('s');
    await page.getByLabel('Name (optional)').fill('my-test-run');
    await page.getByRole('button', { name: 'Start', exact: true }).click();

    await expect(page.getByRole('listitem')).toContainText('my-test-run');
});
