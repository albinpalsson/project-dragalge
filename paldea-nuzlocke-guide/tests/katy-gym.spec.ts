import { test, expect } from '@playwright/test';
import {
    cardFor,
    createGame,
    expandCollapsedSummary,
} from './helpers';

test('a boss ace uses its Tera type for defense information', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'katy-visuals-run');

    await expandCollapsedSummary(page, 'Katy (Gym)');
    const card = cardFor(page, 'Katy (Gym)').first();

    await card.getByRole('button', { name: 'Teddiursa type defenses' }).click();
    const defenses = page.getByRole('dialog');
    await expect(
        defenses.getByRole('heading', { name: 'Type defenses (bug)' }),
    ).toBeVisible();
    await expect(defenses).toContainText('fire');
    await expect(defenses).toContainText('Weak 2×');
    await expect(defenses).toContainText('fighting');
    await expect(defenses).toContainText('Resistant 0.5×');
});
