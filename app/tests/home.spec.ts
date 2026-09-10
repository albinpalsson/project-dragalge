import { test, expect } from '@playwright/test';
import {
    boxSection,
    cardFor,
    createGame,
    navigateTo,
    openBox,
    openGame,
    resolveEncounter,
    rollEncounter,
    selectBoxPokemon,
} from './helpers';

test('home game cards show the Pokemon obtained in a run', async ({ page }) => {
    await page.goto('/');
    await createGame(page, 'card-run');
    await openGame(page, 'card-run');

    const rolled = await rollEncounter(page, 'Poco Path');
    await resolveEncounter(page, 'Poco Path', 'Caught');

    await navigateTo(page, 'Home');

    const gameCard = page.getByRole('button', { name: /card-run/ });
    await expect(gameCard).toContainText('1 caught');
    await expect(gameCard.getByRole('img', { name: rolled })).toBeVisible();
});

test('home game cards list party members before the rest', async ({ page }) => {
    await page.goto('/');
    await createGame(page, 'party-order-run');
    await openGame(page, 'party-order-run');

    const pocoPath = await rollEncounter(page, 'Poco Path');
    await resolveEncounter(page, 'Poco Path', 'Caught');
    const inletGrotto = await rollEncounter(page, 'Inlet Grotto');
    await resolveEncounter(page, 'Inlet Grotto', 'Caught');

    await openBox(page);
    await selectBoxPokemon(page, 'Party', pocoPath);
    await page
        .getByRole('region', { name: `${pocoPath} details` })
        .getByRole('button', { name: 'Remove from party' })
        .click();
    await expect(
        boxSection(page, 'Box').getByRole('img', { name: pocoPath }),
    ).toBeVisible();

    await navigateTo(page, 'Home');

    const gameCard = page.getByRole('button', { name: /party-order-run/ });
    await expect(gameCard.getByRole('img').first()).toHaveAttribute(
        'alt',
        inletGrotto,
    );
});

test('clearing a roll allows rolling again', async ({ page }) => {
    await page.goto('/');
    await createGame(page, 'reroll-run');
    await openGame(page, 'reroll-run');

    const card = cardFor(page, 'Poco Path');
    const randomize = card.getByRole('button', { name: 'Randomize' });

    await rollEncounter(page, 'Poco Path');
    await expect(randomize).toBeDisabled();

    await resolveEncounter(page, 'Poco Path', 'Missed');
    await expect(randomize).toBeDisabled();

    await card.getByRole('button', { name: 'Clear' }).click();
    await expect(randomize).toBeEnabled();
});

test('the start-game modal can be dismissed', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Start New Game' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    await page.getByRole('button', { name: 'Start New Game' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();

    await expect(page.getByRole('listitem')).toHaveCount(0);
});

test('header stays visible across views and the menu navigates', async ({
    page,
}) => {
    await page.goto('/');
    await expect(page.getByText('PokeDB')).toBeVisible();

    await navigateTo(page, 'About');
    await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();
    await expect(page.getByText('PokeDB')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();

    await navigateTo(page, 'Home');
    await expect(page.getByRole('heading', { name: 'Games' })).toBeVisible();
});
