import { test, expect } from '@playwright/test';
import {
    cardFor,
    createGame,
    expandCollapsedSummary,
    resolveEncounter,
    rollEncounter,
    waitForPersistence,
} from './helpers';

test('resolved encounter stays expanded until reload', async ({ page }) => {
    await page.goto('/');
    await createGame(page, 'reroll-run');

    const card = cardFor(page, 'Poco Path');

    await rollEncounter(page, 'Poco Path');
    await resolveEncounter(page, 'Poco Path', 'Missed');
    await expect(card.getByRole('button', { name: 'Re-roll' })).toBeVisible();

    await waitForPersistence(page);
    await page.reload();

    const reloadedCard = cardFor(page, 'Poco Path');
    await expect(reloadedCard).toContainText('Missed');
    await expect(
        reloadedCard.getByRole('button', { name: 'Randomize' }),
    ).toBeHidden();
    await expandCollapsedSummary(page, 'Poco Path');
    await expect(
        cardFor(page, 'Poco Path').getByRole('button', { name: 'Re-roll' }),
    ).toBeVisible();
});
