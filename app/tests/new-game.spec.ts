import { test, expect } from '@playwright/test';
import { cardFor, createGame, waitForPersistence } from './helpers';

test('Team Star battle setting updates card visibility and persists', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'team-star-toggle-run');

    const settingsButton = page.getByRole('button', {
        name: 'Game settings',
        exact: true,
    });
    const giacomoCard = cardFor(page, 'Giacomo (Team Star)');

    await expect(giacomoCard).toHaveCount(0);
    await settingsButton.click();
    const checkbox = page.getByLabel('Include Team Star battles');
    await expect(checkbox).not.toBeChecked();
    await checkbox.check();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Show more' }).click();
    await expect(giacomoCard.first()).toBeVisible();

    await waitForPersistence(page);
    await page.reload();
    await page.getByRole('button', { name: 'Show more' }).click();
    await expect(giacomoCard.first()).toBeVisible();

    await settingsButton.click();
    const enabledCheckbox = page.getByLabel('Include Team Star battles');
    await expect(enabledCheckbox).toBeChecked();
    await enabledCheckbox.uncheck();
    await page.keyboard.press('Escape');
    await expect(giacomoCard).toHaveCount(0);

    await waitForPersistence(page);
    await page.reload();
    await page.getByRole('button', { name: 'Show more' }).click();
    await expect(giacomoCard).toHaveCount(0);
    await settingsButton.click();
    await expect(
        page.getByLabel('Include Team Star battles'),
    ).not.toBeChecked();
});

test('the start-game modal can be dismissed', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Start New Game' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();

    await expect(page.getByRole('listitem')).toHaveCount(0);
});

test('randomizer modes guide shows the odds of each mode', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start New Game' }).click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'How do modes work?' }).click();

    const guide = page.getByRole('dialog', { name: 'Randomizer modes' });
    const exampleTable = guide.getByRole('table', {
        name: 'Example encounter table',
    });
    await expect(exampleTable.locator('tbody tr td:first-child')).toHaveText([
        'Lechonk',
        'Buizel',
        'Flabébé (Red Flower)',
        'Flabébé (Yellow Flower)',
        'Pawmi',
        'Wingull',
        'Wingull',
        'Ralts',
    ]);

    // Result, Weighted, Normalized, Equal chance
    const expectedOdds = [
        ['Lechonk', '43.5%', '24.8%', '16.7%'],
        ['Buizel', '21.7%', '24.8%', '16.7%'],
        ['Flabébé', '17.4%', '24.8%', '16.7%'],
        ['Pawmi', '5.4%', '12.4%', '16.7%'],
        ['Wingull', '10.9%', '12.4%', '16.7%'],
        ['Ralts', '1.1%', '1.0%', '16.7%'],
    ];
    const oddsRows = guide
        .getByRole('table', { name: 'Randomizer odds' })
        .locator('tbody tr');
    await expect(oddsRows).toHaveCount(expectedOdds.length);
    for (const [index, cells] of expectedOdds.entries()) {
        await expect(oddsRows.nth(index).locator('td')).toHaveText(cells);
    }

    await page.keyboard.press('Escape');
    await expect(guide).toBeHidden();
    await expect(page.getByRole('dialog')).toHaveCount(1);
});
test('starting a game enforces a 128-character name limit', async ({
    page,
}) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start New Game' }).click();

    const longName = 'a'.repeat(140);
    const expectedName = 'a'.repeat(128);
    const nameInput = page.getByLabel('Name (optional)');
    await nameInput.fill(longName);
    await expect(nameInput).toHaveValue(expectedName);

    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(page.getByRole('heading').first()).toContainText(expectedName);
});
