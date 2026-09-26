import { expect, type Page } from '@playwright/test';

const RANDOMIZE_BUTTON_NAME = /Randomize|Re-roll/;

export function cardFor(page: Page, cardName: string) {
    // Cards render either as a direct <article> (expanded) or as a
    // <div><button/></div> summary shell (collapsed).
    return page.locator('li > article, li > div > button', {
        hasText: cardName,
    });
}

export async function expandCollapsedSummary(page: Page, cardName: string) {
    await cardFor(page, cardName).first().click();
}

async function ensureCardExpanded(page: Page, cardName: string) {
    const card = cardFor(page, cardName).first();
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
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(cardFor(page, 'Starter').first()).toBeVisible();
}

// The game DB write to localStorage is debounced; give it time to flush before a reload.
export async function waitForPersistence(page: Page): Promise<void> {
    await page.waitForTimeout(300);
}

export async function chooseStarter(page: Page): Promise<string> {
    await ensureCardExpanded(page, 'Starter');
    const card = cardFor(page, 'Starter').first();

    await card.getByRole('button', { name: 'Randomize' }).click();
    await expect(card.getByRole('button', { name: 'Randomize' })).toBeHidden();

    const icon = cardFor(page, 'Starter').first().getByRole('img').first();
    await expect(icon).toBeVisible();
    const starter = await icon.getAttribute('alt');
    if (!starter) {
        throw new Error('Chosen starter image is missing alt text');
    }

    await ensureCardExpanded(page, 'Starter');

    return starter;
}

export async function selectStarter(
    page: Page,
    starterName: 'Sprigatito' | 'Fuecoco' | 'Quaxly',
): Promise<void> {
    let starterButton = page
        .locator('article', {
            has: page.getByRole('heading', { name: 'Starter - Cabo poco' }),
        })
        .getByRole('button')
        .filter({ hasText: starterName })
        .first();

    if ((await starterButton.count()) === 0) {
        await expandCollapsedSummary(page, 'Starter');
        starterButton = page
            .locator('article', {
                has: page.getByRole('heading', {
                    name: 'Starter - Cabo poco',
                }),
            })
            .getByRole('button')
            .filter({ hasText: starterName })
            .first();
    }

    await starterButton.click();
    await ensureCardExpanded(page, 'Starter');
    await expect(
        cardFor(page, 'Starter')
            .first()
            .getByRole('button', { name: 'Reset starter choice' }),
    ).toBeVisible();
}

export async function resetStarter(page: Page): Promise<void> {
    await ensureCardExpanded(page, 'Starter');
    const card = cardFor(page, 'Starter').first();
    await card
        .getByRole('button', { name: 'Reset starter choice' })
        .click();
}

export async function rollEncounter(
    page: Page,
    cardName: string,
): Promise<string> {
    await ensureCardExpanded(page, cardName);
    const card = cardFor(page, cardName).first();

    await card.getByRole('button', { name: RANDOMIZE_BUTTON_NAME }).click();
    await expect(card.getByRole('button', { name: 'Re-roll' })).toBeEnabled({
        timeout: 15_000,
    });

    const icon = card.getByRole('img').first();
    await expect(icon).toBeVisible();
    const rolled = await icon.getAttribute('alt');
    if (!rolled) {
        throw new Error('Rolled encounter image is missing alt text');
    }

    return rolled;
}

export async function catchEncounter(
    page: Page,
    cardName: string,
): Promise<string> {
    const rolled = await rollEncounter(page, cardName);
    await resolveEncounter(page, cardName, 'Caught');
    return rolled;
}

export async function resolveEncounter(
    page: Page,
    cardName: string,
    status: 'Caught' | 'Missed' | 'Eliminated',
): Promise<void> {
    await ensureCardExpanded(page, cardName);
    const card = cardFor(page, cardName).first();
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

export async function expectNextStep(page: Page, stepName: string) {
    const nextStepLabel = page.getByText('→ Next step', { exact: true });
    await expect(nextStepLabel).toHaveCount(1);

    const stepCard = cardFor(page, stepName).first();
    await expect(stepCard).toBeVisible();

    const stepItem = page
        .locator('li', { hasText: stepName })
        .filter({ has: page.getByText('→ Next step', { exact: true }) });
    await expect(stepItem).toHaveCount(1);
}

export async function winBossBattle(page: Page, battleName: string) {
    const card = cardFor(page, battleName).first();
    const wonButton = card.getByRole('button', { name: 'Mark won' });
    if ((await wonButton.count()) === 0) {
        await card.click();
    }

    const expandedWonButton = card.getByRole('button', { name: 'Mark won' });
    await expandedWonButton.click();
    await expect(expandedWonButton).toBeDisabled();
}

export async function expectProgressionComplete(page: Page) {
    await expect(
        page.getByRole('heading', { name: /100% complete/ }),
    ).toBeVisible();
    await expect(page.getByText('→ Next step', { exact: true })).toHaveCount(0);
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
