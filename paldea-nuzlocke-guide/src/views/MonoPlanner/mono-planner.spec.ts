import { expect, test } from '@playwright/test';

test('plans a mono type run and remembers the settings', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page
        .getByRole('navigation')
        .getByRole('button', { name: 'Mono type planner', exact: true })
        .click();

    await expect(
        page.getByRole('heading', { name: 'Mono type planner' }),
    ).toBeVisible();
    expect(new URL(page.url()).hash).toBe('#/mono-planner');
    await page
        .getByRole('combobox', { name: 'Mono type', exact: true })
        .selectOption('fire');
    await expect(page.getByText(/this run is rated/)).toBeVisible();
    await expect(
        page.getByText('What your team could look like'),
    ).toBeVisible();

    await page.getByLabel('Show all items').check();
    const katy = page.getByRole('listitem').filter({
        has: page.getByText('Katy (Bug Gym)', { exact: true }),
    });
    await katy.getByText('How the score is calculated').click();
    await expect(katy.getByText(/needs \d+ for OK/)).toBeVisible();

    await page.reload();
    await expect(
        page.getByRole('combobox', { name: 'Mono type', exact: true }),
    ).toHaveValue('fire');
    await expect(page.getByLabel('Show all items')).toBeChecked();
});
