import { test, expect } from '@playwright/test';
import {
    boxSection,
    createGame,
    navigateTo,
    openBox,
    resolveEncounter,
    rollEncounter,
    selectBoxPokemon,
} from './helpers';

test('home game cards show the Pokemon obtained in a run', async ({ page }) => {
    await page.goto('/');
    await createGame(page, 'card-run');

    const pocoPath = await rollEncounter(page, 'Poco Path');
    await resolveEncounter(page, 'Poco Path', 'Caught');
    const inletGrotto = await rollEncounter(page, 'Inlet Grotto');
    await resolveEncounter(page, 'Inlet Grotto', 'Caught');

    await openBox(page);
    await selectBoxPokemon(page, 'Party', pocoPath);
    const pocoPathDetails = page.getByRole('region', {
        name: `${pocoPath} details`,
    });
    await pocoPathDetails.getByRole('button', { name: 'More options' }).click();
    await pocoPathDetails
        .getByRole('button', { name: 'Remove from party' })
        .click();
    await expect(
        boxSection(page, 'Box').getByRole('img', { name: pocoPath }),
    ).toBeVisible();

    await navigateTo(page, 'Home');

    const gameCard = page.getByRole('button', { name: /card-run/ });
    await expect(gameCard).toContainText('2 caught');
    await expect(gameCard.getByRole('img', { name: pocoPath })).toBeVisible();
    await expect(gameCard.getByRole('img', { name: inletGrotto })).toBeVisible();
    await expect(gameCard.getByRole('img').first()).toHaveAttribute(
        'alt',
        inletGrotto,
    );
});
