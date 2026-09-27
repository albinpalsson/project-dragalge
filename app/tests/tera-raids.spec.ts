import { test, expect } from '@playwright/test';
import {
    cardFor,
    catchEncounter,
    chooseStarter,
    createGame,
    createGameWithTeraRaids,
    expandCollapsedSummary,
    expectNextStep,
    winBossBattle,
} from './helpers';

test('Tera Raid card is hidden when the setting is None', async ({ page }) => {
    await page.goto('/');
    await createGameWithTeraRaids(page, 'raid-none-run', 'none');

    await expect(page.getByText('★ Tera Raid')).toHaveCount(0);
});

test('banned Pokemon are excluded from Tera Raid suggestions', async ({
    page,
}) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start New Game' }).click();
    await page.getByLabel('Name (optional)').fill('raid-ban-run');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    const addBanInput = page.getByRole('combobox', {
        name: 'Add a Pokémon ban',
    });
    await addBanInput.fill('Hoppip');
    await addBanInput.press('Enter');

    await page.getByLabel('Tera raids').selectOption('single');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(cardFor(page, 'Starter').first()).toBeVisible();

    await expandCollapsedSummary(page, 'Tera Raid ★');
    const addInput = page.getByRole('combobox', {
        name: 'Add a 1-star Tera Raid Pokémon',
    });
    await addInput.fill('Hoppip');
    await expect(page.getByRole('option', { name: 'Hoppip' })).toHaveCount(0);
});

test('a Single-mode Tera Raidonly allows one Pokemon', async ({
    page,
}) => {
    await page.goto('/');
    await createGameWithTeraRaids(page, 'raid-single-run', 'single');

    await expandCollapsedSummary(page, 'Tera Raid ★');
    const addInput = page.getByRole('combobox', {
        name: 'Add a 1-star Tera Raid Pokémon',
    });
    await addInput.fill('Hoppip');
    await addInput.press('Enter');

    const card = cardFor(page, 'Tera Raid ★').first();
    await card.getByRole('button', { name: 'Caught', exact: true }).click();
    await expect(card).toContainText('Caught');
    await card.getByRole('button', { name: 'Collapse Tera Raid' }).click();
    await expect(cardFor(page, 'Tera Raid ★').first()).toContainText('Caught');

    await expect(
        page.getByRole('combobox', {
            name: 'Add a 1-star Tera Raid Pokémon',
        }),
    ).toHaveCount(0);
});

test('Unlimited Tera Raids allow multiple Pokemon and never become a required step', async ({
    page,
}) => {
    await page.goto('/');
    await createGameWithTeraRaids(page, 'raid-unlimited-run', 'unlimited');
    await chooseStarter(page);
    await catchEncounter(page, 'Poco Path');
    await catchEncounter(page, 'Inlet Grotto');
    await catchEncounter(page, 'South Province (Area One)');
    await winBossBattle(page, 'Nemona (Second Battle)');

    await expectNextStep(page, 'Pokemon League (Paldea)');

    await expandCollapsedSummary(page, 'Tera Raid ★');
    const addInput = page.getByRole('combobox', {
        name: 'Add a 1-star Tera Raid Pokémon',
    });
    await addInput.fill('Hoppip');
    await addInput.press('Enter');

    const card = cardFor(page, 'Tera Raid ★').first();
    await expect(card.getByText('Hoppip', { exact: true })).toBeVisible();

    await addInput.fill('Skiploom');
    await addInput.press('Enter');
    await expect(card.getByText('Skiploom', { exact: true })).toBeVisible();
    await expect(
        page.getByRole('combobox', {
            name: 'Add a 1-star Tera Raid Pokémon',
        }),
    ).toBeVisible();

    await card
        .locator('li', { hasText: 'Hoppip' })
        .getByRole('button', { name: 'Caught', exact: true })
        .click();
    await card.getByRole('button', { name: 'Collapse Tera Raid' }).click();
    await expect(
        cardFor(page, 'Tera Raid ★')
            .first()
            .getByText('Caught', { exact: true }),
    ).toHaveCount(0);
});
