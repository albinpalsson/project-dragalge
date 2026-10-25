import { test, expect } from '@playwright/test';
import {
    cardFor,
    createGameWithTeraRaids,
    expandCollapsedSummary,
    boxSection,
    openBox,
} from './helpers';

test('raid suggestions honor live bans and grouped catches keep concrete forms', async ({
    page,
}) => {
    await page.goto('/');
    await createGameWithTeraRaids(page, 'raid-group-run', 'unlimited');

    await expandCollapsedSummary(page, 'Tera Raid ★');
    const card = cardFor(page, 'Tera Raid ★').first();
    const addInput = card.getByRole('combobox', {
        name: 'Add a 1-star Tera Raid Pokémon',
    });
    await addInput.fill('Hoppip');
    await expect(
        card.getByRole('option', { name: 'Hoppip', exact: true }),
    ).toBeVisible();
    await page
        .getByRole('button', { name: 'Game settings', exact: true })
        .click();
    const banInput = page.getByRole('combobox', {
        name: 'Add a Pok\u00e9mon ban',
    });
    await banInput.fill('Hoppip');
    await banInput.press('Enter');
    await expect(
        page.getByRole('button', { name: 'Remove Hoppip from ban list' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Close dialog' }).click();
    await addInput.fill('Hoppip');
    await expect(
        card.getByRole('option', { name: 'Hoppip', exact: true }),
    ).toHaveCount(0);

    await addInput.fill('Basculin');
    await card.getByRole('option', { name: 'Basculin', exact: true }).click();
    await expect(
        card.getByRole('img', { name: 'Basculin', exact: true }),
    ).toBeVisible();

    await addInput.fill('Basculin (Red-Striped)');
    await card
        .getByRole('option', {
            name: 'Basculin (Red-Striped)',
            exact: true,
        })
        .click();
    await expect(
        card.getByRole('img', { name: 'Basculin', exact: true }),
    ).toHaveCount(2);

    await card
        .locator('li', { hasText: 'Basculin' })
        .first()
        .getByRole('button', { name: 'Caught', exact: true })
        .click();
    await card
        .locator('li', { hasText: 'Basculin' })
        .nth(1)
        .getByRole('button', { name: 'Caught', exact: true })
        .click();

    await expect(addInput).toBeVisible();
    await openBox(page);
    await expect(
        boxSection(page, 'Party')
            .getByRole('img', {
                name: 'Basculin (Red-Striped)',
                exact: true,
            })
            .first(),
    ).toBeVisible();
    await expect(
        boxSection(page, 'Party').getByRole('img', {
            name: /Basculin \((Red-Striped|Blue-Striped)\)/,
        }),
    ).toHaveCount(2);
});
