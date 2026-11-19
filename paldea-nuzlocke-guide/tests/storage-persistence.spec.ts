import { expect, test, type Page } from '@playwright/test';
import {
    cardFor,
    createGame,
    navigateTo,
    waitForPersistence,
} from './helpers';

type StubMode = 'denied' | 'persisted' | 'rejects' | 'missing';

declare global {
    interface Window {
        __persistCalls: number;
    }
}

// Headless Chromium answers persist() unpredictably, so replace it with a
// counter. The init script re-runs on every page load and reads its mode from
// sessionStorage, so one test can reload through several modes.
async function stubStorage(page: Page) {
    await page.addInitScript(() => {
        window.__persistCalls = 0;
        const mode = (sessionStorage.getItem('persistStubMode') ??
            'denied') as StubMode;
        if (mode === 'missing') {
            Object.defineProperty(Navigator.prototype, 'storage', {
                configurable: true,
                get: () => undefined,
            });
            return;
        }
        StorageManager.prototype.persisted = async () => mode === 'persisted';
        StorageManager.prototype.persist = async () => {
            window.__persistCalls += 1;
            if (mode === 'rejects') {
                throw new Error('persist failed');
            }
            return false;
        };
    });
}

function setStubMode(page: Page, mode: StubMode) {
    return page.evaluate((next) => {
        sessionStorage.setItem('persistStubMode', next);
    }, mode);
}

function persistCalls(page: Page): Promise<number> {
    return page.evaluate(() => window.__persistCalls);
}

test('asks once per page load when a game opens, and asks again after a denial', async ({
    page,
}) => {
    await stubStorage(page);
    await page.goto('/');
    await expect(
        page.getByRole('button', { name: 'Start New Game' }),
    ).toBeVisible();
    expect(await persistCalls(page)).toBe(0);

    await createGame(page, 'persist-run');
    await expect.poll(() => persistCalls(page)).toBe(1);

    await navigateTo(page, 'Home');
    await page
        .getByRole('button', { name: /persist-run/ })
        .first()
        .click();
    await expect(cardFor(page, 'Starter').first()).toBeVisible();
    expect(await persistCalls(page)).toBe(1);

    // A denial is not remembered: reloading inside the game asks again.
    await waitForPersistence(page);
    await page.reload();
    await expect(cardFor(page, 'Starter').first()).toBeVisible();
    await expect.poll(() => persistCalls(page)).toBe(1);
});

test('skips the request when already persistent and survives failures', async ({
    page,
}) => {
    await stubStorage(page);
    await page.goto('/');
    await createGame(page, 'persist-variants');
    await waitForPersistence(page);

    await setStubMode(page, 'persisted');
    await page.reload();
    await expect(cardFor(page, 'Starter').first()).toBeVisible();
    expect(await persistCalls(page)).toBe(0);

    await setStubMode(page, 'rejects');
    await page.reload();
    await expect(cardFor(page, 'Starter').first()).toBeVisible();
    await expect.poll(() => persistCalls(page)).toBe(1);
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await setStubMode(page, 'missing');
    await page.reload();
    await expect(cardFor(page, 'Starter').first()).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
});
