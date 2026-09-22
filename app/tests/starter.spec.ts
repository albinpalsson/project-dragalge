import { test, expect } from '@playwright/test';
import { cardFor, chooseStarter, createGame, resetStarter } from './helpers';

test('starter supports randomize, reset, and re-roll', async ({ page }) => {
    await page.goto('/');
    await createGame(page, 'starter-controls-run');

    const firstStarter = await chooseStarter(page);
    await expect(cardFor(page, 'Starter')).toContainText(firstStarter);
    await expect(
        cardFor(page, 'Starter').getByRole('button', {
            name: 'Re-roll starter',
        }),
    ).toBeVisible();
    await expect(
        cardFor(page, 'Starter').getByRole('button', {
            name: 'Reset starter choice',
        }),
    ).toBeVisible();

    await resetStarter(page);
    await expect(
        cardFor(page, 'Starter').getByRole('button', { name: 'Randomize' }),
    ).toBeVisible();

    const rerolledStarter = await chooseStarter(page);
    await expect(cardFor(page, 'Starter')).toContainText(rerolledStarter);
    await expect(
        cardFor(page, 'Starter').getByRole('button', {
            name: 'Re-roll starter',
        }),
    ).toBeVisible();
});
