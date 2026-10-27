import { test, expect } from '@playwright/test';
import {
    boxSection,
    cardFor,
    chooseAnalyticsConsentIfPrompted,
    createGame,
    createGameWithTeraRaids,
    expandCollapsedSummary,
    navigateTo,
    openRenameGameDialog,
    openBox,
    resolveEncounter,
    rollEncounter,
    selectBoxPokemon,
    waitForPersistence,
} from './helpers';

test('Home lists the newest game first after reload', async ({ page }) => {
    await page.clock.setFixedTime(new Date(2026, 9, 27, 12, 0, 0));
    await page.goto('/');

    await createGame(page, 'first-run');
    await navigateTo(page, 'Home');
    await page.clock.setFixedTime(new Date(2026, 9, 27, 12, 1, 0));
    await createGame(page, 'second-run');
    await navigateTo(page, 'Home');
    await page.clock.setFixedTime(new Date(2026, 9, 27, 12, 2, 0));
    await createGame(page, 'third-run');
    await navigateTo(page, 'Home');

    const gameList = page
        .getByRole('heading', { name: 'Games' })
        .locator('..')
        .getByRole('list');
    await expect(gameList.getByRole('listitem')).toHaveText([
        /third-run/,
        /second-run/,
        /first-run/,
    ]);
    await expect(gameList.getByText('Started 2026-10-27')).toHaveCount(3);

    await waitForPersistence(page);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Games' })).toBeVisible();
    await expect(gameList.getByRole('listitem')).toHaveText([
        /third-run/,
        /second-run/,
        /first-run/,
    ]);
    await expect(gameList.getByText('Started 2026-10-27')).toHaveCount(3);
});

test('Home welcome follows whether any games are saved', async ({ page }) => {
    await page.goto('/');

    await expect(
        page.getByText(/Guide your Scarlet\/Violet Nuzlocke/),
    ).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Start New Game' }),
    ).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Licenses & Notices' }),
    ).toBeVisible();

    await createGame(page, 'welcome-state-run');
    await navigateTo(page, 'Home');
    await expect(
        page.getByText(/Guide your Scarlet\/Violet Nuzlocke/),
    ).toHaveCount(0);
    await expect(
        page.getByRole('button', { name: 'Licenses & Notices' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Game options' }).click();
    await page.getByRole('button', { name: 'Delete game' }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(
        page.getByText(/Guide your Scarlet\/Violet Nuzlocke/),
    ).toBeVisible();
});

test('Home supports sharing, duplicate imports and persisted deletion', async ({
    page,
    browser,
}) => {
    await page.goto('/');
    await createGameWithTeraRaids(page, 'shared-run', 'unlimited');
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
            importPage.getByRole('heading', {
                name: 'The Paldea nuzlocke guide',
            }),
        ).toHaveCount(0);
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
    const freshCard = page.getByRole('button', { name: /fresh-run/ });
    await expect(freshCard).toContainText('No caught Pokémon');
    await expect(freshCard).toContainText('0%');
});

test('Home game card name can be edited', async ({ page }) => {
    await page.goto('/');

    await createGame(page, 'first-run');
    await navigateTo(page, 'Home');
    await createGame(page, 'second-run');
    await navigateTo(page, 'Home');

    const dialog = await openRenameGameDialog(page, 'first-run');
    const nameInput = dialog.getByLabel('Game name');
    const save = dialog.getByRole('button', { name: 'Save' });

    await expect(nameInput).toHaveValue('first-run');
    await expect(save).toBeDisabled();

    await nameInput.fill('   ');
    await expect(save).toBeDisabled();

    await nameInput.fill('second-run');
    await save.click();
    await expect(dialog).toContainText('Game name already exists: second-run');

    await nameInput.fill('renamed-run');
    await save.click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('button', { name: /renamed-run/ })).toBeVisible();
    await expect(page.getByText('first-run', { exact: true })).toHaveCount(0);

    await waitForPersistence(page);
    await page.reload();
    await expect(page.getByRole('button', { name: /renamed-run/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /second-run/ })).toBeVisible();
    await expect(page.getByText('first-run', { exact: true })).toHaveCount(0);
});
