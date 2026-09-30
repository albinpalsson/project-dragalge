import { test, expect } from '@playwright/test';
import {
    boxSection,
    createGame,
    navigateTo,
    openBox,
    resolveEncounter,
    rollEncounter,
    selectBoxPokemon,
} from './helpers';

test('home game cards show the Pokemon obtained in a run', async ({ page }) => {
    await page.goto('/');
    await createGame(page, 'card-run');

    const pocoPath = await rollEncounter(page, 'Poco Path');
    await resolveEncounter(page, 'Poco Path', 'Caught');
    const inletGrotto = await rollEncounter(page, 'Inlet Grotto');
    await resolveEncounter(page, 'Inlet Grotto', 'Caught');

    await openBox(page);
    await selectBoxPokemon(page, 'Party', pocoPath);
    const pocoPathDetails = page.getByRole('region', {
        name: `${pocoPath} details`,
    });
    await pocoPathDetails.getByRole('button', { name: 'More options' }).click();
    await pocoPathDetails
        .getByRole('button', { name: 'Remove from party' })
        .click();
    await expect(
        boxSection(page, 'Box').getByRole('img', { name: pocoPath }),
    ).toBeVisible();

    await page.keyboard.press('Escape');
    await navigateTo(page, 'Home');

    const gameCard = page.getByRole('button', { name: /card-run/ });
    await expect(gameCard.getByRole('img', { name: pocoPath })).toBeVisible();
    await expect(
        gameCard.getByRole('img', { name: inletGrotto }),
    ).toBeVisible();
    await expect(gameCard.getByRole('img').first()).toHaveAttribute(
        'alt',
        inletGrotto,
    );
});

test('a game can be exported and imported from its shareable link', async ({
    page,
    browser,
}) => {
    await page.goto('/');
    await createGame(page, 'shared-run');
    const caughtPokemon = await rollEncounter(page, 'Poco Path');
    await resolveEncounter(page, 'Poco Path', 'Caught');
    await navigateTo(page, 'Home');

    await page.getByRole('button', { name: 'Game options' }).click();
    await page.getByRole('button', { name: 'Export game' }).click();
    const linkInput = page.getByLabel('Shareable link');
    await expect(linkInput).toBeVisible();
    const exportLink = await linkInput.inputValue();
    await page.mouse.click(5, 5);
    await page.keyboard.press('Escape');
    await expect(
        page.getByRole('dialog', { name: 'Export game' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Close dialog' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    const importContext = await browser.newContext();
    const importPage = await importContext.newPage();
    await importPage.goto(exportLink);
    await expect(importPage.getByRole('dialog')).toBeVisible();
    await importPage.mouse.click(5, 5);
    await importPage.keyboard.press('Escape');
    await expect(
        importPage.getByRole('dialog', { name: 'Import game' }),
    ).toBeVisible();
    await expect(importPage.getByLabel('Name this game')).toHaveValue(
        'shared-run',
    );
    await importPage.getByRole('button', { name: 'Import' }).click();
    await expect(
        importPage.getByRole('heading', { name: 'Games' }),
    ).toBeVisible();
    await expect(
        importPage.getByRole('img', { name: caughtPokemon }),
    ).toBeVisible();
    await expect(importPage.getByRole('dialog')).toBeHidden();

    const duplicateImportPage = await importContext.newPage();
    await duplicateImportPage.goto(exportLink);
    await expect(duplicateImportPage.getByLabel('Name this game')).toHaveValue(
        'shared-run',
    );
    await duplicateImportPage.getByRole('button', { name: 'Import' }).click();
    await expect(
        duplicateImportPage.getByRole('button', { name: /shared-run-1/ }),
    ).toBeVisible();
    const dismissImportPage = await importContext.newPage();
    await dismissImportPage.goto(exportLink);
    await expect(
        dismissImportPage.getByRole('dialog', { name: 'Import game' }),
    ).toBeVisible();
    await dismissImportPage
        .getByRole('button', { name: 'Close dialog' })
        .click();
    await expect(dismissImportPage.getByRole('dialog')).toBeHidden();
    await importContext.close();
});
