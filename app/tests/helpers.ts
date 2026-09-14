import { expect, type Page } from '@playwright/test';

const RANDOMIZE_BUTTON_NAME = /Randomize|Re-roll/;

export function cardFor(page: Page, cardName: string) {
    // Resolved encounters collapse from an <article> into a summary <button>.
    return page.locator('article, button', { hasText: cardName });
}

export async function expandCollapsedSummary(page: Page, cardName: string) {
    await cardFor(page, cardName).click();
}

async function ensureCardExpanded(page: Page, cardName: string) {
    const card = cardFor(page, cardName);
    const randomizeCount = await card
        .getByRole('button', { name: RANDOMIZE_BUTTON_NAME })
        .count();
    if (randomizeCount === 0) {
        await expandCollapsedSummary(page, cardName);
    }
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
    await ensureCardExpanded(page, cardName);
    const card = cardFor(page, cardName);
    await card.getByRole('button', { name: 'Show encounters' }).click();
    return card.locator('tbody tr td:first-child').allTextContents();
}

export async function rollEncounter(
    page: Page,
    cardName: string,
): Promise<string> {
    await ensureCardExpanded(page, cardName);
    const card = cardFor(page, cardName);

    await card.getByRole('button', { name: RANDOMIZE_BUTTON_NAME }).click();
    await expect(
        card.getByRole('button', { name: RANDOMIZE_BUTTON_NAME }),
    ).toBeDisabled();

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
    await ensureCardExpanded(page, cardName);
    const card = cardFor(page, cardName);
    const statusButton = card.getByRole('button', {
        name: status,
        exact: true,
    });
    await statusButton.click();

    await expect(card).toContainText(status);
}

export async function navigateTo(page: Page, destination: 'Home' | 'About') {
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('button', { name: destination, exact: true }).click();
}

export async function openBox(page: Page) {
    await page.getByRole('button', { name: 'Open box' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
}

export function boxSection(page: Page, title: 'Party' | 'Box' | 'Death Box') {
    return page
        .getByRole('dialog')
        .getByRole('region', { name: title, exact: true });
}

export async function selectBoxPokemon(
    page: Page,
    title: 'Party' | 'Box' | 'Death Box',
    pokemonName: string,
) {
    await boxSection(page, title)
        .getByRole('button', { name: pokemonName })
        .click();
    await expect(
        page
            .getByRole('dialog')
            .getByRole('region', { name: `${pokemonName} details` }),
    ).toBeVisible();
}

export async function dragBoxPokemon(
    page: Page,
    from: 'Party' | 'Box' | 'Death Box',
    pokemonName: string,
    to: 'Party' | 'Box' | 'Death Box',
) {
    const iconButton = boxSection(page, from).getByRole('button', {
        name: pokemonName,
    });
    const targetSection = boxSection(page, to);
    const iconBox = await iconButton.boundingBox();
    const targetBox = await targetSection.boundingBox();
    if (!iconBox || !targetBox) {
        throw new Error('Unable to determine drag positions for Box sections');
    }

    await page.mouse.move(
        iconBox.x + iconBox.width / 2,
        iconBox.y + iconBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height / 2,
        { steps: 8 },
    );
    await page.mouse.up();
}
