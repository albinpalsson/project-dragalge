import { test, expect } from '@playwright/test';

test('the start-game modal can be dismissed', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Start New Game' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();

    await expect(page.getByRole('listitem')).toHaveCount(0);
});

test('starting a game enforces a 128-character name limit', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start New Game' }).click();

    const longName = 'a'.repeat(140);
    const expectedName = 'a'.repeat(128);
    const nameInput = page.getByLabel('Name (optional)');
    await nameInput.fill(longName);
    await expect(nameInput).toHaveValue(expectedName);

    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(page.getByRole('heading', { name: expectedName })).toBeVisible();
});
