import { test, expect } from '@playwright/test';
import { cardFor, createGame, navigateTo } from './helpers';

test('header stays visible across views and the menu navigates', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'persisted-game-run');

    await test.step('game view stays active across reload with shell visible', async () => {
        await expect(page.getByText('PokeDB')).toBeVisible();
        await expect(
            page.getByRole('heading', { name: 'persisted-game-run' }),
        ).toBeVisible();

        await page.reload();
        await expect(cardFor(page, 'Starter')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
    });

    await test.step('menu navigation reaches About with persistent shell', async () => {
        await navigateTo(page, 'About');
        await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();
        await expect(page.getByText('PokeDB')).toBeVisible();
    });

    await test.step('navigating Home persists across reload', async () => {
        await navigateTo(page, 'Home');
        await expect(page.getByRole('heading', { name: 'Games' })).toBeVisible();

        await page.reload();
        await expect(page.getByRole('heading', { name: 'Games' })).toBeVisible();
    });
});
