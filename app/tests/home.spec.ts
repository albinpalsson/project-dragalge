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

test('cancel the start-game modal without creating a game', async ({
    page,
}) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Start New Game' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('listitem')).toHaveCount(0);
});

test('escape key closes the start-game modal', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Start New Game' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
});
