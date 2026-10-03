import { test } from '@playwright/test';
import {
    catchEncounter,
    catchTeraRaid,
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

    await expectNextStep(page, 'Nemona (Second rival battle)');
    await winBossBattle(page, 'Nemona (Second rival battle)');

    await expectNextStep(page, 'Pokemon League (Paldea)');
    await catchEncounter(page, 'Pokemon League (Paldea)');

    await expectNextStep(page, 'South Province (Area Two)');
    await catchEncounter(page, 'South Province (Area Two)');

    await expectNextStep(page, 'Tera Raid ★');
    await catchTeraRaid(page, 1, 'Hoppip');

    await expectNextStep(page, 'Katy (Gym)');
    await winBossBattle(page, 'Katy (Gym)');

    await expectNextStep(page, 'South Province (Area Three)');
    await catchEncounter(page, 'South Province (Area Three)');

    await expectNextStep(page, 'Klawf (Stony Cliff Titan)');
    await winBossBattle(page, 'Klawf (Stony Cliff Titan)');

    await expectNextStep(page, 'Brassius (Gym)');
    await winBossBattle(page, 'Brassius (Gym)');

    await expectNextStep(page, 'South Province (Area Four)');
    await catchEncounter(page, 'South Province (Area Four)');

    await expectNextStep(page, 'Tera Raid ★★');
    await catchTeraRaid(page, 2, 'Hoppip');

    await expectNextStep(page, 'West Province (Area One)');
    await catchEncounter(page, 'West Province (Area One)');

    await expectNextStep(page, 'Bombirdier (Open Sky Titan)');
    await winBossBattle(page, 'Bombirdier (Open Sky Titan)');

    await expectNextStep(page, 'Giacomo (Team Star)');
    await winBossBattle(page, 'Giacomo (Team Star)');

    await expectProgressionComplete(page);
});
