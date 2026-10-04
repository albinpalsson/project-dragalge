import { test, expect } from '@playwright/test';
import {
    cardFor,
    createGame,
    expandCollapsedSummary,
    showMoreProgression,
} from './helpers';

test('Katy shows her Bug specialty badge, gym challenge warning, and ace Tera badge', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'katy-visuals-run');

    await showMoreProgression(page);
    await expandCollapsedSummary(page, 'Katy (Gym)');
    const card = cardFor(page, 'Katy (Gym)').first();

    // Katy's Bug specialty badge, shown next to her name.
    const bugBadgeCount = await card.getByText('Bug', { exact: true }).count();
    expect(bugBadgeCount).toBeGreaterThanOrEqual(1);

    await expect(card).toContainText(
        '0–2 optional trainer battles with 0–2 Pokemon in total',
    );

    await expect(
        page.getByRole('button', {
            name: 'Teddiursa Terastallizes to Bug',
        }),
    ).toBeVisible();

    await card
        .getByRole('button', { name: 'Teddiursa type defenses' })
        .click();
    const defenses = page.getByRole('dialog');
    await expect(defenses).toContainText('fire');
    await expect(defenses).toContainText('Weak 2×');
    await expect(defenses).toContainText('fighting');
    await expect(defenses).toContainText('Resistant 0.5×');
});
