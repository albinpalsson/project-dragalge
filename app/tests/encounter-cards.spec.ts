import { test, expect } from '@playwright/test';
import {
    boxSection,
    cardFor,
    createGame,
    expandCollapsedSummary,
    openBox,
    resolveEncounter,
    rollEncounter,
    showMoreProgression,
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

test('West Province can exclude ocean encounters and remember the setting', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'west-province-ocean-run');
    await showMoreProgression(page);
    await expandCollapsedSummary(page, 'West Province (Area One)');

    const card = cardFor(page, 'West Province (Area One)').first();
    const includeOcean = card.getByRole('checkbox', {
        name: 'Include ocean encounters',
    });
    await expect(includeOcean).not.toBeChecked();
    await includeOcean.check();
    await card.getByRole('button', { name: 'Show encounters' }).click();
    await expect(
        card.locator('tr', { hasText: 'Ocean' }).first(),
    ).toBeVisible();

    await includeOcean.uncheck();
    await expect(card.locator('tr', { hasText: 'Ocean' })).toHaveCount(0);
    await waitForPersistence(page);
    await page.reload();

    await showMoreProgression(page);
    await expandCollapsedSummary(page, 'West Province (Area One)');
    const reloadedCard = cardFor(page, 'West Province (Area One)').first();
    await expect(
        reloadedCard.getByRole('checkbox', {
            name: 'Include ocean encounters',
        }),
    ).not.toBeChecked();
    await reloadedCard.getByRole('button', { name: 'Show encounters' }).click();
    await expect(reloadedCard.locator('tr', { hasText: 'Ocean' })).toHaveCount(
        0,
    );
});

test('a manual ban blocks the full evolution line when enabled', async ({
    page,
}) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start New Game' }).click();
    await page.getByLabel('Name (optional)').fill('full-evolution-ban-run');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    await expect(
        page.getByRole('checkbox', { name: 'Ban full evolution lines' }),
    ).toBeChecked();
    const addBanInput = page.getByRole('combobox', {
        name: 'Add a Pokémon ban',
    });
    await addBanInput.fill('Skiploom');
    await addBanInput.press('Enter');
    await page.getByRole('button', { name: 'Start', exact: true }).click();

    const southProvinceCard = cardFor(
        page,
        'South Province (Area One)',
    ).first();
    await southProvinceCard.click();
    await southProvinceCard
        .getByRole('button', { name: 'Show encounters' })
        .click();

    const hoppipRow = southProvinceCard
        .locator('tr', { hasText: 'Hoppip' })
        .first();
    await expect(hoppipRow).toContainText('Banned by game settings');
    await expect(
        hoppipRow.getByRole('button', { name: 'Pick Hoppip' }),
    ).toBeDisabled();
});

test('catching Hoppip in Poco Path blocks it by dupes in South Province (Area One)', async ({
    page,
}) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start New Game' }).click();
    await page.getByLabel('Name (optional)').fill('dupes-hoppip-run');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('checkbox', { name: 'Dupes clause' }).check();
    await page.getByRole('button', { name: 'Start', exact: true }).click();

    const pocoPathCard = cardFor(page, 'Poco Path').first();
    await pocoPathCard.click();
    await pocoPathCard.getByRole('button', { name: 'Show encounters' }).click();
    await pocoPathCard
        .locator('tr', { hasText: 'Hoppip' })
        .first()
        .getByRole('button', { name: 'Pick Hoppip' })
        .click();
    await resolveEncounter(page, 'Poco Path', 'Caught');

    const southProvinceCard = cardFor(
        page,
        'South Province (Area One)',
    ).first();
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
});

test('a manually picked form displays its group and remains concrete when caught', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'manual-form-run');
    await showMoreProgression(page);
    await expandCollapsedSummary(page, 'West Province (Area One)');

    const card = cardFor(page, 'West Province (Area One)').first();
    await card.getByRole('button', { name: 'Show encounters' }).click();
    await card
        .locator('tr', { hasText: 'Basculin (Red-Striped)' })
        .first()
        .getByRole('button', { name: 'Pick Basculin (Red-Striped)' })
        .click();

    await expect(
        card.getByRole('img', { name: 'Basculin', exact: true }),
    ).toBeVisible();
    await resolveEncounter(page, 'West Province (Area One)', 'Caught');
    await openBox(page);
    await expect(
        boxSection(page, 'Party').getByRole('img', {
            name: 'Basculin (Red-Striped)',
            exact: true,
        }),
    ).toBeVisible();
});
