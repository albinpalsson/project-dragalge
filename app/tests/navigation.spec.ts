import { expect, test } from '@playwright/test';
import {
    cardFor,
    catchEncounter,
    createGame,
    expectNextStep,
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
    await expect(cardFor(page, 'Katy (Gym)')).toBeVisible();
    await expect(cardFor(page, 'Brassius (Gym)')).toHaveCount(0);
    const nextShowMore = page.getByRole('button', {
        name: 'Show more',
        exact: true,
    });
    await expect(nextShowMore).toBeVisible();
    await nextShowMore.click();
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

    await winBossBattle(page, 'Nemona (Second rival battle)');
    await waitForPersistence(page);
    await page.reload();

    await expectNextStep(page, 'Pokemon League (Paldea)');
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
