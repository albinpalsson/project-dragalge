import { test, expect } from '@playwright/test';
import {
    cardFor,
    catchEncounter,
    createGame,
    navigateTo,
    selectStarter,
    waitForPersistence,
    winBossBattle,
} from './helpers';

test('progression windows, Home resume and browser history preserve the run', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'checkpoint-window-run');

    await expect(cardFor(page, 'Nemona (Second rival battle)')).toBeVisible();
    await expect(cardFor(page, 'Katy (Gym)')).toHaveCount(0);
    await expect(
        page.getByRole('button', { name: 'Show previous steps', exact: true }),
    ).toHaveCount(0);

    const showMore = page.getByRole('button', {
        name: 'Show more',
        exact: true,
    });
    await expect(showMore).toBeVisible();
    await showMore.click();
    await expect(cardFor(page, 'Katy (Gym)')).toBeVisible();
    await expect(showMore).toHaveCount(0);

    await page.reload();
    await expect(cardFor(page, 'Nemona (Second rival battle)')).toBeVisible();
    await expect(cardFor(page, 'Katy (Gym)')).toHaveCount(0);
    await selectStarter(page, 'Sprigatito');
    await catchEncounter(page, 'Poco Path');
    await catchEncounter(page, 'Inlet Grotto');
    await catchEncounter(page, 'South Province (Area One)');
    await winBossBattle(page, 'Nemona (Second rival battle)');
    await waitForPersistence(page);
    await navigateTo(page, 'Home');
    await page.getByRole('button', { name: /checkpoint-window-run/ }).click();
    await page.reload();

    await expect(cardFor(page, 'Pokemon League (Paldea)')).toBeVisible();
    await expect(cardFor(page, 'Starter')).toHaveCount(0);
    const showPrevious = page.getByRole('button', {
        name: 'Show previous steps',
        exact: true,
    });
    await expect(showPrevious).toBeVisible();
    await showPrevious.click();
    await expect(cardFor(page, 'Starter')).toBeVisible();
    await expect(showPrevious).toHaveCount(0);
    await test.step('menu navigation reaches About with persistent shell', async () => {
        await navigateTo(page, 'About');
        await expect(
            page.getByRole('heading', { name: 'About' }),
        ).toBeVisible();
    });

    await test.step('browser history restores each visited view', async () => {
        await page.goBack();
        await expect(
            page.getByRole('heading', { name: 'checkpoint-window-run' }),
        ).toBeVisible();

        await page.goForward();
        await expect(
            page.getByRole('heading', { name: 'About' }),
        ).toBeVisible();

        await page.reload();
        await expect(
            page.getByRole('heading', { name: 'About' }),
        ).toBeVisible();
    });

    await test.step('navigate Home', async () => {
        await navigateTo(page, 'Home');
        await expect(
            page.getByRole('heading', { name: 'Games' }),
        ).toBeVisible();
    });
});
