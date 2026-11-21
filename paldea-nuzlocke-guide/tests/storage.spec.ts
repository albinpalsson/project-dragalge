import { expect, test, type Browser, type Page } from '@playwright/test';
import {
    cardFor,
    createGame,
    navigateTo,
    resetStarter,
    selectStarter,
    waitForPersistence,
} from './helpers';
import { ACCOUNTS, FakeDrive, installFakeGoogle } from './fake-google';

const DRIVE_FILE = /^game-db-v\d+\.bin$/;
const [ACCOUNT_A] = ACCOUNTS;

// Each "device" is its own browser context: separate storage, one shared Drive.
async function openDevice(
    browser: Browser,
    baseURL: string | undefined,
    drive: FakeDrive,
    { fakeClock = false }: { fakeClock?: boolean } = {},
): Promise<Page> {
    const context = await browser.newContext({
        baseURL,
        reducedMotion: 'reduce',
    });
    await installFakeGoogle(context, drive);
    const page = await context.newPage();
    if (fakeClock) {
        await page.clock.install();
    }
    await page.goto('/');
    return page;
}

const storageSelect = (page: Page) => page.getByLabel('Stored in');

async function expectHomeLoaded(page: Page) {
    await expect(page.getByRole('button', { name: 'Start New Game' })).toBeVisible();
    await expect(page.getByText(/^Loading/)).toHaveCount(0);
}

// Picking a place restarts the app, so wait for the page to load again.
async function chooseStorage(page: Page, value: 'local' | 'google-drive') {
    const loaded = page.waitForEvent('load');
    await storageSelect(page).selectOption(value);
    await loaded;
    await expectHomeLoaded(page);
}

// The first time, choosing Google Drive asks to sign in before switching.
async function signInAndUseDrive(page: Page) {
    await storageSelect(page).selectOption('google-drive');
    const loaded = page.waitForEvent('load');
    await page
        .getByRole('dialog', { name: 'Sign in to Google' })
        .getByRole('button', { name: 'Sign in with Google' })
        .click();
    await loaded;
    await expectHomeLoaded(page);
}

// One edit causes several debounced saves; wait until Drive has stopped receiving them.
async function waitForDriveSaves(drive: FakeDrive) {
    let previous = -1;
    await expect
        .poll(
            async () => {
                const current = drive.uploads;
                const settled = current > 0 && current === previous;
                previous = current;
                await new Promise((resolve) => setTimeout(resolve, 500));
                return settled;
            },
            { timeout: 15_000 },
        )
        .toBe(true);
}

function gameName(page: Page, name: string) {
    return page.getByText(name, { exact: true });
}

async function lastTokenRequest(page: Page) {
    return JSON.parse(
        await page.evaluate(
            () => localStorage.getItem('fake-token-request') ?? 'null',
        ),
    ) as { login_hint?: string; prompt?: string } | null;
}

const continueAsA = (page: Page) =>
    page
        .getByRole('dialog', { name: 'Sign in to Google' })
        .getByRole('button', { name: /^Continue as Account A/ });

test('shows only the games kept in the selected place', async ({
    browser,
    baseURL,
}) => {
    const drive = new FakeDrive();
    const page = await openDevice(browser, baseURL, drive);

    // Starts in this browser.
    await expect(storageSelect(page)).toHaveValue('local');
    await createGame(page, 'local-run');
    await waitForPersistence(page);
    await navigateTo(page, 'Home');

    await signInAndUseDrive(page);
    await expect(storageSelect(page)).toHaveValue('google-drive');
    await expect(gameName(page, 'local-run')).toHaveCount(0);
    expect(drive.names()).toEqual([]);

    await createGame(page, 'drive-run');
    await waitForDriveSaves(drive);
    expect(drive.names()).toEqual([expect.stringMatching(DRIVE_FILE)]);

    // Each place keeps its own games, and nothing was copied between them.
    await navigateTo(page, 'Home');
    await chooseStorage(page, 'local');
    await expect(gameName(page, 'local-run').first()).toBeVisible();
    await expect(gameName(page, 'drive-run')).toHaveCount(0);

    // Still signed in, so switching back needs no sign-in.
    await chooseStorage(page, 'google-drive');
    await expect(gameName(page, 'drive-run').first()).toBeVisible();
    await expect(gameName(page, 'local-run')).toHaveCount(0);
});

test('cancelling the sign-in leaves the games where they were', async ({
    browser,
    baseURL,
}) => {
    const page = await openDevice(browser, baseURL, new FakeDrive());
    await storageSelect(page).selectOption('google-drive');
    await page
        .getByRole('dialog', { name: 'Sign in to Google' })
        .getByRole('button', { name: 'Close dialog' })
        .click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(storageSelect(page)).toHaveValue('local');
});

test('another device sees the games kept in Google Drive', async ({
    browser,
    baseURL,
}) => {
    const drive = new FakeDrive();
    const deviceA = await openDevice(browser, baseURL, drive);
    const deviceB = await openDevice(browser, baseURL, drive);

    await signInAndUseDrive(deviceA);
    await createGame(deviceA, 'shared-run');
    await waitForDriveSaves(drive);

    await signInAndUseDrive(deviceB);
    await expect(gameName(deviceB, 'shared-run').first()).toBeVisible();
});

test('an older device is told to reload instead of overwriting a newer save', async ({
    browser,
    baseURL,
}) => {
    const drive = new FakeDrive();
    const deviceA = await openDevice(browser, baseURL, drive);
    const deviceB = await openDevice(browser, baseURL, drive);

    await signInAndUseDrive(deviceA);
    await createGame(deviceA, 'stale-run');
    await waitForDriveSaves(drive);

    await signInAndUseDrive(deviceB);
    await gameName(deviceB, 'stale-run').first().click();
    const afterA = drive.uploads;
    await selectStarter(deviceB, 'Quaxly');
    await expect.poll(() => drive.uploads).toBeGreaterThan(afterA);
    await waitForDriveSaves(drive);
    const savedByB = drive.uploads;

    // Device A has not seen device B's save, so its change must not replace it.
    await selectStarter(deviceA, 'Fuecoco');
    const dialog = deviceA.getByRole('dialog', {
        name: 'Game opened in another tab',
    });
    // Generous timeouts: this is the heaviest test when the whole suite runs at once.
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await expect(dialog).toContainText('was not saved');
    expect(drive.uploads).toBe(savedByB);

    const loaded = deviceA.waitForEvent('load');
    await dialog.getByRole('button', { name: 'Reload' }).click();
    await loaded;
    const starter = cardFor(deviceA, 'Starter').first();
    const startNew = deviceA.getByRole('button', { name: 'Start New Game' });
    await expect(starter.or(startNew)).toBeVisible({ timeout: 15_000 });
    if (await startNew.isVisible()) {
        await gameName(deviceA, 'stale-run').first().click();
    }
    await expect(cardFor(deviceA, 'Starter').first()).toContainText(
        /Quaxly\s*Selected/,
        { timeout: 15_000 },
    );
});

test('asks to continue when Google access runs out, without reloading', async ({
    browser,
    baseURL,
}) => {
    const drive = new FakeDrive();
    const page = await openDevice(browser, baseURL, drive, { fakeClock: true });
    await signInAndUseDrive(page);
    await createGame(page, 'lapse-run');
    await waitForDriveSaves(drive);
    await page.evaluate(() => {
        (window as unknown as { marker: number }).marker = 1;
    });
    const before = drive.uploads;

    // Google's access lasts an hour; the app signs out a little before then.
    await page.clock.fastForward('58:30');
    await expect(continueAsA(page)).toBeVisible();

    await continueAsA(page).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await lastTokenRequest(page)).toEqual({
        login_hint: ACCOUNT_A.email,
        prompt: '',
    });

    // Same page, same game, and saving works again.
    expect(
        await page.evaluate(() => (window as unknown as { marker?: number }).marker),
    ).toBe(1);
    await selectStarter(page, 'Quaxly');
    await expect.poll(() => drive.uploads).toBeGreaterThan(before);
});

test('a save after a late sign-out timer asks to sign in instead of failing', async ({
    browser,
    baseURL,
}) => {
    const drive = new FakeDrive();
    const page = await openDevice(browser, baseURL, drive, { fakeClock: true });
    await signInAndUseDrive(page);
    await createGame(page, 'sleep-run');
    await waitForDriveSaves(drive);
    const before = drive.uploads;

    // Like a laptop waking from sleep: the time jumps past Google's access
    // without the app's sign-out timer having run.
    const now = await page.evaluate(() => Date.now());
    await page.clock.setSystemTime(now + 61 * 60_000);
    await selectStarter(page, 'Quaxly');

    await expect(continueAsA(page)).toBeVisible();
    await expect(
        page.getByRole('dialog', { name: 'Something went wrong' }),
    ).toHaveCount(0);
    await continueAsA(page).click();
    await expect.poll(() => drive.uploads).toBeGreaterThan(before);
});

test('a new session continues as the remembered account without reloading', async ({
    browser,
    baseURL,
}) => {
    const drive = new FakeDrive();
    const page = await openDevice(browser, baseURL, drive);
    await signInAndUseDrive(page);
    await createGame(page, 'gate-run');
    await waitForDriveSaves(drive);
    await navigateTo(page, 'Home');

    // A new tab is a new session: Google's short-lived access is not carried over.
    const second = await page.context().newPage();
    await second.goto('/');
    await expect(continueAsA(second)).toBeVisible();
    await expect(second.getByText('Loading games from Google Drive...')).toBeVisible();
    await second.evaluate(() => {
        (window as unknown as { marker: number }).marker = 1;
    });

    await continueAsA(second).click();
    await expect(gameName(second, 'gate-run').first()).toBeVisible();
    expect(
        await second.evaluate(
            () => (window as unknown as { marker?: number }).marker,
        ),
    ).toBe(1);
});

test('a different account has its own games', async ({ browser, baseURL }) => {
    const drive = new FakeDrive();
    const page = await openDevice(browser, baseURL, drive);
    await signInAndUseDrive(page);
    await createGame(page, 'account-a-run');
    await waitForDriveSaves(drive);
    await navigateTo(page, 'Home');

    const second = await page.context().newPage();
    await second.goto('/');
    const loaded = second.waitForEvent('load');
    await second
        .getByRole('dialog', { name: 'Sign in to Google' })
        .getByRole('button', { name: 'Use a different account' })
        .click();
    await loaded;
    await expectHomeLoaded(second);
    expect(await lastTokenRequest(second)).toEqual({ prompt: 'select_account' });
    await expect(gameName(second, 'account-a-run')).toHaveCount(0);
});

test('"Use this browser instead" goes home to the games kept here', async ({
    browser,
    baseURL,
}) => {
    const drive = new FakeDrive();
    const page = await openDevice(browser, baseURL, drive);
    await createGame(page, 'local-run');
    await waitForPersistence(page);
    await navigateTo(page, 'Home');
    await signInAndUseDrive(page);

    const second = await page.context().newPage();
    await second.goto('/');
    await second
        .getByRole('dialog', { name: 'Sign in to Google' })
        .getByRole('button', { name: 'Use this browser instead' })
        .click();
    await expect(storageSelect(second)).toHaveValue('local');
    await expect(gameName(second, 'local-run').first()).toBeVisible();
});

test('a login Google rejects is an unexpected error', async ({
    browser,
    baseURL,
}) => {
    const drive = new FakeDrive();
    const page = await openDevice(browser, baseURL, drive);
    await signInAndUseDrive(page);
    await createGame(page, 'reject-run');
    await waitForDriveSaves(drive);

    drive.rejectAuth = true;
    await selectStarter(page, 'Quaxly');
    await expect(
        page.getByRole('dialog', { name: 'Something went wrong' }),
    ).toBeVisible();
});

test('a save Google Drive cannot receive says so, without a crash report', async ({
    browser,
    baseURL,
}) => {
    const drive = new FakeDrive();
    const page = await openDevice(browser, baseURL, drive);
    await signInAndUseDrive(page);
    await createGame(page, 'offline-run');
    await waitForDriveSaves(drive);

    drive.unreachable = true;
    await selectStarter(page, 'Quaxly');
    const dialog = page.getByRole('dialog', {
        name: "Couldn't reach Google Drive",
    });
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await expect(dialog).toContainText('was not saved');
    await expect(dialog.getByRole('link', { name: 'Email report' })).toHaveCount(
        0,
    );
});

test('a short network blip is retried without bothering the user', async ({
    browser,
    baseURL,
}) => {
    const drive = new FakeDrive();
    const page = await openDevice(browser, baseURL, drive);
    await signInAndUseDrive(page);
    await createGame(page, 'blip-run');
    await waitForDriveSaves(drive);
    const before = drive.uploads;

    drive.failNext = 2;
    await selectStarter(page, 'Quaxly');
    await expect.poll(() => drive.uploads, { timeout: 15_000 }).toBeGreaterThan(
        before,
    );
    expect(drive.failNext).toBe(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('a save Google Drive never answers is reported after a timeout', async ({
    browser,
    baseURL,
}) => {
    test.setTimeout(40_000);
    const drive = new FakeDrive();
    const page = await openDevice(browser, baseURL, drive);
    await signInAndUseDrive(page);
    await createGame(page, 'hang-run');
    await waitForDriveSaves(drive);

    drive.hang = true;
    await selectStarter(page, 'Quaxly');
    await expect(
        page.getByRole('dialog', { name: "Couldn't reach Google Drive" }),
    ).toBeVisible({ timeout: 20_000 });
});

test('sends first_cloud_game once, for the first game created in Google Drive', async ({
    browser,
    baseURL,
}) => {
    const drive = new FakeDrive();
    const page = await openDevice(browser, baseURL, drive);
    await page.evaluate(() =>
        localStorage.setItem(
            'paldea-nuzlocke-guide:analytics-consent',
            'granted',
        ),
    );
    const countEvents = async (name: string) =>
        (
            await page.evaluate(
                () =>
                    (
                        window as unknown as {
                            __analyticsEvents?: { name: string }[];
                        }
                    ).__analyticsEvents ?? [],
            )
        ).filter((event) => event.name === name).length;

    await signInAndUseDrive(page);
    await createGame(page, 'cloud-first');
    await waitForDriveSaves(drive);
    await expect.poll(() => countEvents('game_created')).toBe(1);
    expect(await countEvents('first_cloud_game')).toBe(1);

    await navigateTo(page, 'Home');
    await createGame(page, 'cloud-second');
    await expect.poll(() => countEvents('game_created')).toBe(2);
    expect(await countEvents('first_cloud_game')).toBe(1);
});

test('quick edits are saved with fewer uploads, and the last one wins', async ({
    browser,
    baseURL,
}) => {
    const drive = new FakeDrive();
    const page = await openDevice(browser, baseURL, drive);
    await signInAndUseDrive(page);
    await createGame(page, 'burst-run');
    await waitForDriveSaves(drive);
    const before = drive.uploads;

    // Three edits in a row, each well inside the wait before an upload.
    await selectStarter(page, 'Quaxly');
    await resetStarter(page);
    await selectStarter(page, 'Fuecoco');
    await waitForDriveSaves(drive);
    expect(drive.uploads - before).toBeLessThan(3);

    await page.reload();
    await expect(cardFor(page, 'Starter').first()).toContainText(
        /Fuecoco\s*Selected/,
    );
});
