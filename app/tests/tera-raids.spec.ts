import { test, expect } from '@playwright/test';
import {
    cardFor,
    catchEncounter,
    chooseStarter,
    createGameWithTeraRaids,
    expandCollapsedSummary,
    expectNextStep,
    boxSection,
    openBox,
    showMoreProgression,
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

    await showMoreProgression(page);
    await expandCollapsedSummary(page, 'Tera Raid ★');
    const addInput = page.getByRole('combobox', {
        name: 'Add a 1-star Tera Raid Pokémon',
    });
    await addInput.fill('Hoppip');
    await expect(page.getByRole('option', { name: 'Hoppip' })).toHaveCount(0);
});

test('a Single-mode Tera Raidonly allows one Pokemon', async ({ page }) => {
    await page.goto('/');
    await createGameWithTeraRaids(page, 'raid-single-run', 'single');

    await showMoreProgression(page);
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

test('grouped Tera Raid selections display the group and keep concrete forms', async ({
    page,
}) => {
    await page.goto('/');
    await createGameWithTeraRaids(page, 'raid-group-run', 'unlimited');

    await showMoreProgression(page);
    await expandCollapsedSummary(page, 'Tera Raid ★');
    const card = cardFor(page, 'Tera Raid ★').first();
    const addInput = card.getByRole('combobox', {
        name: 'Add a 1-star Tera Raid Pokémon',
    });

    await addInput.fill('Basculin');
    await card.getByRole('option', { name: 'Basculin', exact: true }).click();
    await expect(
        card.getByRole('img', { name: 'Basculin', exact: true }),
    ).toBeVisible();

    await addInput.fill('Basculin (Red-Striped)');
    await card
        .getByRole('option', {
            name: 'Basculin (Red-Striped)',
            exact: true,
        })
        .click();
    await expect(
        card.getByRole('img', { name: 'Basculin', exact: true }),
    ).toHaveCount(2);

    await card
        .locator('li', { hasText: 'Basculin' })
        .first()
        .getByRole('button', { name: 'Caught', exact: true })
        .click();
    await card
        .locator('li', { hasText: 'Basculin' })
        .nth(1)
        .getByRole('button', { name: 'Caught', exact: true })
        .click();

    await openBox(page);
    await expect(
        boxSection(page, 'Party').getByRole('img', {
            name: 'Basculin (Red-Striped)',
            exact: true,
        }),
    ).toBeVisible();
    await expect(
        boxSection(page, 'Party').getByRole('img', {
            name: /Basculin \((Red-Striped|Blue-Striped)\)/,
        }),
    ).toHaveCount(2);
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
    await winBossBattle(page, 'Nemona (Second rival battle)');

    await showMoreProgression(page);
    await expectNextStep(page, 'Pokemon League (Paldea)');

    await expandCollapsedSummary(page, 'Tera Raid ★');
    const addInput = page.getByRole('combobox', {
        name: 'Add a 1-star Tera Raid Pokémon',
    });
    await addInput.fill('Basculin');
    await addInput.press('Enter');

    const card = cardFor(page, 'Tera Raid ★').first();
    await expect(card.getByText('Basculin', { exact: true })).toBeVisible();

    await addInput.fill('Capsakid');
    await addInput.press('Enter');
    await expect(card.getByText('Capsakid', { exact: true })).toBeVisible();
    await expect(
        page.getByRole('combobox', {
            name: 'Add a 1-star Tera Raid Pokémon',
        }),
    ).toBeVisible();

    await card
        .locator('li', { hasText: 'Basculin' })
        .getByRole('button', { name: 'Caught', exact: true })
        .click();
    await card.getByRole('button', { name: 'Collapse Tera Raid' }).click();
    await expect(
        cardFor(page, 'Tera Raid ★')
            .first()
            .getByText('Caught', { exact: true }),
    ).toHaveCount(0);
});
