import { test, expect } from '@playwright/test';
import {
    boxSection,
    cardFor,
    chooseAnalyticsConsentIfPrompted,
    createGame,
    expandCollapsedSummary,
    openBox,
    resolveEncounter,
    rollEncounter,
    selectBoxPokemon,
    showMoreProgression,
    waitForPersistence,
} from './helpers';

test('missed encounters stay out of Box and can be rerolled after reload', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'reroll-run');

    const card = cardFor(page, 'Poco Path');

    const missed = await rollEncounter(page, 'Poco Path');
    await resolveEncounter(page, 'Poco Path', 'Missed');
    await openBox(page);
    await expect(
        page
            .getByRole('dialog')
            .getByRole('img', { name: missed, exact: true }),
    ).toHaveCount(0);
    await page.getByRole('button', { name: 'Close dialog' }).click();

    await waitForPersistence(page);
    await page.reload();

    const reloadedCard = cardFor(page, 'Poco Path');
    await expect(reloadedCard).toContainText('Missed');
    await expect(
        reloadedCard.getByRole('button', { name: 'Randomize' }),
    ).toBeHidden();
    await expandCollapsedSummary(page, 'Poco Path');
    await expect(
        cardFor(page, 'Poco Path').getByRole('button', { name: 'Re-roll' }),
    ).toBeVisible();
    await rollEncounter(page, 'Poco Path');
    await expect(
        card.getByRole('button', { name: 'Caught', exact: true }),
    ).toBeEnabled();
});

test('caught encounters update dupes and preserve manual, dupes, and mono reason precedence', async ({
    page,
}) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start New Game' }).click();
    await page.getByLabel('Name (optional)').fill('dupes-hoppip-run');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('checkbox', { name: 'Dupes clause' }).check();
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await chooseAnalyticsConsentIfPrompted(page);

    const pocoPathCard = cardFor(page, 'Poco Path').first();
    await pocoPathCard.click();
    await pocoPathCard.getByRole('button', { name: 'Show encounters' }).click();
    const pocoHoppip = pocoPathCard.getByRole('button', {
        name: 'Pick Hoppip',
        exact: true,
    });
    await expect(pocoHoppip).toBeEnabled();
    await page.getByRole('button', { name: 'Game settings' }).click();
    const addBan = page.getByRole('combobox', {
        name: 'Add a Pok\u00e9mon ban',
    });
    await addBan.fill('Skiploom');
    await addBan.press('Enter');
    await expect(pocoHoppip).toBeDisabled();
    await expect(
        pocoPathCard.locator('tr', { hasText: 'Hoppip' }),
    ).toContainText('Banned by game settings');
    await page
        .getByRole('button', { name: 'Remove Skiploom from ban list' })
        .click();
    await expect(pocoHoppip).toBeEnabled();
    await page.getByRole('button', { name: 'Close dialog' }).click();
    await pocoPathCard
        .locator('tr', { hasText: 'Hoppip' })
        .first()
        .getByRole('button', { name: 'Pick Hoppip' })
        .click();
    await resolveEncounter(page, 'Poco Path', 'Caught');

    const southProvinceCard = cardFor(
        page,
        'South Province (Area One)',
    ).first();
    await southProvinceCard.click();
    await southProvinceCard
        .getByRole('button', { name: 'Show encounters' })
        .click();

    const hoppipRow = southProvinceCard
        .locator('tr', { hasText: 'Hoppip' })
        .first();
    await expect(hoppipRow).toContainText('Dupes clause');
    await expect(
        hoppipRow.getByRole('button', { name: 'Pick Hoppip' }),
    ).toBeDisabled();

    await resolveEncounter(page, 'Poco Path', 'Eliminated');
    await expect(hoppipRow).toContainText('Dupes clause');

    await page.getByRole('button', { name: 'Game settings' }).click();
    await page.getByLabel('Mono run').check();
    await page
        .getByRole('combobox', { name: 'Mono type', exact: true })
        .selectOption('normal');
    await expect(page.getByLabel('Mono type')).toHaveValue('normal');
    await expect(page.getByText('Saving...', { exact: true })).toHaveCount(0);
    await expect(hoppipRow).toContainText('Dupes clause');
    const banInput = page.getByRole('combobox', {
        name: 'Add a Pok\u00e9mon ban',
    });
    await banInput.fill('Hoppip');
    await banInput.press('Enter');
    await expect(hoppipRow).toContainText('Banned by game settings');
    await expect(hoppipRow).not.toContainText('Dupes clause');
    await page
        .getByRole('button', { name: 'Remove Hoppip from ban list' })
        .click();
    await expect(hoppipRow).toContainText('Dupes clause');
    await expect(hoppipRow).not.toContainText('Not allowed in mono run');
    await page.getByRole('button', { name: 'Close dialog' }).click();

    await resolveEncounter(page, 'Poco Path', 'Missed');
    await expect(hoppipRow).toContainText('Not allowed in mono run');
    await expect(hoppipRow).not.toContainText('Dupes clause');
    await resolveEncounter(page, 'Poco Path', 'Caught');
    await expect(hoppipRow).toContainText('Dupes clause');

    await page.getByRole('button', { name: 'Game settings' }).click();
    await page.getByLabel('Dupes clause').uncheck();
    await expect(hoppipRow).toContainText('Not allowed in mono run');
    await page.getByRole('button', { name: 'Close dialog' }).click();
});

test('evolution preserves the original grouped encounter name and icon', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'original-form-run', 'Clean');
    await showMoreProgression(page);
    const location = 'South Province (Area Two)';
    const original = 'Flab\u00e9b\u00e9 (Red Flower)';
    const group = 'Flab\u00e9b\u00e9';
    await expandCollapsedSummary(page, location);

    const card = cardFor(page, location).first();
    await card.getByRole('button', { name: 'Show encounters' }).click();
    await card
        .getByRole('button', { name: `Pick ${original}`, exact: true })
        .first()
        .click();
    await card.getByRole('button', { name: 'Hide encounters' }).click();
    const icon = card.getByRole('img', { name: group, exact: true });
    await expect(icon).toBeVisible();
    const originalSource = await icon.getAttribute('src');
    if (!originalSource) {
        throw new Error('Original encounter icon is missing');
    }
    await resolveEncounter(page, location, 'Caught');
    await openBox(page);
    await selectBoxPokemon(page, 'Party', original);
    const evolution = page.getByRole('region', {
        name: 'Evolution',
        exact: true,
    });
    const evolved = await evolution.locator('strong').first().innerText();
    expect(evolved).toMatch(/^Floette/);
    await evolution
        .getByRole('button', { name: 'Evolve', exact: true })
        .click();
    await expect(
        boxSection(page, 'Party').getByRole('img', {
            name: evolved,
            exact: true,
        }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Close dialog' }).click();
    await expect(card.locator('p').filter({ hasText: group })).toHaveText(
        `${group} Caught`,
    );
    await expect(icon).toHaveAttribute('src', originalSource);

    await waitForPersistence(page);
    await page.reload();
    await showMoreProgression(page);
    await expect(card.getByText(group, { exact: true })).toBeVisible();
    await expect(icon).toHaveAttribute('src', originalSource);
    await expandCollapsedSummary(page, location);
    await expect(card.locator('p').filter({ hasText: group })).toHaveText(
        `${group} Caught`,
    );
    await expect(icon).toHaveAttribute('src', originalSource);
    await openBox(page);
    await expect(
        boxSection(page, 'Party').getByRole('img', {
            name: evolved,
            exact: true,
        }),
    ).toBeVisible();
});
