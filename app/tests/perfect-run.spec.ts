import { expect, test, type Page } from '@playwright/test';
import {
    cardFor,
    catchEncounter,
    catchTeraRaid,
    createGame,
    expectNextStep,
    expectProgressionComplete,
    expandCollapsedSummary,
    navigateTo,
    resolveEncounter,
    selectStarter,
    showMoreProgression,
    winBossBattle,
} from './helpers';

test('Fun preset plays through the available progression', async ({ page }) => {
    await page.goto('/');
    await createGame(page, 'fun-run', 'Fun', async (settings) => {
        await expect(settings.getByLabel('Dupes clause')).toBeChecked();
        await expect(settings.getByLabel('Tera raids')).toHaveValue('single');
        await expect(
            settings.getByLabel('Include Team Star battles'),
        ).toBeChecked();
    });
    await expectNextStep(page, 'Starter');
    await selectStarter(page, 'Sprigatito');
    const card = cardFor(page, 'Poco Path').first();
    await test.step('include ocean encounters', async () => {
        await expectNextStep(page, 'Poco Path');
        await expandCollapsedSummary(page, 'Poco Path');
        await card.getByRole('button', { name: 'Show encounters' }).click();
        const rows = card.locator('tbody tr');
        await expect(rows.first()).toBeVisible();
        const inlandCount = await rows.count();
        await card.getByLabel('Include ocean/beach encounters').check();
        await expect.poll(() => rows.count()).toBeGreaterThan(inlandCount);
        await card.getByRole('button', { name: 'Hide encounters' }).click();
    });
    await catchEncounter(page, 'Poco Path');
    await test.step('manually catch Diglett in Inlet Grotto', async () => {
        await expectNextStep(page, 'Inlet Grotto');
        await expandCollapsedSummary(page, 'Inlet Grotto');
        const inletGrotto = cardFor(page, 'Inlet Grotto').first();
        await inletGrotto
            .getByRole('button', { name: 'Show encounters' })
            .click();
        await inletGrotto
            .getByRole('button', { name: 'Pick Diglett', exact: true })
            .first()
            .click();
        await inletGrotto
            .getByRole('button', { name: 'Hide encounters' })
            .click();
        await resolveEncounter(page, 'Inlet Grotto', 'Caught');
    });
    await completeEncounter(page, 'South Province (Area One)');
    await completeBossBattle(page, 'Nemona (Second rival battle)');
    await showMoreProgression(page);
    await completeEncounter(page, 'Pokemon League (Paldea)');
    await completeEncounter(page, 'South Province (Area Two)');
    await completeSingleRaid(page, 1);
    await completeBossBattle(page, 'Katy (Gym)');
    await completeEncounter(page, 'South Province (Area Three)');
    await completeBossBattle(page, 'Klawf (Stony Cliff Titan)');
    await completeBossBattle(page, 'Brassius (Gym)');
    await completeEncounter(page, 'South Province (Area Four)');
    await completeSingleRaid(page, 2);
    await completeEncounter(page, 'West Province (Area One)');
    await completeBossBattle(page, 'Bombirdier (Open Sky Titan)');
    await completeBossBattle(page, 'Giacomo (Team Star)');
    await expectProgressionComplete(page);
    // 20-40%: evolve a caught Pokemon naturally in Box.
    // 40-60%: move party members with buttons and one drag action.
    // 60-80%: inspect a boss move, ability and defenses, then an owned Pokemon's defenses.
    // Endgame: win the Elite Four and verify Home classifies the run as complete.
    await returnHome(page, 'fun-run');
});

test('Challenging preset plays through the available progression', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(
        page,
        'challenging-run',
        'Challenging',
        async (settings) => {
            await expect(settings.getByLabel('Dupes clause')).toBeChecked();
            await expect(settings.getByLabel('Tera raids')).toHaveValue('none');
            await expect(settings.getByLabel('Release starter')).toBeChecked();
            await expect(
                settings.getByLabel('Include Team Star battles'),
            ).toBeChecked();
            await expect(
                settings.getByRole('button', {
                    name: 'Remove Garchomp from ban list',
                }),
            ).toBeVisible();
        },
    );
    await expectNextStep(page, 'Starter');
    await selectStarter(page, 'Sprigatito');
    await completeEncounter(page, 'Poco Path');
    await releaseStarter(page);
    await completeEncounter(page, 'Inlet Grotto');
    await completeEncounter(page, 'South Province (Area One)');
    await completeBossBattle(page, 'Nemona (Second rival battle)');
    await showMoreProgression(page);
    await completeEncounter(page, 'Pokemon League (Paldea)');
    await completeEncounter(page, 'South Province (Area Two)');
    await expect(cardFor(page, 'Tera Raid ★')).toHaveCount(0);
    await completeBossBattle(page, 'Katy (Gym)');
    await completeEncounter(page, 'South Province (Area Three)');
    await completeBossBattle(page, 'Klawf (Stony Cliff Titan)');
    await completeBossBattle(page, 'Brassius (Gym)');
    await completeEncounter(page, 'South Province (Area Four)');
    await expect(cardFor(page, 'Tera Raid ★★')).toHaveCount(0);
    await completeEncounter(page, 'West Province (Area One)');
    await completeBossBattle(page, 'Bombirdier (Open Sky Titan)');
    await completeBossBattle(page, 'Giacomo (Team Star)');
    await expectProgressionComplete(page);
    // 20-40%: add a ban in settings and verify an eligible encounter becomes banned.
    // 40-60%: visit Home midway and resume the same run at its unfinished step.
    // 60-80%: eliminate through an encounter card and verify Death Box membership.
    // Endgame: win the bonus Nemona battle and verify Home classifies the run as complete.
    await returnHome(page, 'challenging-run');
});

test('Mono Electric run plays through the available progression', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'mono-run', 'Clean', async (settings) => {
        await settings.getByLabel('Mono run', { exact: true }).check();
        await settings
            .getByRole('combobox', { name: 'Mono type', exact: true })
            .selectOption('electric');
        await expect(settings.getByLabel('Tera raids')).toHaveCount(0);
    });
    await expectNextStep(page, 'Starter');
    await selectStarter(page, 'Sprigatito');
    await completeEncounter(page, 'Poco Path');
    await releaseStarter(page);
    await completeEncounter(page, 'Inlet Grotto');
    await completeEncounter(page, 'South Province (Area One)');
    await completeBossBattle(page, 'Nemona (Second rival battle)');
    await showMoreProgression(page);
    await completeEncounter(page, 'Pokemon League (Paldea)');
    await completeEncounter(page, 'South Province (Area Two)');
    await completeBossBattle(page, 'Katy (Gym)');
    await completeEncounter(page, 'South Province (Area Three)');
    await completeBossBattle(page, 'Klawf (Stony Cliff Titan)');
    await completeBossBattle(page, 'Brassius (Gym)');
    await completeEncounter(page, 'South Province (Area Four)');
    await completeEncounter(page, 'West Province (Area One)');
    await completeBossBattle(page, 'Bombirdier (Open Sky Titan)');
    await expectProgressionComplete(page);
    // 20-40%: log multiple eligible raid entries and verify Unlimited behavior.
    // 40-60%: miss an encounter not already obtained and verify it is absent from Box.
    // Endgame: lose a late battle and verify Home classifies the run as lost.
    await returnHome(page, 'mono-run');
});

async function completeEncounter(page: Page, location: string) {
    await test.step(location, async () => {
        await expectNextStep(page, location);
        await expandCollapsedSummary(page, location);
        const card = cardFor(page, location).first();
        const confirm = card.getByRole('button', {
            name: 'Confirm',
            exact: true,
        });
        const randomize = card.getByRole('button', {
            name: 'Randomize',
            exact: true,
        });
        await expect(confirm.or(randomize)).toBeVisible();
        if (await confirm.count()) {
            await confirm.click();
            await expect(card).toContainText('Skipped');
        } else {
            await catchEncounter(page, location);
        }
    });
}

async function releaseStarter(page: Page) {
    await expectNextStep(page, 'Release starter');
    const card = cardFor(page, 'Release starter').first();
    await card.getByRole('button', { name: 'Release Sprigatito' }).click();
    await expect(card).toContainText('Released');
}

async function completeBossBattle(page: Page, battle: string) {
    await test.step(battle, async () => {
        await expectNextStep(page, battle);
        await winBossBattle(page, battle);
    });
}

async function completeSingleRaid(page: Page, stars: number) {
    const location = `Tera Raid ${'★'.repeat(stars)}`;
    await test.step(location, async () => {
        await expectNextStep(page, location);
        await catchTeraRaid(page, stars);
        await expect(
            cardFor(page, location).first().getByRole('combobox'),
        ).toHaveCount(0);
    });
}

async function returnHome(page: Page, name: string) {
    await navigateTo(page, 'Home');
    await expect(
        page.getByRole('button', { name: new RegExp(name) }),
    ).toBeVisible();
}
