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

    const southProvinceCard = cardFor(page, 'South Province (Area One)').first();
    await southProvinceCard.click();
    await southProvinceCard.getByRole('button', { name: 'Show encounters' }).click();

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

    const southProvinceCard = cardFor(page, 'South Province (Area One)').first();
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
