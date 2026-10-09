import { test, expect } from '@playwright/test';
import {
    boxSection,
    cardFor,
    chooseAnalyticsConsentIfPrompted,
    createGame,
    createGameWithTeraRaids,
    expandCollapsedSummary,
    navigateTo,
    openBox,
    resolveEncounter,
    rollEncounter,
    selectBoxPokemon,
    showMoreProgression,
    waitForPersistence,
} from './helpers';

test('Home supports sharing, duplicate imports and persisted deletion', async ({
    page,
    browser,
}) => {
    await page.goto('/');
    await createGameWithTeraRaids(page, 'shared-run', 'unlimited');
    await showMoreProgression(page);
    await expandCollapsedSummary(page, 'Tera Raid ★');
    const raidCard = cardFor(page, 'Tera Raid ★').first();
    const addPokemon = raidCard.getByRole('combobox', {
        name: 'Add a 1-star Tera Raid Pokémon',
    });
    await addPokemon.fill('Basculin');
    await raidCard
        .getByRole('option', { name: 'Basculin', exact: true })
        .click();
    await expect(
        raidCard.getByRole('img', { name: 'Basculin', exact: true }),
    ).toBeVisible();
    await raidCard.getByRole('button', { name: 'Caught', exact: true }).click();
    await openBox(page);
    const caughtPokemon = await boxSection(page, 'Party')
        .getByRole('img')
        .first()
        .getAttribute('alt');
    if (!caughtPokemon) {
        throw new Error('Caught Pokémon is missing alt text');
    }
    expect(caughtPokemon).toMatch(/^Basculin \((Red-Striped|Blue-Striped)\)$/);
    await selectBoxPokemon(page, 'Party', caughtPokemon);
    const details = page.getByRole('region', {
        name: `${caughtPokemon} details`,
    });
    await details.getByRole('button', { name: 'More options' }).click();
    await details.getByRole('button', { name: 'Remove from party' }).click();
    await expect(
        boxSection(page, 'Box').getByRole('img', { name: caughtPokemon }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    const partyPokemon = await rollEncounter(page, 'Poco Path');
    await resolveEncounter(page, 'Poco Path', 'Caught');
    await navigateTo(page, 'Home');
    const gameCard = page.getByRole('button', { name: /shared-run/ });
    await expect(gameCard.getByRole('img')).toHaveCount(2);
    await expect(
        gameCard.getByRole('img', { name: partyPokemon }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Game options' }).click();
    await page.getByRole('button', { name: 'Export game' }).click();
    const linkInput = page.getByLabel('Shareable link');
    await expect(linkInput).toBeVisible();
    const exportLink = await linkInput.inputValue();
    await page.getByRole('button', { name: 'Close dialog' }).click();

    const importContext = await browser.newContext();
    try {
        const importPage = await importContext.newPage();
        await importPage.goto(exportLink);
        await expect(importPage.getByLabel('Name this game')).toHaveValue(
            'shared-run',
        );
        await importPage.getByRole('button', { name: 'Import' }).click();
        await chooseAnalyticsConsentIfPrompted(importPage);
        await expect(
            importPage.getByRole('heading', { name: 'Games' }),
        ).toBeVisible();
        await expect(
            importPage.getByRole('img', { name: caughtPokemon }),
        ).toBeVisible();
        await expect(importPage.getByRole('dialog')).toBeHidden();

        await waitForPersistence(importPage);
        await importPage.goto('about:blank');
        await importPage.goto(exportLink);
        await expect(importPage.getByLabel('Name this game')).toHaveValue(
            'shared-run',
        );
        await importPage.getByRole('button', { name: 'Import' }).click();
        await expect(
            importPage.getByRole('button', { name: /shared-run-1/ }),
        ).toBeVisible();
    } finally {
        await importContext.close();
    }

    await page.getByRole('button', { name: 'Game options' }).click();
    await page.getByRole('button', { name: 'Delete game' }).click();
    await expect(
        page.getByRole('dialog', { name: 'Delete game' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(gameCard).toBeVisible();

    await page.getByRole('button', { name: 'Game options' }).click();
    await page.getByRole('button', { name: 'Delete game' }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(gameCard).toBeHidden();

    await waitForPersistence(page);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Games' })).toBeVisible();
    await expect(gameCard).toBeHidden();

    // The freed id is reused, so the new game must not inherit old rows.
    await createGame(page, 'fresh-run');
    await navigateTo(page, 'Home');
    await expect(page.getByRole('button', { name: /fresh-run/ })).toContainText(
        'No caught Pokémon',
    );
});
