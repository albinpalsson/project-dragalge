import { expect, type Page } from '@playwright/test';

export function cardFor(page: Page, cardName: string) {
    return page.locator('article', { hasText: cardName });
}

export async function createGame(page: Page, name: string) {
    await page.getByRole('button', { name: 'Start New Game' }).click();
    await page.getByLabel('Name (optional)').fill(name);
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(page.getByRole('listitem')).toContainText(name);
}

export async function openGame(page: Page, name: string) {
    await page.getByRole('button', { name: new RegExp(name) }).click();
}

// The game DB write to localStorage is debounced; give it time to flush before a reload.
export async function waitForPersistence(page: Page): Promise<void> {
    await page.waitForTimeout(300);
}

export async function chooseStarter(page: Page): Promise<string> {
    const card = cardFor(page, 'Starter');

    await card.getByRole('button', { name: 'Randomize' }).click();
    await expect(card.getByRole('button', { name: 'Randomize' })).toBeHidden();

    const icon = card.getByRole('img').first();
    await expect(icon).toBeVisible();
    const starter = await icon.getAttribute('alt');
    if (!starter) {
        throw new Error('Chosen starter image is missing alt text');
    }

    return starter;
}

export async function listEncounterNames(
    page: Page,
    cardName: string,
): Promise<string[]> {
    const card = cardFor(page, cardName);
    await card.getByRole('button', { name: 'Show encounters' }).click();
    return card.locator('tbody tr td:first-child').allTextContents();
}

export async function rollEncounter(
    page: Page,
    cardName: string,
): Promise<string> {
    const card = cardFor(page, cardName);

    await card.getByRole('button', { name: 'Randomize' }).click();
    await expect(card.getByRole('button', { name: 'Randomize' })).toBeDisabled();

    const icon = card.getByRole('img').first();
    await expect(icon).toBeVisible();
    const rolled = await icon.getAttribute('alt');
    if (!rolled) {
        throw new Error('Rolled encounter image is missing alt text');
    }

    return rolled;
}

export async function resolveEncounter(
    page: Page,
    cardName: string,
    status: 'Caught' | 'Missed' | 'Eliminated',
): Promise<void> {
    const card = cardFor(page, cardName);

    const statusButton = card.getByRole('button', { name: status, exact: true });
    await statusButton.click();
    await expect(statusButton).toBeDisabled();
}

export async function navigateTo(page: Page, destination: 'Home' | 'About') {
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('button', { name: destination, exact: true }).click();
}
