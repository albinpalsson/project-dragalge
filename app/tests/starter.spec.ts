import { test, expect } from '@playwright/test';
import {
    cardFor,
    chooseStarter,
    createGame,
    openBox,
    resetStarter,
    selectStarter,
} from './helpers';

test('starter can be rerolled, reset and released from Box', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'starter-controls-run', 'Fun', async (settings) => {
        await settings.getByLabel('Release starter').check();
    });

    const firstStarter = await chooseStarter(page);
    const starterCard = cardFor(page, 'Starter').first();
    await expect(starterCard).toContainText(firstStarter);
    await expect(
        starterCard.getByRole('button', {
            name: 'Re-roll starter',
        }),
    ).toBeVisible();
    await expect(
        starterCard.getByRole('button', {
            name: 'Reset starter choice',
        }),
    ).toBeVisible();

    await starterCard.getByRole('button', { name: 'Re-roll starter' }).click();
    await expect(starterCard.getByRole('img')).toBeVisible();
    await resetStarter(page);
    await expect(
        starterCard.getByRole('button', { name: 'Randomize' }),
    ).toBeVisible();

    await selectStarter(page, 'Sprigatito');

    const releaseCard = cardFor(page, 'Release starter').first();
    await expect(releaseCard).toBeVisible();
    await releaseCard
        .getByRole('button', { name: 'Release Sprigatito' })
        .click();
    await expect(releaseCard).toContainText('Released');

    await openBox(page);
    await expect(
        page
            .getByRole('dialog')
            .getByRole('button', { name: 'Sprigatito', exact: true }),
    ).toHaveCount(0);
});
