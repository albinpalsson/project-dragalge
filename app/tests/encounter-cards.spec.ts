import { test, expect } from '@playwright/test';
import {
    boxSection,
    cardFor,
    chooseAnalyticsConsentIfPrompted,
    createGame,
    expandCollapsedSummary,
    openBox,
    resolveEncounter,
    rollEncounter,
    selectBoxPokemon,
    showMoreProgression,
    waitForPersistence,
} from './helpers';

test('compact encounter and battle labels fit phone-width viewports', async ({
    page,
}) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/');
    await createGame(page, 'compact-header-mobile-run');

    const areaCard = cardFor(page, 'South Province (A1)').first();
    const battleCard = cardFor(page, 'Nemona (2nd rival battle)').first();
    await expect(areaCard).toBeVisible();
    await expect(battleCard).toBeVisible();

    for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 800 });
        await expect
            .poll(() =>
                page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <=
                        window.innerWidth,
                ),
            )
            .toBe(true);

        for (const card of [areaCard, battleCard]) {
            const bounds = await card.evaluate((element) => {
                const { left, right } = element.getBoundingClientRect();
                return { left, right, viewportWidth: window.innerWidth };
            });
            expect(bounds.left).toBeGreaterThanOrEqual(0);
            expect(bounds.right).toBeLessThanOrEqual(bounds.viewportWidth);
        }
    }
});

test('missed encounters stay out of Box and can be rerolled after reload', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'reroll-run');

    const card = cardFor(page, 'Poco Path');
    await expect(
        card.first().getByText('South Province', { exact: true }),
    ).toHaveCount(0);
    await expect(card.first().getByText(/^Lv /)).toBeVisible();

    const missed = await rollEncounter(page, 'Poco Path');
    await resolveEncounter(page, 'Poco Path', 'Missed');
    await openBox(page);
    await expect(
        page
            .getByRole('dialog')
            .getByRole('img', { name: missed, exact: true }),
    ).toHaveCount(0);
    await page.getByRole('button', { name: 'Close dialog' }).click();

    await waitForPersistence(page);
    await page.reload();

    const reloadedCard = cardFor(page, 'Poco Path');
    await expect(reloadedCard).toContainText('Missed');
    await expect(reloadedCard.getByText(/^Lv /)).toHaveCount(0);
    await expect(
        reloadedCard.getByRole('button', { name: 'Randomize' }),
    ).toBeHidden();
    await expandCollapsedSummary(page, 'Poco Path');
    const expandedCard = cardFor(page, 'Poco Path').first();
    await expect(
        expandedCard.getByText('South Province', { exact: true }),
    ).toBeVisible();
    await expect(
        expandedCard.locator('header').first().getByText(/^Lv /),
    ).toHaveCount(0);
    await expect(
        cardFor(page, 'Poco Path').getByRole('button', { name: 'Re-roll' }),
    ).toBeVisible();
    await rollEncounter(page, 'Poco Path');
    await expect(
        expandedCard.locator('header').first().getByText(/^Lv /),
    ).toBeVisible();
    await expect(
        card.getByRole('button', { name: 'Caught', exact: true }),
    ).toBeEnabled();
});

test('caught encounters update dupes and preserve manual, dupes, and mono reason precedence', async ({
    page,
}) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start New Game' }).click();
    await page.getByLabel('Name (optional)').fill('dupes-hoppip-run');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('checkbox', { name: 'Dupes clause' }).check();
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await chooseAnalyticsConsentIfPrompted(page);

    const pocoPathCard = cardFor(page, 'Poco Path').first();
    await pocoPathCard.click();
    await pocoPathCard.getByRole('button', { name: 'Show encounters' }).click();
    const pocoHoppip = pocoPathCard.getByRole('button', {
        name: 'Pick Hoppip',
        exact: true,
    });
    await expect(pocoHoppip).toBeEnabled();
    await page.getByRole('button', { name: 'Game settings' }).click();
    const addBan = page.getByRole('combobox', {
        name: 'Add a Pok\u00e9mon ban',
    });
    await addBan.fill('Skiploom');
    await addBan.press('Enter');
    await expect(pocoHoppip).toBeDisabled();
    await expect(
        pocoPathCard.locator('tr', { hasText: 'Hoppip' }),
    ).toContainText('Banned by game settings');
    await page
        .getByRole('button', { name: 'Remove Skiploom from ban list' })
        .click();
    await expect(pocoHoppip).toBeEnabled();
    await page.getByRole('button', { name: 'Close dialog' }).click();
    await pocoPathCard
        .locator('tr', { hasText: 'Hoppip' })
        .first()
        .getByRole('button', { name: 'Pick Hoppip' })
        .click();
    await resolveEncounter(page, 'Poco Path', 'Caught');

    const southProvinceCard = cardFor(page, 'South Province (A1)').first();
    await southProvinceCard.click();
    await southProvinceCard
        .getByRole('button', { name: 'Show encounters' })
        .click();

    const hoppipRow = southProvinceCard
        .locator('tr', { hasText: 'Hoppip' })
        .first();
    await expect(hoppipRow).toContainText('Dupes clause');
    await expect(
        hoppipRow.getByRole('button', { name: 'Pick Hoppip' }),
    ).toBeDisabled();

    await resolveEncounter(page, 'Poco Path', 'Eliminated');
    await expect(hoppipRow).toContainText('Dupes clause');

    await page.getByRole('button', { name: 'Game settings' }).click();
    await page.getByLabel('Mono run').check();
    await page
        .getByRole('combobox', { name: 'Mono type', exact: true })
        .selectOption('normal');
    await expect(page.getByLabel('Mono type')).toHaveValue('normal');
    await expect(page.getByText('Saving...', { exact: true })).toHaveCount(0);
    await expect(hoppipRow).toContainText('Dupes clause');
    const banInput = page.getByRole('combobox', {
        name: 'Add a Pok\u00e9mon ban',
    });
    await banInput.fill('Hoppip');
    await banInput.press('Enter');
    await expect(hoppipRow).toContainText('Banned by game settings');
    await expect(hoppipRow).not.toContainText('Dupes clause');
    await page
        .getByRole('button', { name: 'Remove Hoppip from ban list' })
        .click();
    await expect(hoppipRow).toContainText('Dupes clause');
    await expect(hoppipRow).not.toContainText('Not allowed in mono run');
    await page.getByRole('button', { name: 'Close dialog' }).click();

    await resolveEncounter(page, 'Poco Path', 'Missed');
    await expect(hoppipRow).toContainText('Not allowed in mono run');
    await expect(hoppipRow).not.toContainText('Dupes clause');
    await resolveEncounter(page, 'Poco Path', 'Caught');
    await expect(hoppipRow).toContainText('Dupes clause');

    await page.getByRole('button', { name: 'Game settings' }).click();
    await page.getByLabel('Dupes clause').uncheck();
    await expect(hoppipRow).toContainText('Not allowed in mono run');
    await page.getByRole('button', { name: 'Close dialog' }).click();
});

test('evolution preserves the original grouped encounter name and icon', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'original-form-run', { preset: 'Clean' });
    await showMoreProgression(page);
    const location = 'South Province (A2)';
    const original = 'Flab\u00e9b\u00e9 (Red Flower)';
    const group = 'Flab\u00e9b\u00e9';
    await expandCollapsedSummary(page, location);

    const card = cardFor(page, location).first();
    await card.getByRole('button', { name: 'Show encounters' }).click();
    await card
        .getByRole('button', { name: `Pick ${original}`, exact: true })
        .first()
        .click();
    await card.getByRole('button', { name: 'Hide encounters' }).click();
    const icon = card.getByRole('img', { name: group, exact: true });
    await expect(icon).toBeVisible();
    const originalSource = await icon.getAttribute('src');
    if (!originalSource) {
        throw new Error('Original encounter icon is missing');
    }
    await resolveEncounter(page, location, 'Caught');
    await openBox(page);
    await selectBoxPokemon(page, 'Party', original);
    const evolution = page.getByRole('region', {
        name: 'Evolution',
        exact: true,
    });
    const evolved = await evolution.locator('strong').first().innerText();
    expect(evolved).toMatch(/^Floette/);
    await evolution
        .getByRole('button', { name: 'Evolve', exact: true })
        .click();
    await expect(
        boxSection(page, 'Party').getByRole('img', {
            name: evolved,
            exact: true,
        }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Close dialog' }).click();
    await expect(card.getByText(`${group} Caught`, { exact: true })).toHaveText(
        `${group} Caught`,
    );
    await expect(icon).toHaveAttribute('src', originalSource);

    await waitForPersistence(page);
    await page.reload();
    await showMoreProgression(page);
    await expect(card.getByText(group, { exact: true })).toBeVisible();
    await expect(icon).toHaveAttribute('src', originalSource);
    await expandCollapsedSummary(page, location);
    await expect(card.getByText(`${group} Caught`, { exact: true })).toHaveText(
        `${group} Caught`,
    );
    await expect(icon).toHaveAttribute('src', originalSource);
    await openBox(page);
    await expect(
        boxSection(page, 'Party').getByRole('img', {
            name: evolved,
            exact: true,
        }),
    ).toBeVisible();
});

test('available Paldea trade offers replace and restore the current encounter Pokemon', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'trade-run', { preset: 'Clean' });

    const openEncounter = async (locationName: string) => {
        for (let attempt = 0; attempt < 20; attempt += 1) {
            const target = cardFor(page, locationName).first();
            if (await target.isVisible()) {
                break;
            }
            const showMore = page.getByRole('button', {
                name: 'Show more',
                exact: true,
            });
            if ((await showMore.count()) === 0) {
                throw new Error(`Could not reveal ${locationName}`);
            }
            await showMore.click();
        }

        let card = cardFor(page, locationName).first();
        await expect(card).toBeVisible();
        if (
            (await card
                .getByRole('button', { name: 'Show encounters' })
                .count()) === 0 &&
            (await card
                .getByRole('button', { name: 'Hide encounters' })
                .count()) === 0
        ) {
            await card.click();
            card = cardFor(page, locationName).first();
        }
        const showEncounters = card.getByRole('button', {
            name: 'Show encounters',
        });
        if ((await showEncounters.count()) > 0) {
            await showEncounters.click();
        }
        return cardFor(page, locationName).first();
    };

    const pickEncounter = async (locationName: string, pokemonName: string) => {
        const card = await openEncounter(locationName);
        await card
            .getByRole('button', { name: `Pick ${pokemonName}`, exact: true })
            .first()
            .click();
        return cardFor(page, locationName).first();
    };

    const flabebeLocation = 'South Province (A2)';
    const flabebe = 'Flab\u00e9b\u00e9 (Blue Flower)';
    let card = await pickEncounter(flabebeLocation, flabebe);
    await expect(card).toContainText(
        'Flab\u00e9b\u00e9 can be traded for a Snom (Lv. 10) in Cortondo from a girl on the main path of the city. Mark trade here to change the species in your box.',
    );
    await resolveEncounter(page, flabebeLocation, 'Caught');
    await card.getByRole('button', { name: 'Trade', exact: true }).click();
    await expect(
        card.getByRole('img', { name: 'Flab\u00e9b\u00e9', exact: true }),
    ).toBeVisible();
    await expect(card).toContainText('Caught');
    await expect(card).toContainText('Found in');

    await openBox(page);
    await expect(
        boxSection(page, 'Party').getByRole('img', {
            name: 'Snom',
            exact: true,
        }),
    ).toBeVisible();

    await selectBoxPokemon(page, 'Party', 'Snom');
    const evolution = page.getByRole('region', {
        name: 'Evolution',
        exact: true,
    });
    const evolvedPokemon = await evolution
        .locator('strong')
        .first()
        .innerText();
    await evolution
        .getByRole('button', { name: 'Evolve', exact: true })
        .click();
    await expect(
        boxSection(page, 'Party').getByRole('img', {
            name: evolvedPokemon,
            exact: true,
        }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Close dialog' }).click();
    await expect(
        card.getByRole('button', { name: 'Undo trade', exact: true }),
    ).toBeVisible();

    await waitForPersistence(page);
    await page.reload();
    card = await openEncounter(flabebeLocation);
    await expect(
        card.getByRole('img', { name: 'Flab\u00e9b\u00e9', exact: true }),
    ).toBeVisible();
    await expect(
        card.getByRole('button', { name: 'Undo trade', exact: true }),
    ).toBeVisible();
    await card.getByRole('button', { name: 'Undo trade', exact: true }).click();
    await expect(
        card.getByRole('img', { name: 'Flab\u00e9b\u00e9', exact: true }),
    ).toBeVisible();
    await expect(card).toContainText('Caught');

    card = await pickEncounter('South Province (A1)', 'Wooper (Paldean Form)');
    await expect(card).toContainText(
        'Paldean Wooper can be traded for a Johtonian Wooper (Lv. 18) in Cascarrafa from a trainer next to the center fountain. Mark trade here to change the species in your box.',
    );
    await card.getByRole('button', { name: 'Trade', exact: true }).click();
    await expect(
        card.getByRole('img', {
            name: 'Wooper (Paldean Form)',
            exact: true,
        }),
    ).toBeVisible();
    await card.getByRole('button', { name: 'Undo trade', exact: true }).click();
    await expect(
        card.getByRole('img', {
            name: 'Wooper (Paldean Form)',
            exact: true,
        }),
    ).toBeVisible();
});
