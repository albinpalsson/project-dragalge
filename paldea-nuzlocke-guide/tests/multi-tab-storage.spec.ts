import { expect, test } from '@playwright/test';
import { cardFor, createGame, waitForPersistence } from './helpers';

test('the newest tab owns writes and reload takes control', async ({
    page,
    context,
}) => {
    await page.goto('/');
    await createGame(page, 'shared-tabs');
    await waitForPersistence(page);

    const secondTab = await context.newPage();
    await secondTab.goto('/');
    await expect(cardFor(secondTab, 'Starter').first()).toBeVisible();

    await cardFor(page, 'Starter')
        .first()
        .getByRole('button', { name: 'Sprigatito' })
        .click();
    const conflict = page.getByRole('dialog', {
        name: 'Game opened in another tab',
    });
    await expect(conflict).toBeVisible();
    await expect(conflict).toContainText('was not saved');
    await expect(
        conflict.getByRole('link', { name: 'Email report' }),
    ).toHaveCount(0);
    await expect(
        conflict.getByRole('button', { name: 'Close dialog' }),
    ).toHaveCount(0);
    await page.keyboard.press('Escape');
    await page.mouse.click(5, 5);
    await expect(conflict).toBeVisible();

    await conflict.getByRole('button', { name: 'Reload' }).click();
    await expect(cardFor(page, 'Starter').first()).toBeVisible();
    await expect(
        cardFor(page, 'Starter')
            .first()
            .getByRole('button', { name: 'Reset starter choice' }),
    ).toHaveCount(0);

    await cardFor(page, 'Starter')
        .first()
        .getByRole('button', { name: 'Quaxly' })
        .click();
    await waitForPersistence(page);
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await cardFor(secondTab, 'Starter')
        .first()
        .getByRole('button', { name: 'Quaxly' })
        .click();
    await expect(
        secondTab.getByRole('dialog', { name: 'Game opened in another tab' }),
    ).toBeVisible();

    await page.reload();
    await expect(cardFor(page, 'Starter').first()).toContainText(
        /Quaxly\s*Selected/,
    );
});
