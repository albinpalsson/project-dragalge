import { expect, test } from '@playwright/test';

test('the privacy policy is a standalone page', async ({ page }) => {
    await page.goto('/privacy.html');
    await expect(
        page.getByRole('heading', { level: 1, name: 'Privacy policy' }),
    ).toBeVisible();
    // The disclosures Google asks for apps that use Drive.
    await expect(page.getByText('drive.appdata').first()).toBeVisible();
    await expect(
        page.getByRole('link', {
            name: 'Google API Services User Data Policy',
        }),
    ).toBeVisible();
});

test('Home and Licenses link to the privacy policy', async ({ page }) => {
    await page.goto('/');
    const homeLink = page.getByRole('link', { name: 'Privacy policy' });
    await expect(homeLink).toHaveAttribute('href', '/privacy.html');

    await page.getByRole('button', { name: 'Open menu' }).click();
    await page
        .getByRole('navigation')
        .getByRole('button', { name: 'Licenses & Notices', exact: true })
        .click();
    await expect(
        page.getByRole('link', { name: 'Privacy policy' }),
    ).toHaveAttribute('href', '/privacy.html');
});
