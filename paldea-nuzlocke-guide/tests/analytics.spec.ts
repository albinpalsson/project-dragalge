import { test, expect, type Page } from '@playwright/test';
import { cardFor, chooseStarter } from './helpers';

interface TrackedEvent {
    name: string;
    view?: string;
    variant?: string;
    randomizerMode?: string;
}

async function getTrackedEvents(page: Page): Promise<TrackedEvent[]> {
    return page.evaluate(
        () =>
            (window as Window & { __analyticsEvents?: TrackedEvent[] })
                .__analyticsEvents ?? [],
    );
}

async function submitNewGame(page: Page, name: string): Promise<void> {
    await page.getByRole('button', { name: 'Start New Game' }).click();
    await page.getByLabel('Name (optional)').fill(name);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Start', exact: true }).click();
}

test('accepting analytics consent sends the first game and game view events', async ({
    page,
}) => {
    await page.goto('/');
    await expect(
        page.getByRole('heading', { name: 'Allow optional usage analytics?' }),
    ).toHaveCount(0);
    await submitNewGame(page, 'analytics-accepted-run');

    await expect(
        page.getByRole('heading', { name: 'Allow optional usage analytics?' }),
    ).toBeVisible();
    await expect(cardFor(page, 'Starter')).toHaveCount(0);
    expect(await getTrackedEvents(page)).toEqual([]);

    await page.getByRole('button', { name: 'Accept', exact: true }).click();
    await expect(cardFor(page, 'Starter').first()).toBeVisible();
    await expect
        .poll(async () => (await getTrackedEvents(page)).length)
        .toBe(3);

    await chooseStarter(page);
    await expect
        .poll(async () => (await getTrackedEvents(page)).length)
        .toBe(4);

    const events = await getTrackedEvents(page);
    const createdEvent = events.find((event) => event.name === 'game_created');
    expect(createdEvent).toEqual(
        expect.objectContaining({ name: 'game_created', variant: 's' }),
    );
    expect(createdEvent?.randomizerMode).toEqual(expect.any(String));
    expect(events).toContainEqual({ name: 'page_view', view: 'home' });
    expect(events).toContainEqual({ name: 'page_view', view: 'game' });
    expect(events).toContainEqual({
        name: 'progression_milestone',
        milestone: 'Starter',
        outcome: 'chosen',
    });
    expect(
        await page.evaluate(() =>
            localStorage.getItem('paldea-nuzlocke-guide:analytics-consent'),
        ),
    ).toBe('granted');
    await page.reload();
    await expect(cardFor(page, 'Starter').first()).toBeVisible();
    await expect(
        page.getByRole('heading', { name: 'Allow optional usage analytics?' }),
    ).toHaveCount(0);
});

test('declining analytics consent still creates the game without tracking', async ({
    page,
}) => {
    await page.goto('/');
    await expect(
        page.getByRole('heading', { name: 'Allow optional usage analytics?' }),
    ).toHaveCount(0);
    await submitNewGame(page, 'analytics-declined-run');

    await expect(
        page.getByRole('heading', { name: 'Allow optional usage analytics?' }),
    ).toBeVisible();
    await expect(cardFor(page, 'Starter')).toHaveCount(0);
    await page.getByRole('button', { name: 'Decline', exact: true }).click();

    await expect(cardFor(page, 'Starter').first()).toBeVisible();
    expect(await getTrackedEvents(page)).toEqual([]);
});
