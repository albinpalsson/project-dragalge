import { test, expect } from '@playwright/test';
import {
    cardFor,
    chooseStarter,
    createGame,
    listEncounterNames,
    openGame,
    resolveEncounter,
    rollEncounter,
    waitForPersistence,
} from './helpers';

// The single intended-path run; extend this as each progression card lands.
test('plays a run from the starter through the first encounter', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'playthrough-run');
    await openGame(page, 'playthrough-run');

    const starter = await chooseStarter(page);

    const listed = await listEncounterNames(page, 'Poco Path');
    const rolled = await rollEncounter(page, 'Poco Path');
    expect(listed).toContain(rolled);

    await resolveEncounter(page, 'Poco Path', 'Caught');
    await expect(cardFor(page, 'Poco Path')).toContainText(`Caught ${rolled}`);

    await waitForPersistence(page);
    await page.reload();
    await openGame(page, 'playthrough-run');

    await expect(cardFor(page, 'Starter')).toContainText(starter);
    await expect(cardFor(page, 'Poco Path')).toContainText(`Caught ${rolled}`);
});
