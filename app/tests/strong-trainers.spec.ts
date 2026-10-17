import { expect, test } from '@playwright/test';
import {
    cardFor,
    createGame,
    expandCollapsedSummary,
    expectNextStep,
    showMoreProgression,
} from './helpers';

test('strong trainer cards de-emphasize collapsed summaries and show rosters', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'strong-trainers-run', {
        preset: 'Clean',
        custom: async (settings) => {
            const showStrongTrainers = settings.getByLabel(
                'Show strong trainers',
            );
            await expect(showStrongTrainers).not.toBeChecked();
            await showStrongTrainers.check();
        },
    });

    await expectNextStep(page, 'Starter');
    await showMoreProgression(page);

    const trainers = [
        ['Hiker Nerea', 'South Province (A5)', 'Sudowoodo'],
        ['Sofia the Waitress', 'South Province (A5)', 'Indeedee'],
        [
            'Severino the Office Worker',
            'South Province (A3)',
            'Jigglypuff',
        ],
        ['Candina the Model', 'West Province (A1)', 'Oinkologne'],
        ['Elias the Black Belt', 'Asado Desert', 'Breloom'],
        ['Xavier the Student', 'East Province (A2)', 'Kirlia'],
        ['Ignacio the Scientist', 'Glaseado Mountain', 'Magnezone'],
        ['Angel the Courier', 'South Province (A2)', 'Psyduck'],
    ] as const;

    for (const [name] of trainers) {
        const card = cardFor(page, `Strong trainer - ${name}`).first();
        await expect(card).toBeVisible();
        await expect(card.locator('img')).toHaveCount(0);
        await expect(
            card.getByText('→ Next step', { exact: true }),
        ).toHaveCount(0);
    }

    for (const [name, , firstPokemon] of trainers) {
        await expandCollapsedSummary(page, `Strong trainer - ${name}`);
        await expect(
            cardFor(page, `Strong trainer - ${name}`)
                .first()
                .getByText(firstPokemon),
        ).toBeVisible();
    }

    await expect(
        cardFor(page, 'Strong trainer - Angel the Courier').first(),
    ).toContainText('Angel is found at the crossroads just east or Cortondo');

    const elias = cardFor(
        page,
        'Strong trainer - Elias the Black Belt',
    ).first();
    await expect(
        elias.getByRole('heading', {
            name: 'Strong trainer - Elias the Black Belt',
            exact: true,
        }),
    ).toBeVisible();
    await expect(elias.locator('header img')).toHaveCount(0);
    await expect(elias).toContainText('Asado Desert');

    const heracross = elias
        .locator('article')
        .filter({ hasText: 'Heracross' })
        .last();
    await expect(heracross).toContainText('Swarm or Guts');
    await expect(heracross).toContainText('Focus Sash');
    await heracross.getByRole('button', { name: 'Guts', exact: true }).hover();
    await expect(page.getByRole('tooltip')).toBeVisible();
    const item = heracross.getByRole('button', {
        name: 'Focus Sash',
        exact: true,
    });
    await item.hover();
    await expect(page.getByRole('tooltip')).toContainText('full HP');

    await expectNextStep(page, 'Starter');

    await page.getByRole('button', { name: 'Game settings' }).click();
    const setting = page.getByLabel('Show strong trainers');
    await expect(setting).toBeChecked();
    await setting.uncheck();
    await expect(
        cardFor(page, 'Strong trainer - Elias the Black Belt'),
    ).toHaveCount(0);
    await setting.check();
    await expect(
        cardFor(page, 'Strong trainer - Elias the Black Belt'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Close dialog' }).click();
});
