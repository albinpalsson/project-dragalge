import { test, expect } from '@playwright/test';
import {
    cardFor,
    createGame,
    showMoreProgression,
    waitForPersistence,
} from './helpers';

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
    await showMoreProgression(page);
    await expect(giacomoCard.first()).toBeVisible();

    await waitForPersistence(page);
    await page.reload();
    await expect(giacomoCard).toHaveCount(0);
    await showMoreProgression(page);
    await expect(giacomoCard.first()).toBeVisible();

    await settingsButton.click();
    const enabledCheckbox = page.getByLabel('Include Team Star battles');
    await expect(enabledCheckbox).toBeChecked();
    await enabledCheckbox.uncheck();
    await page.keyboard.press('Escape');
    await expect(giacomoCard).toHaveCount(0);

    await waitForPersistence(page);
    await page.reload();
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
