import { test } from '@playwright/test';
import {
    catchEncounter,
    createGame,
    expectNextStep,
    expectProgressionComplete,
    selectStarter,
    winBossBattle,
} from './helpers';

// The single intended-path run; extend this as each progression card lands with one
// expected-next-step assertion and one simplest successful action.
test('plays the canonical perfect run through the current progression', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'playthrough-run');

    await expectNextStep(page, 'Starter');
    await selectStarter(page, 'Sprigatito');

    await expectNextStep(page, 'Poco Path');
    await catchEncounter(page, 'Poco Path');

    await expectNextStep(page, 'Inlet Grotto');
    await catchEncounter(page, 'Inlet Grotto');

    await expectNextStep(page, 'South Province (Area One)');
    await catchEncounter(page, 'South Province (Area One)');

    await expectNextStep(page, 'Nemona (Second Battle)');
    await winBossBattle(page, 'Nemona (Second Battle)');

    await expectProgressionComplete(page);
});
