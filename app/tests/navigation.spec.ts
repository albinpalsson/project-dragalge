import { test, expect } from '@playwright/test';
import {
    cardFor,
    catchEncounter,
    createGame,
    createGameWithTeraRaids,
    navigateTo,
    selectStarter,
    waitForPersistence,
    winBossBattle,
} from './helpers';

test('checkpoint controls reveal progression and reset on reload', async ({
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
});

test('previous steps are revealed before the opening window', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'checkpoint-previous-run');

    await selectStarter(page, 'Sprigatito');
    await catchEncounter(page, 'Poco Path');
    await catchEncounter(page, 'Inlet Grotto');
    await catchEncounter(page, 'South Province (Area One)');
    await winBossBattle(page, 'Nemona (Second rival battle)');
    await waitForPersistence(page);
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
});

test('short checkpoint sections extend through the second checkpoint', async ({
    page,
}) => {
    await page.goto('/');
    await createGameWithTeraRaids(page, 'checkpoint-fallback-run', 'single');

    await selectStarter(page, 'Sprigatito');
    await catchEncounter(page, 'Poco Path');
    await waitForPersistence(page);
    await page.reload();

    await expect(cardFor(page, 'Inlet Grotto')).toBeVisible();
    await expect(cardFor(page, 'Katy (Gym)')).toBeVisible();
    await expect(cardFor(page, 'South Province (Area Three)')).toHaveCount(0);

    await page.getByRole('button', { name: 'Show more', exact: true }).click();
    await expect(
        cardFor(page, 'South Province (Area Three)').first(),
    ).toBeVisible();
});

test('header stays visible across views and the menu navigates', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'persisted-game-run');

    await test.step('game view stays active across reload with shell visible', async () => {
        await expect(
            page.getByRole('heading', { name: 'persisted-game-run' }),
        ).toBeVisible();
        await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();

        await page.reload();
        await expect(cardFor(page, 'Starter')).toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Open menu' }),
        ).toBeVisible();
    });

    await test.step('menu navigation reaches About with persistent shell', async () => {
        await navigateTo(page, 'About');
        await expect(
            page.getByRole('heading', { name: 'About' }),
        ).toBeVisible();
        await expect(page.getByText('PokeDB')).toBeVisible();
        await expect(page.getByRole('dialog')).toBeHidden();
    });

    await test.step('browser history restores each visited view', async () => {
        await page.goBack();
        await expect(
            page.getByRole('heading', { name: 'persisted-game-run' }),
        ).toBeVisible();

        await page.goBack();
        await expect(
            page.getByRole('heading', { name: 'Games' }),
        ).toBeVisible();
        await expect(page.getByRole('button', { name: 'Back' })).toBeHidden();

        await page.goForward();
        await expect(
            page.getByRole('heading', { name: 'persisted-game-run' }),
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

    await test.step('navigating Home persists across reload', async () => {
        await navigateTo(page, 'Home');
        await expect(
            page.getByRole('heading', { name: 'Games' }),
        ).toBeVisible();

        await page.reload();
        await expect(
            page.getByRole('heading', { name: 'Games' }),
        ).toBeVisible();
    });
});
