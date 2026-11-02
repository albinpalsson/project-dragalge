import { expect, type Page, test } from '@playwright/test';
import { cardFor, createGame, navigateTo, waitForPersistence } from './helpers';

const FIRST_BOSS = 'Nemona (2nd rival battle)';
const SECOND_BOSS = 'Katy (Gym)';

async function setBossResult(
    page: Page,
    battle: string,
    action: 'Mark won' | 'Mark lost' | 'Clear result',
) {
    const card = cardFor(page, battle).first();
    if ((await card.getByRole('button', { name: action }).count()) === 0) {
        await card.click();
    }
    await card.getByRole('button', { name: action }).click();
    await waitForPersistence(page);
}

async function expectHomeRunLost(page: Page, name: string, lost: boolean) {
    await navigateTo(page, 'Home');
    const card = page.getByRole('button', { name: new RegExp(name) });
    if (lost) {
        await expect(card).toContainText('Run Lost');
    } else {
        await expect(card).not.toContainText('Run Lost');
    }
    await card.click();
}

test('clearing a lost boss result clears the lost game status', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'lost-clear-run');

    await setBossResult(page, FIRST_BOSS, 'Mark lost');
    await expectHomeRunLost(page, 'lost-clear-run', true);

    await setBossResult(page, FIRST_BOSS, 'Clear result');
    await expectHomeRunLost(page, 'lost-clear-run', false);
});

test('marking a lost boss as won clears the lost game status', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'lost-won-run');

    await setBossResult(page, FIRST_BOSS, 'Mark lost');
    await expectHomeRunLost(page, 'lost-won-run', true);

    await setBossResult(page, FIRST_BOSS, 'Mark won');
    await expectHomeRunLost(page, 'lost-won-run', false);
});

test('the game stays lost until every lost boss result is cleared', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'two-lost-run');

    await setBossResult(page, FIRST_BOSS, 'Mark lost');
    await setBossResult(page, SECOND_BOSS, 'Mark lost');

    await setBossResult(page, FIRST_BOSS, 'Clear result');
    await expectHomeRunLost(page, 'two-lost-run', true);

    await setBossResult(page, SECOND_BOSS, 'Clear result');
    await expectHomeRunLost(page, 'two-lost-run', false);
});
