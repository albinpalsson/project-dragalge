import { test, expect, type Page } from '@playwright/test';
import {
    cardFor,
    expandCollapsedSummary,
    selectStarter,
    showMoreProgression,
    waitForPersistence,
} from './helpers';

async function createMonoGame(
    page: Page,
    name: string,
    type: string,
    futureEvolutions = false,
) {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start New Game' }).click();
    await page.getByLabel('Name (optional)').fill(name);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByLabel('Mono run').check();
    await page.getByLabel('Mono type').selectOption(type);
    if (futureEvolutions) {
        await page.getByLabel('Allow future evolutions').check();
    }
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(cardFor(page, 'Starter').first()).toBeVisible();
}

function starterOptions(page: Page) {
    return cardFor(page, 'Starter').first().getByRole('listitem');
}

test('mono type does not ban any starter choices', async ({ page }) => {
    await createMonoGame(page, 'mono-fire-run', 'fire');

    await expect(starterOptions(page)).toHaveCount(3);
    for (const starter of await starterOptions(page).all()) {
        await expect(starter.getByRole('button')).toBeEnabled();
        await expect(starter).not.toContainText('Not allowed in mono run');
    }
});

test('mono run without a matching starter offers all starters and requires release', async ({
    page,
}) => {
    await createMonoGame(page, 'mono-ghost-run', 'ghost');

    await expect(starterOptions(page)).toHaveCount(3);
    await starterOptions(page).first().getByRole('button').click();
    const releaseCard = cardFor(page, 'Release starter').first();
    await expect(releaseCard).toBeVisible();
});

test('mono settings control release starter and hide tera options', async ({
    page,
}) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start New Game' }).click();
    await page.getByLabel('Name (optional)').fill('mono-settings-run');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByLabel('Mono run').check();
    await page.getByLabel('Mono type').selectOption('ghost');

    await expect(page.getByLabel('Tera raids')).toHaveCount(0);
    await expect(page.getByLabel('Release starter')).toHaveCount(0);

    await page.getByLabel('Allow future evolutions').check();
    await expect(page.getByLabel('Release starter')).toHaveCount(0);
    await page.getByRole('button', { name: 'Start', exact: true }).click();

    await selectStarter(page, 'Fuecoco');
    await showMoreProgression(page);
    await expect(cardFor(page, 'Release starter')).toHaveCount(0);
});

test('game settings modal applies mono rules when saving', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start New Game' }).click();
    await page.getByLabel('Name (optional)').fill('mono-settings-save-run');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await selectStarter(page, 'Fuecoco');

    await page.getByRole('button', { name: 'Game settings' }).click();
    await page.getByLabel('Mono run').check();
    await page.getByLabel('Mono type').selectOption('ghost');
    await page.getByRole('button', { name: 'Close dialog' }).click();

    await showMoreProgression(page);
    await expect(cardFor(page, 'Release starter').first()).toBeVisible();
});

test('empty encounter pool can be confirmed to continue', async ({ page }) => {
    await createMonoGame(page, 'mono-dragon-run', 'dragon');

    await expandCollapsedSummary(page, 'Poco Path');
    const card = cardFor(page, 'Poco Path').first();
    await card.getByRole('button', { name: 'Confirm' }).click();

    await expect(card).toContainText('Skipped');
    await expect(card.getByRole('button', { name: 'Undo skip' })).toBeVisible();

    await card.getByRole('button', { name: 'Collapse encounter' }).click();
    await expect(card).toContainText('No encounter available');
    await expect(card).toContainText('Skipped');
    await expect(card).not.toContainText('?');
    await waitForPersistence(page);
    await page.reload();
    await expect(card).toContainText('No encounter available');
    await expect(card).toContainText('Skipped');
    await expect(card).not.toContainText('?');

    await expandCollapsedSummary(page, 'Poco Path');
    await card.getByRole('button', { name: 'Undo skip' }).click();
    await expect(card.getByRole('button', { name: 'Confirm' })).toBeVisible();
    await card.getByRole('button', { name: 'Collapse encounter' }).click();
    await expect(card).toContainText('?');
    await expect(card).not.toContainText('Skipped');
    await expect(card).not.toContainText('No encounter available');
});

test('mono lookup updates encounter reasons and rollable pools when settings change', async ({
    page,
}) => {
    await createMonoGame(page, 'mono-live-lookup-run', 'fire');
    await expandCollapsedSummary(page, 'Poco Path');
    const card = cardFor(page, 'Poco Path').first();
    await card.getByRole('button', { name: 'Show encounters' }).click();
    const hoppipRow = card.locator('tr', { hasText: 'Hoppip' }).first();
    const lechonkRow = card.locator('tr', { hasText: 'Lechonk' }).first();

    await expect(hoppipRow).toContainText('Not allowed in mono run');
    await expect(hoppipRow.getByRole('button')).toBeDisabled();
    await expect(card.getByRole('button', { name: 'Confirm' })).toBeVisible();

    await page.getByRole('button', { name: 'Game settings' }).click();
    await page.getByLabel('Mono type').selectOption('grass');
    await expect(hoppipRow.getByRole('button')).toBeEnabled();
    await page.getByRole('button', { name: 'Close dialog' }).click();
    await expect(hoppipRow).not.toContainText('Not allowed in mono run');
    await expect(lechonkRow.getByRole('button')).toBeDisabled();
    await expect(card.getByRole('button', { name: 'Randomize', exact: true })).toBeEnabled();
    await expect(card.getByRole('button', { name: 'Confirm' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Game settings' }).click();
    await page.getByLabel('Mono run').uncheck();
    await expect(lechonkRow.getByRole('button')).toBeEnabled();
    await page.getByRole('button', { name: 'Close dialog' }).click();
    await expect(lechonkRow).not.toContainText('Not allowed in mono run');
});

test('starters ignore mono exclusion but still honor manual bans when picked or randomized', async ({
    page,
}) => {
    await createMonoGame(page, 'mono-starter-manual-ban-run', 'fire');
    await page.getByRole('button', { name: 'Game settings' }).click();
    const banInput = page.getByRole('combobox', { name: 'Add a Pok\u00e9mon ban' });
    for (const name of ['Fuecoco', 'Quaxly']) {
        await banInput.fill(name);
        await banInput.press('Enter');
        await expect(
            starterOptions(page).filter({ hasText: name }).getByRole('button'),
        ).toBeDisabled();
    }
    await page.getByRole('button', { name: 'Close dialog' }).click();

    const options = starterOptions(page);
    await expect(options.filter({ hasText: 'Fuecoco' })).toContainText('Banned by game settings');
    await expect(options.filter({ hasText: 'Quaxly' })).toContainText('Banned by game settings');
    await expect(options.filter({ hasText: 'Sprigatito' }).getByRole('button')).toBeEnabled();
    const card = cardFor(page, 'Starter').first();
    await card.getByRole('button', { name: 'Randomize', exact: true }).click();
    await expect(card.getByRole('img', { name: 'Sprigatito', exact: true })).toBeVisible();
});

test('raid lookup preserves exact-form typing and forward-only future evolution eligibility', async ({
    page,
}) => {
    await createMonoGame(page, 'mono-raid-lookup-run', 'fire');
    await showMoreProgression(page);
    await expandCollapsedSummary(page, 'Tera Raid \u2605');
    const picker = page.getByRole('combobox', {
        name: 'Add a 1-star Tera Raid Pok\u00e9mon',
    });
    await picker.fill('Tauros');
    await expect(page.getByRole('option', { name: 'Tauros (Blaze Breed)', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Tauros (Aqua Breed)', exact: true })).toHaveCount(0);
    await expect(page.getByRole('option', { name: 'Tauros (Combat Breed)', exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: 'Game settings' }).click();
    await page.getByLabel('Mono type').selectOption('ghost');
    await expect(page.getByLabel('Mono type')).toHaveValue('ghost');
    await expect(page.getByText('Saving...', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Close dialog' }).click();
    await picker.fill('Fuecoco');
    await expect(page.getByRole('option', { name: 'Fuecoco', exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: 'Game settings' }).click();
    await page.getByLabel('Allow future evolutions').check();
    await expect(page.getByRole('option', { name: 'Fuecoco', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Close dialog' }).click();

    await page.getByRole('button', { name: 'Game settings' }).click();
    await page.getByLabel('Mono type').selectOption('normal');
    await expect(page.getByRole('option', { name: 'Fuecoco', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Close dialog' }).click();
    await picker.fill('Eevee');
    await expect(page.getByRole('option', { name: 'Eevee', exact: true })).toBeVisible();
    await picker.fill('Espeon');
    await expect(page.getByRole('option', { name: 'Espeon', exact: true })).toHaveCount(0);
});
