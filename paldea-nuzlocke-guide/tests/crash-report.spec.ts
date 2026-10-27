import { expect, test } from '@playwright/test';
import { chooseAnalyticsConsentIfPrompted } from './helpers';

test('an unexpected error offers an emailed or copied crash report', async ({
    page,
    context,
}) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await chooseAnalyticsConsentIfPrompted(page);

    await page.evaluate(() => {
        setTimeout(() => {
            throw new Error('boom');
        });
    });

    const dialog = page.getByRole('dialog', { name: 'Something went wrong' });
    await expect(dialog).toBeVisible();

    const emailLink = dialog.getByRole('link', { name: 'Email report' });
    const href = await emailLink.getAttribute('href');
    expect(href).toMatch(/^mailto:feedback@paldeanuzlocke\.com\?subject=/);
    expect(decodeURIComponent(href ?? '')).toContain('boom');

    await dialog.getByRole('button', { name: 'Copy report' }).click();
    await expect(dialog.getByRole('button', { name: 'Copied' })).toBeVisible();
    const clipboard = await page.evaluate(() =>
        navigator.clipboard.readText(),
    );
    expect(clipboard).toContain('feedback@paldeanuzlocke.com');
    expect(clipboard).toContain('boom');
});
