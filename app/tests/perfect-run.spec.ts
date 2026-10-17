import { expect, type Page, test } from '@playwright/test';
import {
    boxSection,
    cardFor,
    catchEncounter,
    catchTeraRaid,
    createGame,
    dragBoxPokemon,
    expandCollapsedSummary,
    expectNextStep,
    expectProgressionComplete,
    navigateTo,
    openBox,
    rollEncounter,
    resolveEncounter,
    selectBoxPokemon,
    selectStarter,
    showMoreProgression,
    winBossBattle,
} from './helpers';

test.setTimeout(120_000);

test('Fun preset plays through the available progression', async ({ page }) => {
    await page.goto('/');
    await createGame(page, 'fun-run', {
        preset: 'Fun',
        custom: async (settings) => {
            await expect(settings.getByLabel('Dupes clause')).toBeChecked();
            await expect(settings.getByLabel('Tera raids')).toHaveValue(
                'single',
            );
            await expect(
                settings.getByLabel('Include Team Star battles'),
            ).toBeChecked();
            await settings.getByLabel('Show strong trainers').check();
        },
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
    await completeEncounter(page, 'South Province (A1)');
    await completeBossBattle(page, 'Nemona (2nd rival battle)');
    await showMoreProgression(page);
    await expect(
        page.getByRole('region', { name: 'Nuzlocke complete' }),
    ).toBeVisible();
    await completeEncounter(page, 'Pokemon League');
    await completeEncounter(page, 'South Province (A2)');
    await completeSingleRaid(page, 1);
    await completeBossBattle(page, 'Katy (Gym)');
    await evolveCaughtPokemonInBox(page);
    await completeEncounter(page, 'South Province (A3)');
    await completeBossBattle(page, 'Klawf (Stony Cliff Titan)');
    await completeBossBattle(page, 'Brassius (Gym)');
    await completeEncounter(page, 'South Province (A4)');
    await completeSingleRaid(page, 2);
    await completeEncounter(page, 'West Province (A1)');
    await movePartyMembersInBox(page);
    await completeBossBattle(page, 'Bombirdier (Open Sky Titan)');
    await completeBossBattle(page, 'Giacomo (Team Star)');
    await expect(
        cardFor(page, 'South Paldean Sea')
            .first()
            .getByText(/Lv \d+-\d+/),
    ).toHaveText('Lv 14-23');
    await completeEncounter(page, 'South Paldean Sea');
    await completeEncounter(page, 'East Province (A1)');
    await completeBossBattle(page, 'Nemona (3rd rival battle)');
    await completeEncounter(page, 'South Province (A5)');
    await completeEncounter(page, 'East Province (A2)');
    await test.step('the Iono milestone includes the Eviolite tip', async () => {
        const title = 'South Province (A5) trainer reward';
        const tipSummary = cardFor(page, title).first();
        await tipSummary.click();
        const tipCard = page.locator('li > article').filter({ hasText: title });
        await expect(tipCard).toContainText('Defeat 7 trainers');
    });
    await completeBossBattle(page, 'Iono (Gym)');
    await completeEncounter(page, 'Asado Desert');
    await test.step('inspect an optional strong trainer without changing progress', async () => {
        const name = 'Strong trainer - Elias the Black Belt';
        await expandCollapsedSummary(page, name);
        const trainerCard = cardFor(page, name).first();
        await expect(trainerCard).toContainText('Find Elias the Black Belt');
        const heracross = trainerCard
            .locator('article')
            .filter({ hasText: 'Heracross' });
        await expect(heracross).toContainText('Focus Sash');
    });
    await completeEncounter(page, 'East Paldean Sea');
    await completeEncounter(page, 'East Province (A3)');
    await completeBossBattle(page, 'Mela (Team Star)');
    await completeEncounter(page, 'West Province (A2)');
    await completeBossBattle(page, 'Orthworm (Lurking Steel Titan)');
    await completeBossBattle(page, 'Kofu (Gym)');
    await completeEncounter(page, 'West Province (A3)');
    await completeEncounter(page, 'Tagtree Thicket');
    await completeBossBattle(page, 'Atticus (Team Star)');
    await completeSingleRaid(page, 3);
    await completeEncounter(page, 'West Paldean Sea');
    await completeEncounter(page, 'Dalizapa Passage');
    await completeBossBattle(page, 'Larry (Gym)');
    await inspectBossAndOwnedPokemon(page, 'Larry (Gym)');
    await completeBossBattle(page, 'Nemona (4th rival battle)');
    await completeEncounter(page, 'Glaseado Mountain');
    await completeBossBattle(page, 'Ryme (Gym)');
    await completeEncounter(page, 'Alfornada Cavern');
    await completeEncounter(page, 'South Province (A6)');
    await completeBossBattle(page, 'Nemona (5th rival battle)');
    await completeSingleRaid(page, 4);
    await completeBossBattle(page, 'Great Tusk (Quaking Earth Titan)');
    await completeBossBattle(page, 'Tulip (Gym)');
    await completeEncounter(page, 'North Province (A3)');
    await completeEncounter(page, 'North Paldean Sea');
    await completeBossBattle(page, 'Grusha (Gym)');
    await completeBossBattle(page, 'Ortega (Team Star)');
    await completeEncounter(page, 'North Province (A1)');
    await completeEncounter(page, 'North Province (A2)');
    await completeEncounter(page, 'Casseroya Lake');
    await completeEncounter(page, 'Socarrat Trail');
    await completeBossBattle(page, 'Eri (Team Star)');
    await completeBossBattle(page, 'Dondozo (False Dragon Titan)');
    await completeBossBattle(page, 'Rika (Elite Four)');
    await completeBossBattle(page, 'Poppy (Elite Four)');
    await completeBossBattle(page, 'Larry (Elite Four)');
    await completeBossBattle(page, 'Hassel (Elite Four)');
    await completeBossBattle(page, 'Geeta (Top Champion)');
    const championNotice = page.getByRole('region', {
        name: 'Nuzlocke complete',
    });
    await expect(
        championNotice.getByRole('heading', { name: 'Nuzlocke complete' }),
    ).toBeVisible();
    await expect(championNotice.locator('p')).toHaveText(
        "You are now the Paldea Champion. At this point, you can consider the Nuzlocke complete. Of course, it's your run and your rules, and there's more of the game to play. If your team is still able to battle and you're interested in a bonus challenge, consider heading straight to Mesagoza for one more back-to-back battle against Nemona.",
    );
    await expect(
        cardFor(page, 'Nemona (Final rival battle)').first(),
    ).toBeVisible();
    await expectProgressionComplete(page);
    await returnHome(page, 'fun-run');
    await expect(
        page.getByRole('button', { name: /Run Complete/ }),
    ).toBeVisible();
});

test('Challenging preset plays through the available progression', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'challenging-run', {
        preset: 'Challenging',
        custom: async (settings) => {
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
    });
    await expectNextStep(page, 'Starter');
    await selectStarter(page, 'Sprigatito');
    await completeEncounter(page, 'Poco Path');
    await releaseStarter(page);
    await completeEncounter(page, 'Inlet Grotto');
    await completeEncounter(page, 'South Province (A1)');
    await completeBossBattle(page, 'Nemona (2nd rival battle)');
    await showMoreProgression(page);
    await test.step('ban a Pokemon and verify its encounter is disabled', async () => {
        await page.getByRole('button', { name: 'Game settings' }).click();
        const banInput = page.getByRole('combobox', {
            name: 'Add a Pokémon ban',
        });
        await banInput.fill('Skiploom');
        await banInput.press('Enter');
        await expect(
            page.getByRole('button', { name: 'Remove Skiploom from ban list' }),
        ).toBeVisible();
        await page.getByRole('button', { name: 'Close dialog' }).click();

        await expandCollapsedSummary(page, 'Poco Path');
        const pocoPath = cardFor(page, 'Poco Path').first();
        await pocoPath.getByRole('button', { name: 'Show encounters' }).click();
        const hoppipRow = pocoPath.locator('tr', { hasText: 'Hoppip' }).first();
        await expect(hoppipRow).toContainText('Banned by game settings');
        await expect(
            hoppipRow.getByRole('button', { name: 'Pick Hoppip' }),
        ).toBeDisabled();
    });
    await completeEncounter(page, 'Pokemon League');
    await completeEncounter(page, 'South Province (A2)');
    await test.step('leave Home and resume at the same unfinished step', async () => {
        await navigateTo(page, 'Home');
        await page.getByRole('button', { name: /challenging-run/ }).click();
        await expectNextStep(page, 'Katy (Gym)');
        await showMoreProgression(page);
    });
    await expect(cardFor(page, 'Tera Raid ★')).toHaveCount(0);
    await completeBossBattle(page, 'Katy (Gym)');
    await completeEncounter(page, 'South Province (A3)');
    await completeBossBattle(page, 'Klawf (Stony Cliff Titan)');
    await completeBossBattle(page, 'Brassius (Gym)');
    await completeEncounter(page, 'South Province (A4)');
    await expect(cardFor(page, 'Tera Raid ★★')).toHaveCount(0);
    await completeEncounter(page, 'West Province (A1)');
    await completeBossBattle(page, 'Bombirdier (Open Sky Titan)');
    await completeBossBattle(page, 'Giacomo (Team Star)');
    await completeEncounter(page, 'South Paldean Sea');
    await completeEncounter(page, 'East Province (A1)');
    await completeBossBattle(page, 'Nemona (3rd rival battle)');
    await completeEncounter(page, 'South Province (A5)');
    await completeEncounter(page, 'East Province (A2)');
    await completeBossBattle(page, 'Iono (Gym)');
    await completeEncounter(page, 'Asado Desert');
    await completeEncounter(page, 'East Paldean Sea');
    await completeEncounter(page, 'East Province (A3)');
    await completeBossBattle(page, 'Mela (Team Star)');
    await completeEncounter(page, 'West Province (A2)');
    await completeBossBattle(page, 'Orthworm (Lurking Steel Titan)');
    await completeBossBattle(page, 'Kofu (Gym)');
    await completeEncounter(page, 'West Province (A3)');
    await completeEncounter(page, 'Tagtree Thicket');
    await completeBossBattle(page, 'Atticus (Team Star)');
    await expect(cardFor(page, 'Tera Raid ★★★')).toHaveCount(0);
    await test.step('eliminate an encounter and verify Death Box membership', async () => {
        const eliminated = await rollEncounter(page, 'West Paldean Sea');
        await resolveEncounter(page, 'West Paldean Sea', 'Eliminated');
        await openBox(page);
        await expect(
            boxSection(page, 'Death Box').getByRole('img', {
                name: eliminated,
            }),
        ).toBeVisible();
        await page.keyboard.press('Escape');
    });
    await completeEncounter(page, 'Dalizapa Passage');
    await completeBossBattle(page, 'Larry (Gym)');
    await completeBossBattle(page, 'Nemona (4th rival battle)');
    await completeEncounter(page, 'Glaseado Mountain');
    await completeBossBattle(page, 'Ryme (Gym)');
    await completeEncounter(page, 'Alfornada Cavern');
    await completeEncounter(page, 'South Province (A6)');
    await completeBossBattle(page, 'Nemona (5th rival battle)');
    await expect(cardFor(page, 'Tera Raid ★★★★')).toHaveCount(0);
    await completeBossBattle(page, 'Great Tusk (Quaking Earth Titan)');
    await completeBossBattle(page, 'Tulip (Gym)');
    await completeEncounter(page, 'North Province (A3)');
    await completeEncounter(page, 'North Paldean Sea');
    await completeBossBattle(page, 'Grusha (Gym)');
    await completeBossBattle(page, 'Ortega (Team Star)');
    await completeEncounter(page, 'North Province (A1)');
    await completeEncounter(page, 'North Province (A2)');
    await completeEncounter(page, 'Casseroya Lake');
    await completeEncounter(page, 'Socarrat Trail');
    await completeBossBattle(page, 'Eri (Team Star)');
    await completeBossBattle(page, 'Dondozo (False Dragon Titan)');
    await completeBossBattle(page, 'Rika (Elite Four)');
    await completeBossBattle(page, 'Poppy (Elite Four)');
    await completeBossBattle(page, 'Larry (Elite Four)');
    await completeBossBattle(page, 'Hassel (Elite Four)');
    await completeBossBattle(page, 'Geeta (Top Champion)');
    await expect(
        page.getByRole('region', { name: 'Nuzlocke complete' }),
    ).toBeVisible();
    await test.step('win the optional Nemona bonus battle', async () => {
        await winBossBattle(page, 'Nemona (Final rival battle)');
    });
    await expectProgressionComplete(page);
    await returnHome(page, 'challenging-run');
    await expect(
        page.getByRole('button', { name: /Run Complete/ }),
    ).toBeVisible();
});

test('Mono Electric run plays through the available progression', async ({
    page,
}) => {
    await page.goto('/');
    await createGame(page, 'mono-run', {
        preset: 'Clean',
        variant: 'v',
        custom: async (settings) => {
            await settings.getByLabel('Mono run', { exact: true }).check();
            await settings
                .getByRole('combobox', { name: 'Mono type', exact: true })
                .selectOption('electric');
            await expect(settings.getByLabel('Tera raids')).toHaveCount(0);
        },
    });
    await expectNextStep(page, 'Starter');
    await selectStarter(page, 'Sprigatito');
    await completeEncounter(page, 'Poco Path');
    await releaseStarter(page);
    await completeEncounter(page, 'Inlet Grotto');
    await completeEncounter(page, 'South Province (A1)');
    await completeBossBattle(page, 'Nemona (2nd rival battle)');
    await showMoreProgression(page);
    await completeEncounter(page, 'Pokemon League');
    await completeEncounter(page, 'South Province (A2)');
    await addMultipleUnlimitedRaidEntries(page);
    await completeBossBattle(page, 'Katy (Gym)');
    await completeEncounter(page, 'South Province (A3)');
    await completeBossBattle(page, 'Klawf (Stony Cliff Titan)');
    await completeBossBattle(page, 'Brassius (Gym)');
    await completeEncounter(page, 'South Province (A4)');
    await completeEncounter(page, 'West Province (A1)');
    await completeBossBattle(page, 'Bombirdier (Open Sky Titan)');
    await completeEncounter(page, 'South Paldean Sea');
    await missEligibleEncounter(page, 'East Province (A1)');
    await completeBossBattle(page, 'Nemona (3rd rival battle)');
    await completeEncounter(page, 'South Province (A5)');
    await completeEncounter(page, 'East Province (A2)');
    await completeBossBattle(page, 'Iono (Gym)');
    await completeEncounter(page, 'Asado Desert');
    await completeEncounter(page, 'East Paldean Sea');
    await completeEncounter(page, 'East Province (A3)');
    await completeEncounter(page, 'West Province (A2)');
    await completeBossBattle(page, 'Orthworm (Lurking Steel Titan)');
    await completeBossBattle(page, 'Kofu (Gym)');
    await completeEncounter(page, 'West Province (A3)');
    await completeEncounter(page, 'Tagtree Thicket');
    await expect(cardFor(page, 'Tera Raid ★★★ (3-star)')).toBeVisible();
    await completeEncounter(page, 'West Paldean Sea');
    await completeEncounter(page, 'Dalizapa Passage');
    await completeBossBattle(page, 'Larry (Gym)');
    await completeBossBattle(page, 'Nemona (4th rival battle)');
    await completeEncounter(page, 'Glaseado Mountain');
    await completeBossBattle(page, 'Ryme (Gym)');
    await completeEncounter(page, 'Alfornada Cavern');
    await completeEncounter(page, 'South Province (A6)');
    await completeBossBattle(page, 'Nemona (5th rival battle)');
    await expect(cardFor(page, 'Tera Raid ★★★★ (4-star)')).toBeVisible();
    await completeBossBattle(page, 'Iron Treads (Quaking Earth Titan)');
    await completeBossBattle(page, 'Tulip (Gym)');
    await completeEncounter(page, 'North Province (A3)');
    await completeEncounter(page, 'North Paldean Sea');
    await completeBossBattle(page, 'Grusha (Gym)');
    await completeEncounter(page, 'North Province (A1)');
    await completeEncounter(page, 'North Province (A2)');
    await completeEncounter(page, 'Casseroya Lake');
    await completeEncounter(page, 'Socarrat Trail');
    await completeBossBattle(page, 'Dondozo (False Dragon Titan)');
    await completeBossBattle(page, 'Rika (Elite Four)');
    await completeBossBattle(page, 'Poppy (Elite Four)');
    await completeBossBattle(page, 'Larry (Elite Four)');
    await completeBossBattle(page, 'Hassel (Elite Four)');
    await loseBossBattle(page, 'Geeta (Top Champion)');
    await expectProgressionComplete(page);
    await returnHome(page, 'mono-run');
    await expect(page.getByRole('button', { name: /Run Lost/ })).toBeVisible();
});

async function evolveCaughtPokemonInBox(page: Page) {
    await test.step('evolve a caught Pokemon in Box', async () => {
        await openBox(page);
        await selectBoxPokemon(page, 'Party', 'Sprigatito');
        const evolution = page
            .getByRole('region', { name: 'Sprigatito details' })
            .getByRole('region', { name: 'Evolution' });
        await expect(evolution).toContainText('Evolves into Floragato');
        await evolution.getByRole('button', { name: 'Evolve' }).click();
        await expect(
            page.getByRole('region', { name: 'Floragato details' }),
        ).toBeVisible();
        await page.keyboard.press('Escape');
    });
}

async function movePartyMembersInBox(page: Page) {
    await test.step('move party members with buttons and drag', async () => {
        await openBox(page);
        const partyImages = await boxSection(page, 'Party')
            .getByRole('img')
            .all();
        const pokemonName = await partyImages[1]?.getAttribute('alt');
        if (!pokemonName) {
            throw new Error('Expected at least two Pokemon in the Party');
        }

        await selectBoxPokemon(page, 'Party', pokemonName);
        const details = page.getByRole('region', {
            name: `${pokemonName} details`,
        });
        await details.getByRole('button', { name: 'More options' }).click();
        await details
            .getByRole('button', { name: 'Remove from party' })
            .click();
        await expect(
            boxSection(page, 'Box').getByRole('img', { name: pokemonName }),
        ).toBeVisible();

        await details.getByRole('button', { name: 'More options' }).click();
        await details.getByRole('button', { name: 'Add to party' }).click();
        await expect(
            boxSection(page, 'Party').getByRole('img', { name: pokemonName }),
        ).toBeVisible();

        await dragBoxPokemon(page, 'Party', 'Floragato', 'Box');
        await expect(
            boxSection(page, 'Box').getByRole('img', { name: 'Floragato' }),
        ).toBeVisible();
        await page.keyboard.press('Escape');
    });
}

async function inspectBossAndOwnedPokemon(page: Page, battle: string) {
    await test.step('inspect a boss and an owned Pokemon', async () => {
        await expandCollapsedSummary(page, battle);
        const bossCard = cardFor(page, battle).first();
        const bossPokemon = bossCard.locator('article').first();
        const moveDescription = bossPokemon
            .getByRole('button', { name: /description$/ })
            .first();
        await moveDescription.hover();
        await expect(page.getByRole('tooltip')).toBeVisible();
        const ability = bossPokemon
            .locator('p')
            .filter({ hasText: 'Ability:' })
            .getByRole('button');
        await ability.hover();
        await expect(page.getByRole('tooltip')).toBeVisible();

        await bossPokemon
            .getByRole('button', { name: /type defenses$/ })
            .click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.keyboard.press('Escape');

        await openBox(page);
        const ownedPokemon = await boxSection(page, 'Party')
            .getByRole('img')
            .first()
            .getAttribute('alt');
        if (!ownedPokemon) {
            throw new Error('Expected an owned Pokemon in the Party');
        }
        await selectBoxPokemon(page, 'Party', ownedPokemon);
        await expect(
            page.getByRole('region', {
                name: `${ownedPokemon} details`,
            }),
        ).toContainText(/Type defenses/);
        await page.keyboard.press('Escape');
    });
}

async function addMultipleUnlimitedRaidEntries(page: Page) {
    await test.step('log multiple eligible raids in Unlimited mode', async () => {
        await expandCollapsedSummary(page, 'Tera Raid ★');
        const card = cardFor(page, 'Tera Raid ★').first();
        const picker = card.getByRole('combobox', {
            name: 'Add a 1-star Tera Raid Pokémon',
        });

        for (let count = 0; count < 2; count += 1) {
            await picker.fill('a');
            const option = card.getByRole('option').first();
            await expect(option).toBeVisible();
            await option.click();
            await card
                .getByRole('button', { name: 'Caught', exact: true })
                .last()
                .click();
            await expect(picker).toBeVisible();
        }

        await expect(
            card.getByRole('button', { name: 'Caught', exact: true }),
        ).toHaveCount(2);
    });
}

async function missEligibleEncounter(page: Page, location: string) {
    await test.step('miss an unowned eligible encounter', async () => {
        await expectNextStep(page, location);
        await expandCollapsedSummary(page, location);
        const card = cardFor(page, location).first();
        await card.getByRole('button', { name: 'Show encounters' }).click();
        await openBox(page);
        const ownedImages = await page
            .getByRole('dialog')
            .getByRole('img')
            .all();
        const ownedPokemon = new Set(
            (
                await Promise.all(
                    ownedImages.map((image) => image.getAttribute('alt')),
                )
            )
                .filter((name): name is string => name !== null)
                .map((name) => name.replace(/\s+\([^)]*\)$/, '')),
        );
        await page.keyboard.press('Escape');

        const pickButtons = await card
            .getByRole('button', { name: /^Pick / })
            .all();
        let missed: string | undefined;
        for (const button of pickButtons) {
            if (!(await button.isEnabled())) {
                continue;
            }
            const label = await button.getAttribute('aria-label');
            const candidate = label?.replace(/^Pick /, '');
            if (
                candidate &&
                !ownedPokemon.has(candidate.replace(/\s+\([^)]*\)$/, ''))
            ) {
                missed = candidate;
                await button.click();
                break;
            }
        }
        if (!missed) {
            throw new Error(
                `No unowned eligible encounter found in ${location}`,
            );
        }
        await resolveEncounter(page, location, 'Missed');
        await openBox(page);
        await expect(
            page.getByRole('dialog').getByRole('img', {
                name: missed,
            }),
        ).toHaveCount(0);
        await page.keyboard.press('Escape');
    });
}

async function loseBossBattle(page: Page, battle: string) {
    await test.step(`lose ${battle}`, async () => {
        const card = cardFor(page, battle).first();
        const lostButton = card.getByRole('button', { name: 'Mark lost' });
        if ((await lostButton.count()) === 0) {
            await card.click();
        }
        await card.getByRole('button', { name: 'Mark lost' }).click();
        await expect(
            card.getByRole('button', { name: 'Mark lost' }),
        ).toBeDisabled();
    });
}

async function completeEncounter(page: Page, location: string) {
    await test.step(location, async () => {
        await expectNextStep(page, location);
        const stepItem = page
            .locator('li')
            .filter({ has: page.getByText('→ Next step', { exact: true }) });
        await stepItem.getByRole('button').first().click();
        const card = stepItem.locator('article').first();
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
        } else {
            await card
                .getByRole('button', { name: /Randomize|Re-roll/ })
                .click();
            await card
                .getByRole('button', { name: 'Caught', exact: true })
                .click();
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
