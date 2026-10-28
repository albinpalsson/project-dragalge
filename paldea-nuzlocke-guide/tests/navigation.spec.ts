import { expect, test } from '@playwright/test';
import {
    cardFor,
    catchEncounter,
    createGame,
    deleteGameFromHome,
    expectNextStep,
    navigateTo,
    selectStarter,
    waitForPersistence,
    winBossBattle,
} from './helpers';

test('menu and About link to the repository and the feedback email', async ({
    page,
}) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(
        page.getByRole('link', { name: 'GitHub repository' }),
    ).toHaveAttribute(
        'href',
        'https://github.com/albinpalsson/project-dragalge',
    );
    await expect(
        page.getByRole('link', { name: 'Email feedback' }),
    ).toHaveAttribute('href', /^mailto:feedback@paldeanuzlocke\.com/);

    await page.getByRole('button', { name: 'About', exact: true }).click();
    await expect(
        page.getByRole('link', { name: 'feedback@paldeanuzlocke.com' }),
    ).toBeVisible();
    await expect(
        page.getByRole('link', { name: 'open an issue on GitHub' }),
    ).toBeVisible();
});

test('progression windows, Home resume and browser history preserve the run', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'checkpoint-window-run');

    await expect(cardFor(page, 'Nemona (2nd rival battle)')).toBeVisible();
    await expect(cardFor(page, 'Katy (Gym)')).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Show previous steps', exact: true }),
    ).toHaveCount(0);

    await expect(cardFor(page, 'Katy (Gym)')).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Show more', exact: true }),
    ).toHaveCount(0);

    await page.reload();
    await expect(cardFor(page, 'Nemona (2nd rival battle)')).toBeVisible();
    await expect(cardFor(page, 'Katy (Gym)')).toBeVisible();
    await selectStarter(page, 'Sprigatito');
    await catchEncounter(page, 'Poco Path');
    await catchEncounter(page, 'Inlet Grotto');
    await catchEncounter(page, 'South Province (A1)');
    await winBossBattle(page, 'Nemona (2nd rival battle)');
    await waitForPersistence(page);
    await navigateTo(page, 'Home');
    await page.getByRole('button', { name: /checkpoint-window-run/ }).click();
    await page.reload();

    await expectNextStep(page, 'Pokemon League');
    await expect(cardFor(page, 'Katy (Gym)')).toBeVisible();
    await expect(cardFor(page, 'Brassius (Gym)')).toBeVisible();
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

test('a resolved boss advances next step without hiding skipped encounters', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'skipped-encounter-run');
    await selectStarter(page, 'Sprigatito');

    await winBossBattle(page, 'Nemona (2nd rival battle)');
    await waitForPersistence(page);
    await page.reload();

    await expectNextStep(page, 'Pokemon League');
    await expect(cardFor(page, 'Poco Path')).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Show previous steps', exact: true }),
    ).toHaveCount(0);
});

test('Licenses & Notices is reachable and restored by browser history', async ({
    page,
}) => {
    await page.goto('/');
    await navigateTo(page, 'Licenses & Notices');

    await expect(
        page.getByRole('heading', { name: 'Licenses & Notices' }),
    ).toBeVisible();
    await expect(
        page.getByRole('heading', { name: 'Bulbapedia data' }),
    ).toBeVisible();
    await expect(
        page.getByRole('link', { name: 'CC BY-NC-SA 2.5 license' }),
    ).toHaveAttribute(
        'href',
        'https://creativecommons.org/licenses/by-nc-sa/2.5/',
    );

    for (const [path, phrase, internalPhrase] of [
        [
            '/notices/bulbapedia-data.txt',
            'License terms can vary by page or revision',
            'importing at scale',
        ],
        [
            '/notices/pokemondb-sprites.txt',
            'not a license or permission from the rights holders',
            'fetches are queued',
        ],
        [
            '/assets/ATTRIBUTION.txt',
            'not a license or permission from the rights holders',
            'free to reuse',
        ],
        [
            '/notices/third-party.txt',
            'react-dom 19.2.7 (MIT)',
            'installed package distributions',
        ],
    ]) {
        const response = await page.request.get(path);
        expect(response.ok()).toBeTruthy();
        const notice = await response.text();
        expect(notice).toContain(phrase);
        expect(notice).not.toContain(internalPhrase);
    }

    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Games' })).toBeVisible();
    await page.goForward();
    await expect(
        page.getByRole('heading', { name: 'Licenses & Notices' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('button', { name: 'About', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();
    await page.getByRole('button', { name: 'Licenses & Notices' }).click();
    await expect(
        page.getByRole('heading', { name: 'Licenses & Notices' }),
    ).toBeVisible();
    await page.reload();
    await expect(
        page.getByRole('heading', { name: 'Licenses & Notices' }),
    ).toBeVisible();
});

test('a new game created after deleting a played one starts from the first step', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'replay-run');
    await selectStarter(page, 'Sprigatito');
    await catchEncounter(page, 'Poco Path');
    await catchEncounter(page, 'Inlet Grotto');
    await waitForPersistence(page);
    await navigateTo(page, 'Home');
    await deleteGameFromHome(page, 'replay-run');

    await createGame(page, 'replay-run');

    await expectNextStep(page, 'Starter');
    await expect(
        page.getByRole('button', { name: 'Show previous steps', exact: true }),
    ).toHaveCount(0);
    await expect(cardFor(page, 'Starter').first()).toBeVisible();
});

test('Home lists games newest first even after a deleted game slot is reused', async ({
    page,
}) => {
    await page.goto('/');
    for (const name of ['order-a', 'order-b', 'order-c']) {
        await createGame(page, name);
        await navigateTo(page, 'Home');
    }
    await deleteGameFromHome(page, 'order-b');
    await createGame(page, 'order-d');
    await navigateTo(page, 'Home');

    const buttons = page.getByRole('button', { name: /order-[a-d]\b/ });
    await expect(buttons).toHaveCount(3);
    const texts = await buttons.allTextContents();
    const order = texts.map((text) => /order-[a-d]/.exec(text)?.[0]);
    expect(order).toEqual(['order-d', 'order-c', 'order-a']);
});

test("a game recreated under a deleted game's name keeps none of its settings or UI state", async ({
    page,
}) => {
    const oceanToggle = () => page.getByLabel('Include ocean/beach encounters');

    await page.goto('/');
    await createGame(page, 'reused-name-run');
    await cardFor(page, 'Poco Path').first().click();
    await oceanToggle().check();
    await page.getByRole('button', { name: 'Game settings' }).click();
    const addBan = page.getByRole('combobox', {
        name: 'Add a Pokémon ban',
    });
    await addBan.fill('Skiploom');
    await addBan.press('Enter');
    await expect(
        page.getByRole('button', { name: 'Remove Skiploom from ban list' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Close dialog' }).click();
    await waitForPersistence(page);
    await navigateTo(page, 'Home');
    await deleteGameFromHome(page, 'reused-name-run');

    await createGame(page, 'reused-name-run');
    await cardFor(page, 'Poco Path').first().click();
    await expect(oceanToggle()).not.toBeChecked();
    await page.getByRole('button', { name: 'Game settings' }).click();
    await expect(
        page.getByRole('button', { name: 'Remove Skiploom from ban list' }),
    ).toHaveCount(0);
});

test('deleting a game keeps the persisted UI state of a game whose name extends it', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'prefix-a');
    await navigateTo(page, 'Home');
    await createGame(page, 'prefix-a:b');
    await cardFor(page, 'Poco Path').first().click();
    await page.getByLabel('Include ocean/beach encounters').check();
    await waitForPersistence(page);
    await navigateTo(page, 'Home');

    await deleteGameFromHome(page, 'prefix-a');

    await page.getByRole('button', { name: /prefix-a:b/ }).click();
    await cardFor(page, 'Poco Path').first().click();
    await expect(
        page.getByLabel('Include ocean/beach encounters'),
    ).toBeChecked();
});

test('opening a game name that does not exist reports it as missing', async ({
    page,
}) => {
    await page.goto('/');
    await page.evaluate(() => {
        window.localStorage.setItem(
            'paldea-nuzlocke-guide:activeGameRunId',
            'missing-run',
        );
        window.history.replaceState(null, '');
    });
    await page.reload();

    await expect(page.getByText('Game not found: missing-run')).toBeVisible();
});
