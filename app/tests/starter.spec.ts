import { test, expect } from '@playwright/test';
import {
    boxSection,
    cardFor,
    chooseStarter,
    createGame,
    openBox,
    resetStarter,
    selectStarter,
} from './helpers';

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

test('default starter ban disables Fuecoco selection', async ({ page }) => {
    await page.goto('/');
    await createGame(page, 'starter-ban-run');

    const starterCard = cardFor(page, 'Starter').first();
    await starterCard.click();

    const fuecocoButton = starterCard
        .getByRole('button')
        .filter({ hasText: 'Fuecoco' })
        .first();
    await expect(fuecocoButton).toBeDisabled();
    await expect(starterCard).toContainText('Banned by game settings');
});

test('released starter no longer appears in box sections', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start New Game' }).click();
    await page.getByLabel('Name (optional)').fill('starter-release-run');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByLabel('Release starter').check();
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(cardFor(page, 'Starter').first()).toBeVisible();

    await selectStarter(page, 'Sprigatito');

    const releaseCard = cardFor(page, 'Release starter').first();
    await expect(releaseCard).toBeVisible();
    await releaseCard.getByRole('button', { name: 'Release Sprigatito' }).click();
    await expect(releaseCard).toContainText('Released');

    await openBox(page);
    await expect(
        boxSection(page, 'Party').getByRole('button', { name: 'Sprigatito' }),
    ).toHaveCount(0);
    await expect(
        boxSection(page, 'Box').getByRole('button', { name: 'Sprigatito' }),
    ).toHaveCount(0);
    await expect(
        boxSection(page, 'Death Box').getByRole('button', {
            name: 'Sprigatito',
        }),
    ).toHaveCount(0);
});
