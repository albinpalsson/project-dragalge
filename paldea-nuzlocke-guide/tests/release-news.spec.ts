import { expect, type Page, test } from '@playwright/test';

const STORAGE_KEY = 'paldea-nuzlocke-guide:release-news';

// A browser that has opened the app before, having seen news up to `number`.
// Only seeds a missing checkpoint, so reloads keep what the page stored.
async function returnHaving(page: Page, number: number) {
    await page.addInitScript(
        ({ key, value }) => {
            if (window.localStorage.getItem(key) === null) {
                window.localStorage.setItem(key, value);
            }
        },
        {
            key: STORAGE_KEY,
            value: JSON.stringify({
                schemaVersion: 1,
                acknowledgedThrough: number,
            }),
        },
    );
}

function newsDialog(page: Page) {
    return page.getByRole('dialog', { name: "What's new" });
}

async function storedCheckpoint(page: Page) {
    return page.evaluate(
        (key) => JSON.parse(window.localStorage.getItem(key) ?? 'null'),
        STORAGE_KEY,
    );
}

test('a first visit shows no news and starts from the latest', async ({
    page,
}) => {
    await page.goto('/');
    await expect(
        page.getByRole('heading', { name: 'Stored games' }),
    ).toBeVisible();
    await expect(newsDialog(page)).toHaveCount(0);
    expect(await storedCheckpoint(page)).toEqual({
        schemaVersion: 1,
        acknowledgedThrough: 2,
    });
});

test('returning browsers see all pending news in one popup until they close it', async ({
    page,
}) => {
    await returnHaving(page, 0);
    await page.goto('/');

    const dialog = newsDialog(page);
    await expect(
        dialog.getByRole('heading', { name: 'Mono type planner' }),
    ).toBeVisible();
    await expect(
        dialog.getByRole('heading', {
            name: 'Keep your games in Google Drive',
        }),
    ).toBeVisible();
    await expect(
        dialog.getByRole('link', { name: 'Privacy policy' }),
    ).toHaveAttribute('href', '/privacy.html');

    await dialog.getByRole('button', { name: 'Got it' }).click();
    await expect(dialog).toHaveCount(0);
    expect((await storedCheckpoint(page)).acknowledgedThrough).toBe(2);

    await page.reload();
    await expect(
        page.getByRole('heading', { name: 'Stored games' }),
    ).toBeVisible();
    await expect(newsDialog(page)).toHaveCount(0);
});

test('closing the popup with Escape counts as seen', async ({ page }) => {
    await returnHaving(page, 1);
    await page.goto('/');

    const dialog = newsDialog(page);
    await expect(
        dialog.getByRole('heading', {
            name: 'Keep your games in Google Drive',
        }),
    ).toBeVisible();
    await expect(
        dialog.getByRole('heading', { name: 'Mono type planner' }),
    ).toHaveCount(0);

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);

    await page.reload();
    await expect(
        page.getByRole('heading', { name: 'Stored games' }),
    ).toBeVisible();
    await expect(newsDialog(page)).toHaveCount(0);
});

test('the planner action opens the planner and counts as seen', async ({
    page,
}) => {
    await returnHaving(page, 0);
    await page.goto('/');

    await newsDialog(page)
        .getByRole('button', { name: 'Open the planner' })
        .click();
    await expect(newsDialog(page)).toHaveCount(0);
    await expect(page).toHaveURL(/#\/mono-planner$/);
    expect((await storedCheckpoint(page)).acknowledgedThrough).toBe(2);
});

test('closing the popup in one tab closes it in the others', async ({
    context,
}) => {
    const first = await context.newPage();
    await returnHaving(first, 0);
    await first.goto('/');
    const second = await context.newPage();
    await second.goto('/');

    await expect(newsDialog(first)).toBeVisible();
    await expect(newsDialog(second)).toBeVisible();

    await newsDialog(first).getByRole('button', { name: 'Got it' }).click();
    await expect(newsDialog(first)).toHaveCount(0);
    await expect(newsDialog(second)).toHaveCount(0);
});
