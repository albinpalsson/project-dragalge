import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

async function createGame(page: Page, name: string) {
    await page.getByRole('button', { name: 'Start New Game' }).click();
    await page.getByLabel('Name (optional)').fill(name);
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(page.getByRole('listitem')).toContainText(name);
}

test('randomized starter is persisted for the game run', async ({ page }) => {
    await page.goto('/');
    await createGame(page, 'starter-run');

    await page.getByRole('button', { name: /starter-run/ }).click();
    await expect(
        page.getByRole('heading', { name: 'Starter - Cabo poco' }),
    ).toBeVisible();

    await page.waitForFunction(() =>
        Object.keys(localStorage).some((key) =>
            key.startsWith('pokedb2:game-db:'),
        ),
    );
    const storedGameDb = await page.evaluate(() => {
        const key = Object.keys(localStorage).find((candidate) =>
            candidate.startsWith('pokedb2:game-db:'),
        );
        if (!key) {
            throw new Error('Game DB was not persisted');
        }
        return { key, value: localStorage.getItem(key) };
    });

    await page.getByRole('button', { name: 'Randomize' }).click();
    await expect(
        page.getByRole('button', { name: 'Randomize' }),
    ).toBeHidden();
    await page.waitForFunction(
        ({ key, value }) => localStorage.getItem(key) !== value,
        storedGameDb,
    );

    const chosen = page.getByRole('img').first();
    await expect(chosen).toBeVisible();
    const chosenName = await chosen.getAttribute('alt');
    expect(chosenName).toBeTruthy();
    if (!chosenName) {
        throw new Error('Chosen starter image is missing alt text');
    }

    await page.reload();
    await page.getByRole('button', { name: /starter-run/ }).click();

    await expect(page.getByRole('img', { name: chosenName })).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Randomize' }),
    ).toBeHidden();

    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('button', { name: 'Home', exact: true }).click();
    await expect(
        page.getByRole('button', { name: /starter-run/ }),
    ).toContainText('1 caught');
    await expect(
        page
            .getByRole('button', { name: /starter-run/ })
            .getByRole('img', { name: chosenName }),
    ).toBeVisible();
});

test('header stays visible across views and the menu navigates', async ({
    page,
}) => {
    await page.goto('/');
    await expect(page.getByText('PokeDB')).toBeVisible();

    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('button', { name: 'About', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();
    await expect(page.getByText('PokeDB')).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Open menu' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('button', { name: 'Home', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Games' })).toBeVisible();
});
