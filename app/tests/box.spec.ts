import { test, expect, type Page } from '@playwright/test';
import {
    boxSection,
    catchEncounter,
    cardFor,
    createGame,
    dragBoxPokemon,
    openBox,
    selectBoxPokemon,
    selectStarter,
    waitForPersistence,
} from './helpers';

async function setupRunWithThreeCaught(page: Page) {
    await page.goto('/');
    await createGame(page, 'box-run');

    await selectStarter(page, 'Sprigatito');
    const pocoPath = await catchEncounter(page, 'Poco Path');
    const inletGrotto = await catchEncounter(page, 'Inlet Grotto');

    return {
        starter: 'Sprigatito' as const,
        pocoPath,
        inletGrotto,
    };
}

test('box details show base stats and type defenses for caught Pokemon', async ({
    page,
}) => {
    const { starter, pocoPath, inletGrotto } = await setupRunWithThreeCaught(
        page,
    );

    await test.step('inspect details and type defenses for a caught Pokemon', async () => {
        await openBox(page);
        await selectBoxPokemon(page, 'Party', pocoPath);

        const details = page.getByRole('region', { name: `${pocoPath} details` });
        await expect(details).toContainText('HP');
        await expect(details).toContainText('Type Defenses');
    });

    await test.step('evolve and devolve the starter while summary keeps starter identity', async () => {
        await selectBoxPokemon(page, 'Party', starter);

        const starterDetails = page.getByRole('region', {
            name: `${starter} details`,
        });
        const evolutionSection = starterDetails.getByRole('region', {
            name: 'Evolution',
        });

        await expect(evolutionSection).toContainText('Evolves into Floragato');
        const evolveButton = evolutionSection.getByRole('button', {
            name: 'Evolve',
        });
        await evolveButton.click();

        const evolvedDetails = page.getByRole('region', {
            name: 'Floragato details',
        });
        await expect(evolvedDetails).toBeVisible();
        await expect(
            boxSection(page, 'Party').getByRole('img', { name: 'Floragato' }),
        ).toBeVisible();
        await expect(cardFor(page, 'Starter')).toContainText(starter);

        await evolvedDetails.getByRole('button', { name: 'More options' }).click();
        await evolvedDetails
            .getByRole('button', { name: `Devolve to ${starter}` })
            .click();
        await expect(starterDetails).toBeVisible();
    });

    await test.step('move Pokemon between Party and Box with actions', async () => {
        await selectBoxPokemon(page, 'Party', pocoPath);

        const details = page.getByRole('region', { name: `${pocoPath} details` });
        const party = boxSection(page, 'Party');
        const box = boxSection(page, 'Box');

        await details.getByRole('button', { name: 'More options' }).click();
        await details.getByRole('button', { name: 'Remove from party' }).click();
        await expect(box.getByRole('img', { name: pocoPath })).toBeVisible();

        await details.getByRole('button', { name: 'More options' }).click();
        await details.getByRole('button', { name: 'Add to party' }).click();
        await expect(party.getByRole('img', { name: pocoPath })).toBeVisible();
    });

    await test.step('drag Pokemon between Party, Box, and Death Box', async () => {
        await dragBoxPokemon(page, 'Party', inletGrotto, 'Box');
        await expect(
            boxSection(page, 'Box').getByRole('img', { name: inletGrotto }),
        ).toBeVisible();

        await dragBoxPokemon(page, 'Box', inletGrotto, 'Death Box');
        await expect(
            boxSection(page, 'Death Box').getByRole('img', {
                name: inletGrotto,
            }),
        ).toBeVisible();
    });
});

test('eliminated Pokemon move to Death Box and persist after reload', async ({
    page,
}) => {
    const { starter, pocoPath } = await setupRunWithThreeCaught(
        page,
    );

    await openBox(page);

    await test.step('eliminate a party member into the Death Box', async () => {
        await selectBoxPokemon(page, 'Party', starter);
        const starterDetails = page.getByRole('region', {
            name: `${starter} details`,
        });
        await starterDetails.getByRole('button', { name: 'More options' }).click();
        await starterDetails.getByRole('button', { name: 'Eliminated' }).click();
        await expect(
            boxSection(page, 'Death Box').getByRole('img', { name: starter }),
        ).toBeVisible();
    });

    await waitForPersistence(page);
    await page.reload();

    await test.step('reload keeps Death Box and surviving Party state', async () => {
        await openBox(page);
        await expect(
            boxSection(page, 'Death Box').getByRole('img', { name: starter }),
        ).toBeVisible();
        await expect(
            boxSection(page, 'Party').getByRole('img', { name: pocoPath }),
        ).toBeVisible();
    });
});
