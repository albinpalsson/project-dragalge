import { test, expect } from '@playwright/test';
import {
    boxSection,
    cardFor,
    chooseStarter,
    createGame,
    dragBoxPokemon,
    listEncounterNames,
    openBox,
    openGame,
    resolveEncounter,
    rollEncounter,
    selectBoxPokemon,
    waitForPersistence,
} from './helpers';

// The single intended-path run; extend this as each progression card lands.
test('plays a run from the starter through Inlet Grotto', async ({ page }) => {
    await page.goto('/');
    await createGame(page, 'playthrough-run');
    await openGame(page, 'playthrough-run');

    const starter = await chooseStarter(page);

    const listed = await listEncounterNames(page, 'Poco Path');
    const rolled = await rollEncounter(page, 'Poco Path');
    expect(listed).toContain(rolled);

    await resolveEncounter(page, 'Poco Path', 'Caught');
    await expect(cardFor(page, 'Poco Path')).toContainText(rolled);
    await expect(cardFor(page, 'Poco Path')).toContainText('Caught');

    const inletGrottoRoll = await rollEncounter(page, 'Inlet Grotto');
    await resolveEncounter(page, 'Inlet Grotto', 'Caught');
    await expect(cardFor(page, 'Inlet Grotto')).toContainText(inletGrottoRoll);
    await expect(cardFor(page, 'Inlet Grotto')).toContainText('Caught');

    // Catching fills free party slots, so all three are in the party already.
    await openBox(page);
    const party = boxSection(page, 'Party');
    await expect(party.getByRole('img', { name: starter })).toBeVisible();
    await expect(party.getByRole('img', { name: rolled })).toBeVisible();

    await selectBoxPokemon(page, 'Party', rolled);
    const details = page.getByRole('region', { name: `${rolled} details` });
    await expect(details).toContainText('HP');
    await expect(details).toContainText('Speed');
    // Verify type effectiveness/defenses data is available
    await expect(details).toContainText('Type Defenses');

    await details.getByRole('button', { name: 'Remove from party' }).click();
    await expect(party.getByRole('img', { name: rolled })).toBeHidden();
    await expect(
        boxSection(page, 'Box').getByRole('img', { name: rolled }),
    ).toBeVisible();

    // The detail pane stays open on the moved Pokemon, so it can be added straight back.
    await details.getByRole('button', { name: 'Add to party' }).click();
    await expect(party.getByRole('img', { name: rolled })).toBeVisible();

    await dragBoxPokemon(page, 'Party', inletGrottoRoll, 'Box');
    await expect(
        boxSection(page, 'Box').getByRole('img', { name: inletGrottoRoll }),
    ).toBeVisible();
    await dragBoxPokemon(page, 'Box', inletGrottoRoll, 'Death Box');
    await expect(
        boxSection(page, 'Death Box').getByRole('img', {
            name: inletGrottoRoll,
        }),
    ).toBeVisible();

    await selectBoxPokemon(page, 'Party', starter);
    const starterDetails = page.getByRole('region', {
        name: `${starter} details`,
    });
    await starterDetails
        .getByRole('button', { name: 'More Pokémon actions' })
        .click();
    await starterDetails
        .getByRole('button', { name: 'Mark eliminated' })
        .click();
    await expect(party.getByRole('img', { name: starter })).toBeHidden();
    await expect(
        boxSection(page, 'Death Box').getByRole('img', { name: starter }),
    ).toBeVisible();

    await waitForPersistence(page);
    await page.reload();
    await openGame(page, 'playthrough-run');

    await expect(cardFor(page, 'Starter')).toContainText(starter);
    await expect(cardFor(page, 'Poco Path')).toContainText(rolled);
    await expect(cardFor(page, 'Poco Path')).toContainText('Caught');
    await expect(cardFor(page, 'Inlet Grotto')).toContainText(inletGrottoRoll);
    await expect(cardFor(page, 'Inlet Grotto')).toContainText('Eliminated');

    await openBox(page);
    await expect(
        boxSection(page, 'Death Box').getByRole('img', { name: starter }),
    ).toBeVisible();
    await expect(
        boxSection(page, 'Death Box').getByRole('img', {
            name: inletGrottoRoll,
        }),
    ).toBeVisible();
    await expect(
        boxSection(page, 'Party').getByRole('img', { name: rolled }),
    ).toBeVisible();
});
